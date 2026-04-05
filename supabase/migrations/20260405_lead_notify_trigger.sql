-- S48: Enable pg_net + create lead INSERT trigger to call notify-new-lead edge function
-- Applied 2026-04-05 via Supabase MCP

CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Trigger function: fires on leads INSERT → calls notify-new-lead edge function async
CREATE OR REPLACE FUNCTION public.trigger_notify_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  -- Never block a lead insert due to notification failure
  RAISE WARNING '[notify-new-lead] trigger error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Trigger on leads INSERT (idempotent)
DROP TRIGGER IF EXISTS on_lead_insert ON public.leads;
CREATE TRIGGER on_lead_insert
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_new_lead();
