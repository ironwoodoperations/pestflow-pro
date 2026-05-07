-- s199 trigger-jwt-rewrite
--
-- Moves the service_role JWT out of trigger_notify_new_lead's function body
-- and into vault.decrypted_secrets, where it's encrypted at rest via
-- Supabase managed keys. pg_dump snapshots and pg_proc reads no longer
-- leak the credential.
--
-- DEPLOY PREREQUISITE (Scott via Supabase Dashboard, BEFORE applying this migration):
--   1. Project Settings → Vault → Secrets
--   2. Find existing secret `supabase_service_role_key` (currently 'placeholder')
--   3. Edit → paste the real service role key (matches the current hardcoded JWT
--      in pg_proc; copyable from Dashboard → API Keys → service_role)
--   4. Save
--   5. Verify with:
--        SELECT length(decrypted_secret) FROM vault.decrypted_secrets
--        WHERE name='supabase_service_role_key';
--      Expect ~279 chars (actual JWT length), NOT 11.
--
-- This migration is safe to apply even if the vault prereq is incomplete:
-- the new function emits RAISE WARNING and skips the HTTP POST when the
-- secret is missing/placeholder, but allows the lead INSERT to proceed.
-- (Same graceful-degradation behavior as the EXCEPTION WHEN OTHERS clause.)
--
-- Rollback: docs/migrations/s199-trigger-jwt-vault-rewrite-rollback.sql

CREATE OR REPLACE FUNCTION public.trigger_notify_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _url text := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/notify-new-lead';
  _key text;
BEGIN
  -- Read service role key from vault.decrypted_secrets at call time.
  -- vault.decrypted_secrets is a SECURITY DEFINER view owned by supabase_admin
  -- that decrypts via managed keys. postgres (this function's owner) has
  -- SELECT grant. The JWT never appears in pg_proc, pg_dump, or query plans.
  SELECT decrypted_secret INTO _key
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_service_role_key';

  -- Fail-soft if vault is unset or still holds the placeholder.
  IF _key IS NULL OR _key = '' OR _key = 'placeholder' THEN
    RAISE WARNING '[notify-new-lead] vault secret supabase_service_role_key is missing or placeholder; skipping notification (lead insert proceeds)';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url     := _url,
    body    := jsonb_build_object(
                 'type',   'INSERT',
                 'table',  'leads',
                 'record', row_to_json(NEW)::jsonb
               ),
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer ' || _key
               )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[notify-new-lead] trigger error: %', SQLERRM;
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.trigger_notify_new_lead() IS
  's199 trigger-jwt-rewrite: reads service_role JWT from vault.decrypted_secrets at call time. JWT never embedded in pg_proc.';

-- No NOTIFY pgrst needed — this is a function rewrite, not a schema change.
