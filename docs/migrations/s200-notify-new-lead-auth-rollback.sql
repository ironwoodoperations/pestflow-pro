-- S200 rollback — restores trigger_notify_new_lead to S199 state (Authorization: Bearer only,
-- no apikey header). Use ONLY if the in-source apikey check in notify-new-lead causes
-- legitimate trigger fires to fail and the edge function source rewrite cannot be reverted
-- in time.
--
-- Sequence to fully roll back S200:
-- 1. Revert the edge function source: `supabase functions deploy notify-new-lead
--    --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt` from a checkout at commit 8c01c0f
--    (last main commit before S200).
-- 2. Run this SQL via Supabase MCP apply_migration or SQL editor.
-- 3. Confirm: SELECT pg_get_functiondef('public.trigger_notify_new_lead'::regproc)
--    no longer contains 'apikey' or 'notify_new_lead_internal_secret'.
--
-- Vault entry notify_new_lead_internal_secret can be left in place (harmless) or deleted via
-- Dashboard if a clean rollback is desired. Edge function env var
-- NOTIFY_NEW_LEAD_INTERNAL_SECRET can also be left or deleted.

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
  SELECT decrypted_secret INTO _key
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_service_role_key';

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
