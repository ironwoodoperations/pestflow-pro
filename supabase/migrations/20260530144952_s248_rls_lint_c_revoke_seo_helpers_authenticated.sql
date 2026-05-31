-- Category C final: revoke authenticated EXECUTE on the two read-only SEO gating
-- helpers. Verified S248 (PR #140 Item C): grep found ZERO frontend RPC callers.
-- The SEO "Run Now" path (Ga4/GscAnalyticsTile -> useSeoRuns.ts -> seo-analytics
-- edge fn) invokes these via supabaseAdmin (service-role), which bypasses GRANTs,
-- so revoking authenticated does not affect the frontend. anon was already revoked
-- in s248_rls_lint_c_revoke_internal_dispatchers (not re-revoked here); service_role
-- retains EXECUTE.

REVOKE EXECUTE ON FUNCTION public.seo_run_now_allowed(uuid, text)     FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.seo_run_next_allowed_at(uuid, text) FROM authenticated;
