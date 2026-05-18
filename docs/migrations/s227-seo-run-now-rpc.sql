-- S227 Phase 3: weekly "Run Now" rate-limit RPCs.
-- Applied via Supabase MCP apply_migration (name: s227_seo_run_now_rpc) on 2026-05-18.
-- supabase/migrations/ is protected by protect-files.sh; DDL recorded here for
-- PR review (S224 precedent). Migration history is canonical (list_migrations).
--
-- Validator gate Q2: Postgres RPC enforces the weekly cadence. Manual user
-- "Run Now" is rejected (edge fn -> 429) when a run for (tenant[, kind]) exists
-- within the last 7 days. p_kind NULL = "any kind" (the tile runs all 3).
-- SECURITY DEFINER (owner) so the boolean check sees rows under RLS; only the
-- caller's own tenant_id is ever passed by the edge fn.

CREATE OR REPLACE FUNCTION public.seo_run_now_allowed(p_tenant_id uuid, p_kind text DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.seo_runs
    WHERE tenant_id = p_tenant_id
      AND (p_kind IS NULL OR kind = p_kind)
      AND ran_at > now() - interval '7 days'
  );
$$;

CREATE OR REPLACE FUNCTION public.seo_run_next_allowed_at(p_tenant_id uuid, p_kind text DEFAULT NULL)
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
  SELECT max(ran_at) + interval '7 days'
  FROM public.seo_runs
  WHERE tenant_id = p_tenant_id
    AND (p_kind IS NULL OR kind = p_kind);
$$;

REVOKE ALL ON FUNCTION public.seo_run_now_allowed(uuid, text) FROM public;
REVOKE ALL ON FUNCTION public.seo_run_next_allowed_at(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.seo_run_now_allowed(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.seo_run_next_allowed_at(uuid, text) TO authenticated, service_role;
-- Supabase default privileges auto-grant EXECUTE to anon on new public
-- functions; revoke for least privilege (mirrors the seo_runs anon-revoke).
REVOKE EXECUTE ON FUNCTION public.seo_run_now_allowed(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.seo_run_next_allowed_at(uuid, text) FROM anon;

NOTIFY pgrst, 'reload schema';
