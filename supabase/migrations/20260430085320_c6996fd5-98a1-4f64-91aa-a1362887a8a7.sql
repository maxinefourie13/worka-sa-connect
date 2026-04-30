
-- =====================================================================
-- Sjoh: Privacy lockdown + reveal-on-accept + trust score + founding live count
-- =====================================================================

-- 1) CUSTOMER CONTACT ON OPPORTUNITIES ---------------------------------
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS client_phone text,
  ADD COLUMN IF NOT EXISTS client_email text,
  ADD COLUMN IF NOT EXISTS contact_preference text DEFAULT 'whatsapp';

-- 2) NO-SHOW REPORTS TABLE ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.no_show_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  deal_memo_id uuid REFERENCES public.deal_memos(id) ON DELETE SET NULL,
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE SET NULL,
  reason text,
  status text NOT NULL DEFAULT 'open', -- open | confirmed | reversed
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.no_show_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can file no-show reports"
ON public.no_show_reports FOR INSERT TO authenticated
WITH CHECK (
  reporter_id = auth.uid()
  AND NOT EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
);

CREATE POLICY "Reporter, pro, admin can view"
ON public.no_show_reports FOR SELECT TO authenticated
USING (
  reporter_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins manage no-show reports"
ON public.no_show_reports FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) TRUST SCORE ON BUSINESSES -----------------------------------------
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS trust_score integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS no_show_count integer NOT NULL DEFAULT 0;

