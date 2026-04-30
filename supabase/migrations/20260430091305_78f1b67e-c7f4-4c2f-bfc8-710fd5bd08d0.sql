
-- 1. Secondary categories on businesses (max 6 enforced via trigger + RPC)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS secondary_categories text[] NOT NULL DEFAULT '{}'::text[];

CREATE OR REPLACE FUNCTION public.enforce_secondary_categories_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.secondary_categories IS NOT NULL AND array_length(NEW.secondary_categories, 1) > 6 THEN
    RAISE EXCEPTION 'You can only choose up to 6 secondary categories.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_secondary_categories_limit ON public.businesses;
CREATE TRIGGER trg_enforce_secondary_categories_limit
BEFORE INSERT OR UPDATE OF secondary_categories ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.enforce_secondary_categories_limit();

CREATE OR REPLACE FUNCTION public.set_secondary_categories(_business_id uuid, _slugs text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid;
BEGIN
  SELECT owner_id INTO _owner FROM public.businesses WHERE id = _business_id;
  IF _owner IS NULL THEN
    RAISE EXCEPTION 'Business not found.';
  END IF;
  IF _owner <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'You can only edit your own business.';
  END IF;
  IF _slugs IS NOT NULL AND array_length(_slugs, 1) > 6 THEN
    RAISE EXCEPTION 'Choose at most 6 secondary categories.';
  END IF;

  UPDATE public.businesses
     SET secondary_categories = COALESCE(_slugs, '{}'::text[]),
         updated_at = now()
   WHERE id = _business_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_secondary_categories(uuid, text[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_secondary_categories(uuid, text[]) TO authenticated;

-- 2. Referral code on provider_balances
ALTER TABLE public.provider_balances
  ADD COLUMN IF NOT EXISTS referral_code text;

-- Generate a short, friendly, URL-safe code (e.g. SJ-A7K9P2)
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no 0/O/1/I confusion
  code text;
  attempt int := 0;
BEGIN
  LOOP
    code := 'SJ-' ||
            substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1) ||
            substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1) ||
            substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1) ||
            substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1) ||
            substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1) ||
            substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.provider_balances WHERE referral_code = code);
    attempt := attempt + 1;
    IF attempt > 8 THEN EXIT; END IF;
  END LOOP;
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_referral_code_default()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_referral_code_default ON public.provider_balances;
CREATE TRIGGER trg_set_referral_code_default
BEFORE INSERT ON public.provider_balances
FOR EACH ROW EXECUTE FUNCTION public.set_referral_code_default();

-- Backfill existing rows
UPDATE public.provider_balances
   SET referral_code = public.generate_referral_code()
 WHERE referral_code IS NULL;

ALTER TABLE public.provider_balances
  ADD CONSTRAINT provider_balances_referral_code_unique UNIQUE (referral_code);

