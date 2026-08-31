-- ROLLBACK for 20260831200000_s308e_gate_d1_b5.sql
--
-- Deliberately NOT timestamp-prefixed (see s308_operator_membership_split_rollback.sql
-- for why). Apply by hand only.
--
-- WARNING: this restores the ungated tenant_redirects member policy (any member,
-- any role, full DML on their tenant's redirects) and re-allows an operator to
-- move a support ticket between tenants.

DROP POLICY IF EXISTS tenant_redirects_member_select ON public.tenant_redirects;
DROP POLICY IF EXISTS tenant_redirects_member_write  ON public.tenant_redirects;

CREATE POLICY tenant_redirects_member_all ON public.tenant_redirects
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));

DROP TRIGGER IF EXISTS trg_support_tickets_lock_tenant ON public.support_tickets;
DROP FUNCTION IF EXISTS public.support_tickets_lock_tenant();

NOTIFY pgrst, 'reload schema';
