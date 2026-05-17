-- Rollback for S224 pagespeed_runs cache table.
DROP POLICY IF EXISTS pagespeed_runs_tenant_read ON pagespeed_runs;
DROP INDEX IF EXISTS idx_pagespeed_runs_tenant_ran_at;
DROP TABLE IF EXISTS pagespeed_runs;
NOTIFY pgrst, 'reload schema';
