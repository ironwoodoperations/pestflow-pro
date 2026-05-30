-- S248 — RLS lint A+B: service-role-only table lockdown + audit-guard search_path pin.
--
-- Applied to production via Supabase MCP apply_migration on 2026-05-30 13:59:52 UTC
-- (schema_migrations.version = 20260530135952,
--  name = s248_rls_lint_a_b_lockdown_and_searchpath).
-- This file is the REPO AUDIT-TRAIL SYNC of that change (precedent: PR #133, PR #136).
-- No re-apply happens from this file — filename version matches the recorded version,
-- so the Supabase CLI skips it on `db reset` / `migration up`.
--
-- Why (Category A — 4 service-role-only tables):
--   ai_proxy_log, delegation_jti, tenant_offboard_audit, tenant_offboard_queue had
--   wide-open client grants from CREATE TABLE defaults. Verified S248: every accessor
--   is SECURITY DEFINER or service-role; no frontend reads these directly. Revoking
--   anon/authenticated grants + adding an explicit deny-by-default policy makes the
--   intent visible to the linter (it sees a deliberate policy, not empty RLS).
--   service_role bypasses RLS entirely, so the audit/log writers still work.
--
-- Why (Category B — pin mutable search_path on audit guard trigger fn):
--   tenant_offboard_audit_guard()'s body uses only pg_catalog built-ins
--   (current_setting, raise), so setting search_path = '' is safe and removes the
--   mutable-search_path linter finding.
--
-- ── Idempotency: drop the new policies first so this file is safe to re-run ──
DROP POLICY IF EXISTS "no_client_access" ON public.ai_proxy_log;
DROP POLICY IF EXISTS "no_client_access" ON public.delegation_jti;
DROP POLICY IF EXISTS "no_client_access" ON public.tenant_offboard_audit;
DROP POLICY IF EXISTS "no_client_access" ON public.tenant_offboard_queue;

-- ── Category A: revoke wide-open client grants on 4 service-role-only tables ──
REVOKE ALL ON public.ai_proxy_log          FROM anon, authenticated;
REVOKE ALL ON public.delegation_jti        FROM anon, authenticated;
REVOKE ALL ON public.tenant_offboard_audit FROM anon, authenticated;
REVOKE ALL ON public.tenant_offboard_queue FROM anon, authenticated;

-- ── Category A: explicit deny-by-default so the linter sees intentional policy ──
-- USING (false) => no client role can read; service role bypasses RLS entirely.
CREATE POLICY "no_client_access" ON public.ai_proxy_log
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "no_client_access" ON public.delegation_jti
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "no_client_access" ON public.tenant_offboard_audit
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "no_client_access" ON public.tenant_offboard_queue
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- ── Category B: pin mutable search_path on the audit guard trigger fn ──
-- Body uses only pg_catalog built-ins (current_setting, raise) -> empty path is safe.
ALTER FUNCTION public.tenant_offboard_audit_guard() SET search_path = '';
