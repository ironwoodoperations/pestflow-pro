-- S227: seo_runs — DataForSEO SEO analytics snapshots.
-- Applied via Supabase MCP apply_migration (name: s227_seo_runs) on 2026-05-18.
-- supabase/migrations/ is protected by protect-files.sh, so the applied DDL is
-- recorded here for PR review / traceability (S224 pagespeed_runs precedent).
-- Supabase migration history is the canonical record (see list_migrations).
--
-- Mirrors the real zernio_runs schema (8 cols: id, tenant_id, status, data,
-- data_raw, api_error_code, api_error_msg, ran_at) + a `kind` discriminator.
-- Validator gate Q1 (Perplexity+Gemini): single table, kind CHECK, derived
-- MAX(ran_at) freshness (NO last_seo_run_at column, NO cache table).
--
-- ============================================================================
-- JSONB `data` PAYLOAD CONTRACT per kind (edge fn owns/validates the shape;
-- intentionally NOT enforced by a DB JSON Schema constraint — Q1 decision):
--
--   kind='rankings'      data = {
--     target: text,                 -- domain queried
--     items: [ { keyword, position, search_volume, url } ]   -- top ~20
--   }
--   kind='competitors'   data = {
--     target: text,
--     items: [ { domain, avg_position, intersections, visibility } ]  -- 1..3
--   }
--   kind='opportunities' data = {
--     target: text, competitor: text,
--     items: [ { keyword, competitor_position, target_position, search_volume } ]
--   }                                                          -- top ~10
--
-- status='error' rows: data MAY be null; api_error_code/api_error_msg populated
-- from the DataForSEO response (status_code != 20000 or transport failure).
-- ============================================================================

CREATE TABLE seo_runs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind           text NOT NULL CHECK (kind IN ('rankings','competitors','opportunities')),
  status         text NOT NULL CHECK (status IN ('success','error')),
  data           jsonb,
  data_raw       jsonb,
  api_error_code text,
  api_error_msg  text,
  ran_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seo_runs_status_error_consistency CHECK (
    (status = 'success' AND api_error_code IS NULL AND api_error_msg IS NULL)
    OR (status = 'error' AND api_error_code IS NOT NULL)
  )
);

CREATE INDEX idx_seo_runs_tenant_kind_ran_at
  ON seo_runs (tenant_id, kind, ran_at DESC);

ALTER TABLE seo_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY seo_runs_tenant_read ON seo_runs
  FOR SELECT TO authenticated
  USING (tenant_id = current_tenant_id());

REVOKE ALL ON seo_runs FROM authenticated;
GRANT SELECT ON seo_runs TO authenticated;
REVOKE ALL ON seo_runs FROM anon;

NOTIFY pgrst, 'reload schema';
