-- ============================================================================
-- S259 — Monthly Report cron (dispatcher + worker)
-- ============================================================================
-- REPO RECORD of the cron the orchestrator schedules via MCP (cron.schedule lives
-- in the DB, not the repo — CC Web cannot run it). Queue-and-worker design
-- (validator-mandated): the dispatcher enqueues jobs monthly; the worker drains
-- the queue every minute and fires the generate-monthly-report edge fn per job.
--
-- PREREQUISITES (orchestrator, before scheduling):
--   1. Deploy generate-monthly-report (verify_jwt=false).
--   2. Store its internal secret in BOTH places with the SAME value:
--        - edge env: GENERATE_MONTHLY_REPORT_INTERNAL_SECRET
--        - vault:    generate_monthly_report_internal_secret  (read by the worker below)
--   3. Extensions pg_cron + pg_net already enabled (used by existing crons).
-- ============================================================================

-- ── DISPATCHER — monthly, 10th 09:00 UTC ────────────────────────────────────
-- Enqueues one 'pending' job per tenant for the current period. Idempotent via
-- ON CONFLICT (tenant_id, period) — safe to re-run.
-- NOTE: v1 enqueues ALL tenants (per S259 spec fallback — no project-wide "active
-- customer" predicate exists yet). Refine this WHERE clause when one lands.
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monthly-report-dispatcher') THEN
    PERFORM cron.unschedule('monthly-report-dispatcher');
  END IF;
  PERFORM cron.schedule(
    'monthly-report-dispatcher',
    '0 9 10 * *',
    $job$
      INSERT INTO public.report_jobs (tenant_id, period, status)
      SELECT id, to_char(now(), 'YYYY-MM'), 'pending'
      FROM public.tenants
      ON CONFLICT (tenant_id, period) DO NOTHING;
    $job$
  );
END
$cron$;

-- ── WORKER — every 1 minute ─────────────────────────────────────────────────
-- Claims a small batch of due jobs (pending, OR processing-but-stuck >15 min)
-- with FOR UPDATE SKIP LOCKED so concurrent ticks never grab the same row, then
-- fires the edge fn per claimed job. The edge fn does the authoritative status
-- claim itself (idempotent), so a duplicate dispatch is harmless. pg_net default
-- timeout (5s) is too short for the fn's run → 30000ms (S258 rule).
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monthly-report-worker') THEN
    PERFORM cron.unschedule('monthly-report-worker');
  END IF;
  PERFORM cron.schedule(
    'monthly-report-worker',
    '* * * * *',
    $job$
      WITH claimed AS (
        SELECT id, tenant_id, period
        FROM public.report_jobs
        WHERE status = 'pending'
           OR (status = 'processing' AND started_at < now() - interval '15 minutes')
        ORDER BY created_at
        LIMIT 5
        FOR UPDATE SKIP LOCKED
      )
      SELECT net.http_post(
        url     := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/generate-monthly-report',
        headers := jsonb_build_object(
                     'Content-Type', 'application/json',
                     'apikey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'generate_monthly_report_internal_secret')
                   ),
        body    := jsonb_build_object('tenant_id', c.tenant_id, 'period', c.period),
        timeout_milliseconds := 30000
      )
      FROM claimed c;
    $job$
  );
END
$cron$;
