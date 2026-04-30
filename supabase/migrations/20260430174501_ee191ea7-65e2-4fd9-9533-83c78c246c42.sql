create table if not exists public.business_images (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  url text not null,
  storage_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists business_images_business_id_idx
  on public.business_images (business_id, sort_order);

alter table public.business_images enable row level security;

drop policy if exists "Business images are viewable by everyone" on public.business_images;
create policy "Business images are viewable by everyone"
  on public.business_images
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Owners can insert images for their business" on public.business_images;
create policy "Owners can insert images for their business"
  on public.business_images
  for insert
  to authenticated
  with check (exists (
    select 1 from public.businesses b
    where b.id = business_images.business_id and b.owner_id = auth.uid()
  ));

drop policy if exists "Owners can update images for their business" on public.business_images;
create policy "Owners can update images for their business"
  on public.business_images
  for update
  to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = business_images.business_id and b.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.businesses b
    where b.id = business_images.business_id and b.owner_id = auth.uid()
  ));

drop policy if exists "Owners can delete images for their business" on public.business_images;
create policy "Owners can delete images for their business"
  on public.business_images
  for delete
  to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = business_images.business_id and b.owner_id = auth.uid()
  ));

insert into storage.buckets (id, name, public)
values ('business-gallery', 'business-gallery', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can read gallery files" on storage.objects;
create policy "Anyone can read gallery files"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'business-gallery');

drop policy if exists "Owners can upload gallery files" on storage.objects;
create policy "Owners can upload gallery files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'business-gallery'
    and exists (
      select 1 from public.businesses b
      where b.owner_id = auth.uid()
        and (storage.foldername(name))[1] = b.id::text
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
      select 1 from public.businesses b
      where b.owner_id = auth.uid()
        and (storage.foldername(name))[1] = b.id::text
    )
  );