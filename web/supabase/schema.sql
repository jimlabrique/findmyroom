create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'admin', 'super_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.app_users (id, email, role)
select
  id,
  lower(nullif(trim(email), '')) as email,
  case
    when lower(nullif(trim(email), '')) = 'jim@la-brique.be' then 'super_admin'
    else 'user'
  end as role
from auth.users
on conflict (id) do update
set email = excluded.email;

update public.app_users
set role = 'super_admin'
where lower(coalesce(email, '')) = 'jim@la-brique.be';

create index if not exists app_users_role_idx on public.app_users (role);
create index if not exists app_users_email_idx on public.app_users (lower(email));

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  title text not null,
  rent_eur integer not null check (rent_eur > 0),
  city text not null,
  available_rooms smallint not null check (available_rooms > 0),
  total_rooms smallint not null check (total_rooms > 0 and total_rooms >= available_rooms),
  room_details jsonb not null default '[]'::jsonb,
  animals_policy text not null default 'negotiable' check (animals_policy in ('yes', 'no', 'negotiable')),
  current_flatmates text,
  lgbtq_friendly boolean,
  available_from date not null,
  housing_description text not null,
  flatshare_vibe text not null,
  photo_urls text[] not null default '{}'::text[],
  photo_captions text[] not null default '{}'::text[],
  contact_whatsapp text,
  contact_email text,
  charges_eur integer check (charges_eur >= 0),
  lease_type text,
  min_duration_months smallint check (min_duration_months >= 0),
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  expires_at date not null default ((current_date + interval '30 day')::date),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_required check (
    nullif(trim(coalesce(contact_whatsapp, '')), '') is not null
    or nullif(trim(coalesce(contact_email, '')), '') is not null
  )
);

alter table public.listings
add column if not exists photo_captions text[] not null default '{}'::text[];

alter table public.listings
add column if not exists expires_at date not null default ((current_date + interval '30 day')::date);

alter table public.listings
add column if not exists total_rooms smallint;

alter table public.listings
add column if not exists room_details jsonb not null default '[]'::jsonb;

alter table public.listings
add column if not exists animals_policy text;

alter table public.listings
add column if not exists current_flatmates text;

alter table public.listings
add column if not exists lgbtq_friendly boolean;

update public.listings
set photo_captions = array(
  select coalesce(photo_captions[idx], '')
  from generate_series(1, coalesce(array_length(photo_urls, 1), 0)) as idx
);

update public.listings
set expires_at = coalesce(expires_at, (created_at::date + interval '30 day')::date)
where expires_at is null;

update public.listings
set total_rooms = coalesce(total_rooms, available_rooms)
where total_rooms is null;

update public.listings
set room_details = coalesce(room_details, '[]'::jsonb)
where room_details is null;

update public.listings
set animals_policy = coalesce(animals_policy, 'negotiable')
where animals_policy is null;

alter table public.listings
alter column total_rooms set default 1;

alter table public.listings
alter column total_rooms set not null;

alter table public.listings
alter column animals_policy set default 'negotiable';

alter table public.listings
alter column animals_policy set not null;

alter table public.listings
drop constraint if exists photo_arrays_same_length;

alter table public.listings
add constraint photo_arrays_same_length
check (coalesce(array_length(photo_urls, 1), 0) = coalesce(array_length(photo_captions, 1), 0));

alter table public.listings
drop constraint if exists listings_total_rooms_valid;

alter table public.listings
add constraint listings_total_rooms_valid
check (total_rooms > 0 and total_rooms >= available_rooms);

alter table public.listings
drop constraint if exists listings_room_details_is_array;

alter table public.listings
add constraint listings_room_details_is_array
check (jsonb_typeof(room_details) = 'array');

alter table public.listings
drop constraint if exists listings_animals_policy_valid;

alter table public.listings
add constraint listings_animals_policy_valid
check (animals_policy in ('yes', 'no', 'negotiable'));

