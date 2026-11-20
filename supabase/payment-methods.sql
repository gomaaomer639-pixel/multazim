-- Payment destinations shown to customers during checkout.
-- Safe to run more than once: the table is created only if missing and the
-- two configured rows are upserted by stable method code.
create table if not exists public.payment_methods (
  method_code text primary key check (method_code in ('vodafone_cash', 'instapay')),
  display_name text not null,
  payment_identifier text not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.payment_methods enable row level security;

-- These identifiers are intended to be visible to shoppers so they can pay.
-- No public write policy is created; changes must be made by a trusted admin
-- in the Supabase SQL Editor or through a secured backend.
drop policy if exists "customers can read active payment methods" on public.payment_methods;
create policy "customers can read active payment methods"
  on public.payment_methods
  for select
  to anon, authenticated
  using (is_active = true);

revoke all on table public.payment_methods from public, anon, authenticated;
grant select on table public.payment_methods to anon, authenticated;

insert into public.payment_methods (method_code, display_name, payment_identifier, is_active)
values
  ('vodafone_cash', 'Vodafone Cash', '01023825831', true),
  ('instapay', 'InstaPay', '01556984927', true)
on conflict (method_code) do update
set display_name = excluded.display_name,
    payment_identifier = excluded.payment_identifier,
    is_active = excluded.is_active,
    updated_at = now();
