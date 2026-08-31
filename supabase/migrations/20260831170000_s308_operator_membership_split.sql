-- S308 — Split the accidental operator grant into a real operator check
--        and a real membership check.
--
-- NOTE: run inside a transaction. The Supabase migration runner wraps each
-- file in one; if applying by hand with psql, wrap it yourself.
--
-- PROBLEM
-- 13 policies named ironwood_admin_* were all cmd=ALL, roles={authenticated},
-- with the expression:
--     current_tenant_id() = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'::uuid
-- Two independent faults:
--   1. WRONG IDENTITY SOURCE. current_tenant_id() reads `profiles`, the
--      pre-S273 membership table. get_my_tenant_role() was migrated to
--      tenant_users; current_tenant_id() was not. admin@demo.com shares
--      profiles.tenant_id with admin@pestflowpro.com, so the database
--      classified the shared demo account as Ironwood staff.
--   2. THE GRANT IS UNSCOPED. The expression never references tenant_id, so
--      it is a blanket grant over the whole table, not "your tenant's rows".
--
-- APPROACH
-- Replace each blanket grant with an explicit operator allowlist, and ADD
-- membership policies sourced from tenant_users (the S273 SSOT) so that
-- legitimate multi-tenant access — the five demo dashboards — keeps working.
-- All new policies are PERMISSIVE and the existing current_tenant_id()
-- policies are left untouched, so single-tenant users keep working through
-- the old path. Verified precondition: there are zero RESTRICTIVE policies in
-- the public schema, so permissive policies OR together.
--
-- current_tenant_id() is deliberately NOT modified: it is read by ~70 policies
-- across ~25 tables, returns a scalar uuid, and cannot express membership in
-- five tenants. Repointing it is a separate design session.
--
-- Rollback: s308_operator_membership_split_rollback.sql


-- ---------------------------------------------------------------------------
-- 1. Operator allowlist + membership predicate
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.operators (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
-- Deliberately NO policies. With RLS on and no policy, the table is
-- unreachable from PostgREST under anon/authenticated. It is read only
-- through public.is_operator() below, which is SECURITY DEFINER.

-- SECURITY DEFINER is required, not stylistic: an inline subquery against an
-- RLS-enabled table inside an RLS policy risks recursion. tenant_users' own
-- policy is `auth.uid() = user_id` (self-contained) so there is no recursion
-- today, but the definer form makes that guarantee permanent and gives one
-- place to change the rule. search_path is pinned for the same reason
-- check_tenant_access pins it.

CREATE OR REPLACE FUNCTION public.is_operator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.operators o WHERE o.user_id = auth.uid());
$fn$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.user_id = auth.uid() AND tu.tenant_id = p_tenant_id
  );
$fn$;

REVOKE ALL ON FUNCTION public.is_operator()            FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_tenant_member(uuid)   FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_operator()          TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid) TO authenticated, service_role;

-- Seed: EXACTLY ONE operator — scott@homeflowpro.ai.
-- Chosen because it is never published (unlike admin@pestflowpro.com on the
-- marketing homepage and admin@demo.com on /demos/admin) and has no profiles
-- row, so it is untouched by every current_tenant_id() policy.
INSERT INTO public.operators (user_id, note)
VALUES ('32b8fbf4-6378-49b2-b5b5-580d7a0c9a21',
        'scott@homeflowpro.ai — sole Ironwood operator (S308)')
ON CONFLICT (user_id) DO UPDATE SET note = EXCLUDED.note;


-- ---------------------------------------------------------------------------
-- 2. Replace the 13 blanket grants with an explicit operator predicate
-- ---------------------------------------------------------------------------
-- Note the naming exception: tenant_redirects' policy is
-- `ironwood_admin_redirects_write`, not `ironwood_admin_tenant_redirects_write`.

DROP POLICY IF EXISTS ironwood_admin_blog_posts_write            ON public.blog_posts;
DROP POLICY IF EXISTS ironwood_admin_ironwood_integrations_write ON public.ironwood_integrations;
DROP POLICY IF EXISTS ironwood_admin_page_content_write          ON public.page_content;
DROP POLICY IF EXISTS ironwood_admin_prospects_write             ON public.prospects;
DROP POLICY IF EXISTS ironwood_admin_salespeople_write           ON public.salespeople;
DROP POLICY IF EXISTS ironwood_admin_seo_meta_write              ON public.seo_meta;
DROP POLICY IF EXISTS ironwood_admin_service_areas_write         ON public.service_areas;
DROP POLICY IF EXISTS ironwood_admin_settings_write              ON public.settings;
DROP POLICY IF EXISTS ironwood_admin_team_members_write          ON public.team_members;
DROP POLICY IF EXISTS ironwood_admin_redirects_write             ON public.tenant_redirects;
DROP POLICY IF EXISTS ironwood_admin_tenants_write               ON public.tenants;
DROP POLICY IF EXISTS ironwood_admin_testimonials_write          ON public.testimonials;
DROP POLICY IF EXISTS ironwood_admin_youpest_layout_write        ON public.youpest_layout;

