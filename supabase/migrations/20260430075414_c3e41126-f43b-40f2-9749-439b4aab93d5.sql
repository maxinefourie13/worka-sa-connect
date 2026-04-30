-- KYC fields on businesses (ThisIsMe)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS kyc_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS kyc_reference text,
  ADD COLUMN IF NOT EXISTS kyc_verified_at timestamptz;

-- Concierge fields on opportunities
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS is_concierge_lead boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_contact_url text;

-- Allow admin-posted concierge jobs without a registered client
ALTER TABLE public.opportunities
  ALTER COLUMN client_id DROP NOT NULL;

-- Make sure admins can post/manage concierge opportunities even without client_id = auth.uid()
DROP POLICY IF EXISTS "Admins can manage all opportunities" ON public.opportunities;
CREATE POLICY "Admins can manage all opportunities"
  ON public.opportunities
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Tighten the existing "Clients can post" policy so concierge inserts (client_id = null) only succeed for admins
-- (Current policy: WITH CHECK (auth.uid() = client_id) — admins are covered by the policy above.)
