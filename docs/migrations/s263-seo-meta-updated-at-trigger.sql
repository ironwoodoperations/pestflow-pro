-- S263 — attach the shared bump_updated_at trigger to seo_meta.
--
-- REPO-TRUTH SQL. Apply via MCP off merged source (s263 spec §8). Placed in
-- docs/migrations/ because supabase/migrations/ is hook-protected (DO NOT TOUCH).
--
-- WHY: the Fix-Chain apply guards meta writes with optimistic concurrency
-- (UPDATE ... WHERE updated_at = fix_base_updated_at — s263 spec §7 Seam 5). For that
-- predicate to bite, seo_meta.updated_at must advance whenever the row changes. The
-- S257-era trigger rollout (20260419) attached bump_updated_at to settings +
-- page_content but missed seo_meta, so its updated_at only reflected insert time.
-- This closes the gap. user_edited=false stays the load-bearing manual-edit guard on
-- seo_meta; this makes the concurrency guard real too (harmless to the manual editor).
--
-- bump_updated_at() already exists (created in 20260419). Idempotent.

DROP TRIGGER IF EXISTS seo_meta_bump_updated_at ON public.seo_meta;
CREATE TRIGGER seo_meta_bump_updated_at
BEFORE UPDATE ON public.seo_meta
FOR EACH ROW EXECUTE FUNCTION public.bump_updated_at();
