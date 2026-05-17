-- S224: pagespeed_runs cache table for PageSpeed Insights audit results.
-- Applied via Supabase MCP apply_migration (name: s224_pagespeed_runs) on 2026-05-17.
-- supabase/migrations/ is protected by protect-files.sh, so the applied DDL is
-- recorded here for PR review / traceability. Supabase migration history is the
-- canonical record (see list_migrations: s224_pagespeed_runs).
CREATE TABLE pagespeed_runs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url         text NOT NULL,
  status      text NOT NULL CHECK (status IN ('success','error')),
  desktop_performance    smallint,
  desktop_seo            smallint,
  desktop_accessibility  smallint,
  desktop_best_practices smallint,
  mobile_performance     smallint,
  mobile_seo             smallint,
  mobile_accessibility   smallint,
  mobile_best_practices  smallint,
  desktop_raw jsonb,
  mobile_raw  jsonb,
  api_error_code text,
  api_error_msg  text,
  ran_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pagespeed_runs_tenant_ran_at
  ON pagespeed_runs (tenant_id, ran_at DESC);

ALTER TABLE pagespeed_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY pagespeed_runs_tenant_read ON pagespeed_runs
  FOR SELECT TO authenticated
  USING (tenant_id = current_tenant_id());

REVOKE ALL ON pagespeed_runs FROM authenticated;
GRANT SELECT ON pagespeed_runs TO authenticated;

NOTIFY pgrst, 'reload schema';