CREATE POLICY blog_posts_operator_all            ON public.blog_posts
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_operator()) WITH CHECK (public.is_operator());
CREATE POLICY ironwood_integrations_operator_all ON public.ironwood_integrations
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_operator()) WITH CHECK (public.is_operator());
CREATE POLICY page_content_operator_all          ON public.page_content
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_operator()) WITH CHECK (public.is_operator());
CREATE POLICY prospects_operator_all             ON public.prospects
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_operator()) WITH CHECK (public.is_operator());
CREATE POLICY salespeople_operator_all           ON public.salespeople
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_operator()) WITH CHECK (public.is_operator());
CREATE POLICY seo_meta_operator_all              ON public.seo_meta
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_operator()) WITH CHECK (public.is_operator());
CREATE POLICY service_areas_operator_all         ON public.service_areas
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_operator()) WITH CHECK (public.is_operator());
CREATE POLICY settings_operator_all              ON public.settings
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_operator()) WITH CHECK (public.is_operator());
CREATE POLICY team_members_operator_all          ON public.team_members
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_operator()) WITH CHECK (public.is_operator());
CREATE POLICY tenant_redirects_operator_all      ON public.tenant_redirects
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_operator()) WITH CHECK (public.is_operator());
CREATE POLICY tenants_operator_all               ON public.tenants
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_operator()) WITH CHECK (public.is_operator());
CREATE POLICY testimonials_operator_all          ON public.testimonials
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_operator()) WITH CHECK (public.is_operator());
CREATE POLICY youpest_layout_operator_all        ON public.youpest_layout
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_operator()) WITH CHECK (public.is_operator());

-- ---------------------------------------------------------------------------
-- 3. Membership policies (tenant-scoped tables only)
-- ---------------------------------------------------------------------------
-- Six tables gate writes today behind
--     get_my_tenant_role(tenant_id) = ANY (ARRAY['admin','manager'])
-- Verified per table: all 18 role gates across these six use exactly that
-- array — none differ. The member policies mirror that gate exactly, so the
-- new SSOT-sourced path grants precisely what the old path grants and does
-- NOT hand write access to a `user`-role member who is denied it today.
-- get_my_tenant_role() already reads tenant_users, so the write path is fully
-- SSOT-sourced.

