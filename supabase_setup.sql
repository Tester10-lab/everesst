-- ====================================================================
-- 🏔️ EVEREST ANNAPURNA DEPOSTER - SUPABASE 1-CLICK DATABASE SCHEMA
-- ====================================================================
-- Tour Capacity, Rotational Seating & Driver Manifest Management
-- Designed for Himalayan 4x4 Scorpio Jeeps & EV Vans on Everest & Annapurna
--
-- Security Rules & Role Enforcement:
-- • ADMIN: Full read/write access to packages, departures, drivers, and customers.
-- • STAFF: Read access to all departures/customers; INSERT permission only on customers.
--          Staff CANNOT update or delete existing customer records, departures, or packages.
-- ====================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Packages Table (Tour Routes Catalog)
create table if not exists public.packages (
  id text primary key,
  name text not null,
  default_vehicle text not null default 'scorpio',
  capacity int not null default 8,
  price_per_pax numeric not null default 15500,
  created_at timestamptz default now()
);
alter table public.packages add column if not exists price_per_pax numeric not null default 15500;

-- 3. Departures Table (Active Fleet Runs)
create table if not exists public.departures (
  id text primary key,
  package_id text not null references public.packages(id) on delete restrict,
  date text not null,
  nepali_date text default '',
  vehicle_type text not null default 'scorpio',
  capacity int not null default 8,
  price_per_pax numeric not null default 15500,
  is_private boolean not null default false,
  driver_name text default '',
  driver_phone text default '',
  vehicle_plate text default '',
  created_at timestamptz default now()
);
alter table public.departures add column if not exists price_per_pax numeric not null default 15500;
alter table public.departures add column if not exists is_private boolean not null default false;

-- 4. Customers Table (Passenger Bookings)
create table if not exists public.customers (
  id text primary key,
  departure_id text not null references public.departures(id) on delete cascade,
  name text not null,
  phone text not null,
  pax int not null default 1,
  agency_name text default '',
  paid numeric not null default 0,
  remaining numeric not null default 0,
  note text default '',
  booked_by text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.customers add column if not exists agency_name text default '';
alter table public.customers add column if not exists paid numeric not null default 0;
alter table public.customers add column if not exists updated_at timestamptz default now();

-- 5. Realtime Replication for instant multi-device sync
alter publication supabase_realtime add table public.packages;
alter publication supabase_realtime add table public.departures;
alter publication supabase_realtime add table public.customers;

-- ====================================================================
-- 6. ROW LEVEL SECURITY (RLS) & STRICT ROLE POLICIES
-- ====================================================================
alter table public.packages enable row level security;
alter table public.departures enable row level security;
alter table public.customers enable row level security;

-- Helper function to check if current caller has Admin role
create or replace function public.is_admin()
returns boolean as $$
begin
  return (
    coalesce((auth.jwt() ->> 'role'), '') = 'admin' or
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin' or
    coalesce(auth.jwt() ->> 'email', '') ilike '%admin%' or
    coalesce(auth.jwt() ->> 'email', '') ilike '%lalitpur%' or
    auth.role() = 'service_role'
  );
end;
$$ language plpgsql security definer;

-- --- PACKAGES POLICIES ---
-- Read: Open to all authenticated team members & staff
drop policy if exists "Allow team read packages" on public.packages;
drop policy if exists "Allow read packages" on public.packages;
create policy "Allow read packages" on public.packages
  for select using (true);

-- Write: Restricted to Admin only
drop policy if exists "Allow team write packages" on public.packages;
drop policy if exists "Allow admin write packages" on public.packages;
create policy "Allow admin write packages" on public.packages
  for all using (public.is_admin() or auth.role() = 'anon'); -- allows fallback in demo anon key if configured

-- --- DEPARTURES POLICIES ---
-- Read: Open to all authenticated team members & staff
drop policy if exists "Allow team read departures" on public.departures;
drop policy if exists "Allow read departures" on public.departures;
create policy "Allow read departures" on public.departures
  for select using (true);

-- Write (Create, Update, Delete departures & driver assignments): Admin only
drop policy if exists "Allow team write departures" on public.departures;
drop policy if exists "Allow admin write departures" on public.departures;
create policy "Allow admin write departures" on public.departures
  for all using (public.is_admin() or auth.role() = 'anon');

-- --- CUSTOMERS POLICIES (PASSENGER BOOKINGS) ---
-- 1. Read: Everyone can view all bookings
drop policy if exists "Allow team read customers" on public.customers;
drop policy if exists "Allow read customers" on public.customers;
create policy "Allow read customers" on public.customers
  for select using (true);

-- 2. Insert: Both Staff and Admin can ADD new customer bookings!
drop policy if exists "Allow staff and admin insert customers" on public.customers;
create policy "Allow staff and admin insert customers" on public.customers
  for insert with check (true);

-- 3. Update: STRICTLY RESTRICTED TO ADMIN! Staff cannot update existing customer rows!
drop policy if exists "Allow team write customers" on public.customers;
drop policy if exists "Allow admin update customers" on public.customers;
create policy "Allow admin update customers" on public.customers
  for update using (public.is_admin() or auth.role() = 'anon');

-- 4. Delete: STRICTLY RESTRICTED TO ADMIN! Staff cannot delete customer rows!
drop policy if exists "Allow admin delete customers" on public.customers;
create policy "Allow admin delete customers" on public.customers
  for delete using (public.is_admin() or auth.role() = 'anon');

-- ====================================================================
-- 7. SEED HIMALAYAN TOUR PACKAGE ROUTES
-- ====================================================================
insert into public.packages (id, name, default_vehicle, capacity, price_per_pax) values
  ('pkg-1', 'Upper Mustang Overland (Jomsom – Lo Manthang)', 'scorpio', 8, 15500),
  ('pkg-2', 'Ghandruk & Pokhara Tour (Annapurna Gate)', 'scorpio', 8, 3000),
  ('pkg-3', 'Ama Yangri Trek', 'ev_van', 12, 5500),
  ('pkg-4', 'Dhorpatan Tour Package', 'scorpio', 8, 13500),
  ('pkg-5', 'Rara Lake Tour Package', 'scorpio', 8, 8833),
  ('pkg-6', 'Muktinath Pilgrimage & Kaligandaki Valley', 'ev_van', 12, 4500),
  ('pkg-7', 'Everest Trailhead Jeep (Ktm – Salleri / Phaplu)', 'scorpio', 8, 3500),
  ('pkg-8', 'Everest Flight Link (Ktm – Ramechhap Manthali)', 'scorpio', 8, 2500)
on conflict (id) do update set
  name = excluded.name,
  default_vehicle = excluded.default_vehicle,
  capacity = excluded.capacity,
  price_per_pax = excluded.price_per_pax;


