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

-- 1. CHECK constraint: subdomain must be NULL or a host-safe slug
--    pattern. Idempotent via pg_constraint lookup.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tenants_subdomain_format'
      AND conrelid = 'public.tenants'::regclass
  ) THEN
    ALTER TABLE public.tenants
      ADD CONSTRAINT tenants_subdomain_format
      CHECK (subdomain IS NULL OR subdomain ~ '^[a-z0-9-]+$');
  END IF;
END $$;

-- 2. UNIQUE partial index on subdomain. Prevents slug↔subdomain
--    collision across tenants from making resolveTenantBySlug's
--    .maybeSingle() nondeterministic. Native CREATE UNIQUE INDEX
--    IF NOT EXISTS supported in PG ≥ 9.5.
CREATE UNIQUE INDEX IF NOT EXISTS tenants_subdomain_unique
  ON public.tenants (subdomain)
  WHERE subdomain IS NOT NULL;

-- 3. Set master tenant subdomain. 'demo' satisfies the CHECK above.
UPDATE public.tenants
SET subdomain = 'demo',
    updated_at = NOW()
WHERE id = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'
  AND (subdomain IS NULL OR subdomain != 'demo');

-- Verify post-application:
-- SELECT id, slug, subdomain FROM tenants WHERE id = '9215b06b-3eb5-49a1-a16e-7ff214bf6783';
-- Expected: slug='pestflow-pro', subdomain='demo'
--
-- Verify constraint + index:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'public.tenants'::regclass AND conname = 'tenants_subdomain_format';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'tenants' AND indexname = 'tenants_subdomain_unique';
