-- Recreate the public businesses view with pre_launch filter so the
-- public directory hides Workshop Mode listings.
DROP VIEW IF EXISTS public.businesses_public;

CREATE VIEW public.businesses_public
WITH (security_invoker = true)
AS
SELECT
  id,
  owner_id,
  slug,
  name,
  category_slug,
  category_name,
  province,
  city,
  address,
  website,
  description,
  tags,
  hours,
  image_url,
  plan,
  is_verified,
  certified_pro,
  certifications,
  rating,
  review_count,
  followers_count,
  response_rate,
  pre_launch,
  created_at,
  updated_at
FROM public.businesses
WHERE pre_launch = false;

GRANT SELECT ON public.businesses_public TO anon, authenticated;

-- Helper RPC: lets an owner flip their own business out of pre-launch mode.
-- Admins can flip any business. Used by the future launch-day toggle.
CREATE OR REPLACE FUNCTION public.set_business_pre_launch(
  _business_id uuid,
  _pre_launch boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_owner boolean;
  _is_admin boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT (owner_id = auth.uid()) INTO _is_owner
  FROM public.businesses WHERE id = _business_id;

  _is_admin := public.has_role(auth.uid(), 'admin'::app_role);

  IF NOT (_is_owner OR _is_admin) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.businesses
  SET pre_launch = _pre_launch, updated_at = now()
  WHERE id = _business_id;

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_business_pre_launch(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_business_pre_launch(uuid, boolean) TO authenticated;