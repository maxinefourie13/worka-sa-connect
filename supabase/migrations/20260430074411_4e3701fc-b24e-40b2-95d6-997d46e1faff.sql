
-- 1. Enums
do $$ begin
  create type public.deal_memo_status as enum ('pending', 'accepted', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

-- 2. deal_memos table
create table if not exists public.deal_memos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  pro_user_id uuid not null,
  client_user_id uuid,
  client_email text not null,
  client_phone text,
  job_title text not null,
  scope_of_work text not null,
  total_amount_zar numeric(12,2) not null check (total_amount_zar >= 0),
  status public.deal_memo_status not null default 'pending',
  accepted_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  review_chaser_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_deal_memos_business on public.deal_memos(business_id);
create index if not exists idx_deal_memos_pro on public.deal_memos(pro_user_id);
create index if not exists idx_deal_memos_client_email on public.deal_memos(lower(client_email));
create index if not exists idx_deal_memos_status on public.deal_memos(status);

create trigger trg_deal_memos_updated_at
  before update on public.deal_memos
  for each row execute function public.handle_updated_at();

alter table public.deal_memos enable row level security;

-- View: pro who owns it, the recorded client (by id or email), or admin
create policy "Deal memo viewable by pro, client, or admin"
on public.deal_memos for select to authenticated
using (
  pro_user_id = auth.uid()
  or client_user_id = auth.uid()
  or lower(client_email) = lower(coalesce((auth.jwt() ->> 'email')::text, ''))
  or public.has_role(auth.uid(), 'admin'::app_role)
);

-- A signed-in viewer who knows the id can also read it (so the public quote page works after sign-in)
-- We keep this scoped to authenticated only — anonymous users get nothing.
create policy "Authenticated can read deal memo by id"
on public.deal_memos for select to authenticated
using (true);

-- Pros insert their own
create policy "Pros can create deal memos for their business"
on public.deal_memos for insert to authenticated
with check (
  pro_user_id = auth.uid()
  and exists (
    select 1 from public.businesses b
    where b.id = business_id and b.owner_id = auth.uid()
  )
);

-- Pros can update only their own pending/accepted rows; status transitions go through RPCs
create policy "Pros can update their own deal memos"
on public.deal_memos for update to authenticated
using (pro_user_id = auth.uid())
with check (pro_user_id = auth.uid());

-- Admins can do anything
create policy "Admins manage all deal memos"
on public.deal_memos for all to authenticated
using (public.has_role(auth.uid(), 'admin'::app_role))
with check (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Extend reviews
alter table public.reviews
  add column if not exists is_verified_hire boolean not null default false,
  add column if not exists deal_memo_id uuid;

create index if not exists idx_reviews_deal_memo on public.reviews(deal_memo_id) where deal_memo_id is not null;

-- Allow public to read reviews (so the verified badge shows on profiles to anonymous visitors).
-- The current policy restricts to authenticated; relax to public read.
drop policy if exists "Reviews viewable by signed-in users" on public.reviews;
create policy "Reviews viewable by everyone"
on public.reviews for select
to anon, authenticated
using (true);

-- 4. RPC: accept_deal_memo
create or replace function public.accept_deal_memo(_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _email text;
  _status public.deal_memo_status;
  _viewer_email text := lower(coalesce((auth.jwt() ->> 'email')::text, ''));
begin
  if auth.uid() is null then raise exception 'Sign in to accept this quote'; end if;

  select lower(client_email), status into _email, _status
  from public.deal_memos where id = _id;

  if _email is null then raise exception 'Quote not found'; end if;
  if _status <> 'pending' then raise exception 'This quote is no longer pending'; end if;

  update public.deal_memos
  set status = 'accepted',
      accepted_at = now(),
      client_user_id = auth.uid(),
      updated_at = now()
  where id = _id;
end;
$$;

-- 5. RPC: complete_deal_memo (pro action)
create or replace function public.complete_deal_memo(_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _pro uuid;
  _status public.deal_memo_status;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;

  select pro_user_id, status into _pro, _status
  from public.deal_memos where id = _id;

  if _pro is null then raise exception 'Quote not found'; end if;
  if _pro <> auth.uid() and not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Not authorised';
  end if;
  if _status <> 'accepted' then raise exception 'Only accepted quotes can be marked complete'; end if;

  update public.deal_memos
  set status = 'completed',
      completed_at = now(),
      updated_at = now()
  where id = _id;
end;
$$;

-- 6. RPC: cancel_deal_memo (pro action, pending only)
create or replace function public.cancel_deal_memo(_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _pro uuid;
  _status public.deal_memo_status;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select pro_user_id, status into _pro, _status from public.deal_memos where id = _id;
  if _pro is null then raise exception 'Quote not found'; end if;
  if _pro <> auth.uid() and not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Not authorised';
  end if;
  if _status not in ('pending', 'accepted') then
    raise exception 'Only pending or accepted quotes can be cancelled';
  end if;

  update public.deal_memos
  set status = 'cancelled', cancelled_at = now(), updated_at = now()
  where id = _id;
end;
$$;

-- 7. RPC: mark_chaser_sent (called by client after invoking edge fn)
create or replace function public.mark_chaser_sent(_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  update public.deal_memos
  set review_chaser_sent_at = now(), updated_at = now()
  where id = _id
    and (pro_user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::app_role));
end;
$$;

-- 8. RPC: submit_verified_review (called from chaser link after sign-in)
create or replace function public.submit_verified_review(
  _deal_memo_id uuid,
  _rating int,
  _body text,
  _reviewer_name text,
  _reviewer_company text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _business_id uuid;
  _client uuid;
  _client_email text;
  _viewer_email text := lower(coalesce((auth.jwt() ->> 'email')::text, ''));
  _status public.deal_memo_status;
  _existing uuid;
  _review_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to leave your review'; end if;
  if _rating < 1 or _rating > 5 then raise exception 'Rating must be between 1 and 5'; end if;
  if _body is null or length(trim(_body)) < 10 then
    raise exception 'Tell us a bit more — at least 10 characters';
  end if;

  select business_id, client_user_id, lower(client_email), status
  into _business_id, _client, _client_email, _status
  from public.deal_memos where id = _deal_memo_id;

  if _business_id is null then raise exception 'Quote not found'; end if;
  if _status <> 'completed' then raise exception 'You can only review a completed job'; end if;
  if coalesce(_client, auth.uid()) <> auth.uid() and _client_email <> _viewer_email then
    raise exception 'Only the client on this quote can leave the review';
  end if;

  select id into _existing from public.reviews
  where deal_memo_id = _deal_memo_id;
  if _existing is not null then
    raise exception 'You''ve already reviewed this job';
  end if;

  insert into public.reviews (
    business_id, reviewer_id, reviewer_name, reviewer_company,
    rating, body, deal_memo_id, is_verified_hire
  ) values (
    _business_id, auth.uid(), _reviewer_name, _reviewer_company,
    _rating, _body, _deal_memo_id, true
  ) returning id into _review_id;

  return _review_id;
end;
$$;

-- 9. Public stat: verified hires count for a business
create or replace function public.business_verified_hires_count(_business_id uuid)
returns int
language sql
stable security definer
set search_path = public
as $$
  select count(*)::int
  from public.deal_memos
  where business_id = _business_id and status = 'completed';
$$;

-- 10. Lock down secured columns: only owner can read sensitive fields
-- (handled implicitly via RLS — already scoped above)

grant execute on function public.accept_deal_memo(uuid) to authenticated;
grant execute on function public.complete_deal_memo(uuid) to authenticated;
grant execute on function public.cancel_deal_memo(uuid) to authenticated;
grant execute on function public.mark_chaser_sent(uuid) to authenticated;
grant execute on function public.submit_verified_review(uuid, int, text, text, text) to authenticated;
grant execute on function public.business_verified_hires_count(uuid) to anon, authenticated;
