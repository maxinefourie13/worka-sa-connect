-- ============================================================
-- 1. Bidding RPCs
-- ============================================================

-- Allow klaps_spent = 0 (free proposals)
ALTER TABLE public.proposals ALTER COLUMN klaps_spent SET DEFAULT 0;

-- Drop legacy single-klap spend
DROP FUNCTION IF EXISTS public.spend_klap(uuid, text);

-- place_bid: create proposal + deduct bid Klaps atomically
CREATE OR REPLACE FUNCTION public.place_bid(
  _opportunity_id uuid,
  _business_id uuid,
  _message text,
  _quote_amount numeric,
  _bid_klaps integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _proposal_id uuid;
  _balance integer;
  _is_owner boolean;
  _is_suspended boolean;
  _opp_status opportunity_status;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _bid_klaps IS NULL OR _bid_klaps < 0 THEN
    RAISE EXCEPTION 'Bid must be 0 or more';
  END IF;

  IF _message IS NULL OR length(trim(_message)) < 20 THEN
    RAISE EXCEPTION 'Pitch must be at least 20 characters';
  END IF;

  -- Verify business ownership + not suspended
  SELECT (owner_id = auth.uid()), is_suspended
    INTO _is_owner, _is_suspended
    FROM public.businesses WHERE id = _business_id;
  IF NOT coalesce(_is_owner, false) THEN
    RAISE EXCEPTION 'You do not own this business';
  END IF;
  IF _is_suspended THEN
    RAISE EXCEPTION 'This business is suspended';
  END IF;

  -- Verify opportunity is open
  SELECT status INTO _opp_status FROM public.opportunities WHERE id = _opportunity_id;
  IF _opp_status IS NULL THEN
    RAISE EXCEPTION 'Opportunity not found';
  END IF;
  IF _opp_status <> 'open' THEN
    RAISE EXCEPTION 'This job is no longer open';
  END IF;

  -- Lock balance & validate
  IF _bid_klaps > 0 THEN
    SELECT klaps_remaining INTO _balance
      FROM public.provider_balances
      WHERE user_id = auth.uid()
      FOR UPDATE;
    IF _balance IS NULL THEN
      RAISE EXCEPTION 'No balance record';
    END IF;
    IF _balance < _bid_klaps THEN
      RAISE EXCEPTION 'Insufficient Klaps';
    END IF;

    UPDATE public.provider_balances
      SET klaps_remaining = klaps_remaining - _bid_klaps,
          updated_at = now()
      WHERE user_id = auth.uid();
  END IF;

  -- Insert proposal
  INSERT INTO public.proposals (
    opportunity_id, business_id, provider_id, message, quote_amount, klaps_spent
  )
  VALUES (
    _opportunity_id, _business_id, auth.uid(), _message, _quote_amount, _bid_klaps
  )
  RETURNING id INTO _proposal_id;

  -- Bump applicants count
  UPDATE public.opportunities
    SET applicants_count = applicants_count + 1, updated_at = now()
    WHERE id = _opportunity_id;

  -- Log klap event if any spent
  IF _bid_klaps > 0 THEN
    INSERT INTO public.klap_events (user_id, opportunity_id, proposal_id, job_title, cost, outcome)
    SELECT auth.uid(), _opportunity_id, _proposal_id, o.title, _bid_klaps, 'pending'
      FROM public.opportunities o WHERE o.id = _opportunity_id;
  END IF;

  RETURN _proposal_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.place_bid(uuid, uuid, text, numeric, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_bid(uuid, uuid, text, numeric, integer) TO authenticated;

-- top_up_bid: add Klaps to an existing proposal you own
CREATE OR REPLACE FUNCTION public.top_up_bid(
  _proposal_id uuid,
  _additional_klaps integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _balance integer;
  _proposal record;
  _opp_status opportunity_status;
  _new_total integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _additional_klaps IS NULL OR _additional_klaps < 1 THEN
    RAISE EXCEPTION 'Top-up must be at least 1 Klap';
  END IF;

  SELECT * INTO _proposal FROM public.proposals WHERE id = _proposal_id FOR UPDATE;
  IF _proposal.id IS NULL THEN
    RAISE EXCEPTION 'Proposal not found';
  END IF;
  IF _proposal.provider_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not your proposal';
  END IF;

  SELECT status INTO _opp_status FROM public.opportunities WHERE id = _proposal.opportunity_id;
  IF _opp_status <> 'open' THEN
    RAISE EXCEPTION 'This job is no longer open';
  END IF;

  SELECT klaps_remaining INTO _balance
    FROM public.provider_balances
    WHERE user_id = auth.uid()
    FOR UPDATE;
  IF _balance IS NULL OR _balance < _additional_klaps THEN
    RAISE EXCEPTION 'Insufficient Klaps';
  END IF;

  UPDATE public.provider_balances
    SET klaps_remaining = klaps_remaining - _additional_klaps, updated_at = now()
    WHERE user_id = auth.uid();

  UPDATE public.proposals
    SET klaps_spent = klaps_spent + _additional_klaps, updated_at = now()
    WHERE id = _proposal_id
    RETURNING klaps_spent INTO _new_total;

  INSERT INTO public.klap_events (user_id, opportunity_id, proposal_id, job_title, cost, outcome)
  SELECT auth.uid(), _proposal.opportunity_id, _proposal_id,
         (SELECT title FROM public.opportunities WHERE id = _proposal.opportunity_id),
         _additional_klaps, 'pending';

  RETURN _new_total;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.top_up_bid(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.top_up_bid(uuid, integer) TO authenticated;

-- ============================================================
-- 2. Google Reviews import
-- ============================================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS google_place_id text,
  ADD COLUMN IF NOT EXISTS google_maps_url text,
  ADD COLUMN IF NOT EXISTS google_rating numeric,
  ADD COLUMN IF NOT EXISTS google_review_count integer,
  ADD COLUMN IF NOT EXISTS google_reviews_last_fetched_at timestamptz;

CREATE TABLE IF NOT EXISTS public.business_google_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_photo_url text,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text text,
  relative_time text,
  time timestamptz,
  language text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_google_reviews_business ON public.business_google_reviews(business_id, time DESC);

ALTER TABLE public.business_google_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Google reviews are viewable by everyone"
  ON public.business_google_reviews FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies -> only SECURITY DEFINER functions / service role can write.