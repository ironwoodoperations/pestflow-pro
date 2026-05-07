-- Schedule process-sms-queue cron mirroring publish-scheduled-posts pattern.
--
-- APPLY ORDER: this migration MUST be applied AFTER process-sms-queue edge
-- function is deployed. Otherwise pg_cron will fire HTTP POSTs to a 404
-- endpoint until the function lands. Claude.ai applies migrations + deploys
-- in this order via Supabase MCP after PR merge:
--
--   1. Apply 20260507000000_create_sms_queue.sql (table)
--   2. Deploy send-sms@v30 edge fn
--   3. Deploy process-sms-queue edge fn
--   4. Apply 20260507000001_schedule_sms_queue_cron.sql (this file)

SELECT cron.schedule(
  'process-sms-queue',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/process-sms-queue',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
