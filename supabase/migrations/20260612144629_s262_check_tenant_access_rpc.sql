-- S262 — single authoritative gate resolver. SECURITY DEFINER + pinned search_path;
-- EXECUTE locked to service_role (the edge functions call it with the service key).
create or replace function public.check_tenant_access(p_tenant_id uuid, p_required_tier smallint)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenants
    where id = p_tenant_id and entitlement >= p_required_tier
  );
$$;

revoke all on function public.check_tenant_access(uuid, smallint) from public;
revoke all on function public.check_tenant_access(uuid, smallint) from anon;
revoke all on function public.check_tenant_access(uuid, smallint) from authenticated;
grant execute on function public.check_tenant_access(uuid, smallint) to service_role;
