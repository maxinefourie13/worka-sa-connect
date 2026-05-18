-- =========================================================
-- Payments + Identity verification additions
-- =========================================================

-- 1) Verification status enum + new columns on provider_balances
create type public.verification_status as enum (
  'not_required', 'required', 'pending', 'verified', 'failed', 'expired'
);

alter table public.provider_balances
  add column is_id_verified boolean not null default false,
  add column verification_status public.verification_status not null default 'not_required',
  add column verification_expires_at timestamptz,
  add column smile_id_job_id text,
  add column paystack_customer_code text,
  add column paystack_subscription_code text,
  add column tier_expires_at timestamptz;

create index provider_balances_paystack_customer_idx
  on public.provider_balances(paystack_customer_code);
create index provider_balances_paystack_sub_idx
  on public.provider_balances(paystack_subscription_code);

-- 2) Payment events (audit log of every Paystack webhook)
create type public.payment_event_kind as enum (
  'subscription_charge',
  'subscription_disable',
  'subscription_payment_failed',
  'klap_topup_charge',
  'urgent_fee_charge',
  'other'
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  paystack_reference text not null unique,  -- dedupe key
  paystack_event text not null,
  kind public.payment_event_kind not null default 'other',
  amount_cents int,
  currency text default 'ZAR',
  raw jsonb not null,
  processed boolean not null default false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create index payment_events_user_idx on public.payment_events(user_id);
create index payment_events_kind_idx on public.payment_events(kind);

alter table public.payment_events enable row level security;

create policy "Users view their own payment events"
  on public.payment_events for select to authenticated
  using (auth.uid() = user_id);

create policy "Admins view all payment events"
  on public.payment_events for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- No INSERT/UPDATE/DELETE policies => only SECURITY DEFINER functions can write.

-- 3) Klap top-ups (pending purchases waiting for webhook)
create table public.klap_topups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pack_slug text not null,           -- 'six-pack' | 'crate'
  klaps int not null,                -- snapshot of pack size at time of purchase
  amount_cents int not null,
  paystack_reference text not null unique,
  status text not null default 'pending', -- 'pending' | 'completed' | 'failed'
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index klap_topups_user_idx on public.klap_topups(user_id);

alter table public.klap_topups enable row level security;

create policy "Users view their own topups"
  on public.klap_topups for select to authenticated
  using (auth.uid() = user_id);

-- 4) Urgent fees (paid by clients to boost an opportunity)
create table public.urgent_fees (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  amount_cents int not null,
  paystack_reference text not null unique,
  status text not null default 'pending',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index urgent_fees_client_idx on public.urgent_fees(client_id);
create index urgent_fees_opp_idx on public.urgent_fees(opportunity_id);

alter table public.urgent_fees enable row level security;

create policy "Clients view their own urgent fees"
  on public.urgent_fees for select to authenticated
  using (auth.uid() = client_id);

-- 5) Public view: per-business verified status (combines verified flag + active sub + non-expired)
create or replace view public.business_verified_status
with (security_invoker = true)
as
  select
    b.id as business_id,
    coalesce(
      pb.is_id_verified
      and (pb.tier_expires_at is null or pb.tier_expires_at > now())
      and (pb.verification_expires_at is null or pb.verification_expires_at > now()),
      false
    ) as is_verified_pro
  from public.businesses b
  left join public.provider_balances pb on pb.user_id = b.owner_id;

grant select on public.business_verified_status to anon, authenticated;

-- 6) Server-side functions — the only path to mutate balances/verification

-- 6a) Apply subscription charge: activate plan, top up klaps, require verification
create or replace function public.apply_subscription_payment(
  _user_id uuid,
  _tier public.sjoh_tier,
  _customer_code text,
  _subscription_code text,
  _next_renewal timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _monthly_klaps int;
begin
  _monthly_klaps := case _tier
    when 'hustler'   then 15
    when 'main-oke'  then 100
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
    -- Require verification only if not already verified (or expired)
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

-- 6b) Credit a klap topup exactly once
create or replace function public.apply_klap_topup(_topup_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _t record;
begin
  select * into _t from public.klap_topups where id = _topup_id for update;
  if _t is null then raise exception 'Topup not found'; end if;
  if _t.status = 'completed' then return; end if;

  update public.provider_balances
    set klaps_remaining = klaps_remaining + _t.klaps,
        updated_at = now()
    where user_id = _t.user_id;

  -- If user has no balance row yet (edge case), create one.
  if not found then
    insert into public.provider_balances (user_id, klaps_remaining, klaps_this_month)
    values (_t.user_id, _t.klaps, 0);
  end if;

  update public.klap_topups
    set status = 'completed', completed_at = now()
    where id = _topup_id;
end;
$$;

-- 6c) Apply verification result from the legacy verification webhook
create or replace function public.apply_verification_result(
  _user_id uuid,
  _job_id text,
  _verified boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.provider_balances set
    smile_id_job_id = _job_id,
    is_id_verified = _verified,
    verification_status = case when _verified then 'verified'::verification_status
                               else 'failed'::verification_status end,
    verification_expires_at = case when _verified then now() + interval '12 months'
                                   else verification_expires_at end,
    updated_at = now()
  where user_id = _user_id;
end;
$$;

-- 6d) Lapse a subscription
create or replace function public.lapse_subscription(_subscription_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.provider_balances set
    tier = 'dala-trial'::sjoh_tier,
    tier_expires_at = now(),
    updated_at = now()
  where paystack_subscription_code = _subscription_code;
end;
$$;

-- 6e) Mark verification flow as pending (called by the legacy verification init flow)
create or replace function public.mark_verification_pending(_job_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  update public.provider_balances set
    smile_id_job_id = _job_id,
    verification_status = 'pending'::verification_status,
    updated_at = now()
  where user_id = auth.uid();
end;
$$;

-- Lock down direct execution; webhook functions run as service-role, which bypasses these grants.
revoke execute on function public.apply_subscription_payment(uuid, public.sjoh_tier, text, text, timestamptz) from public, anon, authenticated;
revoke execute on function public.apply_klap_topup(uuid) from public, anon, authenticated;
revoke execute on function public.apply_verification_result(uuid, text, boolean) from public, anon, authenticated;
revoke execute on function public.lapse_subscription(text) from public, anon, authenticated;

-- Only mark_verification_pending is callable by users (so the client can flip status before redirecting to SDK).
grant execute on function public.mark_verification_pending(text) to authenticated;

-- 7) Daily expiry sweep (run via pg_cron if available, otherwise call from a daily edge function)
create or replace function public.expire_stale_verifications()
returns void
language sql
security definer
set search_path = public
as $$
  update public.provider_balances
     set verification_status = 'expired'::verification_status,
         updated_at = now()
   where is_id_verified = true
     and verification_expires_at is not null
     and verification_expires_at < now()
     and verification_status <> 'expired';
$$;

revoke execute on function public.expire_stale_verifications() from public, anon, authenticated;
