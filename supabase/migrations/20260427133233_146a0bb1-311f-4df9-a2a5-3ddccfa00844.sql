REVOKE EXECUTE ON FUNCTION public.set_push_subscription(text, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_email_alerts_optin(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_push_subscription(text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_email_alerts_optin(boolean) TO authenticated;