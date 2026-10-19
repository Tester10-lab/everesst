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
  agency_name text default '',
  remaining numeric not null default 0,
  note text default '',
  booked_by text default '',
  created_at timestamptz default now()
);
alter table public.customers add column if not exists agency_name text default '';

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

-- 7. Seed Himalayan Tour Package Routes
insert into public.packages (id, name, default_vehicle, capacity) values
  ('pkg-1', 'Upper Mustang Overland (Jomsom – Lo Manthang)', 'scorpio', 8),
  ('pkg-2', 'Ghandruk & Pokhara Tour (Annapurna Gate)', 'scorpio', 8),
  ('pkg-3', 'Ama Yangri Trek', 'ev_van', 12),
  ('pkg-4', 'Dhorpatan Tour Package', 'scorpio', 8),
  ('pkg-5', 'Rara Lake Tour Package', 'scorpio', 8),
  ('pkg-6', 'Muktinath Pilgrimage & Kaligandaki Valley', 'ev_van', 12),
  ('pkg-7', 'Everest Trailhead Jeep (Ktm – Salleri / Phaplu)', 'scorpio', 8),
  ('pkg-8', 'Everest Flight Link (Ktm – Ramechhap Manthali)', 'scorpio', 8)
on conflict (id) do update set
  name = excluded.name,
  default_vehicle = excluded.default_vehicle,
  capacity = excluded.capacity;

-- 8. Seed Active Departures (Kartik 5 & Kartik 6)
insert into public.departures (id, package_id, date, nepali_date, vehicle_type, capacity, driver_name, driver_phone, vehicle_plate) values
  ('dep-mustang-kartik5', 'pkg-1', '2026-10-22', 'Kartik 5 gatey', 'scorpio', 8, '', '', ''),
  ('dep-ghandruk-kartik6', 'pkg-2', '2026-10-23', 'Kartik 6 gatey', 'scorpio', 8, '', '', ''),
  ('dep-amayan-kartik6', 'pkg-3', '2026-10-23', 'Kartik 6 gatey', 'ev_van', 12, '', '', ''),
  ('dep-mustang-kartik6', 'pkg-1', '2026-10-23', 'Kartik 6 gatey', 'scorpio', 8, '', '', ''),
  ('dep-dhorpatan-kartik6', 'pkg-4', '2026-10-23', 'Kartik 6 gatey', 'scorpio', 8, '', '', ''),
  ('dep-rara-kartik6', 'pkg-5', '2026-10-23', 'Kartik 6 gatey', 'scorpio', 8, '', '', '')
on conflict (id) do update set
  package_id = excluded.package_id,
  date = excluded.date,
  nepali_date = excluded.nepali_date,
  vehicle_type = excluded.vehicle_type,
  capacity = excluded.capacity;

-- 9. Seed Passenger Bookings (with Agency Names)
insert into public.customers (id, departure_id, name, phone, pax, agency_name, remaining, note, booked_by) values
  ('c-ujwal-1', 'dep-mustang-kartik5', 'Ujwal Baiju', '+977 984-3399734', 7, 'Everest Agency', 83500, 'Kartik 5 departure', 'Everest Agency'),
  ('c-hema-1', 'dep-ghandruk-kartik6', 'Hema Bhatta', '9868119376', 3, 'Satdobato Agency', 7500, 'Satdobato • 1500 rec / 9000 pkg', 'Satdobato Agency'),
  ('c-rubishna-1', 'dep-ghandruk-kartik6', 'Rubishna Ranjit & Prajwol Gupt Ranjit', '9841228980 / 9861667312', 2, 'Manjushree Agency', 0, 'Manjushree Temple', 'Manjushree Agency'),
  ('c-kumar-1', 'dep-amayan-kartik6', 'Kumar Poudel', '9851089299', 9, 'Samakhusi Travels', 44500, 'Samakhusi & Dhapasi • 3 Room', 'Samakhusi Travels'),
  ('c-monika-1', 'dep-mustang-kartik6', 'Monika Tamang', '9860581443', 3, 'Budhanilkantha Agency', 11500, 'Budhanilkantha & Samakhusi • 4000 rec / 15500 pkg', 'Budhanilkantha Agency'),
  ('c-bishesh-1', 'dep-dhorpatan-kartik6', 'Bishesh Parajuli', '9865511916 / +977 970-8539671', 1, 'Bhrikutimandap Desk', 9500, 'Bhrikutimandap • 3N/4D • 4000 rec / 13500 pkg', 'Bhrikutimandap Desk'),
  ('c-sarmila-1', 'dep-rara-kartik6', 'Sarmila Shrestha', '9803699927', 3, 'Gokarna Travels', 2650, 'Gokarna (2) & Medicity (1) • 23850 rec / 26500 pkg', 'Gokarna Travels')
on conflict (id) do update set
  departure_id = excluded.departure_id,
  name = excluded.name,
  phone = excluded.phone,
  pax = excluded.pax,
  agency_name = excluded.agency_name,
  remaining = excluded.remaining,
  note = excluded.note,
  booked_by = excluded.booked_by;
