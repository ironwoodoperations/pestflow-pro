-- s254 strip settings secrets — ROLLBACK (restore from backup table)
--
-- Restores settings.integrations from public._secret_migration_backup, undoing
-- s254-strip-settings-secrets.sql. No full DB snapshot / downtime required.
--
-- This restores the ENTIRE integrations blob captured at strip time (which
-- includes the 4 secrets and all non-secret keys as they were then). Run this
-- only if the Vault read-path has to be abandoned and the functions reverted to
-- reading secrets from settings.
--
-- PREREQUISITE: public._secret_migration_backup must still exist (it is kept for
-- at least one sprint post-strip). If it was already dropped, restore from Vault
-- instead (re-collect the 4 secrets via get_tenant_secret per tenant) or from a
-- DB snapshot.
--
-- NOTE: any NON-secret edits made to settings.integrations between the strip and
-- this rollback would be reverted to their strip-time values, because this does
-- a full-blob restore (matches the validator-specified DOWN form). If preserving
-- post-strip non-secret edits matters, restore only the 4 secret keys instead
-- (commented variant below).

-- Full-blob restore (validator-specified form):
UPDATE public.settings s
  SET value = b.integration_blob,
      updated_at = now()
  FROM public._secret_migration_backup b
  WHERE s.id = b.id;

-- Alternative — restore ONLY the 4 secret keys, preserving any post-strip
-- non-secret edits (uncomment to use instead of the full-blob restore above):
-- UPDATE public.settings s
--   SET value = s.value
--         || jsonb_strip_nulls(jsonb_build_object(
--              'facebook_access_token',    b.integration_blob->>'facebook_access_token',
--              'ga4_oauth_refresh_token',  b.integration_blob->>'ga4_oauth_refresh_token',
--              'gsc_oauth_refresh_token',  b.integration_blob->>'gsc_oauth_refresh_token',
--              'textbelt_api_key',         b.integration_blob->>'textbelt_api_key'
--            )),
--       updated_at = now()
--   FROM public._secret_migration_backup b
--   WHERE s.id = b.id;

NOTIFY pgrst, 'reload schema';
