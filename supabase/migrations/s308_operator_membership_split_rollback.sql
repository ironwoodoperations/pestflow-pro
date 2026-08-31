-- ROLLBACK for 20260831170000_s308_operator_membership_split.sql
--
-- Deliberately NOT timestamp-prefixed. The Supabase CLI reads the leading
-- 14 digits as a migration version, so a timestamped rollback would (a) collide
-- with the migration's own version and (b) be replayed straight after it on a
-- fresh `db push`, undoing the change. Same convention as
-- s281_business_info_vertical_check_rollback.sql. Apply by hand only.
--
-- NOTE: run inside a transaction. The Supabase migration runner wraps each
-- file in one; if applying by hand with psql, wrap it yourself.
--
-- Restores the pre-S308 state exactly: the 13 ironwood_admin_* blanket grants
-- are recreated verbatim from their captured pg_policies definitions, the
-- support_tickets/support_replies policies are returned to their profiles- and
-- Host-header-derived forms, and the new helpers are dropped.
--
-- WARNING: applying this reinstates the privilege escalation S308 closed —
-- any authenticated user whose profiles.tenant_id equals the pestflow-pro
-- tenant UUID (which includes admin@demo.com, whose credentials are published
-- on /demos/admin) regains SELECT+INSERT+UPDATE+DELETE on every row of all 13
-- tables across all tenants. Use only to unblock a production incident.


-- 1. Drop the S308 policies -------------------------------------------------

DROP POLICY IF EXISTS blog_posts_operator_all            ON public.blog_posts;
DROP POLICY IF EXISTS ironwood_integrations_operator_all ON public.ironwood_integrations;
DROP POLICY IF EXISTS page_content_operator_all          ON public.page_content;
DROP POLICY IF EXISTS prospects_operator_all             ON public.prospects;
DROP POLICY IF EXISTS salespeople_operator_all           ON public.salespeople;
DROP POLICY IF EXISTS seo_meta_operator_all              ON public.seo_meta;
DROP POLICY IF EXISTS service_areas_operator_all         ON public.service_areas;
DROP POLICY IF EXISTS settings_operator_all              ON public.settings;
DROP POLICY IF EXISTS team_members_operator_all          ON public.team_members;
DROP POLICY IF EXISTS tenant_redirects_operator_all      ON public.tenant_redirects;
DROP POLICY IF EXISTS tenants_operator_all               ON public.tenants;
DROP POLICY IF EXISTS testimonials_operator_all          ON public.testimonials;
DROP POLICY IF EXISTS youpest_layout_operator_all        ON public.youpest_layout;

DROP POLICY IF EXISTS blog_posts_member_select     ON public.blog_posts;
DROP POLICY IF EXISTS blog_posts_member_write      ON public.blog_posts;
DROP POLICY IF EXISTS page_content_member_select   ON public.page_content;
DROP POLICY IF EXISTS page_content_member_write    ON public.page_content;
DROP POLICY IF EXISTS seo_meta_member_select       ON public.seo_meta;
DROP POLICY IF EXISTS seo_meta_member_write        ON public.seo_meta;
DROP POLICY IF EXISTS service_areas_member_select  ON public.service_areas;
DROP POLICY IF EXISTS service_areas_member_write   ON public.service_areas;
DROP POLICY IF EXISTS team_members_member_select   ON public.team_members;
DROP POLICY IF EXISTS team_members_member_write    ON public.team_members;
DROP POLICY IF EXISTS testimonials_member_select   ON public.testimonials;
DROP POLICY IF EXISTS testimonials_member_write    ON public.testimonials;
DROP POLICY IF EXISTS settings_member_all          ON public.settings;
DROP POLICY IF EXISTS tenant_redirects_member_all  ON public.tenant_redirects;
DROP POLICY IF EXISTS tenants_member_select        ON public.tenants;

-- 2. Restore the 13 ironwood_admin_* grants verbatim ------------------------
-- Captured from pg_policies before the change: every one was
-- PERMISSIVE / ALL / {authenticated} / USING = WITH CHECK =
--   (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid)

