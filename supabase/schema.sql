-- Run this in Supabase SQL Editor. Create an admin user through Supabase Auth first.
create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  email text not null,
  phone text not null,
  product_id text not null,
  product_name text not null,
  amount numeric(10,2) not null check (amount >= 0),
  payment_method text not null check (payment_method in ('Vodafone Cash','InstaPay')),
  proof_path text not null,
  note text,
  tracking_token_hash text,
  order_number_hash text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','delivered')),
  delivery_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists orders_order_number_hash_uidx
  on public.orders (order_number_hash)
  where order_number_hash is not null;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'); $$;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  purchased text,
  message text not null,
  name text,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.feedback enable row level security;
alter table public.user_roles enable row level security;

drop policy if exists "admins can read own role" on public.user_roles;
create policy "admins can read own role" on public.user_roles for select to authenticated using (user_id = auth.uid());
drop policy if exists "Allow anonymous order submissions"
on public.orders;
-- Public checkout can create a pending order only. Customers cannot read/update orders.
drop policy if exists "public can submit pending orders" on public.orders;
create policy "public can submit pending orders" on public.orders
for insert to anon, authenticated
with check (status = 'pending' and delivery_url is null);

-- Feedback can be submitted publicly; only authenticated admins can read it.
drop policy if exists "public can submit feedback" on public.feedback;
create policy "public can submit feedback" on public.feedback
for insert to anon, authenticated with check (length(message) between 1 and 600);

-- Admin access is allowlisted in user_roles. After creating an Auth user, add its UUID:
-- insert into public.user_roles(user_id, role) values ('AUTH-USER-UUID', 'admin');
drop policy if exists "authenticated admins read orders" on public.orders;
create policy "authenticated admins read orders" on public.orders
for select to authenticated using (public.is_admin());
drop policy if exists "authenticated admins update orders" on public.orders;
create policy "authenticated admins update orders" on public.orders
for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "authenticated users read feedback" on public.feedback;
create policy "authenticated users read feedback" on public.feedback
for select to authenticated using (public.is_admin());

-- Create a PRIVATE bucket named payment-proofs in Storage.
-- The app uploads using the anon key; permit inserts only. Do not create public read access.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs','payment-proofs',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public=false, file_size_limit=5242880, allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "public can upload payment proofs" on storage.objects;
create policy "public can upload payment proofs" on storage.objects
for insert to anon, authenticated with check (bucket_id = 'payment-proofs');
-- Required table privileges
grant insert on public.orders to anon, authenticated;
grant select, update on public.orders to authenticated;

grant insert on public.feedback to anon, authenticated;
grant select on public.feedback to authenticated;

grant select on public.user_roles to authenticated;
-- IMPORTANT before launch:
-- 1) Add the intended admin user UUID to public.user_roles.
-- 2) Add a secure server/Edge Function to create signed delivery URLs and send emails.
-- 3) Configure payment account details in protected admin settings; never put secrets in frontend code.
