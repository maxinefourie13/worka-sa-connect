-- Already had SET search_path = public, but the linter wants it more explicit.
-- Re-create with search_path = '' and fully-qualified names instead.

CREATE OR REPLACE FUNCTION public.claim_founding_spot(_signup_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _role text;
  _current_count integer;
  _claimed boolean := false;
BEGIN
  SELECT role INTO _role
  FROM public.early_access_signups
  WHERE id = _signup_id
  FOR UPDATE;

  IF _role IS NULL THEN
    RETURN false;
  END IF;

  SELECT count(*) INTO _current_count
  FROM public.early_access_signups
  WHERE role = _role AND claimed_founding_spot = true;

  IF _current_count < 500 THEN
    UPDATE public.early_access_signups
    SET claimed_founding_spot = true
    WHERE id = _signup_id;
    _claimed := true;
  END IF;

  RETURN _claimed;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_founding_spot_counts()
RETURNS TABLE(role text, claimed integer, cap integer, remaining integer)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT
    s.role,
    count(*) FILTER (WHERE s.claimed_founding_spot = true)::integer AS claimed,
    500 AS cap,
    GREATEST(0, 500 - count(*) FILTER (WHERE s.claimed_founding_spot = true))::integer AS remaining
  FROM public.early_access_signups s
  WHERE s.role IN ('pro', 'customer')
  GROUP BY s.role;
$$;