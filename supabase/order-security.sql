-- Apply only after reviewing order-security-diagnostics.sql.
-- This migration removes anonymous order creation and proof upload while
-- preserving authenticated admin read/update access and admin proof viewing.
begin;

alter table public.orders
  add column if not exists tracking_token_hash text;
create unique index if not exists orders_tracking_token_hash_uidx
  on public.orders (tracking_token_hash)
  where tracking_token_hash is not null;

alter table public.orders enable row level security;
drop policy if exists "Allow anonymous order submissions" on public.orders;
drop policy if exists "public can submit pending orders" on public.orders;
revoke all on table public.orders from public, anon;
revoke insert, delete on table public.orders from authenticated;
grant select, update on table public.orders to authenticated;
grant usage on schema public to service_role;
grant select, insert on table public.orders to service_role;
do $$
begin
  if to_regclass('public.product_catalog') is not null then
    execute 'grant select on public.product_catalog to service_role';
  end if;
  if to_regclass('public.payment_methods') is not null then
    execute 'grant select on public.payment_methods to service_role';
  end if;
  if to_regclass('public.payment_method') is not null then
    execute 'grant select on public.payment_method to service_role';
  end if;
end $$;

-- Remove any additional order policies that could grant access outside the
-- admin allowlist. The order-specific diagnostic should be reviewed first.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'orders'
      and policyname not in ('authenticated admins read orders', 'authenticated admins update orders')
  loop
    execute format('drop policy %I on public.orders', p.policyname);
  end loop;
end $$;

-- Reassert the existing admin-only policies by stable names.
drop policy if exists "authenticated admins read orders" on public.orders;
create policy "authenticated admins read orders" on public.orders
  for select to authenticated using (public.is_admin());
drop policy if exists "authenticated admins update orders" on public.orders;
create policy "authenticated admins update orders" on public.orders
  for update to authenticated using (public.is_admin())
  with check (public.is_admin());

-- Disable any legacy UUID-plus-phone tracking RPC overloads.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as signature
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'track_order'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.signature);
  end loop;
end $$;

-- Keep this bucket private. Service role uploads bypass RLS; authenticated
-- admins may read objects to create short-lived signed proof URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880,
        array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public can upload payment proofs" on storage.objects;
drop policy if exists "admins can read payment proofs" on storage.objects;
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (coalesce(qual, '') ilike '%payment-proofs%'
        or coalesce(with_check, '') ilike '%payment-proofs%')
      and policyname <> 'admins can read payment proofs'
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;
create policy "admins can read payment proofs" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());
grant select on storage.objects to authenticated;
grant usage on schema storage to service_role;
grant select, insert, delete on storage.objects to service_role;

-- Stop safely if a remaining unscoped storage policy could include the private
-- proof bucket. Review the diagnostic output and scope that policy first.
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and cmd in ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL')
      and coalesce(qual, '') || ' ' || coalesce(with_check, '') not ilike '%payment-proofs%'
      and coalesce(qual, '') || ' ' || coalesce(with_check, '') not ilike '%bucket_id%'
      and (
        roles && array['public', 'anon']::name[]
        or (cmd in ('SELECT', 'ALL')
            and roles && array['authenticated']::name[]
            and coalesce(qual, '') not ilike '%is_admin%')
      )
  ) then
    raise exception 'Review unscoped storage.objects policies before continuing; the transaction has been rolled back.';
  end if;
end $$;

commit;

-- After application, re-run the diagnostics. Remove any other storage.objects
-- policy that grants anon/public read access to payment-proofs; the exact
-- policy name and predicate must be confirmed from the diagnostic output.
