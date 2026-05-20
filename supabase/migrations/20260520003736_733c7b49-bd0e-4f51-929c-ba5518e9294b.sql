
ALTER TABLE public.provider_balances
  ADD COLUMN IF NOT EXISTS payfast_token text;

ALTER TABLE public.payment_events
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'paystack';

CREATE INDEX IF NOT EXISTS idx_provider_balances_payfast_token
  ON public.provider_balances (payfast_token)
  WHERE payfast_token IS NOT NULL;
