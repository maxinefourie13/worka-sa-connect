-- 1. Lock down businesses table: remove broad public SELECT (forces use of businesses_public view + reveal_contact RPC)
DROP POLICY IF EXISTS "Public can view active businesses" ON public.businesses;

-- 2. Remove redundant deal_memos leak: "Authenticated can read deal memo by id" with USING (true)
DROP POLICY IF EXISTS "Authenticated can read deal memo by id" ON public.deal_memos;

-- 3. Tier-gated opportunity detail RPC. Returns full description + attachments only for:
--    - the client who posted it
--    - admins
--    - pros with active verified_pro tier (R250)
--    Basic/trial pros get title+category+location only (description/attachments omitted from result).
CREATE OR REPLACE FUNCTION public.get_opportunity_for_viewer(_opportunity_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  category_slug text,
  category_name text,
  province text,
  city text,
  budget numeric,
  budget_type budget_type,
  is_urgent boolean,
  status opportunity_status,
  applicants_count int,
  created_at timestamptz,
  description text,
  attachments jsonb,
  requirements text[],
  deadline text,
  posted_by_name text,
  can_view_full boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _viewer uuid := auth.uid();
  _is_owner boolean;
  _is_admin boolean := public.has_role(_viewer, 'admin'::app_role);
  _has_pro boolean := public.has_verified_pro_access(_viewer);
  _can_full boolean;
BEGIN
  SELECT (o.client_id = _viewer) INTO _is_owner FROM public.opportunities o WHERE o.id = _opportunity_id;
  IF _is_owner IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;

  _can_full := coalesce(_is_owner, false) OR _is_admin OR _has_pro;

  RETURN QUERY
  SELECT
    o.id, o.title, o.category_slug, o.category_name, o.province, o.city,
    o.budget, o.budget_type, o.is_urgent, o.status, o.applicants_count, o.created_at,
    CASE WHEN _can_full THEN o.description ELSE NULL END,
    CASE WHEN _can_full THEN o.attachments ELSE '[]'::jsonb END,
    CASE WHEN _can_full THEN o.requirements ELSE '{}'::text[] END,
    CASE WHEN _can_full THEN o.deadline ELSE NULL END,
    CASE WHEN _can_full THEN o.posted_by_name ELSE NULL END,
    _can_full
  FROM public.opportunities o
  WHERE o.id = _opportunity_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_opportunity_for_viewer(uuid) TO authenticated, anon;