-- ============================================================
-- A. Fix gallery storage policies: qualify `name` so it refers
--    to storage.objects.name, not businesses.name.
-- ============================================================
drop policy if exists "Owners can upload gallery files" on storage.objects;
create policy "Owners can upload gallery files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'business-gallery'
    and exists (
      select 1
      from public.businesses b
      where b.owner_id = auth.uid()
        and (storage.foldername(storage.objects.name))[1] = b.id::text
    )
  );

drop policy if exists "Owners can delete gallery files" on storage.objects;
create policy "Owners can delete gallery files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'business-gallery'
    and exists (
      select 1
      from public.businesses b
      where b.owner_id = auth.uid()
        and (storage.foldername(storage.objects.name))[1] = b.id::text
    )
  );

-- ============================================================
-- B. Restrict public reads of opportunities so client_phone /
--    client_email / contact_preference / external_contact_url
--    are never returned to anon. Replace the broad public SELECT
--    policy with role-scoped policies + a public view.
-- ============================================================

-- Drop the old "viewable by everyone" policy on the base table.
drop policy if exists "Opportunities are viewable by everyone" on public.opportunities;

-- Owner / admin retain full row access (they need contact fields for their own posts).
drop policy if exists "Owners can view their own opportunities" on public.opportunities;
create policy "Owners can view their own opportunities"
  on public.opportunities
  for select
  to authenticated
  using (auth.uid() = client_id);

-- (admin policy already exists via "Admins can manage all opportunities" ALL)

-- Public/safe view: same shape minus the PII columns.
drop view if exists public.opportunities_public;
create view public.opportunities_public
with (security_invoker = true)
as
select
  id,
  client_id,
  title,
  description,
  category_slug,
  category_name,
  province,
  city,
  budget,
  budget_type,
  status,
  is_urgent,
  urgent_boost_paid_at,
  urgent_boost_amount_cents,
  is_concierge_lead,
  applicants_count,
  posted_by_name,
  requirements,
  attachments,
  deadline,
  created_at,
  updated_at
from public.opportunities;

-- Allow anon + authenticated to read the safe view.
grant select on public.opportunities_public to anon, authenticated;

-- Because the view uses security_invoker, the underlying table must
-- still allow these roles to SELECT the safe columns. Add a row-level
-- policy that lets anyone read rows but rely on prior column-level
-- REVOKE on (client_phone, client_email, contact_preference) to keep
-- PII inaccessible.
drop policy if exists "Opportunities safe columns viewable by everyone" on public.opportunities;
create policy "Opportunities safe columns viewable by everyone"
  on public.opportunities
  for select
  to anon, authenticated
  using (true);

-- Re-assert column-level revoke for safety (idempotent).
revoke select (client_phone, client_email, contact_preference, external_contact_url)
  on public.opportunities from anon, authenticated;

-- ============================================================
-- C. Remove provider_balances from the realtime publication so
--    other users can't subscribe to it.
-- ============================================================
do $$
begin
  if exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'provider_balances'
  ) then
    execute 'alter publication supabase_realtime drop table public.provider_balances';
  end if;
end $$;
