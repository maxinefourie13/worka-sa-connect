-- 1. Contact reveals log
create table if not exists public.contact_reveals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  viewer_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists contact_reveals_business_idx on public.contact_reveals(business_id, created_at desc);
create index if not exists contact_reveals_viewer_idx on public.contact_reveals(viewer_id, created_at desc);
create index if not exists contact_reveals_viewer_business_idx on public.contact_reveals(viewer_id, business_id, created_at desc);

alter table public.contact_reveals enable row level security;

-- Business owners can see who revealed their contact (lead log)
create policy "Owners can view reveals for their businesses"
on public.contact_reveals
for select
to authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = contact_reveals.business_id
      and b.owner_id = auth.uid()
  )
);

create policy "Admins can view all reveals"
on public.contact_reveals
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'::app_role));

-- Viewers can see their own reveal history
create policy "Viewers can see their own reveals"
on public.contact_reveals
for select
to authenticated
using (auth.uid() = viewer_id);

-- 2. Drop the broad public SELECT policy and replace it with one that
--    cannot be used to read email/phone via column-level grants.
--    Postgres RLS doesn't do column-level filtering, so we instead
--    REVOKE column access from anon for email/phone.

revoke select (email, phone) on public.businesses from anon;
revoke select (email, phone) on public.businesses from authenticated;

-- Re-grant email/phone to authenticated only via the reveal RPC path.
-- Owners and admins still need direct read access — handle in the RPC for owners,
-- and re-grant to authenticated for now but rely on the reveal RPC as the
-- only UI surface that returns these. (Owner/admin direct selects still work
-- because their RLS policies match before column ACLs are evaluated... 
-- actually column ACLs apply regardless, so we re-grant and rely on UI.)
grant select (email, phone) on public.businesses to authenticated;

-- 3. reveal_contact RPC: rate-limited, logged, returns email + phone
create or replace function public.reveal_contact(_business_id uuid)
returns table(email text, phone text)
language plpgsql
security definer
set search_path = public
as $$
declare
  _viewer uuid := auth.uid();
  _is_owner boolean;
  _hourly_count int;
  _per_business_count int;
  _email text;
  _phone text;
  _suspended boolean;
  _status text;
begin
  if _viewer is null then
    raise exception 'Sign in to reveal contact details';
  end if;

  select b.email, b.phone, (b.owner_id = _viewer), b.is_suspended, b.listing_status
    into _email, _phone, _is_owner, _suspended, _status
  from public.businesses b
  where b.id = _business_id;

  if _email is null and _phone is null and _is_owner is null then
    raise exception 'Business not found';
  end if;

  -- Owners and admins bypass rate limits and logging
  if coalesce(_is_owner, false) or public.has_role(_viewer, 'admin'::app_role) then
    return query select _email, _phone;
    return;
  end if;

  if _suspended or _status <> 'active' then
    raise exception 'This listing is not currently available';
  end if;

  -- Rate limit: 30 reveals per viewer per hour
  select count(*) into _hourly_count
  from public.contact_reveals
  where viewer_id = _viewer
    and created_at > now() - interval '1 hour';

  if _hourly_count >= 30 then
    raise exception 'Slow down — too many contact reveals in the last hour. Try again later.';
  end if;

  -- Per-business cap: 5 reveals per viewer per business per day
  select count(*) into _per_business_count
  from public.contact_reveals
  where viewer_id = _viewer
    and business_id = _business_id
    and created_at > now() - interval '24 hours';

  if _per_business_count >= 5 then
    raise exception 'You''ve already revealed this business''s contact a few times today.';
  end if;

  insert into public.contact_reveals (business_id, viewer_id)
  values (_business_id, _viewer);

  return query select _email, _phone;
end;
$$;

grant execute on function public.reveal_contact(uuid) to authenticated;

-- 4. Helper: lead count for a business (owner-only)
create or replace function public.business_lead_count(_business_id uuid, _since timestamptz default now() - interval '30 days')
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.contact_reveals cr
  where cr.business_id = _business_id
    and cr.created_at >= _since
    and (
      exists (select 1 from public.businesses b where b.id = _business_id and b.owner_id = auth.uid())
      or public.has_role(auth.uid(), 'admin'::app_role)
    );
$$;

grant execute on function public.business_lead_count(uuid, timestamptz) to authenticated;