-- Drop urgent SOS infrastructure & bump Klap allowances per Sjoh! spec
begin;

-- 1) Drop urgent_fees table (no payments reference it after we remove the edge fn)
drop table if exists public.urgent_fees cascade;

-- 2) Drop is_urgent column from opportunities
alter table public.opportunities drop column if exists is_urgent;

-- 3) Drop the 'urgent_fee' enum value usage if present in payment_event_kind.
-- We can't drop enum values in Postgres easily; leave the value in place if it exists.
-- Any urgent_fee events stay in payment_events for audit.

-- 4) Bump Klap allowances to match spec:
--    Main Oke: 200 (was 100), Hustler: 50 (was 15) - keeping Hustler as a mid-tier
create or replace function public.apply_subscription_payment(
  _user_id uuid,
  _tier sjoh_tier,
  _customer_code text,
  _subscription_code text,
  _next_renewal timestamptz
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _monthly_klaps int;
begin
  _monthly_klaps := case _tier
    when 'hustler'   then 50
    when 'main-oke'  then 200
    else 5
  end;

  insert into public.provider_balances (
    user_id, tier, klaps_remaining, klaps_this_month,
    paystack_customer_code, paystack_subscription_code, tier_expires_at,
    verification_status
  )
  values (
    _user_id, _tier, _monthly_klaps, _monthly_klaps,
    _customer_code, _subscription_code, _next_renewal,
    case when _tier in ('hustler', 'main-oke') then 'required'::verification_status
         else 'not_required'::verification_status end
  )
  on conflict (user_id) do update set
    tier = excluded.tier,
    klaps_remaining = public.provider_balances.klaps_remaining + _monthly_klaps,
    klaps_this_month = _monthly_klaps,
    paystack_customer_code = excluded.paystack_customer_code,
    paystack_subscription_code = excluded.paystack_subscription_code,
    tier_expires_at = excluded.tier_expires_at,
    verification_status = case
      when public.provider_balances.is_id_verified
        and (public.provider_balances.verification_expires_at is null
             or public.provider_balances.verification_expires_at > now())
      then public.provider_balances.verification_status
      else 'required'::verification_status
    end,
    updated_at = now();
end;
$$;

revoke execute on function public.apply_subscription_payment(uuid, public.sjoh_tier, text, text, timestamptz) from public, anon, authenticated;

commit;