CREATE POLICY ironwood_admin_blog_posts_write ON public.blog_posts
  AS PERMISSIVE FOR ALL TO authenticated
  USING (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid)
  WITH CHECK (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid);
CREATE POLICY ironwood_admin_ironwood_integrations_write ON public.ironwood_integrations
  AS PERMISSIVE FOR ALL TO authenticated
  USING (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid)
  WITH CHECK (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid);
CREATE POLICY ironwood_admin_page_content_write ON public.page_content
  AS PERMISSIVE FOR ALL TO authenticated
  USING (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid)
  WITH CHECK (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid);
CREATE POLICY ironwood_admin_prospects_write ON public.prospects
  AS PERMISSIVE FOR ALL TO authenticated
  USING (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid)
  WITH CHECK (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid);
CREATE POLICY ironwood_admin_salespeople_write ON public.salespeople
  AS PERMISSIVE FOR ALL TO authenticated
  USING (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid)
  WITH CHECK (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid);
CREATE POLICY ironwood_admin_seo_meta_write ON public.seo_meta
  AS PERMISSIVE FOR ALL TO authenticated
  USING (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid)
  WITH CHECK (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid);
CREATE POLICY ironwood_admin_service_areas_write ON public.service_areas
  AS PERMISSIVE FOR ALL TO authenticated
  USING (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid)
  WITH CHECK (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid);
CREATE POLICY ironwood_admin_settings_write ON public.settings
  AS PERMISSIVE FOR ALL TO authenticated
  USING (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid)
  WITH CHECK (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid);
CREATE POLICY ironwood_admin_team_members_write ON public.team_members
  AS PERMISSIVE FOR ALL TO authenticated
  USING (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid)
  WITH CHECK (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid);
CREATE POLICY ironwood_admin_redirects_write ON public.tenant_redirects
  AS PERMISSIVE FOR ALL TO authenticated
  USING (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid)
  WITH CHECK (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid);
CREATE POLICY ironwood_admin_tenants_write ON public.tenants
  AS PERMISSIVE FOR ALL TO authenticated
  USING (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid)
  WITH CHECK (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid);
CREATE POLICY ironwood_admin_testimonials_write ON public.testimonials
  AS PERMISSIVE FOR ALL TO authenticated
  USING (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid)
  WITH CHECK (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid);
CREATE POLICY ironwood_admin_youpest_layout_write ON public.youpest_layout
  AS PERMISSIVE FOR ALL TO authenticated
  USING (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid)
  WITH CHECK (current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid);

-- 3. Restore support_tickets / support_replies to their pre-S308 form -------

DROP POLICY IF EXISTS tenant_read_own_tickets   ON public.support_tickets;
DROP POLICY IF EXISTS tenant_insert_own_tickets ON public.support_tickets;
DROP POLICY IF EXISTS tenant_update_tickets     ON public.support_tickets;

CREATE POLICY tenant_read_own_tickets ON public.support_tickets
  AS PERMISSIVE FOR SELECT TO public
  USING (tenant_id IN (SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid()));
CREATE POLICY tenant_insert_own_tickets ON public.support_tickets
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (tenant_id IN (SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid()));
-- There was deliberately no UPDATE policy before S308.

DROP POLICY IF EXISTS tenant_read_own_replies ON public.support_replies;
CREATE POLICY tenant_read_own_replies ON public.support_replies
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (ticket_id IN (
    SELECT support_tickets.id FROM support_tickets
    WHERE support_tickets.tenant_id = (
      SELECT t.id FROM tenants t
      WHERE t.slug = split_part(((current_setting('request.headers'::text))::json ->> 'host'::text), '.'::text, 1)
      LIMIT 1)));

-- 4. Drop the helpers -------------------------------------------------------

DROP FUNCTION IF EXISTS public.is_tenant_member(uuid);
DROP FUNCTION IF EXISTS public.is_operator();
DROP TABLE IF EXISTS public.operators;


NOTIFY pgrst, 'reload schema';
