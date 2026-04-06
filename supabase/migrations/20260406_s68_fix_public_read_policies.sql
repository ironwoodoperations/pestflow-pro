-- =====================================================================
-- Fix: public-facing tables must be readable by ALL users (anon + auth)
--
-- Root cause: the tenant_isolation_* FOR ALL policies restrict SELECT
-- to the authenticated user's own tenant. When an admin session is active
-- in the browser (e.g. Scott viewing a client's live site), the Supabase
-- client sends the auth token, hits the authenticated policies, and can
-- only see their own tenant's rows. The anon policies never fire because
-- the user IS authenticated.
--
-- Fix: add permissive FOR SELECT USING (true) policies for authenticated
-- role. PostgreSQL ORs permissive policies, so these read-all policies
-- combine with the existing tenant_isolation FOR ALL policies:
--   - SELECT: any authenticated user can read any row (new SELECT policy wins via OR)
--   - INSERT/UPDATE/DELETE: still restricted to own tenant (existing ALL policy)
-- =====================================================================

-- tenants
CREATE POLICY "auth_read_all_tenants"
  ON public.tenants FOR SELECT TO authenticated USING (true);

-- page_content
CREATE POLICY "auth_read_all_page_content"
  ON public.page_content FOR SELECT TO authenticated USING (true);

-- settings
CREATE POLICY "auth_read_all_settings"
  ON public.settings FOR SELECT TO authenticated USING (true);

-- seo_meta
CREATE POLICY "auth_read_all_seo_meta"
  ON public.seo_meta FOR SELECT TO authenticated USING (true);

-- blog_posts (also missing anon read)
CREATE POLICY "anon_read_blog_posts"
  ON public.blog_posts FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read_all_blog_posts"
  ON public.blog_posts FOR SELECT TO authenticated USING (true);

-- location_data (also missing anon read)
CREATE POLICY "anon_read_location_data"
  ON public.location_data FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read_all_location_data"
  ON public.location_data FOR SELECT TO authenticated USING (true);

-- testimonials (also missing anon read)
CREATE POLICY "anon_read_testimonials"
  ON public.testimonials FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read_all_testimonials"
  ON public.testimonials FOR SELECT TO authenticated USING (true);
