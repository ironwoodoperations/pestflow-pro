-- ROLLBACK for 20260901170000_s309_required_tenant_id.sql
--
-- NOT TIMESTAMP-PREFIXED, DELIBERATELY. The Supabase CLI reads the leading 14 digits
-- as a migration version. A file named 20260901170000_..._rollback.sql would carry the
-- SAME version as the migration and sort immediately after it, so a fresh
-- `supabase db push` would apply the change and then silently undo it. That trap was
-- caught in S308; the naming here matches s281_business_info_vertical_check_rollback.sql
-- and s308_operator_membership_split_rollback.sql.
--
-- Restores the pre-S309 state exactly: the zero-argument list_tenant_members() with
-- its current_tenant_id() derivation, and get_my_tenant_role's original search_path.
-- Run by hand, never by the CLI.

DROP FUNCTION IF EXISTS public.list_tenant_members(uuid);

CREATE OR REPLACE FUNCTION public.get_my_tenant_role(p_tenant_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
  SELECT role FROM public.tenant_users
  WHERE user_id = (SELECT auth.uid()) AND tenant_id = p_tenant_id;
$fn$;

CREATE OR REPLACE FUNCTION public.list_tenant_members()
RETURNS TABLE(user_id uuid, email text, role text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
declare
  v_tenant uuid;
begin
  v_tenant := public.current_tenant_id();          -- server-derived; never from the client
  if v_tenant is null then
    return;                                          -- no binding → no rows
  end if;
  if public.get_my_tenant_role(v_tenant) = 'admin' then   -- strict; NULL → false → fail closed
    return query
      select tu.user_id, u.email::text, tu.role
      from public.tenant_users tu
      join auth.users u on u.id = tu.user_id
      where tu.tenant_id = v_tenant;
  end if;
  return;                                            -- non-admin / NULL role → zero rows
end;
$fn$;

NOTIFY pgrst, 'reload schema';
