-- Create the business-images storage bucket for logo and cover photo uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-images',
  'business-images',
  true,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own images
CREATE POLICY "Authenticated users can upload business images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'business-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update/replace their own images
CREATE POLICY "Authenticated users can update their business images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'business-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access (so logos/covers are visible to everyone)
CREATE POLICY "Public read access for business images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'business-images');
