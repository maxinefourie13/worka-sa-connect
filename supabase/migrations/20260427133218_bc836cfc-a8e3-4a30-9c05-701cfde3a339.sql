-- Notification preferences and OneSignal player ID

ALTER TABLE public.provider_balances
  ADD COLUMN IF NOT EXISTS email_alerts_optin boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_alerts_optin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onesignal_player_id text;

-- RPC to safely set push subscription state
CREATE OR REPLACE FUNCTION public.set_push_subscription(_player_id text, _enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.provider_balances (user_id, onesignal_player_id, push_alerts_optin)
  VALUES (auth.uid(), _player_id, _enabled)
  ON CONFLICT (user_id) DO UPDATE SET
    onesignal_player_id = CASE WHEN _enabled THEN _player_id ELSE NULL END,
    push_alerts_optin = _enabled,
    updated_at = now();
END;
$$;

-- RPC to update email opt-in
CREATE OR REPLACE FUNCTION public.set_email_alerts_optin(_enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.provider_balances
  SET email_alerts_optin = _enabled, updated_at = now()
  WHERE user_id = auth.uid();
END;
$$;