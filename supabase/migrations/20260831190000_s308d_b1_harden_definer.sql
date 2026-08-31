-- S308d / B1 — validator gate condition: harden both definer helpers.
--
-- NOTE: run inside a transaction. The Supabase migration runner wraps each
-- file in one; if applying by hand with psql, wrap it yourself.
--
-- Perplexity asked for 'pg_catalog' on the search_path. Gemini asked for
-- SET search_path = '' with every reference fully qualified. Conservative-wins
-- arbitration takes Gemini's: an empty search_path resolves nothing implicitly,
-- so a hostile schema earlier on the path cannot shadow `operators`,
-- `tenant_users`, or any operator/function these bodies use.
--
-- auth.uid() is wrapped in a scalar subselect per Supabase's policy-performance
-- guidance: it is then evaluated once per query rather than once per row, which
-- matters because these helpers sit inside RLS predicates on large tables.
--
-- Verified behaviour-neutral: the full seven-user access matrix was captured
-- before and after and every value matched.
--
-- Rollback: s308d_b1_harden_definer_rollback.sql

CREATE OR REPLACE FUNCTION public.is_operator()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.operators o
                 WHERE o.user_id = (SELECT auth.uid()));
$fn$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.tenant_users tu
                 WHERE tu.user_id = (SELECT auth.uid())
                   AND tu.tenant_id = p_tenant_id);
$fn$;

-- EXECUTE grants are deliberately NOT changed here. See B2 in QA_REPORT_S308.md:
-- revoking EXECUTE from `authenticated` was tested and BREAKS RLS entirely
-- (42501: permission denied for function is_operator), because policy predicates
-- are evaluated as the querying role. The grants were restored and the full
-- matrix re-verified. Moving the helpers to a non-exposed schema is ROADMAP #12.

NOTIFY pgrst, 'reload schema';
