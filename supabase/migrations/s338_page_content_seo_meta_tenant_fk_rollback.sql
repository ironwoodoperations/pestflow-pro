-- S338 ROLLBACK — drop the two tenant FKs.
--
-- Dropping a foreign key never destroys rows, so this is safe to run. What it
-- destroys is the GUARANTEE: with the constraint gone, deleting a tenant again
-- leaves its page_content and seo_meta behind as orphans nothing owns. That is
-- the state these constraints were added to end.
--
-- Any orphans created while the constraint is absent will block re-adding it
-- later, exactly as 17 CityShield rows did in S338.

ALTER TABLE public.page_content DROP CONSTRAINT IF EXISTS page_content_tenant_id_fkey;
ALTER TABLE public.seo_meta     DROP CONSTRAINT IF EXISTS seo_meta_tenant_id_fkey;

NOTIFY pgrst, 'reload schema';
