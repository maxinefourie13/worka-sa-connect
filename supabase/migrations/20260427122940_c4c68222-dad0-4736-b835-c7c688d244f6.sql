-- =========================================================
-- Sjoh full schema: profiles, roles, businesses, services,
-- reviews, opportunities, proposals, klap balances/events,
-- promotions, follows.
-- =========================================================

-- 1) Roles enum + roles table (separate from profiles to avoid privilege escalation)
create type public.app_role as enum ('admin', 'business_owner', 'client');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view their own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all roles"
  on public.user_roles for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage all roles"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 2) Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  phone text,
  province text,
  city text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select to anon, authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- 3) Auto-create profile + default 'client' role on signup
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
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Provider tier enum + business plans
create type public.sjoh_tier as enum ('dala-trial', 'hustler', 'main-oke');
create type public.business_plan as enum ('free', 'standard', 'featured');

-- 5) Businesses
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  name text not null,
  category_slug text not null,
  category_name text not null,
  province text not null,
  city text not null,
  address text,
  phone text,
  email text,
  website text,
  description text,
  tags text[] not null default '{}',
  hours text,
  image_url text,
  plan public.business_plan not null default 'free',
  is_verified boolean not null default false,
  certified_pro boolean not null default false,
  certifications text[] not null default '{}',
  strikes int not null default 0,
  rating numeric(3,2) not null default 0,
  review_count int not null default 0,
  followers_count int not null default 0,
  response_rate int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index businesses_owner_idx on public.businesses(owner_id);
create index businesses_category_idx on public.businesses(category_slug);
create index businesses_province_idx on public.businesses(province);

alter table public.businesses enable row level security;

create policy "Businesses are viewable by everyone"
  on public.businesses for select to anon, authenticated using (true);

create policy "Owners can insert their business"
  on public.businesses for insert to authenticated
  with check (auth.uid() = owner_id);

create policy "Owners can update their business"
  on public.businesses for update to authenticated
  using (auth.uid() = owner_id);

create policy "Owners can delete their business"
  on public.businesses for delete to authenticated
  using (auth.uid() = owner_id);

create policy "Admins can manage all businesses"
  on public.businesses for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.handle_updated_at();

-- 6) Services (offered by a business)
create type public.price_type as enum ('fixed', 'from', 'quote');

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  price_from numeric(12,2) not null default 0,
  price_type public.price_type not null default 'from',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index services_business_idx on public.services(business_id);

alter table public.services enable row level security;

create policy "Services are viewable by everyone"
  on public.services for select to anon, authenticated using (true);

create policy "Owners can manage their services"
  on public.services for all to authenticated
  using (exists (select 1 from public.businesses b where b.id = services.business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.businesses b where b.id = services.business_id and b.owner_id = auth.uid()));

-- 7) Reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewer_name text not null,
  reviewer_company text,
  rating int not null check (rating between 1 and 5),
  body text not null,
  created_at timestamptz not null default now()
);

create index reviews_business_idx on public.reviews(business_id);

alter table public.reviews enable row level security;

create policy "Reviews are viewable by everyone"
  on public.reviews for select to anon, authenticated using (true);

create policy "Authenticated users can post reviews"
  on public.reviews for insert to authenticated
  with check (auth.uid() = reviewer_id);

create policy "Authors can update their reviews"
  on public.reviews for update to authenticated using (auth.uid() = reviewer_id);

create policy "Authors can delete their reviews"
  on public.reviews for delete to authenticated using (auth.uid() = reviewer_id);

-- 8) Follows (client follows a business)
create table public.business_follows (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  follower_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (business_id, follower_id)
);

create index follows_follower_idx on public.business_follows(follower_id);

alter table public.business_follows enable row level security;

create policy "Follows are viewable by everyone"
  on public.business_follows for select to anon, authenticated using (true);

create policy "Users can follow"
  on public.business_follows for insert to authenticated
  with check (auth.uid() = follower_id);

create policy "Users can unfollow themselves"
  on public.business_follows for delete to authenticated
  using (auth.uid() = follower_id);

