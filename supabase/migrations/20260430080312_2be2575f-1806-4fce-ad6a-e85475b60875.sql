-- Add is_urgent (free) on opportunities + auto-stamp 72h pin
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS is_urgent boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_urgent_opportunity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_urgent = true THEN
    IF NEW.urgent_boost_paid_at IS NULL
       OR (NOW() - NEW.urgent_boost_paid_at) > interval '72 hours' THEN
      NEW.urgent_boost_paid_at := NOW();
      NEW.urgent_boost_amount_cents := 0;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS opp_urgent_stamp ON public.opportunities;
CREATE TRIGGER opp_urgent_stamp
  BEFORE INSERT OR UPDATE OF is_urgent ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.handle_urgent_opportunity();

-- Provider status helper
CREATE OR REPLACE FUNCTION public.provider_status(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN pb.tier = 'locked'::sjoh_tier THEN 'locked'
    WHEN pb.tier IN ('basic'::sjoh_tier, 'verified_pro'::sjoh_tier)
         AND (pb.tier_expires_at IS NULL OR pb.tier_expires_at > now())
      THEN 'active'
    WHEN pb.tier IN ('basic_trial'::sjoh_tier, 'verified_pro_trial'::sjoh_tier)
         AND pb.trial_ends_at IS NOT NULL AND pb.trial_ends_at > now()
      THEN 'trialing'
    ELSE 'none'
  END
  FROM public.provider_balances pb
  WHERE pb.user_id = _user_id
$$;

-- KYC-on-business helper
CREATE OR REPLACE FUNCTION public.user_has_kyc_business(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses
    WHERE owner_id = _user_id AND kyc_verified = true
  )
$$;

-- Rewrite submit_proposal with new gating
CREATE OR REPLACE FUNCTION public.submit_proposal(
  _opportunity_id uuid,
  _business_id uuid,
  _message text,
  _quote_amount numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _proposal_id uuid;
  _is_owner boolean;
  _is_suspended boolean;
  _is_verified boolean;
  _opp_status opportunity_status;
  _opp_is_urgent boolean;
  _existing uuid;
  _status text;
  _has_pro boolean;
  _kyc boolean;
  _can_use_free boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to submit a proposal';
  END IF;

  IF _message IS NULL OR length(trim(_message)) < 20 THEN
    RAISE EXCEPTION 'Your pitch needs at least 20 characters';
  END IF;

  SELECT (owner_id = auth.uid()), is_suspended, is_verified
    INTO _is_owner, _is_suspended, _is_verified
    FROM public.businesses WHERE id = _business_id;

  IF NOT coalesce(_is_owner, false) THEN
    RAISE EXCEPTION 'You do not own this business';
  END IF;
  IF _is_suspended THEN
    RAISE EXCEPTION 'This business is suspended';
  END IF;

  SELECT status, is_urgent INTO _opp_status, _opp_is_urgent
  FROM public.opportunities WHERE id = _opportunity_id;
  IF _opp_status IS NULL THEN
    RAISE EXCEPTION 'Opportunity not found';
  END IF;
  IF _opp_status <> 'open' THEN
    RAISE EXCEPTION 'This job is no longer open';
  END IF;

  _status := public.provider_status(auth.uid());
  _has_pro := public.has_verified_pro_access(auth.uid());
  _kyc := public.user_has_kyc_business(auth.uid());
  _can_use_free := (NOT _has_pro) AND public.can_use_founding_proposal(auth.uid());

  IF _status = 'locked' THEN
    RAISE EXCEPTION 'Your account is locked. Choose a plan in your dashboard to start applying again.';
  END IF;
  IF _status = 'none' THEN
    RAISE EXCEPTION 'Your trial has ended. Choose On the Map (R50) or Ready for Work (R250) to keep going.';
  END IF;

  IF _opp_is_urgent THEN
    IF NOT _has_pro THEN
      RAISE EXCEPTION 'Eish! Urgent jobs are reserved for Ready for Work pros. Upgrade to R250/mo to claim emergency leads.';
    END IF;
    IF NOT _kyc THEN
      RAISE EXCEPTION 'Eish! Urgent jobs need a verified ID. Complete the ID check on your business profile, then try again.';
    END IF;
  END IF;

  IF _has_pro THEN
    IF NOT _is_verified THEN
      RAISE EXCEPTION 'Only verified businesses can submit proposals';
    END IF;
  ELSIF _can_use_free THEN
    NULL;
  ELSIF _status = 'trialing' THEN
    NULL;
  ELSE
    IF EXISTS (
      SELECT 1 FROM public.provider_balances
      WHERE user_id = auth.uid() AND tier = 'basic'::sjoh_tier
    ) THEN
      RAISE EXCEPTION 'You''re on the On the Map plan (passive listing). Upgrade to Ready for Work (R250/mo) to apply to jobs.';
    END IF;
    RAISE EXCEPTION 'Only Ready for Work subscribers can apply for jobs. Upgrade to apply.';
  END IF;

  SELECT id INTO _existing
    FROM public.proposals
    WHERE opportunity_id = _opportunity_id AND business_id = _business_id;
  IF _existing IS NOT NULL THEN
    RAISE EXCEPTION 'You''ve already submitted a proposal for this job';
  END IF;

  INSERT INTO public.proposals (opportunity_id, business_id, provider_id, message, quote_amount)
  VALUES (_opportunity_id, _business_id, auth.uid(), _message, _quote_amount)
  RETURNING id INTO _proposal_id;

  IF _can_use_free THEN
    INSERT INTO public.provider_balances (user_id, founding_proposals_used_this_month, founding_proposals_period_start)
    VALUES (auth.uid(), 1, date_trunc('month', now()))
    ON CONFLICT (user_id) DO UPDATE SET
      founding_proposals_used_this_month = CASE
        WHEN public.provider_balances.founding_proposals_period_start < date_trunc('month', now()) THEN 1
        ELSE public.provider_balances.founding_proposals_used_this_month + 1
      END,
      founding_proposals_period_start = date_trunc('month', now()),
      updated_at = now();
  END IF;

  UPDATE public.opportunities
    SET applicants_count = applicants_count + 1, updated_at = now()
    WHERE id = _opportunity_id;

  RETURN _proposal_id;
END;
$$;

-- Lock lapsed trials
CREATE OR REPLACE FUNCTION public.lock_lapsed_trials()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _locked int := 0;
BEGIN
  WITH locked AS (
    UPDATE public.provider_balances
    SET tier = 'locked'::sjoh_tier,
        updated_at = now()
    WHERE tier IN ('basic_trial'::sjoh_tier, 'verified_pro_trial'::sjoh_tier)
      AND trial_ends_at IS NOT NULL
      AND trial_ends_at < now()
      AND paystack_subscription_code IS NULL
    RETURNING 1
  )
  SELECT count(*) INTO _locked FROM locked;
  RETURN _locked;
END;
$$;