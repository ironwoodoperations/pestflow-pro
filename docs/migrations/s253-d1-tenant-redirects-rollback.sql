-- S253 / D1 — Rollback for public.tenant_redirects
--
-- The table was applied in PRODUCTION via Supabase MCP (migration
-- `s253_tenant_redirects`). This file is the DOCUMENTED REVERSAL ONLY — it is a
-- checked-in artifact staged alongside the code, NOT something the build or any
-- automated step executes.
--
-- Effect of running this:
--   * Drops the per-tenant redirect table and every redirect row (CASCADE clears
--     the tenant_id FK references).
--   * The build-time projection (redirects-map.json) regenerates to `{}` on the
--     NEXT deploy, after which middleware performs no redirects. Redirects are
--     never live until a deploy runs, so a deploy must follow this rollback to
--     fully take effect at the Edge.
--
-- To reverse a bad cutover WITHOUT dropping the table, prefer deleting the
-- offending rows (DELETE FROM public.tenant_redirects WHERE ...) and redeploying;
-- only drop the table when retiring the mechanism entirely.

DROP TABLE IF EXISTS public.tenant_redirects CASCADE;

-- Force PostgREST to reload its schema cache so the dropped relation is no
-- longer exposed through the data API.
NOTIFY pgrst, 'reload schema';
