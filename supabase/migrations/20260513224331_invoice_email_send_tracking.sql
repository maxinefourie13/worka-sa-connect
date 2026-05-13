ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'failed')),
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_message_id text,
  ADD COLUMN IF NOT EXISTS email_error text;

CREATE INDEX IF NOT EXISTS invoices_status_idx ON public.invoices(status);
CREATE INDEX IF NOT EXISTS invoices_sent_at_idx ON public.invoices(sent_at);

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
