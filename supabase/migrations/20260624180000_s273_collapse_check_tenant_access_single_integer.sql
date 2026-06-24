-- S273 hotfix — repo trail for an MCP-applied migration.
--
-- Collapse public.check_tenant_access to a SINGLE integer overload. Fixes PGRST203.
--
-- ROOT CAUSE: migration 20260622170000 added an ADDITIVE integer overload alongside
-- the original smallint signature (20260612144629). PostgREST resolves RPCs by
-- parameter NAME, not type, and a JSON-number argument is ambiguous between
-- check_tenant_access(uuid, smallint) and check_tenant_access(uuid, integer)
-- → PostgREST returned PGRST203 (could not choose a candidate function). The
-- ai-proxy tier gate calls svc.rpc('check_tenant_access', …); that PGRST203 error
-- surfaced to users as a spurious 403 'Upgrade required' on gated AI features (e.g.
-- Dang SEO Generate). Direct SQL resolved fine because Postgres exact-matched the
-- int literal, which is why DB-side checks passed while the live RPC failed.
--
-- FIX: drop BOTH overloads and create exactly one — the integer signature, with the
-- access rule (tenants.entitlement >= required_tier) inlined (no smallint delegate left).
--
-- GRANTS: the live DROP/CREATE during the hotfix had widened EXECUTE to anon and
-- authenticated. The explicit REVOKE below tightens it back to service_role only —
-- ai-proxy calls this RPC with the service-role key, so no caller is affected.
--
-- Applied live this session via Supabase MCP apply_migration (ledger written, no file);
-- this commit reconciles repo <-> DB. Timestamp sorts AFTER 20260622170000 so a fresh
-- replay applies the overload then this collapse, leaving exactly one signature.
-- Idempotent (DROP IF EXISTS + idempotent REVOKE/GRANT), safe to re-apply.

DROP FUNCTION IF EXISTS public.check_tenant_access(uuid, smallint);
DROP FUNCTION IF EXISTS public.check_tenant_access(uuid, integer);

CREATE FUNCTION public.check_tenant_access(p_tenant_id uuid, p_required_tier integer)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select exists (
    select 1 from public.tenants
    where id = p_tenant_id and entitlement >= p_required_tier
  );
$$;

REVOKE ALL ON FUNCTION public.check_tenant_access(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_tenant_access(uuid, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_tenant_access(uuid, integer) TO service_role;

NOTIFY pgrst, 'reload schema';
