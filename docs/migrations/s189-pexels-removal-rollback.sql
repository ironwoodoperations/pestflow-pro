-- Rollback for S189 Phase 1a Pexels API integration removal.
-- Restores the empty-string pexels_api_key field to integrations JSONB rows
-- where it was dropped. Run from claude.ai via Supabase MCP if Phase 1a
-- needs to be reverted.
--
-- Pre-rollback state (verified S189): 2 of 3 tenants had pexels_api_key
-- with empty-string values. Master tenant (9215b06b) did not have it.

UPDATE settings
SET value = value || '{"pexels_api_key": ""}'::jsonb
WHERE key = 'integrations'
  AND NOT (value ? 'pexels_api_key');

NOTIFY pgrst, 'reload schema';
