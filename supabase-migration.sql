-- ============================================================
-- Kappi 2.0 — Full Supabase Migration
-- Run this entire block once in the Supabase SQL Editor.
-- It is idempotent (IF NOT EXISTS) — safe to re-run.
-- ============================================================

-- ========== MEMBERS ==========
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- ========== ORDERS ==========
-- one row per member per day; items stored as JSON: { "Tea": 2, "Egg Puff": 1, ... }
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  member_name text not null,           -- denormalized for easy display/edit
  items jsonb not null default '{}',   -- { "itemName": qty }
  paid boolean default false,
  order_date date not null default current_date,
  updated_at timestamptz default now()
);

create index if not exists idx_orders_date on orders(order_date);
create index if not exists idx_orders_member on orders(member_id);

-- Unique constraint to support upsert on conflict
create unique index if not exists idx_orders_member_date on orders(member_id, order_date);

-- ========== MENU ITEMS ==========
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null,
  icon text default '🍽️',
  position int default 0,
  created_at timestamptz default now()
);

-- ========== SETTINGS (for QR image storage) ==========
-- Stores arbitrary small key/value config.
-- key="qr_image" stores the base64 data URL — no Supabase Storage needed.
create table if not exists settings (
  id serial primary key,
  key text unique not null,
  value text,
  updated_at timestamptz default now()
);

-- ========== ROW LEVEL SECURITY ==========
alter table members enable row level security;
alter table orders enable row level security;
alter table menu_items enable row level security;
alter table settings enable row level security;

-- Public SELECT (anon key can read — safe for client-side LiveSummary, etc.)
create policy if not exists "public read members"    on members    for select using (true);
create policy if not exists "public read orders"     on orders     for select using (true);
create policy if not exists "public read menu_items" on menu_items for select using (true);
create policy if not exists "public read settings"   on settings   for select using (true);

-- NOTE: No public INSERT/UPDATE/DELETE policies.
-- Writes go through /api/* serverless functions using SUPABASE_SERVICE_ROLE_KEY
-- which bypasses RLS entirely — keeping the DB safe.

-- ========== SEED DEFAULT MEMBERS ==========
insert into members (name, is_default)
select v.name, true
from (values
  ('Darun'),('Charuuu'),('Kabilesh'),('Jai'),('Inzamam'),
  ('Madhan'),('Abishek'),('Arun RS'),('Ashwanth'),('Hanumanth'),('Yogesh')
) as v(name)
where not exists (select 1 from members where members.name = v.name);

-- ========== SEED MENU ITEMS ==========
insert into menu_items (name, price, icon, position)
select v.name, v.price, v.icon, v.position
from (values
  ('Tea',      20, '☕', 1),
  ('Coffee',   15, '☕', 2),
  ('Egg Puff', 25, '🥟', 3),
  ('Milk',     20, '🥛', 4),
  ('Cake',     50, '🎂', 5),
  ('Muffin',   40, '🧁', 6),
  ('Horlick',  30, '🍵', 7),
  ('Boost',    30, '💪', 8)
) as v(name, price, icon, position)
where not exists (select 1 from menu_items where menu_items.name = v.name);
