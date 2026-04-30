ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS stale_fallback_notified_at timestamptz;

-- Count of "active, visible" Pros for a category / province (and optionally city).
-- Mirrors directory visibility: must have profile pic, ≥20 char bio, not suspended,
-- and an active paid sub or trial.
CREATE OR REPLACE FUNCTION public.count_active_pros(
  _category_slug text,
  _province text,
  _city text DEFAULT NULL
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.businesses b
  LEFT JOIN public.provider_balances pb ON pb.user_id = b.owner_id
  WHERE b.is_suspended = false
    AND b.image_url IS NOT NULL
    AND b.image_url <> ''
    AND char_length(COALESCE(b.description, '')) > 20
    AND b.listing_status IN ('active', 'workshop')
    AND (
      b.category_slug = _category_slug
      OR _category_slug = ANY(b.secondary_categories)
    )
    AND b.province = _province
    AND (_city IS NULL OR _city = '' OR lower(b.city) = lower(_city))
    AND (
      pb.tier IN ('verified_pro', 'basic', 'basic_trial')
      AND (pb.tier_expires_at IS NULL OR pb.tier_expires_at > now())
    );
$$;

REVOKE EXECUTE ON FUNCTION public.count_active_pros(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_active_pros(text, text, text) TO anon, authenticated;

-- Suggest up to 5 fallback Pros for a stale lead. Widens the net:
-- 1. exact category + city, 2. exact category + province, 3. category nationwide.
CREATE OR REPLACE FUNCTION public.find_fallback_pros_for_opportunity(_opportunity_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  city text,
  province text,
  rating numeric,
  review_count integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cat text;
  _prov text;
  _city text;
BEGIN
  SELECT o.category_slug, o.province, o.city
    INTO _cat, _prov, _city
  FROM public.opportunities o
  WHERE o.id = _opportunity_id;

  IF _cat IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT b.id, b.name, b.slug, b.city, b.province, b.rating, b.review_count,
           CASE
             WHEN lower(b.city) = lower(_city) THEN 3
             WHEN b.province = _prov THEN 2
             ELSE 1
           END AS proximity
    FROM public.businesses b
    LEFT JOIN public.provider_balances pb ON pb.user_id = b.owner_id
    WHERE b.is_suspended = false
      AND b.image_url IS NOT NULL AND b.image_url <> ''
      AND char_length(COALESCE(b.description, '')) > 20
      AND b.listing_status IN ('active', 'workshop')
      AND (b.category_slug = _cat OR _cat = ANY(b.secondary_categories))
      AND (
        pb.tier IN ('verified_pro', 'basic', 'basic_trial')
        AND (pb.tier_expires_at IS NULL OR pb.tier_expires_at > now())
      )
  )
  SELECT base.id, base.name, base.slug, base.city, base.province, base.rating, base.review_count
  FROM base
  ORDER BY base.proximity DESC, base.rating DESC NULLS LAST, base.review_count DESC
  LIMIT 5;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.find_fallback_pros_for_opportunity(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_fallback_pros_for_opportunity(uuid) TO authenticated, service_role;