-- S273 — rewrite the provisioning_status operator gate off profiles.role.
--
-- master_admin_read_provisioning_status is an OPERATOR gate: only an admin member of
-- the operator tenant (slug='pestflow-pro') may SELECT provisioning_status. It is NOT
-- a customer-tenant gate. It was the one standalone RLS policy missed by PR #1's grep
-- (which scoped to the 18 edge fns), and it is the sole remaining dependency blocking
-- DROP COLUMN profiles.role.
--
-- This rewrites the same intent against tenant_users.role (the SSOT) via a SECURITY
-- DEFINER slug-resolver. The helper removes the prior transitive dependency on profiles
-- (via current_tenant_id) AND on tenants RLS — the policy no longer reads tenants under
-- the caller's RLS context. (SELECT auth.uid()) is wrapped so the planner caches it
-- per-statement (initplan), not per-row. After this lands, the subsequent
-- DROP COLUMN profiles.role (20260617120100_s273_neutralize_profiles_role.sql) succeeds.

CREATE OR REPLACE FUNCTION public.operator_tenant_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$ SELECT id FROM public.tenants WHERE slug = 'pestflow-pro' $$;

REVOKE ALL ON FUNCTION public.operator_tenant_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.operator_tenant_id() TO authenticated, service_role;

DROP POLICY IF EXISTS master_admin_read_provisioning_status ON public.provisioning_status;

CREATE POLICY master_admin_read_provisioning_status
  ON public.provisioning_status
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.user_id = (SELECT auth.uid())
        AND tu.tenant_id = public.operator_tenant_id()
        AND tu.role = 'admin'
    )
  );

NOTIFY pgrst, 'reload schema';
