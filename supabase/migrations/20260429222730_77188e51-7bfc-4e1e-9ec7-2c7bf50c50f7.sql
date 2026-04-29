-- 1. Add lifecycle columns to businesses
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS listing_status text NOT NULL DEFAULT 'workshop'
    CHECK (listing_status IN ('workshop', 'active', 'dormant', 'archived'));

-- 2. Backfill listing_status from existing pre_launch flag
UPDATE public.businesses
SET listing_status = CASE WHEN pre_launch THEN 'workshop' ELSE 'active' END;

-- 3. Indexes for the cron + public filters
CREATE INDEX IF NOT EXISTS idx_businesses_listing_status
  ON public.businesses(listing_status);
CREATE INDEX IF NOT EXISTS idx_businesses_last_active
  ON public.businesses(last_active_at);

-- 4. Replace the old "Public can view live businesses" policy so it now
--    keys off listing_status instead of pre_launch.
DROP POLICY IF EXISTS "Public can view live businesses" ON public.businesses;

CREATE POLICY "Public can view active businesses"
  ON public.businesses
  FOR SELECT
  TO anon, authenticated
  USING (listing_status = 'active');

-- 5. Keep set_business_pre_launch in sync with listing_status
CREATE OR REPLACE FUNCTION public.set_business_pre_launch(_business_id uuid, _pre_launch boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    RAISE EXCEPTION 'Not authorised';
  END IF;

  UPDATE public.businesses
  SET pre_launch = _pre_launch,
      listing_status = CASE
        WHEN _pre_launch THEN 'workshop'
        ELSE 'active'
      END,
      last_active_at = now(),
      updated_at = now()
  WHERE id = _business_id;

  RETURN true;
END;
$function$;

-- 6. Bump activity (called from app on session refresh)
CREATE OR REPLACE FUNCTION public.bump_last_active()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.businesses
  SET last_active_at = now(),
      -- if they were dormant/archived and they log back in, snap to active
      listing_status = CASE
        WHEN listing_status IN ('dormant', 'archived') AND pre_launch = false THEN 'active'
        ELSE listing_status
      END,
      updated_at = now()
  WHERE owner_id = auth.uid();
END;
$$;

-- 7. One-click reactivate
CREATE OR REPLACE FUNCTION public.reactivate_listing(_business_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _is_owner boolean;
  _pre_launch boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT (owner_id = auth.uid()), pre_launch
    INTO _is_owner, _pre_launch
    FROM public.businesses WHERE id = _business_id;

  IF NOT coalesce(_is_owner, false) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  UPDATE public.businesses
  SET listing_status = CASE WHEN _pre_launch THEN 'workshop' ELSE 'active' END,
      last_active_at = now(),
      updated_at = now()
  WHERE id = _business_id;

  RETURN true;
END;
$$;

-- 8. Daily transition function (called by cron edge function)
CREATE OR REPLACE FUNCTION public.transition_listing_states()
RETURNS TABLE(to_dormant int, to_archived int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _dormant_count int;
  _archived_count int;
BEGIN
  -- active -> dormant (60 days no activity, only post-launch)
  WITH updated AS (
    UPDATE public.businesses
    SET listing_status = 'dormant', updated_at = now()
    WHERE listing_status = 'active'
      AND pre_launch = false
      AND last_active_at < now() - interval '60 days'
    RETURNING 1
  )
  SELECT count(*) INTO _dormant_count FROM updated;

  -- dormant -> archived (180 days no activity)
  WITH updated AS (
    UPDATE public.businesses
    SET listing_status = 'archived', updated_at = now()
    WHERE listing_status = 'dormant'
      AND last_active_at < now() - interval '180 days'
    RETURNING 1
  )
  SELECT count(*) INTO _archived_count FROM updated;

  RETURN QUERY SELECT _dormant_count, _archived_count;
END;
$$;

-- 9. Permissions
REVOKE EXECUTE ON FUNCTION public.transition_listing_states() FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.bump_last_active()           TO authenticated;
GRANT  EXECUTE ON FUNCTION public.reactivate_listing(uuid)     TO authenticated;