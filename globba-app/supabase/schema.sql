-- Globba database. Paste this whole file in Supabase → SQL Editor → New query → Run.
-- It is safe to run more than once.
--
-- Security (Row Level Security):
--   * Everyone can READ regions, products, published stores and inventory.
--   * Everyone can only ADD rows to product_requests and search_misses (never read, change or delete).
--   * Only emails listed in the "admins" table can change data (from the /admin page).

-- ---------- Tables ----------
create table if not exists public.regions (
  id       text primary key,              -- short code, e.g. 'latam'
  color    text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  name_it  text not null,
  name_en  text not null,
  sort     int  not null default 0
);

create table if not exists public.products (
  id        text primary key check (id ~ '^[a-z0-9-]+$'),   -- used in the page address: /prodotti/<id>/
  name_it   text not null,
  name_en   text not null,
  synonyms  text[] not null default '{}',                   -- other names in any language
  created_at timestamptz not null default now()
);

create table if not exists public.stores (
  id            text primary key check (id ~ '^[a-z0-9-]+$'), -- used in the page address: /negozi/<id>/
  name          text not null,
  address       text not null,
  lat           double precision not null,
  lng           double precision not null,
  phone         text,
  whatsapp      text,                       -- leave empty if it is the same as the phone
  regions       text[] not null check (cardinality(regions) between 1 and 2), -- first = main region (pin color)
  hours_it      text,
  hours_en      text,
  last_checked  date not null default current_date,
  published     boolean not null default true,
  notes         text,                       -- private notes, not shown on the site
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.inventory (
  store_id      text not null references public.stores(id) on delete cascade on update cascade,
  product_id    text not null references public.products(id) on delete cascade on update cascade,
  availability  text not null check (availability in ('u','s','z')),  -- u = usually, s = sometimes, z = seasonal
  primary key (store_id, product_id)
);

create table if not exists public.product_requests (
  id          bigint generated always as identity primary key,
  query       text not null check (char_length(query) between 1 and 200),
  lang        text check (lang in ('it','en')),
  created_at  timestamptz not null default now()
);

create table if not exists public.search_misses (
  id          bigint generated always as identity primary key,
  query       text not null check (char_length(query) between 1 and 200),
  lang        text check (lang in ('it','en')),
  created_at  timestamptz not null default now()
);

create table if not exists public.admins (
  email text primary key
);

-- Keep updated_at current
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists stores_touch on public.stores;
create trigger stores_touch before update on public.stores for each row execute function public.touch_updated_at();

-- Is the logged-in user an admin?
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

-- ---------- Row Level Security ----------
alter table public.regions          enable row level security;
alter table public.products         enable row level security;
alter table public.stores           enable row level security;
alter table public.inventory        enable row level security;
alter table public.product_requests enable row level security;
alter table public.search_misses    enable row level security;
alter table public.admins           enable row level security;

-- Public read
drop policy if exists "public read" on public.regions;
create policy "public read" on public.regions for select using (true);
drop policy if exists "public read" on public.products;
create policy "public read" on public.products for select using (true);
drop policy if exists "public read" on public.stores;
create policy "public read" on public.stores for select using (published or public.is_admin());
drop policy if exists "public read" on public.inventory;
create policy "public read" on public.inventory for select using (true);

-- Admin write
drop policy if exists "admin write" on public.regions;
create policy "admin write" on public.regions for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin write" on public.products;
create policy "admin write" on public.products for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin write" on public.stores;
create policy "admin write" on public.stores for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin write" on public.inventory;
create policy "admin write" on public.inventory for all using (public.is_admin()) with check (public.is_admin());

-- Visitors can only add requests and missed searches; only admins can read or delete them
drop policy if exists "anyone insert" on public.product_requests;
create policy "anyone insert" on public.product_requests for insert with check (true);
drop policy if exists "admin read" on public.product_requests;
create policy "admin read" on public.product_requests for select using (public.is_admin());
drop policy if exists "admin delete" on public.product_requests;
create policy "admin delete" on public.product_requests for delete using (public.is_admin());

drop policy if exists "anyone insert" on public.search_misses;
create policy "anyone insert" on public.search_misses for insert with check (true);
drop policy if exists "admin read" on public.search_misses;
create policy "admin read" on public.search_misses for select using (public.is_admin());
drop policy if exists "admin delete" on public.search_misses;
create policy "admin delete" on public.search_misses for delete using (public.is_admin());

-- The admins table: only admins can see it, nobody can change it from the website
-- (add yourself with the SQL at the bottom of this file).
drop policy if exists "admin read" on public.admins;
create policy "admin read" on public.admins for select using (public.is_admin());

-- Table permissions for the website's public key
grant select on public.regions, public.products, public.stores, public.inventory to anon, authenticated;
grant insert on public.product_requests, public.search_misses to anon, authenticated;
grant insert, update, delete on public.regions, public.products, public.stores, public.inventory to authenticated;
grant select, delete on public.product_requests, public.search_misses to authenticated;
grant select on public.admins to authenticated;
revoke update, delete on public.product_requests, public.search_misses from anon;

-- ---------- Regions (the 6 colors used by the app) ----------
insert into public.regions (id, color, name_it, name_en, sort) values
  ('latam',  '#FF8C1E', 'America Latina',          'Latin America',         1),
  ('asia',   '#BA3F6A', 'Asia orientale',          'East Asia',             2),
  ('south',  '#F5CE24', 'Asia del Sud',            'South Asia',            3),
  ('mena',   '#14918A', 'Medio Oriente e Maghreb', 'Middle East & Maghreb', 4),
  ('africa', '#551B81', 'Africa',                  'Africa',                5),
  ('east',   '#3B82C4', 'Est Europa',              'Eastern Europe',        6)
on conflict (id) do nothing;

-- ---------- Make yourself an admin ----------
-- Replace the email below with the one you will use to log in to /admin, then run this line:
-- insert into public.admins (email) values ('your-email@example.com') on conflict do nothing;
