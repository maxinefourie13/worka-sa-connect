ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'failed')),
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_message_id text,
  ADD COLUMN IF NOT EXISTS email_error text,
  ADD COLUMN IF NOT EXISTS pdf_path text,
  ADD COLUMN IF NOT EXISTS access_token text,
  ADD COLUMN IF NOT EXISTS access_token_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS invoices_status_idx ON public.invoices(status);
CREATE INDEX IF NOT EXISTS invoices_sent_at_idx ON public.invoices(sent_at);
CREATE UNIQUE INDEX IF NOT EXISTS invoices_access_token_idx
  ON public.invoices(access_token)
  WHERE access_token IS NOT NULL;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('invoice-pdfs', 'invoice-pdfs', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf'];

DROP POLICY IF EXISTS "Pros can update invoice send status" ON public.invoices;
CREATE POLICY "Pros can update invoice send status"
ON public.invoices FOR UPDATE TO authenticated
USING (
  pro_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = invoices.business_id
      AND b.owner_id = auth.uid()
  )
)
WITH CHECK (
  pro_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = invoices.business_id
      AND b.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Pros can upload their own invoice pdfs" ON storage.objects;
CREATE POLICY "Pros can upload their own invoice pdfs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'invoice-pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Pros can view their own invoice pdfs" ON storage.objects;
CREATE POLICY "Pros can view their own invoice pdfs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'invoice-pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Pros can replace their own invoice pdfs" ON storage.objects;
CREATE POLICY "Pros can replace their own invoice pdfs"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'invoice-pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'invoice-pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
