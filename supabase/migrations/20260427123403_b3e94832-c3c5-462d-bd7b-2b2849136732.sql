-- 1) Reviews: hide from anon (reviewer names are PII)
drop policy if exists "Reviews are viewable by everyone" on public.reviews;

create policy "Reviews viewable by signed-in users"
  on public.reviews for select to authenticated
  using (true);

-- 2) Lock proposal updates by opportunity owner to status-only
drop policy if exists "Opportunity owners can update proposal status" on public.proposals;

create or replace function public.protect_proposal_fields()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  _is_provider boolean := (new.provider_id = auth.uid());
begin
  if _is_provider or public.has_role(auth.uid(), 'admin') then
    return new;
  end if;
  -- Non-provider (i.e., the opportunity owner) can only change `status`.
  new.opportunity_id := old.opportunity_id;
  new.business_id    := old.business_id;
  new.provider_id    := old.provider_id;
  new.message        := old.message;
  new.quote_amount   := old.quote_amount;
  new.klaps_spent    := old.klaps_spent;
  new.created_at     := old.created_at;
  return new;
end;
$$;

create trigger proposals_protect_fields
  before update on public.proposals
  for each row execute function public.protect_proposal_fields();

create policy "Opportunity owners can update proposal status"
  on public.proposals for update to authenticated
  using (exists (select 1 from public.opportunities o where o.id = proposals.opportunity_id and o.client_id = auth.uid()))
  with check (exists (select 1 from public.opportunities o where o.id = proposals.opportunity_id and o.client_id = auth.uid()));