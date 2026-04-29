-- 1. New payment event kind for Urgent Boost
ALTER TYPE payment_event_kind ADD VALUE IF NOT EXISTS 'urgent_boost';

-- 2. Admin RPC: grant or revoke founding spot, enforces 500-cap on grant
CREATE OR REPLACE FUNCTION public.admin_set_founding_spot(_signup_id uuid, _claimed boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role text;
  _current_count int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  SELECT role INTO _role FROM public.early_access_signups WHERE id = _signup_id FOR UPDATE;
  IF _role IS NULL THEN
    RAISE EXCEPTION 'Signup not found';
  END IF;

  IF _claimed THEN
    SELECT count(*) INTO _current_count
    FROM public.early_access_signups
    WHERE role = _role AND claimed_founding_spot = true;
    IF _current_count >= 500 THEN
      RAISE EXCEPTION 'Founding-spot cap reached for role %', _role;
    END IF;
  END IF;

  UPDATE public.early_access_signups
  SET claimed_founding_spot = _claimed
  WHERE id = _signup_id;

  RETURN true;
END;
$$;

-- 3. Admin RPC: manually add a founding signup row
CREATE OR REPLACE FUNCTION public.admin_create_founding_signup(_email text, _role text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _signup_id uuid;
  _current_count int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;
  IF _role NOT IN ('pro', 'customer') THEN
    RAISE EXCEPTION 'Role must be pro or customer';
  END IF;
  IF _email IS NULL OR length(trim(_email)) < 3 THEN
    RAISE EXCEPTION 'Valid email required';
  END IF;

  SELECT count(*) INTO _current_count
  FROM public.early_access_signups
  WHERE role = _role AND claimed_founding_spot = true;
  IF _current_count >= 500 THEN
    RAISE EXCEPTION 'Founding-spot cap reached for role %', _role;
  END IF;

  INSERT INTO public.early_access_signups (email, role, claimed_founding_spot, source)
  VALUES (lower(trim(_email)), _role, true, 'admin_manual')
  RETURNING id INTO _signup_id;

  RETURN _signup_id;
END;
$$;

-- 4. Allow admins to UPDATE early_access_signups (needed for the RPCs above to work via SECURITY DEFINER, plus future flexibility)
-- (admin SELECT policy already exists)
CREATE POLICY "Admins can update early access signups"
ON public.early_access_signups
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Apply urgent boost (called by Paystack webhook)
CREATE OR REPLACE FUNCTION public.apply_urgent_boost(
  _opportunity_id uuid,
  _user_id uuid,
  _amount_cents integer,
  _reference text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _client uuid;
BEGIN
  SELECT client_id INTO _client FROM public.opportunities WHERE id = _opportunity_id;
  IF _client IS NULL THEN
    RAISE EXCEPTION 'Opportunity not found';
  END IF;
  IF _client <> _user_id THEN
    RAISE EXCEPTION 'User does not own this opportunity';
  END IF;

  UPDATE public.opportunities
  SET urgent_boost_paid_at = now(),
      urgent_boost_amount_cents = _amount_cents,
      updated_at = now()
  WHERE id = _opportunity_id;

  -- Idempotent: don't double-log if same reference already processed
  INSERT INTO public.payment_events (
    paystack_reference, paystack_event, kind, amount_cents, currency,
    user_id, processed, processed_at, raw
  )
  VALUES (
    _reference, 'charge.success', 'urgent_boost'::payment_event_kind, _amount_cents, 'ZAR',
    _user_id, true, now(),
    jsonb_build_object('opportunity_id', _opportunity_id, 'reference', _reference)
  )
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;

-- 6. Protect verified businesses from dormancy/archive sweep
CREATE OR REPLACE FUNCTION public.transition_listing_states()
RETURNS TABLE(to_dormant integer, to_archived integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _dormant_count int;
  _archived_count int;
BEGIN
  -- active -> dormant (60 days no activity, post-launch, unverified only)
  WITH updated AS (
    UPDATE public.businesses
    SET listing_status = 'dormant', updated_at = now()
    WHERE listing_status = 'active'
      AND pre_launch = false
      AND is_verified = false
      AND last_active_at < now() - interval '60 days'
    RETURNING 1
  )
  SELECT count(*) INTO _dormant_count FROM updated;

  -- dormant -> archived (180 days no activity, unverified only)
  WITH updated AS (
    UPDATE public.businesses
    SET listing_status = 'archived', updated_at = now()
    WHERE listing_status = 'dormant'
      AND is_verified = false
      AND last_active_at < now() - interval '180 days'
    RETURNING 1
  )
  SELECT count(*) INTO _archived_count FROM updated;

  RETURN QUERY SELECT _dormant_count, _archived_count;
END;
$$;

-- 7. Lifecycle sweep called by daily edge function
CREATE OR REPLACE FUNCTION public.run_lifecycle_sweep()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _trial_hidden int := 0;
  _lapsed_archived int := 0;
  _activity_result record;
BEGIN
  -- Trial expired with no paid sub -> hide listing (workshop). Verified businesses are exempt.
  WITH hidden AS (
    UPDATE public.businesses b
    SET listing_status = 'workshop', updated_at = now()
    FROM public.provider_balances pb
    WHERE b.owner_id = pb.user_id
      AND b.listing_status = 'active'
      AND b.is_verified = false
      AND pb.tier IN ('basic_trial'::sjoh_tier, 'verified_pro_trial'::sjoh_tier)
      AND pb.trial_ends_at < now()
    RETURNING 1
  )
  SELECT count(*) INTO _trial_hidden FROM hidden;

  -- Paid sub lapsed + 30-day grace passed -> archive (verified exempt)
  WITH archived AS (
    UPDATE public.businesses b
    SET listing_status = 'archived', updated_at = now()
    FROM public.provider_balances pb
    WHERE b.owner_id = pb.user_id
      AND b.listing_status IN ('active', 'dormant')
      AND b.is_verified = false
      AND pb.tier = 'none'::sjoh_tier
      AND pb.tier_expires_at IS NOT NULL
      AND pb.tier_expires_at < now() - interval '30 days'
    RETURNING 1
  )
  SELECT count(*) INTO _lapsed_archived FROM archived;

  -- Run the existing inactivity transitions
  SELECT * INTO _activity_result FROM public.transition_listing_states();

  RETURN jsonb_build_object(
    'trial_hidden', _trial_hidden,
    'lapsed_archived', _lapsed_archived,
    'inactive_to_dormant', _activity_result.to_dormant,
    'inactive_to_archived', _activity_result.to_archived,
    'ran_at', now()
  );
END;
$$;