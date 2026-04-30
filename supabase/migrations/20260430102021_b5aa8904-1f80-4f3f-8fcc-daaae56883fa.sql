-- Lock contact reveal to acceptance only.
-- Removes the urgent_emergency early-reveal branch.

CREATE OR REPLACE FUNCTION public.get_revealed_contact(_proposal_id uuid)
RETURNS TABLE(
  client_phone text,
  client_email text,
  contact_preference text,
  revealed boolean,
  reason text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _opp_id uuid;
  _provider uuid;
  _status text;
  _client_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::text, false, 'unauthenticated'::text;
    RETURN;
  END IF;

  SELECT p.opportunity_id, p.provider_id, p.status::text
    INTO _opp_id, _provider, _status
  FROM public.proposals p
  WHERE p.id = _proposal_id;

  IF _opp_id IS NULL THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::text, false, 'not_found'::text;
    RETURN;
  END IF;

  SELECT o.client_id INTO _client_id FROM public.opportunities o WHERE o.id = _opp_id;

  -- Owner of the request always sees their own contact details.
  IF _client_id = auth.uid() THEN
    RETURN QUERY
      SELECT o.client_phone, o.client_email, o.contact_preference, true, 'owner'::text
      FROM public.opportunities o WHERE o.id = _opp_id;
    RETURN;
  END IF;

  -- Pro only sees contact when THEIR quote was accepted. No urgent shortcut.
  IF _provider = auth.uid() AND _status = 'accepted' THEN
    RETURN QUERY
      SELECT o.client_phone, o.client_email, o.contact_preference, true, 'accepted'::text
      FROM public.opportunities o WHERE o.id = _opp_id;
    RETURN;
  END IF;

  RETURN QUERY SELECT NULL::text, NULL::text, NULL::text, false, 'locked'::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_revealed_contact(uuid) TO authenticated;

-- Defensive: re-revoke direct column access to PII on opportunities.
REVOKE SELECT (client_phone, client_email, contact_preference)
  ON public.opportunities FROM anon, authenticated;