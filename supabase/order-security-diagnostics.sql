-- Read-only preflight. Run before order-security.sql and review the returned
-- policy list, especially any broad storage.objects SELECT policies.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename = 'orders')
   or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

select grantee, table_schema, table_name, privilege_type
from information_schema.role_table_grants
where (table_schema = 'public' and table_name = 'orders'
       and grantee in ('public', 'anon', 'authenticated', 'service_role'))
   or (table_schema = 'storage' and table_name = 'objects'
       and grantee in ('public', 'anon', 'authenticated', 'service_role'))
order by table_schema, table_name, grantee, privilege_type;

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'payment-proofs';

select to_regclass('public.product_catalog') as product_catalog_table,
       to_regclass('public.payment_methods') as payment_methods_table,
       to_regclass('public.payment_method') as legacy_payment_method_table,
       to_regprocedure('public.is_admin()') as admin_check_function;

select p.oid::regprocedure as function_signature,
       p.prosecdef as security_definer,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'track_order';
