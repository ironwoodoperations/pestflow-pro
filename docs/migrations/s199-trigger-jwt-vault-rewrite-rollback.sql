-- Rollback for s199 trigger-jwt-rewrite.
--
-- Restores the hardcoded JWT version of trigger_notify_new_lead. Apply only
-- if the vault read path is broken (e.g., grants revoked, view dropped) AND
-- the rewritten trigger is failing in production.
--
-- Note: this rollback re-embeds the service_role JWT in pg_proc, restoring
-- the security exposure that s199 closed. Use only as emergency revert.

CREATE OR REPLACE FUNCTION public.trigger_notify_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _url     text := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/notify-new-lead';
  _key     text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpZXp6eWtjZ3prcndkZ3Fwc2FyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDc5NDgyMywiZXhwIjoyMDkwMzcwODIzfQ.5WLHqK9r5CtBnI2yRsCPYkn4GXG4VuWbBusy4gc3PTo';
BEGIN
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
