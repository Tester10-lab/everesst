-- ====================================================================
-- 🏔️ EVEREST ANNAPURNA DEPOSTER - SUPABASE 1-CLICK DATABASE SCHEMA
-- ====================================================================
-- How to run:
-- 1. Create a free project at https://supabase.com
-- 2. Go to the "SQL Editor" in your Supabase Dashboard
-- 3. Paste this entire script and click "Run"
-- ====================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Packages Table
create table if not exists public.packages (
  id text primary key,
  name text not null,
  default_vehicle text not null default 'scorpio',
  capacity int not null default 8,
  created_at timestamptz default now()
);

-- 3. Departures Table
create table if not exists public.departures (
  id text primary key,
  package_id text not null,
  date text not null,
  nepali_date text,
  vehicle_type text not null default 'scorpio',
  capacity int not null default 8,
  driver_name text default '',
  driver_phone text default '',
  vehicle_plate text default '',
  created_at timestamptz default now()
);

-- 4. Customers Table (Passenger Bookings)
create table if not exists public.customers (
  id text primary key,
  departure_id text not null references public.departures(id) on delete cascade,
  name text not null,
  phone text not null,
  pax int not null default 1,
  remaining numeric not null default 0,
  note text default '',
  booked_by text default '',
  created_at timestamptz default now()
);

-- 5. Enable Realtime Replication for instant multi-device sync
alter publication supabase_realtime add table public.packages;
alter publication supabase_realtime add table public.departures;
alter publication supabase_realtime add table public.customers;

-- 6. Row Level Security & Policies
alter table public.packages enable row level security;
alter table public.departures enable row level security;
alter table public.customers enable row level security;

-- Allow read & write access for authenticated agency team members
drop policy if exists "Allow team read packages" on public.packages;
create policy "Allow team read packages" on public.packages for select using (true);

drop policy if exists "Allow team write packages" on public.packages;
create policy "Allow team write packages" on public.packages for all using (true);

drop policy if exists "Allow team read departures" on public.departures;
create policy "Allow team read departures" on public.departures for select using (true);

drop policy if exists "Allow team write departures" on public.departures;
create policy "Allow team write departures" on public.departures for all using (true);

drop policy if exists "Allow team read customers" on public.customers;
create policy "Allow team read customers" on public.customers for select using (true);

drop policy if exists "Allow team write customers" on public.customers;
create policy "Allow team write customers" on public.customers for all using (true);

-- 7. Seed Default Himalayan Package Routes
insert into public.packages (id, name, default_vehicle, capacity) values
  ('pkg-1', 'Upper Mustang Overland (Jomsom – Lo Manthang)', 'scorpio', 8),
  ('pkg-2', 'Annapurna Base Camp Gate (Pokhara – Ghandruk)', 'scorpio', 8),
  ('pkg-3', 'Muktinath Pilgrimage & Kaligandaki Valley', 'ev_van', 12),
  ('pkg-4', 'Everest Trailhead Jeep (Ktm – Salleri / Phaplu)', 'scorpio', 8),
  ('pkg-5', 'Everest Flight Link (Ktm – Ramechhap Manthali)', 'scorpio', 8)
on conflict (id) do nothing;

-- 8. Seed Active Booking: Upper Mustang Kartik 5 (Ujwal Baiju - 7 Pax)
insert into public.departures (id, package_id, date, nepali_date, vehicle_type, capacity, driver_name, driver_phone, vehicle_plate) values
  ('dep-mustang-kartik5', 'pkg-1', '2026-10-22', 'Kartik 5 gatey', 'scorpio', 8, '', '', '')
on conflict (id) do nothing;

insert into public.customers (id, departure_id, name, phone, pax, remaining, note, booked_by) values
  ('c-ujwal-1', 'dep-mustang-kartik5', 'Ujwal Baiju', '+977 984-3399734', 7, 83500, 'Kartik 5 departure', 'Counter Staff')
on conflict (id) do nothing;
