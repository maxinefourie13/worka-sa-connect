ALTER TABLE public.provider_balances
  ADD COLUMN IF NOT EXISTS whatsapp_alerts_optin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_number text;

CREATE OR REPLACE FUNCTION public.set_whatsapp_alerts(_enabled boolean, _number text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _clean text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Normalize: strip spaces / dashes; keep leading + and digits
  _clean := regexp_replace(COALESCE(_number, ''), '[^0-9+]', '', 'g');

  IF _enabled AND (_clean IS NULL OR length(_clean) < 8) THEN
    RAISE EXCEPTION 'A valid WhatsApp number is required to enable alerts';
  END IF;

  UPDATE public.provider_balances
  SET whatsapp_alerts_optin = _enabled,
      whatsapp_number = NULLIF(_clean, ''),
      updated_at = now()
  WHERE user_id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_whatsapp_alerts(boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_whatsapp_alerts(boolean, text) TO authenticated;