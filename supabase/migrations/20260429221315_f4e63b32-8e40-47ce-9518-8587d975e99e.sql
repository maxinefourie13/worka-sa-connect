-- Add pre_launch flag to businesses table
-- New businesses default to pre_launch = true (hidden from public until launch day)
ALTER TABLE public.businesses
  ADD COLUMN pre_launch boolean NOT NULL DEFAULT true;

-- Existing businesses (the demo/seed ones) should NOT be pre-launch — they were
-- created before this migration so flip them to live so the directory still works
-- in preview/dev. New founding-pro signups will default to pre_launch = true.
UPDATE public.businesses SET pre_launch = false WHERE created_at < now();

-- Index for the common public-facing query (live businesses only)
CREATE INDEX IF NOT EXISTS idx_businesses_live
  ON public.businesses(pre_launch)
  WHERE pre_launch = false;

-- Tighten the public SELECT policy on businesses so anonymous visitors only see
-- live (non-pre-launch) listings. Owners and admins still see their own pre-launch
-- profiles via the existing owner/admin policies.
DROP POLICY IF EXISTS "Public can view live businesses" ON public.businesses;
CREATE POLICY "Public can view live businesses"
  ON public.businesses
  FOR SELECT
  TO anon, authenticated
  USING (pre_launch = false);