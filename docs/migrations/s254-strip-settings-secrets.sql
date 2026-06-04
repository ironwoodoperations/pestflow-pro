-- s254 strip settings secrets  (STAGED — apply LAST via MCP during cutover)
--
-- NOTE ON LOCATION: staged in docs/migrations/ (not supabase/migrations/)
-- because supabase/migrations/ is protected by .claude/hooks/protect-files.sh,
-- and the project convention stages MCP-applied SQL here. Claude.ai applies
-- this via the Supabase MCP as the FINAL cutover step.
--
-- Removes the 4 true secrets from settings.integrations now that the edge
-- functions read them from Vault. This is the permanent hardening: even if a
-- future RLS/policy change re-exposed settings.integrations to anon, these
-- secrets would no longer be there.
--
-- CRITICAL SEQUENCING (S163 code-first rule): DO NOT apply until ALL of:
--   1. The read-path rewrite PR is merged AND the edge functions are deployed.
--   2. The get_tenant_secret RPC (s254-get-tenant-secret-rpc.sql) is applied.
--   3. Claude.ai has created + populated vault entries for all 4 secrets for
--      every tenant that has them, AND a smoke test confirms one function reads
--      its secret from vault successfully.
-- Applying earlier would null out Dang's live Facebook/SMS/GA4/GSC services.
--
-- Scope — exactly these 4 keys (everything else in integrations stays):
--   facebook_access_token, ga4_oauth_refresh_token,
--   gsc_oauth_refresh_token, textbelt_api_key
--
-- Rollback: docs/migrations/s254-strip-settings-secrets-rollback.sql

UPDATE public.settings
  SET value = value - 'facebook_access_token' - 'ga4_oauth_refresh_token'
                    - 'gsc_oauth_refresh_token' - 'textbelt_api_key'
  WHERE key = 'integrations';

NOTIFY pgrst, 'reload schema';
