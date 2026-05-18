-- S227 Phase 4 ROLLBACK — remove the queue-pull cron + functions.
-- Apply via Supabase MCP apply_migration or execute_sql.

SELECT cron.unschedule('seo-analytics-dispatch');

DROP FUNCTION IF EXISTS public.seo_cron_dispatch();
DROP FUNCTION IF EXISTS public.normalize_tier(jsonb);

NOTIFY pgrst, 'reload schema';
