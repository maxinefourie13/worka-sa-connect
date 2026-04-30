-- Annual billing support
DO $$ BEGIN
  CREATE TYPE public.billing_cycle AS ENUM ('monthly', 'annual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.provider_balances
  ADD COLUMN IF NOT EXISTS billing_cycle public.billing_cycle NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS next_renewal_at timestamptz;

ALTER TABLE public.payment_events
  ADD COLUMN IF NOT EXISTS billing_cycle public.billing_cycle;

-- Update apply_subscription_payment to accept billing_cycle
CREATE OR REPLACE FUNCTION public.apply_subscription_payment(
  _user_id uuid,
  _tier sjoh_tier,
  _customer_code text,
  _subscription_code text,
  _next_renewal timestamp with time zone,
  _billing_cycle public.billing_cycle DEFAULT 'monthly'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if _tier not in ('basic'::sjoh_tier, 'verified_pro'::sjoh_tier) then
    raise exception 'Invalid paid tier %', _tier;
  end if;

  insert into public.provider_balances (
    user_id, tier, paystack_customer_code, paystack_subscription_code, tier_expires_at,
    billing_cycle, next_renewal_at,
    verification_status
  )
  values (
    _user_id, _tier, _customer_code, _subscription_code, _next_renewal,
    _billing_cycle, _next_renewal,
    case when _tier = 'verified_pro' then 'required'::verification_status
         else 'not_required'::verification_status end
  )
  on conflict (user_id) do update set
    tier = excluded.tier,
    paystack_customer_code = excluded.paystack_customer_code,
    paystack_subscription_code = excluded.paystack_subscription_code,
    tier_expires_at = excluded.tier_expires_at,
    billing_cycle = excluded.billing_cycle,
    next_renewal_at = excluded.next_renewal_at,
    verification_status = case
      when public.provider_balances.is_id_verified
        and (public.provider_balances.verification_expires_at is null
             or public.provider_balances.verification_expires_at > now())
      then public.provider_balances.verification_status
      when _tier = 'verified_pro' then 'required'::verification_status
      else 'not_required'::verification_status
    end,
    updated_at = now();
end;
$function$;