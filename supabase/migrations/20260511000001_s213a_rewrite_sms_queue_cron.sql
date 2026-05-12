-- S213a: rewrite process-sms-queue pg_cron command to inject apikey from vault.
-- Mirrors publish-scheduled-posts pattern (jobid=3, already gated S211).
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'process-sms-queue'),
  command := $$
    SELECT net.http_post(
      url := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/process-sms-queue',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'process_sms_queue_internal_secret')
      ),
      body := '{}'::jsonb
    );
  $$
);
