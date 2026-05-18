-- S227 ROLLBACK — undo s227_seo_runs.
-- Apply via Supabase MCP apply_migration (name: s227_seo_runs_rollback) or
-- execute_sql. No tenants column was added (freshness is derived MAX(ran_at)
-- per validator gate Q1), so this is a clean single-object drop.

DROP TABLE IF EXISTS seo_runs;

NOTIFY pgrst, 'reload schema';