-- 3. pro_referrals table
DO $$ BEGIN
  CREATE TYPE public.pro_referral_status AS ENUM ('pending','redeemed','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.pro_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL,
  referee_user_id uuid NOT NULL UNIQUE, -- a Pro can only be referred once
  referral_code text NOT NULL,
  status public.pro_referral_status NOT NULL DEFAULT 'pending',
  redeemed_at timestamptz,
  referrer_credit_applied_at timestamptz,
  referee_credit_applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pro_referrals_referrer_idx ON public.pro_referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS pro_referrals_status_idx ON public.pro_referrals(status);

ALTER TABLE public.pro_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pros can view their own referrals"
ON public.pro_referrals FOR SELECT TO authenticated
USING (referrer_user_id = auth.uid() OR referee_user_id = auth.uid());

CREATE POLICY "Admins manage all referrals"
ON public.pro_referrals FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Claim a referral code (called by the referee right after signup)
CREATE OR REPLACE FUNCTION public.claim_referral_code(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _referrer uuid;
  _existing uuid;
  _new_id uuid;
  _my_tier sjoh_tier;
BEGIN
  IF _me IS NULL THEN
    RAISE EXCEPTION 'Sign in to claim a referral.';
  END IF;

  SELECT user_id INTO _referrer
    FROM public.provider_balances
   WHERE referral_code = upper(trim(_code));

  IF _referrer IS NULL THEN
    RAISE EXCEPTION 'That referral code looks off, boet. Double-check with your mate.';
  END IF;

  IF _referrer = _me THEN
    RAISE EXCEPTION 'Nice try — you can''t refer yourself.';
  END IF;

  -- Already on a paid tier? Too late to claim.
  SELECT tier INTO _my_tier FROM public.provider_balances WHERE user_id = _me;
  IF _my_tier IN ('verified_pro','founding_pro') THEN
    RAISE EXCEPTION 'Referrals can only be claimed before you upgrade to a paid plan.';
  END IF;

  SELECT id INTO _existing FROM public.pro_referrals WHERE referee_user_id = _me;
  IF _existing IS NOT NULL THEN
    RAISE EXCEPTION 'You''ve already used a referral code.';
  END IF;

  INSERT INTO public.pro_referrals (referrer_user_id, referee_user_id, referral_code, status)
  VALUES (_referrer, _me, upper(trim(_code)), 'pending')
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_referral_code(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_referral_code(text) TO authenticated;

-- 5. Apply the +30-day credit to both parties when the referee upgrades
CREATE OR REPLACE FUNCTION public.apply_pro_referral_reward(_referee_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ref RECORD;
BEGIN
  SELECT * INTO _ref
    FROM public.pro_referrals
   WHERE referee_user_id = _referee_user_id
     AND status = 'pending'
   LIMIT 1;

  IF _ref.id IS NULL THEN RETURN; END IF;

  -- Push tier_expires_at out by 30 days for the referee (the new subscriber)
  UPDATE public.provider_balances
     SET tier_expires_at = COALESCE(tier_expires_at, now()) + INTERVAL '30 days',
         updated_at = now()
   WHERE user_id = _referee_user_id;

  -- And for the referrer
  UPDATE public.provider_balances
     SET tier_expires_at = COALESCE(tier_expires_at, now()) + INTERVAL '30 days',
         updated_at = now()
   WHERE user_id = _ref.referrer_user_id;

  UPDATE public.pro_referrals
     SET status = 'redeemed',
         redeemed_at = now(),
         referrer_credit_applied_at = now(),
         referee_credit_applied_at = now()
   WHERE id = _ref.id;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_pro_referral_reward(uuid) FROM public, anon;
-- Only callable internally / by service role / by trigger; admins can also invoke
GRANT EXECUTE ON FUNCTION public.apply_pro_referral_reward(uuid) TO authenticated;

-- 6. Trigger: when a balance row's tier becomes verified_pro, fire reward
CREATE OR REPLACE FUNCTION public.handle_provider_balance_tier_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.tier = 'verified_pro'::sjoh_tier
     AND (OLD.tier IS DISTINCT FROM NEW.tier)
  THEN
    PERFORM public.apply_pro_referral_reward(NEW.user_id);
  ELSIF TG_OP = 'INSERT'
     AND NEW.tier = 'verified_pro'::sjoh_tier
  THEN
    PERFORM public.apply_pro_referral_reward(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_provider_balance_tier_change ON public.provider_balances;
CREATE TRIGGER trg_handle_provider_balance_tier_change
AFTER INSERT OR UPDATE OF tier ON public.provider_balances
FOR EACH ROW EXECUTE FUNCTION public.handle_provider_balance_tier_change();

-- 7. Public helper: get my referral stats (current code + counts)
CREATE OR REPLACE FUNCTION public.get_my_referral_summary()
RETURNS TABLE (
  referral_code text,
  pending_count bigint,
  redeemed_count bigint,
  total_free_months int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
BEGIN
  IF _me IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT
    pb.referral_code,
    (SELECT count(*) FROM public.pro_referrals r WHERE r.referrer_user_id = _me AND r.status = 'pending'),
    (SELECT count(*) FROM public.pro_referrals r WHERE r.referrer_user_id = _me AND r.status = 'redeemed'),
    (SELECT count(*)::int FROM public.pro_referrals r WHERE r.referrer_user_id = _me AND r.status = 'redeemed')
  FROM public.provider_balances pb
  WHERE pb.user_id = _me;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_referral_summary() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_referral_summary() TO authenticated;
