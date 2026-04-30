
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  pro_user_id uuid NOT NULL,
  business_id uuid NOT NULL,
  deal_memo_id uuid,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal_zar numeric NOT NULL DEFAULT 0,
  vat_zar numeric NOT NULL DEFAULT 0,
  total_zar numeric NOT NULL DEFAULT 0,
  vat_included boolean NOT NULL DEFAULT false,
  notes text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invoices_pro_user_id_idx ON public.invoices(pro_user_id);
CREATE INDEX IF NOT EXISTS invoices_business_id_idx ON public.invoices(business_id);
CREATE INDEX IF NOT EXISTS invoices_deal_memo_id_idx ON public.invoices(deal_memo_id);
CREATE UNIQUE INDEX IF NOT EXISTS invoices_invoice_number_business_idx ON public.invoices(business_id, invoice_number);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pros can create invoices for their business"
ON public.invoices FOR INSERT TO authenticated
WITH CHECK (
  pro_user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = invoices.business_id AND b.owner_id = auth.uid())
);

CREATE POLICY "Pros can view their own invoices"
ON public.invoices FOR SELECT TO authenticated
USING (pro_user_id = auth.uid());

CREATE POLICY "Customers can view invoices linked to their deal memos"
ON public.invoices FOR SELECT TO authenticated
USING (
  deal_memo_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.deal_memos dm
    WHERE dm.id = invoices.deal_memo_id
      AND (dm.client_user_id = auth.uid()
           OR lower(dm.client_email) = lower(COALESCE(auth.jwt() ->> 'email', '')))
  )
);

CREATE POLICY "Admins manage all invoices"
ON public.invoices FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
