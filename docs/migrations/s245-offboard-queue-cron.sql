-- ============================================================================
-- S245 PR2 — pg_cron registration for process-offboard-queue (STAGED, APPLY LAST)
-- ============================================================================
-- Apply ONLY AFTER the process-offboard-queue edge fn is deployed & reachable.
-- Prereq: vault secret `process_offboard_queue_internal_secret` exists AND the
-- edge fn's env var PROCESS_OFFBOARD_QUEUE_INTERNAL_SECRET is set to the same
-- value (orchestrator). Mirrors the S213a sms-queue cron (vault-injected apikey).
-- ============================================================================

select cron.schedule(
  'process-offboard-queue',
  '*/5 * * * *',
  $cron$
  select net.http_post(
    url     := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/process-offboard-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets
                 where name = 'process_offboard_queue_internal_secret')
    ),
    body    := '{}'::jsonb
  );
  $cron$
);

-- Rollback: SELECT cron.unschedule('process-offboard-queue');
