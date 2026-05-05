-- has_role is used inside RLS policies on multiple tables.
-- Authenticated users need EXECUTE so those policies can evaluate correctly.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