CREATE POLICY blog_posts_member_select ON public.blog_posts
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY blog_posts_member_write ON public.blog_posts
  AS PERMISSIVE FOR ALL TO authenticated
  USING       (public.is_tenant_member(tenant_id)
               AND get_my_tenant_role(tenant_id) = ANY (ARRAY['admin'::text, 'manager'::text]))
  WITH CHECK  (public.is_tenant_member(tenant_id)
               AND get_my_tenant_role(tenant_id) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY page_content_member_select ON public.page_content
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY page_content_member_write ON public.page_content
  AS PERMISSIVE FOR ALL TO authenticated
  USING       (public.is_tenant_member(tenant_id)
               AND get_my_tenant_role(tenant_id) = ANY (ARRAY['admin'::text, 'manager'::text]))
  WITH CHECK  (public.is_tenant_member(tenant_id)
               AND get_my_tenant_role(tenant_id) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY seo_meta_member_select ON public.seo_meta
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY seo_meta_member_write ON public.seo_meta
  AS PERMISSIVE FOR ALL TO authenticated
  USING       (public.is_tenant_member(tenant_id)
               AND get_my_tenant_role(tenant_id) = ANY (ARRAY['admin'::text, 'manager'::text]))
  WITH CHECK  (public.is_tenant_member(tenant_id)
               AND get_my_tenant_role(tenant_id) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY service_areas_member_select ON public.service_areas
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY service_areas_member_write ON public.service_areas
  AS PERMISSIVE FOR ALL TO authenticated
  USING       (public.is_tenant_member(tenant_id)
               AND get_my_tenant_role(tenant_id) = ANY (ARRAY['admin'::text, 'manager'::text]))
  WITH CHECK  (public.is_tenant_member(tenant_id)
               AND get_my_tenant_role(tenant_id) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY team_members_member_select ON public.team_members
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY team_members_member_write ON public.team_members
  AS PERMISSIVE FOR ALL TO authenticated
  USING       (public.is_tenant_member(tenant_id)
               AND get_my_tenant_role(tenant_id) = ANY (ARRAY['admin'::text, 'manager'::text]))
  WITH CHECK  (public.is_tenant_member(tenant_id)
               AND get_my_tenant_role(tenant_id) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY testimonials_member_select ON public.testimonials
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY testimonials_member_write ON public.testimonials
  AS PERMISSIVE FOR ALL TO authenticated
  USING       (public.is_tenant_member(tenant_id)
               AND get_my_tenant_role(tenant_id) = ANY (ARRAY['admin'::text, 'manager'::text]))
  WITH CHECK  (public.is_tenant_member(tenant_id)
               AND get_my_tenant_role(tenant_id) = ANY (ARRAY['admin'::text, 'manager'::text]));

-- settings and tenant_redirects have NO role gate today: their existing
-- authenticated policies are plain `tenant_id = current_tenant_id()` for ALL.
-- Plain membership therefore mirrors the existing shape.
CREATE POLICY settings_member_all ON public.settings
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY tenant_redirects_member_all ON public.tenant_redirects
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));

-- DEVIATION 1 — `tenants` gets member SELECT only, not member ALL.
-- The brief specified plain is_tenant_member ALL. That would be a privilege
-- escalation: authenticated users have only SELECT on tenants today
-- (tenant_isolation_tenants_auth), with no write path except the blanket grant
-- being removed here. tenants carries `entitlement smallint` — the billing
-- gate S305 made authoritative — plus `slug`, `is_protected` and the deletion
-- confirmation flags. Member ALL would let any tenant admin raise their own
-- entitlement, rename their slug, or delete their tenant row. SELECT-only
-- preserves today's behaviour exactly. Widening this later is one CREATE POLICY.
CREATE POLICY tenants_member_select ON public.tenants
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_tenant_member(id));

-- DEVIATION 2 — `youpest_layout` gets NO member policy.
-- It was omitted from the brief's role-gate classification. It is tenant-scoped
-- but has no member write path today: its only authenticated-reachable policy
-- is `tenant_read_own_layout` (SELECT), which already reads tenant_users and is
-- left in place. Adding member ALL would grant INSERT/UPDATE/DELETE that are
-- denied today — the same regression class as DEVIATION 1. Operator-only write
-- preserves today's behaviour. The table has zero reads anywhere in src/.

-- ---------------------------------------------------------------------------
-- 4. Support tickets — same root cause
-- ---------------------------------------------------------------------------
-- Was: tenant_id IN (SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid())
-- on both SELECT and INSERT, scoped to {public}. Consequences fixed here:
--   * tenant tickets silently failed to insert for multi-tenant users, because
--     profiles.tenant_id did not match the tenant being filed against;
--   * three users have no profiles row at all and could not file;
--   * the operator console had no read path and showed 1 of 5 tickets;
--   * there was NO UPDATE policy, so SupportPanel status changes were filtered
--     to zero rows and returned success — a silent no-op that reverted on
--     reload (a blocked UPDATE does not raise, unlike a blocked INSERT).

DROP POLICY IF EXISTS tenant_read_own_tickets   ON public.support_tickets;
DROP POLICY IF EXISTS tenant_insert_own_tickets ON public.support_tickets;

CREATE POLICY tenant_read_own_tickets ON public.support_tickets
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) OR public.is_operator());

-- Operators answer tickets, they do not file them: no operator branch here.
CREATE POLICY tenant_insert_own_tickets ON public.support_tickets
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY tenant_update_tickets ON public.support_tickets
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.is_operator()) WITH CHECK (public.is_operator());

-- support_replies: retire the Host-header split_part() derivation, which was a
-- fourth membership mechanism on the same feature. service_role_all_replies is
-- left exactly as it is.
DROP POLICY IF EXISTS tenant_read_own_replies ON public.support_replies;

CREATE POLICY tenant_read_own_replies ON public.support_replies
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = support_replies.ticket_id
      AND (public.is_tenant_member(st.tenant_id) OR public.is_operator())
  ));


NOTIFY pgrst, 'reload schema';