-- 9) Opportunities (jobs posted by clients)
create type public.budget_type as enum ('fixed', 'estimate', 'negotiable');
create type public.opportunity_status as enum ('open', 'closed', 'awarded');

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  category_slug text not null,
  category_name text not null,
  province text not null,
  city text not null,
  budget numeric(12,2) not null default 0,
  budget_type public.budget_type not null default 'estimate',
  deadline text,
  is_urgent boolean not null default false,
  status public.opportunity_status not null default 'open',
  requirements text[] not null default '{}',
  applicants_count int not null default 0,
  posted_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index opportunities_client_idx on public.opportunities(client_id);
create index opportunities_category_idx on public.opportunities(category_slug);
create index opportunities_status_idx on public.opportunities(status);

alter table public.opportunities enable row level security;

create policy "Opportunities are viewable by everyone"
  on public.opportunities for select to anon, authenticated using (true);

create policy "Clients can post opportunities"
  on public.opportunities for insert to authenticated
  with check (auth.uid() = client_id);

create policy "Clients can update their opportunities"
  on public.opportunities for update to authenticated using (auth.uid() = client_id);

create policy "Clients can delete their opportunities"
  on public.opportunities for delete to authenticated using (auth.uid() = client_id);

create trigger opportunities_set_updated_at
  before update on public.opportunities
  for each row execute function public.handle_updated_at();

-- 10) Proposals (provider applies to an opportunity — costs Klaps)
create type public.proposal_status as enum ('pending', 'shortlisted', 'won', 'lost', 'withdrawn');

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  provider_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  quote_amount numeric(12,2),
  klaps_spent int not null default 1,
  status public.proposal_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (opportunity_id, business_id)
);

create index proposals_opp_idx on public.proposals(opportunity_id);
create index proposals_business_idx on public.proposals(business_id);

alter table public.proposals enable row level security;

create policy "Providers can view their own proposals"
  on public.proposals for select to authenticated
  using (auth.uid() = provider_id);

create policy "Opportunity owners can view proposals on their opps"
  on public.proposals for select to authenticated
  using (exists (select 1 from public.opportunities o where o.id = proposals.opportunity_id and o.client_id = auth.uid()));

create policy "Providers can submit proposals"
  on public.proposals for insert to authenticated
  with check (
    auth.uid() = provider_id
    and exists (select 1 from public.businesses b where b.id = proposals.business_id and b.owner_id = auth.uid())
  );

create policy "Providers can update their proposals"
  on public.proposals for update to authenticated using (auth.uid() = provider_id);

create policy "Opportunity owners can update proposal status"
  on public.proposals for update to authenticated
  using (exists (select 1 from public.opportunities o where o.id = proposals.opportunity_id and o.client_id = auth.uid()));

create trigger proposals_set_updated_at
  before update on public.proposals
  for each row execute function public.handle_updated_at();

-- 11) Provider Klap balances + tier
create table public.provider_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  tier public.sjoh_tier not null default 'dala-trial',
  trial_ends_at timestamptz,
  klaps_remaining int not null default 5,
  klaps_this_month int not null default 5,
  urgent_alerts_optin boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.provider_balances enable row level security;

create policy "Users can view their own balance"
  on public.provider_balances for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own balance"
  on public.provider_balances for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own balance"
  on public.provider_balances for update to authenticated
  using (auth.uid() = user_id);

create trigger provider_balances_set_updated_at
  before update on public.provider_balances
  for each row execute function public.handle_updated_at();

-- 12) Klap events (audit log)
create type public.klap_outcome as enum ('pending', 'won', 'lost');

create table public.klap_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  proposal_id uuid references public.proposals(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  job_title text not null,
  cost int not null default 1,
  outcome public.klap_outcome not null default 'pending',
  created_at timestamptz not null default now()
);

create index klap_events_user_idx on public.klap_events(user_id);

alter table public.klap_events enable row level security;

create policy "Users can view their own klap events"
  on public.klap_events for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own klap events"
  on public.klap_events for insert to authenticated
  with check (auth.uid() = user_id);

-- 13) Promotions
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  description text,
  discount_percent int,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index promotions_business_idx on public.promotions(business_id);
create index promotions_active_idx on public.promotions(is_active, expires_at);

alter table public.promotions enable row level security;

create policy "Promotions are viewable by everyone"
  on public.promotions for select to anon, authenticated using (true);

create policy "Owners can manage their promotions"
  on public.promotions for all to authenticated
  using (exists (select 1 from public.businesses b where b.id = promotions.business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.businesses b where b.id = promotions.business_id and b.owner_id = auth.uid()));