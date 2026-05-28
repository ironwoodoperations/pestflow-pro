-- ============================================================================
-- S245 PR2 — pg_cron registration for process-offboard-queue (STAGED, APPLY LAST)
-- ============================================================================
-- Apply ONLY AFTER the process-offboard-queue edge fn + s245-offboard-queue-auth.sql
-- are deployed/applied. Prereq: vault secret `process_offboard_queue_internal_secret`
-- (already staged). The cron sends it on header `x-pfp-internal-key`; the edge fn
-- reads the same vault value via offboard_queue_internal_secret() and compares.
-- No Edge Function Secret needed. Mirrors the S213a sms-queue vault-injected cron.
-- ============================================================================

select cron.schedule(
  'process-offboard-queue',
  '*/5 * * * *',
  $cron$
  select net.http_post(
    url     := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/process-offboard-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-pfp-internal-key', (select decrypted_secret from vault.decrypted_secrets
                             where name = 'process_offboard_queue_internal_secret')
    ),
    body    := '{}'::jsonb
  );
  $cron$
);

-- Rollback: SELECT cron.unschedule('process-offboard-queue');
