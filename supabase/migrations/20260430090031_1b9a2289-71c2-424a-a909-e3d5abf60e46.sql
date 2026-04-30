-- 1. Profile minimum viability: rebuild businesses_public view to hide profiles
-- without a photo or with a bio shorter than 20 chars. Owners still see their
-- own row via the businesses table directly.
CREATE OR REPLACE VIEW public.businesses_public
WITH (security_invoker = true) AS
SELECT
  b.id, b.owner_id, b.slug, b.name,
  b.category_slug, b.category_name,
  b.province, b.city, b.address, b.website,
  b.description, b.tags, b.hours, b.image_url,
  b.plan, b.is_verified, b.certified_pro, b.certifications,
  b.rating, b.review_count, b.followers_count, b.response_rate,
  b.pre_launch, b.created_at, b.updated_at
FROM public.businesses b
WHERE b.is_suspended = false
  AND b.image_url IS NOT NULL
  AND b.image_url <> ''
  AND char_length(coalesce(b.description, '')) > 20;

GRANT SELECT ON public.businesses_public TO anon, authenticated;

-- 2. Job completion: add completion fields to deal_memos
ALTER TABLE public.deal_memos
  ADD COLUMN IF NOT EXISTS completion_photo_url text,
  ADD COLUMN IF NOT EXISTS completion_notes text;

-- 3. Storage bucket for completion photos (public so customer can see proof)
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-completions', 'job-completions', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: pros upload to a folder named after their user id;
-- everyone can read (public bucket).
DROP POLICY IF EXISTS "Anyone can view completion photos" ON storage.objects;
CREATE POLICY "Anyone can view completion photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'job-completions');

DROP POLICY IF EXISTS "Pros upload their own completion photos" ON storage.objects;
CREATE POLICY "Pros upload their own completion photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-completions'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Pros update their own completion photos" ON storage.objects;
CREATE POLICY "Pros update their own completion photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'job-completions'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. RPC: mark a deal memo complete + trigger review chaser flag
CREATE OR REPLACE FUNCTION public.mark_deal_memo_complete(
  _deal_memo_id uuid,
  _completion_photo_url text DEFAULT NULL,
  _completion_notes text DEFAULT NULL
)
RETURNS public.deal_memos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.deal_memos;
BEGIN
  UPDATE public.deal_memos
     SET completed_at = now(),
         status = 'completed'::deal_memo_status,
         completion_photo_url = COALESCE(_completion_photo_url, completion_photo_url),
         completion_notes = COALESCE(_completion_notes, completion_notes),
         updated_at = now()
   WHERE id = _deal_memo_id
     AND pro_user_id = auth.uid()
   RETURNING * INTO _row;

  IF _row.id IS NULL THEN
    RAISE EXCEPTION 'Deal memo not found or not yours';
  END IF;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_deal_memo_complete(uuid, text, text) TO authenticated;