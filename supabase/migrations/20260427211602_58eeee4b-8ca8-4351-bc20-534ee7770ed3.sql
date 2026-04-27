-- =========================================================
-- LAUNCH SECURITY HARDENING
-- =========================================================

-- ---------------------------------------------------------
-- 1. Lock down user_roles (PRIVILEGE ESCALATION fix)
-- ---------------------------------------------------------
-- The existing "Admins can manage all roles" ALL policy uses USING + WITH CHECK
-- on has_role(admin), so a non-admin's INSERT WITH CHECK fails — but the
-- absence of an explicit deny made the scanner flag it. Add an explicit
-- restrictive policy that blocks all writes from non-admins beyond doubt.

DROP POLICY IF EXISTS "Only admins can write roles" ON public.user_roles;
CREATE POLICY "Only admins can write roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------------------------------------------------------
-- 2. Stop exposing business contact details to all signed-in users
-- ---------------------------------------------------------
-- Old policy let any authenticated user read businesses.email / .phone.
-- Replace with: owners + admins see full row via the table; everyone else
-- reads through the businesses_public view (already excludes email/phone).

DROP POLICY IF EXISTS "Businesses viewable by signed-in users" ON public.businesses;

CREATE POLICY "Owners can view their own business"
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Admins already covered by "Admins can manage all businesses" ALL policy.

-- Make the public view readable by everyone (the safe, redacted projection).
GRANT SELECT ON public.businesses_public TO anon, authenticated;

-- ---------------------------------------------------------
-- 3. Tighten proposal updates (column-level protection)
-- ---------------------------------------------------------
-- A trigger already exists (protect_proposal_fields) but isn't attached.
-- Attach it so providers can't change status / klaps_spent / quote / message.

DROP TRIGGER IF EXISTS trg_protect_proposal_fields ON public.proposals;
CREATE TRIGGER trg_protect_proposal_fields
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_proposal_fields();

-- Same for businesses (protect_business_admin_fields exists but unattached).
DROP TRIGGER IF EXISTS trg_protect_business_admin_fields ON public.businesses;
CREATE TRIGGER trg_protect_business_admin_fields
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_business_admin_fields();

-- And wire handle_new_report so report_count / suspension auto-update.
DROP TRIGGER IF EXISTS trg_handle_new_report ON public.user_reports;
CREATE TRIGGER trg_handle_new_report
  AFTER INSERT ON public.user_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_report();

-- ---------------------------------------------------------
-- 4. Validate klap_events inserts
-- ---------------------------------------------------------
-- Block fabricated klap_events pointing at jobs/proposals the user doesn't own.

CREATE OR REPLACE FUNCTION public.validate_klap_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.proposal_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.proposals p
      WHERE p.id = NEW.proposal_id AND p.provider_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Klap event references a proposal that is not yours';
    END IF;
  END IF;

  IF NEW.opportunity_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.opportunities o WHERE o.id = NEW.opportunity_id
    ) THEN
      RAISE EXCEPTION 'Klap event references an unknown opportunity';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_klap_event ON public.klap_events;
CREATE TRIGGER trg_validate_klap_event
  BEFORE INSERT ON public.klap_events
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_klap_event();

-- ---------------------------------------------------------
-- 5. Revoke EXECUTE on internal-only SECURITY DEFINER functions
-- ---------------------------------------------------------
-- These are called from triggers, webhooks (service role) or other definer
-- functions — never directly by clients. Lock them down.

REVOKE EXECUTE ON FUNCTION public.apply_klap_topup(uuid)            FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_subscription_payment(uuid, sjoh_tier, text, text, timestamp with time zone) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_verification_result(uuid, text, boolean) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_stale_verifications()      FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_report()               FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                 FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lapse_subscription(text)          FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_proposal_fields()         FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.protect_business_admin_fields()   FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_klap_event()             FROM anon, authenticated, public;

-- has_role stays callable (it's used inside RLS policies and is read-only).
-- mark_verification_pending, set_email_alerts_optin, set_push_subscription,
-- place_bid, top_up_bid, report_business stay callable — they're the
-- intentional client RPCs.
