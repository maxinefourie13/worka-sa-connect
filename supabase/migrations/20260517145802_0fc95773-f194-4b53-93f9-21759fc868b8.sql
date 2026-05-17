DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'id_check_status') THEN
    CREATE TYPE public.id_check_status AS ENUM (
      'pending','processing','verified','failed','needs_review'
    );
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.id_verification_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  id_number text NOT NULL,
  document_path text NOT NULL,
  status public.id_check_status NOT NULL DEFAULT 'pending',
  extracted_name text,
  extracted_id_number text,
  match_score numeric,
  failure_reason text,
  provider text NOT NULL DEFAULT 'sjoh_document_match',
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.id_verification_submissions ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON TYPE public.id_check_status TO authenticated;
GRANT SELECT, INSERT ON public.id_verification_submissions TO authenticated;

CREATE INDEX IF NOT EXISTS idx_id_verification_submissions_user_created
  ON public.id_verification_submissions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_id_verification_submissions_business_created
  ON public.id_verification_submissions(business_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_id_verification_submission_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS set_id_verification_submission_updated_at
  ON public.id_verification_submissions;
CREATE TRIGGER set_id_verification_submission_updated_at
BEFORE UPDATE ON public.id_verification_submissions
FOR EACH ROW EXECUTE FUNCTION public.set_id_verification_submission_updated_at();

DROP POLICY IF EXISTS "Owners can read their ID check submissions" ON public.id_verification_submissions;
CREATE POLICY "Owners can read their ID check submissions"
  ON public.id_verification_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can create ID check submissions for their businesses" ON public.id_verification_submissions;
CREATE POLICY "Owners can create ID check submissions for their businesses"
  ON public.id_verification_submissions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('id-verification-documents','id-verification-documents',false,10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/heic','application/pdf'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Owners can upload their ID check documents" ON storage.objects;
CREATE POLICY "Owners can upload their ID check documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'id-verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Owners can read their ID check documents" ON storage.objects;
CREATE POLICY "Owners can read their ID check documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'id-verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Owners can replace their ID check documents" ON storage.objects;
CREATE POLICY "Owners can replace their ID check documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'id-verification-documents' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'id-verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP FUNCTION IF EXISTS public.apply_verification_result(uuid, text, boolean);
DROP FUNCTION IF EXISTS public.mark_verification_pending(text);

ALTER TABLE public.provider_balances DROP COLUMN IF EXISTS smile_id_job_id;