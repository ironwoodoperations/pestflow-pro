-- ROLLBACK for 20260831190000_s308d_b1_harden_definer.sql
--
-- Deliberately NOT timestamp-prefixed (see s308_operator_membership_split_rollback.sql
-- for why). Apply by hand only.
--
-- Restores the S308 definer bodies: search_path pinned to 'public' rather than
-- empty, and a bare auth.uid() rather than the scalar subselect. Both remain
-- SECURITY DEFINER; this only relaxes the hardening the validator gate asked for.

CREATE OR REPLACE FUNCTION public.is_operator()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.operators o WHERE o.user_id = auth.uid());
$fn$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.user_id = auth.uid() AND tu.tenant_id = p_tenant_id
  );
$fn$;

NOTIFY pgrst, 'reload schema';
