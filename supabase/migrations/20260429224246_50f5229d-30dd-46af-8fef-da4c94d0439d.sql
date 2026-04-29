-- =========================================================================
-- Phase 1: drop everything Klap/bid-related
-- =========================================================================
drop function if exists public.place_bid(uuid, uuid, text, numeric, integer);
drop function if exists public.top_up_bid(uuid, integer);
drop function if exists public.apply_klap_topup(uuid);
drop function if exists public.validate_klap_event() cascade;

drop table if exists public.klap_events cascade;
drop table if exists public.klap_topups cascade;
drop type if exists public.klap_outcome cascade;

-- =========================================================================
-- Phase 2: wipe existing data (no real users yet)
-- =========================================================================
truncate table public.proposals cascade;
truncate table public.opportunities cascade;
truncate table public.business_follows cascade;
truncate table public.business_google_reviews cascade;
truncate table public.reviews cascade;
truncate table public.services cascade;
truncate table public.promotions cascade;
truncate table public.user_reports cascade;
truncate table public.businesses cascade;
truncate table public.provider_balances cascade;
truncate table public.payment_events cascade;

-- =========================================================================
-- Phase 3: drop functions that depend on the old sjoh_tier enum
-- =========================================================================
drop function if exists public.apply_subscription_payment(uuid, public.sjoh_tier, text, text, timestamptz);

-- =========================================================================
-- Phase 4: rebuild the tier enum
-- =========================================================================
alter table public.provider_balances alter column tier drop default;

alter type public.sjoh_tier rename to sjoh_tier_old;

create type public.sjoh_tier as enum (
  'none',
  'basic_trial',
  'basic',
  'verified_pro_trial',
  'verified_pro'
);

alter table public.provider_balances
  alter column tier type public.sjoh_tier
  using 'basic_trial'::public.sjoh_tier;

alter table public.provider_balances
  alter column tier set default 'basic_trial'::public.sjoh_tier;

drop type public.sjoh_tier_old;

-- =========================================================================
-- Phase 5: clean Klap columns off provider_balances
-- =========================================================================
alter table public.provider_balances
  drop column if exists klaps_remaining,
  drop column if exists klaps_this_month;

alter table public.provider_balances
  alter column trial_ends_at set default (now() + interval '30 days');

-- =========================================================================
-- Phase 6: clean Klap column off proposals + add unique constraint
-- =========================================================================
alter table public.proposals
  drop column if exists klaps_spent;

create unique index if not exists proposals_one_per_business_per_opp
  on public.proposals (opportunity_id, business_id);

-- =========================================================================
-- Phase 7: urgent boost on opportunities
-- =========================================================================
alter table public.opportunities
  add column if not exists urgent_boost_paid_at timestamptz,
  add column if not exists urgent_boost_amount_cents integer;

create index if not exists opportunities_urgent_idx
  on public.opportunities (urgent_boost_paid_at desc nulls last);

-- =========================================================================
-- Phase 8: rewrite handle_new_user (no Klaps, 30-day Basic trial)
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  insert into public.user_roles (user_id, role)
  values (new.id, 'client');
  insert into public.provider_balances (user_id, tier, trial_ends_at)
  values (new.id, 'basic_trial'::sjoh_tier, now() + interval '30 days');
  return new;
end;
$$;

-- =========================================================================
-- Phase 9: subscription / access helpers
-- =========================================================================
create or replace function public.has_active_listing_access(_user_id uuid)
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.provider_balances pb
    where pb.user_id = _user_id
      and (
        (pb.tier in ('basic'::sjoh_tier, 'verified_pro'::sjoh_tier)
          and (pb.tier_expires_at is null or pb.tier_expires_at > now()))
        or (pb.tier in ('basic_trial'::sjoh_tier, 'verified_pro_trial'::sjoh_tier)
          and pb.trial_ends_at is not null and pb.trial_ends_at > now())
      )
  )
$$;

create or replace function public.has_verified_pro_access(_user_id uuid)
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.provider_balances pb
    where pb.user_id = _user_id
      and (
        (pb.tier = 'verified_pro'::sjoh_tier
          and (pb.tier_expires_at is null or pb.tier_expires_at > now()))
        or (pb.tier = 'verified_pro_trial'::sjoh_tier
          and pb.trial_ends_at is not null and pb.trial_ends_at > now())
      )
  )
$$;

