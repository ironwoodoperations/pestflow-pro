-- S248 — RLS lint C (part 2): close PUBLIC-grant gap left by the name-based revoke.
--
-- Applied to production via Supabase MCP apply_migration on 2026-05-30 14:15:24 UTC
-- (schema_migrations.version = 20260530141524,
--  name = s248_rls_lint_c_revoke_public_on_two_dispatchers).
-- This file is the REPO AUDIT-TRAIL SYNC of that change (precedent: PR #133, PR #136).
-- No re-apply happens from this file — filename version matches the recorded version,
-- so the Supabase CLI skips it on `db reset` / `migration up`.
--
-- Why:
--   20260530141451_s248_rls_lint_c_revoke_internal_dispatchers revoked EXECUTE FROM
--   anon, authenticated by name on five internal SECURITY DEFINER functions. For
--   outscraper_cron_dispatch() and trigger_process_campaign_job(), EXECUTE was
--   granted via PUBLIC (ACL leading '=X/postgres'), so the name-based revoke was a
--   no-op. This file revokes from PUBLIC directly to close that gap. The other
--   three dispatchers were already locked down by the earlier name-based revoke.
--
-- service_role and postgres retain explicit EXECUTE (cron + service-role callers
-- continue to work). Both functions are verified internal-only (cron dispatch +
-- campaign_jobs trigger).

REVOKE EXECUTE ON FUNCTION public.outscraper_cron_dispatch()     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_process_campaign_job() FROM PUBLIC;
