
-- =============================================================
-- Lightweight rate limiting
-- =============================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action_created
  ON public.rate_limits (user_id, action, created_at DESC);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No client-side access. SECURITY DEFINER functions use it via service role.
CREATE POLICY "No direct access to rate_limits"
  ON public.rate_limits FOR SELECT USING (false);

-- Core helper: throw if the user is over the limit, else log the event.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _action text,
  _max integer,
  _window_seconds integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _count integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;

  -- Opportunistic cleanup: drop rows older than 24 hours so the table stays small.
  DELETE FROM public.rate_limits
   WHERE created_at < now() - interval '24 hours';

  SELECT count(*) INTO _count
    FROM public.rate_limits
   WHERE user_id = _uid
     AND action  = _action
     AND created_at > now() - make_interval(secs => _window_seconds);

  IF _count >= _max THEN
    RAISE EXCEPTION 'Slow down, boet — you''ve hit the limit (% per %s). Try again later.',
      _max, _window_seconds USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.rate_limits (user_id, action) VALUES (_uid, _action);
END;
$$;

-- =============================================================
-- 1) Limit pros to 10 proposals per hour
--    Patch submit_proposal to gate via check_rate_limit
-- =============================================================
CREATE OR REPLACE FUNCTION public.submit_proposal(
  _opportunity_id uuid,
  _business_id uuid,
  _message text,
  _quote_amount numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Rate limit: 10 quotes per hour per pro
  PERFORM public.check_rate_limit('send_quote', 10, 3600);

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

-- =============================================================
-- 2) Limit customers to 3 request posts per hour
--    Trigger on opportunities (BEFORE INSERT)
-- =============================================================
CREATE OR REPLACE FUNCTION public.enforce_post_request_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce for normal authenticated inserts. Service role / admin bypass.
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN RETURN NEW; END IF;

  PERFORM public.check_rate_limit('post_request', 3, 3600);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_post_request_rate_limit ON public.opportunities;
CREATE TRIGGER trg_enforce_post_request_rate_limit
BEFORE INSERT ON public.opportunities
FOR EACH ROW EXECUTE FUNCTION public.enforce_post_request_rate_limit();

GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO authenticated;
