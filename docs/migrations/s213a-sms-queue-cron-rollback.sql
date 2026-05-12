-- S213a rollback: revert process-sms-queue cron to unauthenticated HTTP call.
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'process-sms-queue'),
  command := $$
    SELECT net.http_post(
      url := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/process-sms-queue',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
