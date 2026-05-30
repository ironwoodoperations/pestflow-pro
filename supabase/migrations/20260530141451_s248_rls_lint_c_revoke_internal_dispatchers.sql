-- S248 — RLS lint C (part 1): revoke client EXECUTE on internal SECURITY DEFINER fns.
--
-- Applied to production via Supabase MCP apply_migration on 2026-05-30 14:14:51 UTC
-- (schema_migrations.version = 20260530141451,
--  name = s248_rls_lint_c_revoke_internal_dispatchers).
-- This file is the REPO AUDIT-TRAIL SYNC of that change (precedent: PR #133, PR #136).
-- No re-apply happens from this file — filename version matches the recorded version,
-- so the Supabase CLI skips it on `db reset` / `migration up`.
--
-- Why (Category C — validator-gated, both models concur):
--   Revoke client EXECUTE on internal-only SECURITY DEFINER functions. Verified S248:
--     ga4/gsc/outscraper/seo _cron_dispatch -> invoked only by pg_cron jobs
--       (ga4-weekly-refresh, gsc-weekly-refresh, outscraper-daily-dispatch,
--        seo-analytics-dispatch); pg_cron runs as owner, bypasses role grants.
--     trigger_process_campaign_job -> table trigger campaign_jobs_enqueue on
--       public.campaign_jobs; fires under the engine, not via direct EXECUTE.
--   No frontend path calls any of these. current_tenant_id() and the 4 public
--   intake/boot functions are intentionally LEFT executable. The 2 seo_run_*
--   gating helpers are deferred pending frontend-usage confirmation (see Item C
--   in the s248 trail-sync PR).
--
-- Follow-up: outscraper_cron_dispatch and trigger_process_campaign_job ALSO grant
-- via PUBLIC, so the name-based revoke below is a no-op for them. Closed by
-- 20260530141524_s248_rls_lint_c_revoke_public_on_two_dispatchers.sql.

REVOKE EXECUTE ON FUNCTION public.ga4_cron_dispatch()            FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.gsc_cron_dispatch()            FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.outscraper_cron_dispatch()     FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seo_cron_dispatch()            FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_process_campaign_job() FROM anon, authenticated;
