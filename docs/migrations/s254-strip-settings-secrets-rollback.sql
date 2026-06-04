-- s254 strip settings secrets — ROLLBACK
--
-- Re-inserts the 4 secrets back into settings.integrations FROM VAULT, undoing
-- s254-strip-settings-secrets.sql. Only needed if the vault read-path has to be
-- abandoned and the functions reverted to reading from settings.
--
-- IMPORTANT: rollback requires reading the vault values back out. It depends on
-- the get_tenant_secret RPC (or direct vault access) still being present and the
-- per-tenant vault entries (tenant_<id>_<secret>) still populated. If vault has
-- already been torn down, there is nothing to restore from — re-collect the
-- secrets from their sources (Facebook, Google OAuth, Textbelt) instead.
--
-- This restores each secret per-tenant for every tenant that has a vault entry.
-- Keys whose vault entry is absent/empty are left out (matches pre-strip state
-- where the key may simply not have existed).

DO $$
DECLARE
  r RECORD;
  _secret_names text[] := ARRAY[
    'facebook_access_token',
    'ga4_oauth_refresh_token',
    'gsc_oauth_refresh_token',
    'textbelt_api_key'
  ];
  _name text;
  _val text;
BEGIN
  FOR r IN SELECT tenant_id FROM public.settings WHERE key = 'integrations' LOOP
    FOREACH _name IN ARRAY _secret_names LOOP
      SELECT decrypted_secret INTO _val
      FROM vault.decrypted_secrets
      WHERE name = 'tenant_' || r.tenant_id::text || '_' || _name
      LIMIT 1;

      IF _val IS NOT NULL AND _val <> '' THEN
        UPDATE public.settings
          SET value = value || jsonb_build_object(_name, _val)
          WHERE key = 'integrations' AND tenant_id = r.tenant_id;
      END IF;
    END LOOP;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
