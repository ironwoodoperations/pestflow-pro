-- Set master tenant subdomain to 'demo'
--
-- Master tenant (slug='pestflow-pro') gets subdomain='demo' so that
-- demo.pestflowpro.com resolves to it via the generalized
-- resolveTenantBySlug query (slug OR subdomain).
--
-- Idempotent: WHERE clause prevents re-application if already set.
--
-- IMPORTANT: This migration is NOT auto-applied by this PR. Scott runs
-- it manually via Supabase MCP after the PR's merge and Vercel deploy
-- goes READY. Sequencing rationale: the resolver change in this PR
-- handles both old and new state gracefully (queries slug OR subdomain),
-- so deploying code before the UPDATE runs causes no regression.

UPDATE public.tenants
SET subdomain = 'demo',
    updated_at = NOW()
WHERE id = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'
  AND (subdomain IS NULL OR subdomain != 'demo');

-- Verify post-application:
-- SELECT id, slug, subdomain FROM tenants WHERE id = '9215b06b-3eb5-49a1-a16e-7ff214bf6783';
-- Expected: slug='pestflow-pro', subdomain='demo'