create index if not exists listings_status_created_idx on public.listings (status, created_at desc);
create index if not exists listings_status_expires_idx on public.listings (status, expires_at);
create index if not exists listings_city_idx on public.listings (lower(city));
create index if not exists listings_rent_idx on public.listings (rent_eur);
create index if not exists listings_available_from_idx on public.listings (available_from);

create table if not exists public.listing_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  event_type text not null check (event_type in ('view_listing', 'click_contact')),
  source text not null default 'unknown',
  viewer_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists listing_events_listing_created_idx on public.listing_events (listing_id, created_at desc);
create index if not exists listing_events_listing_type_idx on public.listing_events (listing_id, event_type);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.app_users
  where id = auth.uid()
  limit 1;
$$;

drop trigger if exists app_users_touch_updated_at on public.app_users;
create trigger app_users_touch_updated_at
before update on public.app_users
for each row
execute function public.touch_updated_at();

drop trigger if exists listings_touch_updated_at on public.listings;
create trigger listings_touch_updated_at
before update on public.listings
for each row
execute function public.touch_updated_at();

alter table public.app_users enable row level security;
alter table public.listings enable row level security;

drop policy if exists "Users can read own app user profile" on public.app_users;
create policy "Users can read own app user profile"
on public.app_users
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Admins can read all app users" on public.app_users;
create policy "Admins can read all app users"
on public.app_users
for select
to authenticated
using (public.current_app_role() in ('admin', 'super_admin'));

drop policy if exists "Users can bootstrap app user profile" on public.app_users;
create policy "Users can bootstrap app user profile"
on public.app_users
for insert
to authenticated
with check (
  auth.uid() = id
  and (
    role = 'user'
    or (
      role = 'super_admin'
      and lower(coalesce(email, '')) = 'jim@la-brique.be'
    )
  )
);

drop policy if exists "Super admins can manage app user roles" on public.app_users;
create policy "Super admins can manage app user roles"
on public.app_users
for update
to authenticated
using (public.current_app_role() = 'super_admin')
with check (public.current_app_role() = 'super_admin');

drop policy if exists "Public can read active listings" on public.listings;
create policy "Public can read active listings"
on public.listings
for select
using (
  (status = 'active' and expires_at >= current_date)
  or auth.uid() = user_id
  or public.current_app_role() in ('admin', 'super_admin')
);

drop policy if exists "Users can insert own listings" on public.listings;
create policy "Users can insert own listings"
on public.listings
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own listings" on public.listings;
create policy "Users can update own listings"
on public.listings
for update
using (
  auth.uid() = user_id
  or public.current_app_role() in ('admin', 'super_admin')
)
with check (
  auth.uid() = user_id
  or public.current_app_role() in ('admin', 'super_admin')
);

drop policy if exists "Users can delete own listings" on public.listings;
create policy "Users can delete own listings"
on public.listings
for delete
using (auth.uid() = user_id);

alter table public.listing_events enable row level security;

drop policy if exists "Public can insert listing events" on public.listing_events;
create policy "Public can insert listing events"
on public.listing_events
for insert
to anon, authenticated
with check (
  event_type in ('view_listing', 'click_contact')
  and exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and l.status = 'active'
      and l.expires_at >= current_date
  )
);

drop policy if exists "Owners can read own listing events" on public.listing_events;
create policy "Owners can read own listing events"
on public.listing_events
for select
to authenticated
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and l.user_id = auth.uid()
  )
  or public.current_app_role() in ('admin', 'super_admin')
);

drop policy if exists "Public can view listing photos" on storage.objects;
create policy "Public can view listing photos"
on storage.objects
for select
using (bucket_id = 'listing-photos');

drop policy if exists "Authenticated can upload listing photos" on storage.objects;
create policy "Authenticated can upload listing photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own listing photos" on storage.objects;
create policy "Users can update own listing photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'listing-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'listing-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own listing photos" on storage.objects;
create policy "Users can delete own listing photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
