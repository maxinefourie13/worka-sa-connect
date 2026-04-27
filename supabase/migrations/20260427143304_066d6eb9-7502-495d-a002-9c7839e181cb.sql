-- Safety & Liability: user reporting + auto-flag/suspend

-- 1. Add suspension + report counter to businesses
alter table public.businesses
  add column if not exists is_suspended boolean not null default false,
  add column if not exists report_count integer not null default 0,
  add column if not exists flagged_for_review boolean not null default false;

-- 2. user_reports table
create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null,
  business_id uuid not null references public.businesses(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open',  -- open | reviewed | dismissed
  created_at timestamptz not null default now(),
  unique (reporter_id, business_id)  -- one report per reporter per business
);

create index if not exists idx_user_reports_business on public.user_reports(business_id);

alter table public.user_reports enable row level security;

-- Reporter can see their own report; admins see all
create policy "Users view their own reports"
  on public.user_reports for select
  to authenticated
  using (auth.uid() = reporter_id);

create policy "Admins view all reports"
  on public.user_reports for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can submit reports (cannot report own business)
create policy "Authenticated users can submit reports"
  on public.user_reports for insert
  to authenticated
  with check (
    auth.uid() = reporter_id
    and not exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

-- Admins can update reports
create policy "Admins can manage reports"
  on public.user_reports for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 3. Trigger: when a new report is inserted, recompute count.
-- If count >= 3, mark flagged_for_review and is_suspended.
create or replace function public.handle_new_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _count integer;
begin
  select count(*) into _count
  from public.user_reports
  where business_id = NEW.business_id;

  update public.businesses
    set report_count = _count,
        flagged_for_review = case when _count >= 3 then true else flagged_for_review end,
        is_suspended       = case when _count >= 3 then true else is_suspended end,
        updated_at = now()
  where id = NEW.business_id;

  return NEW;
end;
$$;

drop trigger if exists trg_user_reports_after_insert on public.user_reports;
create trigger trg_user_reports_after_insert
  after insert on public.user_reports
  for each row execute function public.handle_new_report();

-- 4. Block suspended businesses from submitting proposals.
-- Replace the existing INSERT policy.
drop policy if exists "Providers can submit proposals" on public.proposals;
create policy "Providers can submit proposals"
  on public.proposals for insert
  to authenticated
  with check (
    auth.uid() = provider_id
    and exists (
      select 1 from public.businesses b
      where b.id = proposals.business_id
        and b.owner_id = auth.uid()
        and b.is_suspended = false
    )
  );

-- 5. RPC: report a business (one call from the client)
create or replace function public.report_business(
  _business_id uuid,
  _reason text,
  _details text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _report_id uuid;
  _is_owner boolean;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select exists(select 1 from public.businesses where id = _business_id and owner_id = auth.uid())
    into _is_owner;
  if _is_owner then raise exception 'Cannot report your own business'; end if;

  insert into public.user_reports (reporter_id, business_id, reason, details)
  values (auth.uid(), _business_id, _reason, _details)
  on conflict (reporter_id, business_id) do nothing
  returning id into _report_id;

  return _report_id;
end;
$$;

revoke all on function public.report_business(uuid, text, text) from public;
grant execute on function public.report_business(uuid, text, text) to authenticated;
