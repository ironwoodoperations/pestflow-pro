-- S273 follow-up — repo trail for an MCP-applied migration.
--
-- The integer overload of public.check_tenant_access was applied LIVE this session
-- via the Supabase MCP apply_migration tool (migration name on the platform:
-- `add_check_tenant_access_integer_overload`). That path writes a ledger row but
-- does NOT create a file, so this commit reconciles repo <-> DB to prevent drift.
--
-- WHAT IT DOES: adds an additive integer-typed overload of check_tenant_access that
-- delegates to the canonical smallint implementation. Several edge functions call the
-- RPC with a JS number (serialized as integer); without this overload PostgREST could
-- fail to resolve the smallint signature. The overload is a thin cast wrapper — the
-- access rule (tenants.entitlement >= required_tier) lives ONLY in the smallint impl.
--
-- Idempotent (CREATE OR REPLACE + idempotent REVOKE/GRANT), safe to re-apply.

CREATE OR REPLACE FUNCTION public.check_tenant_access(p_tenant_id uuid, p_required_tier integer)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.check_tenant_access(p_tenant_id, p_required_tier::smallint);
$function$;

REVOKE ALL ON FUNCTION public.check_tenant_access(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_tenant_access(uuid, integer) TO service_role;

NOTIFY pgrst, 'reload schema';
