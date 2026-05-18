-- S227 Phase 3 ROLLBACK — drop the Run Now rate-limit RPCs.
-- Apply via Supabase MCP apply_migration or execute_sql.

DROP FUNCTION IF EXISTS public.seo_run_now_allowed(uuid, text);
DROP FUNCTION IF EXISTS public.seo_run_next_allowed_at(uuid, text);

NOTIFY pgrst, 'reload schema';
