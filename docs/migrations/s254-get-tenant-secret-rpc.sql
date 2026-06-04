-- s254 get_tenant_secret RPC  (STAGED — apply via MCP during cutover)
--
-- NOTE ON LOCATION: staged in docs/migrations/ (not supabase/migrations/)
-- because supabase/migrations/ is protected by .claude/hooks/protect-files.sh,
-- and the project convention stages MCP-applied SQL here (cf. s227-seo-runs.sql,
-- s230-gsc-runs.sql, s231-ga4-runs.sql, s245-offboard-foundation.sql).
-- Claude.ai applies this via the Supabase MCP during cutover.
--
-- Read path for per-tenant secrets stored in Postgres Vault. Backs the
-- _shared/secrets/getTenantSecret.ts edge-function helper.
--
-- WHY AN RPC (not a direct vault.decrypted_secrets read from supabase-js):
--   PostgREST only exposes `public, graphql_public`, so the `vault` schema is
--   unreachable via supabase-js .schema('vault').from(...) even though
--   service_role holds SELECT on vault.decrypted_secrets. This SECURITY DEFINER
--   wrapper (owned by postgres) reads the vault view server-side and is
--   EXECUTE-granted to service_role only. Mirrors the S199 convention
--   (trigger_notify_new_lead reads vault inside a SECURITY DEFINER function).
--
-- NAMING CONVENTION: secrets are stored in vault as
--   tenant_<tenantId>_<secretName>
--
-- FAIL-SOFT: returns NULL when the secret is absent. Callers treat NULL exactly
-- like the old empty settings value (no-op / skip).
--
-- CUTOVER ORDER: apply this BEFORE deploying the rewritten edge functions and
-- BEFORE the strip-settings-secrets migration. Safe to apply early — if vault
-- is unpopulated it simply returns NULL (fail-soft), and the functions keep
-- reading the live values from settings until the strip runs.
--
-- Rollback: docs/migrations/s254-get-tenant-secret-rpc-rollback.sql

CREATE OR REPLACE FUNCTION public.get_tenant_secret(p_tenant_id uuid, p_secret_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  _value text;
BEGIN
  IF p_tenant_id IS NULL OR p_secret_name IS NULL OR p_secret_name = '' THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO _value
  FROM vault.decrypted_secrets
  WHERE name = 'tenant_' || p_tenant_id::text || '_' || p_secret_name
  LIMIT 1;

  RETURN _value;  -- NULL when absent
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[get_tenant_secret] vault read error for tenant_%_%: %', p_tenant_id, p_secret_name, SQLERRM;
  RETURN NULL;
END;
$function$;

COMMENT ON FUNCTION public.get_tenant_secret(uuid, text) IS
  's254: SECURITY DEFINER reader for per-tenant Vault secrets (name = tenant_<id>_<secret>). EXECUTE granted to service_role only.';

-- Lock down execution: service_role only. Edge functions call this with the
-- service-role client; anon/authenticated must never reach tenant secrets.
REVOKE ALL ON FUNCTION public.get_tenant_secret(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_tenant_secret(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.get_tenant_secret(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_secret(uuid, text) TO service_role;

NOTIFY pgrst, 'reload schema';