-- Recompute trust score: 100 - 15*(confirmed no-shows) + 5*floor(5star_reviews/3), clamped 0..100
CREATE OR REPLACE FUNCTION public.recompute_trust_score(_business_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _no_shows int;
  _five_stars int;
  _score int;
BEGIN
  SELECT count(*) INTO _no_shows FROM public.no_show_reports
    WHERE business_id = _business_id AND status = 'confirmed';
  SELECT count(*) INTO _five_stars FROM public.reviews
    WHERE business_id = _business_id AND rating = 5 AND is_verified_hire = true;
  _score := 100 - (_no_shows * 15) + (floor(_five_stars / 3.0)::int * 5);
  IF _score > 100 THEN _score := 100; END IF;
  IF _score < 0 THEN _score := 0; END IF;
  UPDATE public.businesses
    SET trust_score = _score,
        no_show_count = _no_shows,
        updated_at = now()
    WHERE id = _business_id;
END $$;

-- Triggers to keep trust_score fresh
CREATE OR REPLACE FUNCTION public.no_show_after_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.recompute_trust_score(COALESCE(NEW.business_id, OLD.business_id));
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_no_show_after_change ON public.no_show_reports;
CREATE TRIGGER trg_no_show_after_change
AFTER INSERT OR UPDATE OR DELETE ON public.no_show_reports
FOR EACH ROW EXECUTE FUNCTION public.no_show_after_change();

CREATE OR REPLACE FUNCTION public.review_after_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (NEW.rating = 5 OR (TG_OP = 'UPDATE' AND OLD.rating = 5))
     AND (NEW.is_verified_hire OR (TG_OP = 'UPDATE' AND OLD.is_verified_hire)) THEN
    PERFORM public.recompute_trust_score(NEW.business_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_review_after_change ON public.reviews;
CREATE TRIGGER trg_review_after_change
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.review_after_change();

-- 4) RESPONSE TIME (avg hours from opportunity creation to first proposal) ---
CREATE OR REPLACE FUNCTION public.business_avg_response_hours(_business_id uuid)
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT round(avg(extract(epoch from (p.created_at - o.created_at)) / 3600.0)::numeric, 1)
  FROM public.proposals p
  JOIN public.opportunities o ON o.id = p.opportunity_id
  WHERE p.business_id = _business_id;
$$;

CREATE OR REPLACE FUNCTION public.business_last_completed_at(_business_id uuid)
RETURNS timestamptz
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT max(completed_at) FROM public.deal_memos
  WHERE business_id = _business_id AND status = 'completed';
$$;

-- 5) ACCEPT QUOTE — single source of truth ---------------------------------
-- Returns customer contact ONLY to the pro whose proposal was accepted.
DROP FUNCTION IF EXISTS public.accept_quote(uuid);
CREATE OR REPLACE FUNCTION public.accept_quote(_proposal_id uuid)
RETURNS TABLE(client_phone text, client_email text, contact_preference text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _opp_id uuid;
  _client uuid;
  _pro_id uuid;
  _existing_status proposal_status;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to accept this quote'; END IF;

  SELECT p.opportunity_id, o.client_id, p.provider_id, p.status
    INTO _opp_id, _client, _pro_id, _existing_status
  FROM public.proposals p
  JOIN public.opportunities o ON o.id = p.opportunity_id
  WHERE p.id = _proposal_id;

  IF _opp_id IS NULL THEN RAISE EXCEPTION 'Quote not found'; END IF;
  IF _client <> auth.uid() THEN RAISE EXCEPTION 'Only the customer can accept this quote'; END IF;

  IF _existing_status <> 'accepted' THEN
    UPDATE public.proposals SET status = 'accepted', updated_at = now() WHERE id = _proposal_id;
    -- mark opportunity as in-progress (closed for new quotes) if you want; leave open for now
  END IF;

  RETURN QUERY
  SELECT o.client_phone, o.client_email, o.contact_preference
  FROM public.opportunities o WHERE o.id = _opp_id;
END $$;

-- Reveal contact for the pro after acceptance OR after submitting on an urgent job
CREATE OR REPLACE FUNCTION public.get_revealed_contact(_proposal_id uuid)
RETURNS TABLE(client_phone text, client_email text, contact_preference text, revealed boolean, reason text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _opp_id uuid;
  _client uuid;
  _pro_id uuid;
  _status proposal_status;
  _is_urgent boolean;
  _has_pro boolean;
  _kyc boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  SELECT p.opportunity_id, o.client_id, p.provider_id, p.status, o.is_urgent
    INTO _opp_id, _client, _pro_id, _status, _is_urgent
  FROM public.proposals p
  JOIN public.opportunities o ON o.id = p.opportunity_id
  WHERE p.id = _proposal_id;
  IF _opp_id IS NULL THEN RAISE EXCEPTION 'Quote not found'; END IF;

  -- Customer always sees their own
  IF _client = auth.uid() THEN
    RETURN QUERY SELECT o.client_phone, o.client_email, o.contact_preference, true, 'owner'::text
      FROM public.opportunities o WHERE o.id = _opp_id;
    RETURN;
  END IF;

  -- Pro must be the proposal owner
  IF _pro_id <> auth.uid() THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::text, false, 'not_authorised'::text;
    RETURN;
  END IF;

  -- Accepted proposal -> reveal
  IF _status = 'accepted' THEN
    RETURN QUERY SELECT o.client_phone, o.client_email, o.contact_preference, true, 'accepted'::text
      FROM public.opportunities o WHERE o.id = _opp_id;
    RETURN;
  END IF;

  -- Urgent + Verified Pro + KYC -> reveal immediately on submission
  _has_pro := public.has_verified_pro_access(auth.uid());
  _kyc := public.user_has_kyc_business(auth.uid());
  IF _is_urgent AND _has_pro AND _kyc THEN
    RETURN QUERY SELECT o.client_phone, o.client_email, o.contact_preference, true, 'urgent_emergency'::text
      FROM public.opportunities o WHERE o.id = _opp_id;
    RETURN;
  END IF;

  RETURN QUERY SELECT NULL::text, NULL::text, NULL::text, false, 'awaiting_acceptance'::text;
END $$;

-- 6) UPDATE OPPORTUNITY VIEWER RPC TO STRIP CONTACT ALWAYS -----------------
-- The existing get_opportunity_for_viewer doesn't expose client_phone/email; good.
-- But we must prevent direct SELECT of those columns by pros.
-- Strategy: keep "Opportunities are viewable by everyone" but rely on the public list
-- never asking for client_phone/client_email. Add an explicit denial via column-grant.
REVOKE SELECT (client_phone, client_email, contact_preference) ON public.opportunities FROM anon, authenticated;
-- (Service role still has all access. Customer reads their own contact via get_revealed_contact / their dashboard RPCs.)

-- Helper: customer reads their own request including contact
CREATE OR REPLACE FUNCTION public.get_my_opportunity(_id uuid)
RETURNS TABLE(
  id uuid, title text, description text, category_slug text, category_name text,
  province text, city text, budget numeric, is_urgent boolean, status opportunity_status,
  client_phone text, client_email text, contact_preference text,
  attachments jsonb, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.title, o.description, o.category_slug, o.category_name,
         o.province, o.city, o.budget, o.is_urgent, o.status,
         o.client_phone, o.client_email, o.contact_preference,
         o.attachments, o.created_at
  FROM public.opportunities o
  WHERE o.id = _id AND o.client_id = auth.uid();
$$;

-- 7) FOUNDING SPOTS LIVE COUNT (counts paid Verified Pro subs, capped at 500) ---
CREATE OR REPLACE FUNCTION public.get_founding_spots_remaining()
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT GREATEST(0, 500 - count(*)::int)
  FROM public.provider_balances
  WHERE tier = 'verified_pro'::sjoh_tier
    AND (tier_expires_at IS NULL OR tier_expires_at > now());
$$;

GRANT EXECUTE ON FUNCTION public.get_founding_spots_remaining() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_quote(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_revealed_contact(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_opportunity(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.business_avg_response_hours(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.business_last_completed_at(uuid) TO anon, authenticated;

-- 8) ENABLE REALTIME FOR FOUNDING COUNT --------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.provider_balances;
