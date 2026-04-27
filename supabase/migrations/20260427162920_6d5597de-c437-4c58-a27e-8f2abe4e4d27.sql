-- Lock down the SECURITY DEFINER functions added for the user-reporting feature
-- so they can't be invoked by anonymous visitors via the exposed PostgREST API.
-- report_business: only signed-in users should call it.
-- handle_new_report: it's a row trigger; nobody needs direct EXECUTE.

REVOKE EXECUTE ON FUNCTION public.report_business(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_business(uuid, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_report() FROM PUBLIC, anon, authenticated;