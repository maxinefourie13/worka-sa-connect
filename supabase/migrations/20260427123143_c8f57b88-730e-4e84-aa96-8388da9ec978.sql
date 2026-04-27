-- ============================================================
-- 1) Profiles: hide phone from public, expose safe view
-- ============================================================

drop policy if exists "Profiles are viewable by everyone" on public.profiles;

create policy "Profiles viewable by self"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Public, sanitised view (no phone)
create or replace view public.profiles_public
with (security_invoker = true)
as
  select id, display_name, avatar_url, province, city, bio, created_at
  from public.profiles;

grant select on public.profiles_public to anon, authenticated;

-- ============================================================
-- 2) Businesses: hide contact details from anon; sanitised view
-- ============================================================

drop policy if exists "Businesses are viewable by everyone" on public.businesses;

create policy "Businesses viewable by signed-in users"
  on public.businesses for select to authenticated
  using (true);

-- Sanitised public view: no phone / no email
create or replace view public.businesses_public
with (security_invoker = true)
as
  select
    id, owner_id, slug, name, category_slug, category_name,
    province, city, address, website, description, tags, hours, image_url,
    plan, is_verified, certified_pro, certifications,
    rating, review_count, followers_count, response_rate,
    created_at, updated_at
  from public.businesses;

grant select on public.businesses_public to anon, authenticated;

-- ============================================================
-- 3) Businesses: prevent owners from tampering with moderation fields
-- ============================================================

drop policy if exists "Owners can update their business" on public.businesses;

create or replace function public.protect_business_admin_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Allow admins to change anything
  if public.has_role(auth.uid(), 'admin') then
    return new;
  end if;

  -- Lock moderation/system fields for non-admins
  new.is_verified    := old.is_verified;
  new.certified_pro  := old.certified_pro;
  new.certifications := old.certifications;
  new.strikes        := old.strikes;
  new.plan           := old.plan;
  new.rating         := old.rating;
  new.review_count   := old.review_count;
  new.followers_count := old.followers_count;
  new.owner_id       := old.owner_id;
  return new;
end;
$$;

create trigger businesses_protect_admin_fields
  before update on public.businesses
  for each row execute function public.protect_business_admin_fields();

create policy "Owners can update their business"
  on public.businesses for update to authenticated
  using (auth.uid() = owner_id);

-- ============================================================
-- 4) Provider balances: remove user write access; auto-create on signup
-- ============================================================

drop policy if exists "Users can insert their own balance" on public.provider_balances;
drop policy if exists "Users can update their own balance" on public.provider_balances;

-- Extend signup trigger to also seed a Dala Trial balance
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
  insert into public.provider_balances (user_id, tier, klaps_remaining, klaps_this_month, trial_ends_at)
  values (new.id, 'dala-trial', 5, 5, now() + interval '3 months');
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Server-side function for spending a klap (only path users can change their balance)
create or replace function public.spend_klap(_opportunity_id uuid, _job_title text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _balance int;
  _event_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select klaps_remaining into _balance
  from public.provider_balances
  where user_id = auth.uid()
  for update;

  if _balance is null then
    raise exception 'No balance record';
  end if;

  if _balance < 1 then
    raise exception 'Insufficient klaps';
  end if;

  update public.provider_balances
  set klaps_remaining = klaps_remaining - 1,
      updated_at = now()
  where user_id = auth.uid();

  insert into public.klap_events (user_id, opportunity_id, job_title, cost, outcome)
  values (auth.uid(), _opportunity_id, _job_title, 1, 'pending')
  returning id into _event_id;

  return _event_id;
end;
$$;

grant execute on function public.spend_klap(uuid, text) to authenticated;

-- Re-seed handle_new_user trigger (function replaced above, trigger still bound, but ensure)
-- (Trigger on auth.users from previous migration still references the function name, no need to recreate.)