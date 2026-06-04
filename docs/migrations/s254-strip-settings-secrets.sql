-- s254 strip settings secrets  (STAGED — apply LAST via MCP during cutover)
--
-- NOTE ON LOCATION: staged in docs/migrations/ (not supabase/migrations/)
-- because supabase/migrations/ is protected by .claude/hooks/protect-files.sh,
-- and the project convention stages MCP-applied SQL here. Claude.ai applies
-- this via the Supabase MCP as the FINAL cutover step.
--
-- STORAGE TARGET (verified against live schema): the 4 secrets live in the
-- public.settings TABLE — one row per tenant with key='integrations' and the
-- JSONB in the `value` column (UNIQUE (tenant_id, key), PRIMARY KEY (id)).
-- There is NO tenants.settings column. This migration therefore targets
-- public.settings, NOT public.tenants.
--
-- Removes the 4 true secrets from settings.integrations now that the edge
-- functions read them from Vault. This is the permanent hardening: even if a
-- future RLS/policy change re-exposed settings.integrations to anon, these
-- secrets would no longer be there.
--
-- REVERSIBLE WITHOUT A FULL DB SNAPSHOT: the UP step first snapshots the entire
-- integrations blob per row into public._secret_migration_backup, so rollback
-- (s254-strip-settings-secrets-rollback.sql) restores from that table with no
-- downtime. Keep _secret_migration_backup for at least one sprint post-strip,
-- then drop it in a cleanup PR.
--
-- CRITICAL SEQUENCING (S163 code-first rule): DO NOT apply until ALL of:
--   1. The fail-hard read-path rewrite PR is merged AND the edge functions are
--      deployed.
--   2. The get_tenant_secret RPC is created (MCP side, hardened version).
--   3. Vault is populated + smoke-tested for all 4 secrets, all holding tenants.
--   4. The WRITE-path fix (onboarding/provisioning → Vault) is deployed, so the
--      onboarding UI can no longer re-introduce a plaintext secret into settings.
-- Applying earlier would null out Dang's live Facebook/SMS/GA4/GSC services.
--
-- Scope — exactly these 4 keys (the ~23 non-secret integrations keys stay):
--   facebook_access_token, ga4_oauth_refresh_token,
--   gsc_oauth_refresh_token, textbelt_api_key
--
-- Rollback: docs/migrations/s254-strip-settings-secrets-rollback.sql

-- UP: back up the full integrations blob before stripping.
CREATE TABLE IF NOT EXISTS public._secret_migration_backup AS
  SELECT id, tenant_id, value AS integration_blob
  FROM public.settings
  WHERE key = 'integrations';

-- Strip the 4 true secrets only; leave every non-secret key intact.
UPDATE public.settings
  SET value = value - 'facebook_access_token' - 'ga4_oauth_refresh_token'
                    - 'gsc_oauth_refresh_token' - 'textbelt_api_key',
      updated_at = now()
  WHERE key = 'integrations';

NOTIFY pgrst, 'reload schema';