-- =========================================================================
-- Phase 10: rebuild apply_subscription_payment for new tiers
-- =========================================================================
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
begin
  if _tier not in ('basic'::sjoh_tier, 'verified_pro'::sjoh_tier) then
    raise exception 'Invalid paid tier %', _tier;
  end if;

  insert into public.provider_balances (
    user_id, tier, paystack_customer_code, paystack_subscription_code, tier_expires_at,
    verification_status
  )
  values (
    _user_id, _tier, _customer_code, _subscription_code, _next_renewal,
    case when _tier = 'verified_pro' then 'required'::verification_status
         else 'not_required'::verification_status end
  )
  on conflict (user_id) do update set
    tier = excluded.tier,
    paystack_customer_code = excluded.paystack_customer_code,
    paystack_subscription_code = excluded.paystack_subscription_code,
    tier_expires_at = excluded.tier_expires_at,
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
$$;

-- =========================================================================
-- Phase 11: lapse_subscription drops to 'none'
-- =========================================================================
create or replace function public.lapse_subscription(_subscription_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.provider_balances set
    tier = 'none'::sjoh_tier,
    tier_expires_at = now(),
    updated_at = now()
  where paystack_subscription_code = _subscription_code;
end;
$$;

-- =========================================================================
-- Phase 12: submit_proposal RPC (free, one-per-job, Verified Pros only)
-- =========================================================================
create or replace function public.submit_proposal(
  _opportunity_id uuid,
  _business_id uuid,
  _message text,
  _quote_amount numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _proposal_id uuid;
  _is_owner boolean;
  _is_suspended boolean;
  _is_verified boolean;
  _opp_status opportunity_status;
  _existing uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to submit a proposal';
  end if;

  if _message is null or length(trim(_message)) < 20 then
    raise exception 'Your pitch needs at least 20 characters';
  end if;

  select (owner_id = auth.uid()), is_suspended, is_verified
    into _is_owner, _is_suspended, _is_verified
    from public.businesses where id = _business_id;

  if not coalesce(_is_owner, false) then
    raise exception 'You do not own this business';
  end if;
  if _is_suspended then
    raise exception 'This business is suspended';
  end if;
  if not _is_verified then
    raise exception 'Only verified businesses can submit proposals';
  end if;

  if not public.has_verified_pro_access(auth.uid()) then
    raise exception 'Only Verified Pro subscribers can apply for jobs. Upgrade to apply.';
  end if;

  select status into _opp_status from public.opportunities where id = _opportunity_id;
  if _opp_status is null then
    raise exception 'Opportunity not found';
  end if;
  if _opp_status <> 'open' then
    raise exception 'This job is no longer open';
  end if;

  select id into _existing
    from public.proposals
    where opportunity_id = _opportunity_id and business_id = _business_id;
  if _existing is not null then
    raise exception 'You''ve already submitted a proposal for this job';
  end if;

  insert into public.proposals (
    opportunity_id, business_id, provider_id, message, quote_amount
  )
  values (
    _opportunity_id, _business_id, auth.uid(), _message, _quote_amount
  )
  returning id into _proposal_id;

  update public.opportunities
    set applicants_count = applicants_count + 1, updated_at = now()
    where id = _opportunity_id;

  return _proposal_id;
end;
$$;

-- =========================================================================
-- Phase 13: respect listing access in pre_launch / reactivate
-- =========================================================================
create or replace function public.set_business_pre_launch(_business_id uuid, _pre_launch boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _is_owner boolean;
  _is_admin boolean;
  _has_access boolean;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select (owner_id = auth.uid()) into _is_owner
  from public.businesses where id = _business_id;

  _is_admin := public.has_role(auth.uid(), 'admin'::app_role);

  if not (_is_owner or _is_admin) then
    raise exception 'Not authorised';
  end if;

  _has_access := public.has_active_listing_access(auth.uid());

  update public.businesses
  set pre_launch = _pre_launch,
      listing_status = case
        when _pre_launch then 'workshop'
        when not _has_access then 'workshop'
        else 'active'
      end,
      last_active_at = now(),
      updated_at = now()
  where id = _business_id;

  return true;
end;
$$;

create or replace function public.reactivate_listing(_business_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _is_owner boolean;
  _pre_launch boolean;
  _has_access boolean;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select (owner_id = auth.uid()), pre_launch
    into _is_owner, _pre_launch
    from public.businesses where id = _business_id;

  if not coalesce(_is_owner, false) then
    raise exception 'Not authorised';
  end if;

  _has_access := public.has_active_listing_access(auth.uid());

  update public.businesses
  set listing_status = case
        when _pre_launch then 'workshop'
        when not _has_access then 'workshop'
        else 'active'
      end,
      last_active_at = now(),
      updated_at = now()
  where id = _business_id;

  return true;
end;
$$;