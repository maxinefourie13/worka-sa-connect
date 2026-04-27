-- The new RESTRICTIVE "Only admins can write roles" policy fully covers
-- write access. The old permissive ALL policy is redundant and confusing.
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Re-add admin-only management as a clean PERMISSIVE policy alongside
-- the restrictive one (restrictive enforces, permissive grants).
CREATE POLICY "Admins manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
