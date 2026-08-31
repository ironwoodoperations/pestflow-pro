-- ROLLBACK for 20260831180000_s308b_settings_role_gate.sql
--
-- Deliberately NOT timestamp-prefixed — the Supabase CLI reads the leading 14
-- digits as a migration version, so a timestamped rollback would collide with
-- the migration's version and be replayed straight after it. Same convention as
-- s308_operator_membership_split_rollback.sql. Apply by hand only.
--
-- Reverts settings to the plain membership policy S308 created. This restores
-- write access on a tenant's settings — including the `integrations` tokens —
-- to every tenant_users member regardless of role. Only do this deliberately.

DROP POLICY IF EXISTS settings_member_select ON public.settings;
DROP POLICY IF EXISTS settings_member_write  ON public.settings;

CREATE POLICY settings_member_all ON public.settings
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));

NOTIFY pgrst, 'reload schema';
