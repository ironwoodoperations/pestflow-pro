-- S308e — validator gate: D1 (role-gate tenant_redirects) + B5 (lock ticket tenant_id)
--
-- NOTE: run inside a transaction. The Supabase migration runner wraps each
-- file in one; if applying by hand with psql, wrap it yourself.
--
-- Rollback: s308e_gate_d1_b5_rollback.sql

-- ── D1 — role-gate tenant_redirects (Gemini condition 6) ────────────────────
-- tenant_redirects was the one tenant-scoped table where S308's member policy
-- granted an ordinary `user` member full DML. Redirects affect SEO and traffic
-- routing, so it is split like the seven other role-gated tables, with the role
-- array copied verbatim from them.
--
-- LIMITATION, reported not fixed (see B3 in QA_REPORT_S308.md): this does NOT
-- make the role gate airtight. The surviving legacy policy
-- `tenant_isolation_redirects_write` is FOR ALL with USING and WITH CHECK of
-- `tenant_id = current_tenant_id()` and NO role test. Permissive policies OR
-- together, so any user whose profiles.tenant_id matches the row still writes
-- without a role check. Changing that policy alters semantics for existing
-- users and was explicitly left to Scott.

DROP POLICY IF EXISTS tenant_redirects_member_all ON public.tenant_redirects;

CREATE POLICY tenant_redirects_member_select ON public.tenant_redirects
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY tenant_redirects_member_write ON public.tenant_redirects
  AS PERMISSIVE FOR ALL TO authenticated
  USING       (public.is_tenant_member(tenant_id)
               AND get_my_tenant_role(tenant_id) = ANY (ARRAY['admin'::text, 'manager'::text]))
  WITH CHECK  (public.is_tenant_member(tenant_id)
               AND get_my_tenant_role(tenant_id) = ANY (ARRAY['admin'::text, 'manager'::text]));

-- ── B5 — support_tickets.tenant_id is immutable (Gemini condition 4) ────────
-- tenant_update_tickets is USING/WITH CHECK public.is_operator() with no
-- constraint on tenant_id, so an operator could move a ticket between tenants.
-- Operators are global, so this is data integrity rather than tenant isolation
-- — but a reassigned ticket corrupts audit history and misdirects
-- notify-support-ticket, which derives BOTH its auth gate and its reply-to
-- recipient from ticket.tenant_id.
--
-- A trigger is used rather than a column privilege or a WITH CHECK clause
-- because an RLS WITH CHECK cannot reference OLD, so it cannot express "this
-- column may not change" — only "the new value must satisfy P".

CREATE OR REPLACE FUNCTION public.support_tickets_lock_tenant()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $fn$
BEGIN
  IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
    RAISE EXCEPTION
      'support_tickets.tenant_id is immutable (attempted % -> %)', OLD.tenant_id, NEW.tenant_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_support_tickets_lock_tenant ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_lock_tenant
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.support_tickets_lock_tenant();

NOTIFY pgrst, 'reload schema';
