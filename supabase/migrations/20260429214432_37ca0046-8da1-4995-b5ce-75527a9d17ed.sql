-- 1. Add the column
ALTER TABLE public.early_access_signups
  ADD COLUMN IF NOT EXISTS claimed_founding_spot boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_early_access_signups_founding
  ON public.early_access_signups (role, claimed_founding_spot)
  WHERE claimed_founding_spot = true;

-- 2. Atomic claim function — checks count and flips flag in one transaction
CREATE OR REPLACE FUNCTION public.claim_founding_spot(_signup_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
  _current_count integer;
  _claimed boolean := false;
BEGIN
  -- Lock the row we're updating
  SELECT role INTO _role
  FROM public.early_access_signups
  WHERE id = _signup_id
  FOR UPDATE;

  IF _role IS NULL THEN
    RETURN false;
  END IF;

  -- Count existing founding spots for this role (pros and customers tracked separately)
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

-- 3. Public counts view (no signup details exposed)
CREATE OR REPLACE VIEW public.founding_spot_counts
WITH (security_invoker = true)
AS
SELECT
  role,
  count(*) FILTER (WHERE claimed_founding_spot = true)::integer AS claimed,
  500 AS cap,
  GREATEST(0, 500 - count(*) FILTER (WHERE claimed_founding_spot = true))::integer AS remaining
FROM public.early_access_signups
WHERE role IN ('pro', 'customer')
GROUP BY role;

-- 4. Allow anon + authenticated to read just the counts view
GRANT SELECT ON public.founding_spot_counts TO anon, authenticated;

-- The view runs as the querying role (security_invoker), so we need a
-- policy on the underlying table that only allows the count aggregate to work.
-- We do this by adding a SELECT policy that allows reading only the columns
-- needed for counting — but since RLS works at row level not column level,
-- we instead create a SECURITY DEFINER function for safe counts:

CREATE OR REPLACE FUNCTION public.get_founding_spot_counts()
RETURNS TABLE(role text, claimed integer, cap integer, remaining integer)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.get_founding_spot_counts() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_founding_spot(uuid) TO anon, authenticated;