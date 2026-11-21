-- Add hashed human-friendly order-number lookups without changing existing
-- row-level security, table privileges, or the legacy tracking-token column.
begin;

alter table public.orders
  add column if not exists order_number_hash text;

create unique index if not exists orders_order_number_hash_uidx
  on public.orders (order_number_hash)
  where order_number_hash is not null;

commit;
