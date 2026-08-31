-- S308b — role-gate the settings membership write path.
--
-- NOTE: run inside a transaction. The Supabase migration runner wraps each
-- file in one; if applying by hand with psql, wrap it yourself.
--
-- Follow-up to 20260831170000_s308_operator_membership_split.sql, which gave
-- `settings` a plain `settings_member_all` because the table has no role gate
-- of its own (tenant_isolation_settings_auth is `ALL` for any member).
--
-- WHY THIS IS STRICTER THAN THE LEGACY PATH, DELIBERATELY
-- `settings` holds the `integrations` key — per-client Facebook and Google
-- Business tokens — alongside business_info, branding and subscription. The
-- new membership path must not grant a `user`-role member write access to a
-- paying client's credentials. Mirroring the table's existing (ungated) shape
-- would have done exactly that: verified live, scottdevore2@gmail.com has
-- role `user` on `dang` and had NO settings access before S308, so a plain
-- member ALL would have granted something previously denied.
--
-- tenant_isolation_settings_auth is left UNTOUCHED. That makes the new
-- SSOT-sourced path deliberately stricter than the legacy current_tenant_id()
-- path, rather than relaxing the legacy one. Nothing that works today loses
-- access: `user` is the only role below admin/manager in tenant_users, and
-- exactly one such row exists (scottdevore2@gmail.com @ dang, verified).
--
-- The gate array is copied verbatim from the six already-role-gated tables,
-- all of which use ARRAY['admin','manager'] — verified per table, none differ.
-- get_my_tenant_role() reads tenant_users, so the write path stays fully
-- SSOT-sourced.
--
-- Rollback: s308b_settings_role_gate_rollback.sql

DROP POLICY IF EXISTS settings_member_all ON public.settings;

CREATE POLICY settings_member_select ON public.settings
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY settings_member_write ON public.settings
  AS PERMISSIVE FOR ALL TO authenticated
  USING       (public.is_tenant_member(tenant_id)
               AND get_my_tenant_role(tenant_id) = ANY (ARRAY['admin'::text, 'manager'::text]))
  WITH CHECK  (public.is_tenant_member(tenant_id)
               AND get_my_tenant_role(tenant_id) = ANY (ARRAY['admin'::text, 'manager'::text]));

NOTIFY pgrst, 'reload schema';
