-- S231 Phase 3: ga4_runs table for Google Analytics 4 OAuth ingest pipeline
-- Applied via Supabase MCP (apply_migration), 2026-05-19
-- Pattern mirrors s230-gsc-runs.sql exactly.

CREATE TABLE IF NOT EXISTS ga4_runs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status         text        NOT NULL CHECK (status IN ('success', 'error', 'unconfigured')),
  data           jsonb,
  data_raw       jsonb,
  api_error_code text,
  api_error_msg  text,
  ran_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ga4_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON ga4_runs
  FOR ALL TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS ga4_runs_tenant_ran_at ON ga4_runs (tenant_id, ran_at DESC);
