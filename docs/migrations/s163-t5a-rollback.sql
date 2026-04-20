-- S163 T5a rollback — execute manually in Supabase SQL editor if Part B
-- needs to be reversed. Not auto-applied. Assumes Part B DDL already ran.

-- 1. Restore columns
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS image_urls jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS image_4_url text;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS image_5_url text;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS image_6_url text;

-- 2. Replay JSONB data from snapshot
UPDATE public.page_content pc
   SET image_urls = b.image_urls
  FROM public.page_content_image_urls_backup_t5 b
 WHERE b.id = pc.id;

-- 3. Restore policy (cross-tenant leak — only restore if you really mean it)
-- CREATE POLICY auth_read_all_page_content ON public.page_content
--   FOR SELECT TO authenticated USING (true);

-- 4. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
