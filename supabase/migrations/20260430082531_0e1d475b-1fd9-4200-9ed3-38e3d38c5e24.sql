-- 1. Add attachments column to opportunities (will be referenced as "requests" in UI)
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Create public bucket for request attachments (images + PDFs, 10MB cap)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'request-attachments',
  'request-attachments',
  true,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Storage policies
-- Public read
CREATE POLICY "Request attachments are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'request-attachments');

-- Authenticated users can upload into their own folder ({uid}/...)
CREATE POLICY "Users can upload their own request attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'request-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Owners can update their files
CREATE POLICY "Users can update their own request attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'request-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Owners (or admins) can delete
CREATE POLICY "Users can delete their own request attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'request-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);