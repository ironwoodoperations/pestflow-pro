-- S260-2a — repo-trail chore for the report_findings table + insert_report_and_findings RPC.
--
-- This DDL was applied to the PestFlow Pro Supabase project (biezzykcgzkrwdgqpsar)
-- via MCP and is ALREADY LIVE; it also exists in schema_migrations. This file only
-- backfills the repo trail so a fresh `db reset` reproduces production state.
-- Verbatim from the applied migration — do not re-run or modify the SQL.
--
-- Purpose: persist each monthly-report finding as a queryable row (not just the
-- tenant_reports summary) so the admin SPA can render per-page "Needs update"
-- badges. The RPC delete-and-reinserts per (tenant_id, period) in one transaction
-- so re-runs are idempotent and never leave a stale partial finding set.
-- NOTE: tenant_reports already has a UNIQUE constraint on (tenant_id, period) —
-- not re-added here.

CREATE TABLE public.report_findings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id     uuid NOT NULL REFERENCES public.tenant_reports(id) ON DELETE CASCADE,
  tenant_id     uuid NOT NULL,
  finding_key   text NOT NULL,
  category      text NOT NULL,
  severity      text NOT NULL,
  page_slug     text,
  page_name     text NOT NULL,
  problem       text NOT NULL,
  metric        text,
  suggested_fix text,
  suggested_fix_at timestamptz,
  is_resolved   boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_findings_badge
  ON public.report_findings (tenant_id, page_slug)
  WHERE is_resolved = false AND page_slug IS NOT NULL;

CREATE INDEX idx_report_findings_report ON public.report_findings (report_id);

ALTER TABLE public.report_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY report_findings_select_tenant_members
  ON public.report_findings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = report_findings.tenant_id
        AND tu.user_id = (select auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.insert_report_and_findings(
  p_tenant_id uuid, p_period text, p_storage_path text,
  p_findings_count int, p_high_count int, p_findings jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_report_id uuid;
BEGIN
  DELETE FROM public.tenant_reports WHERE tenant_id = p_tenant_id AND period = p_period;
  INSERT INTO public.tenant_reports
    (tenant_id, period, storage_path, findings_count, high_count, status, generated_at)
  VALUES
    (p_tenant_id, p_period, p_storage_path, p_findings_count, p_high_count, 'html_ready', now())
  RETURNING id INTO v_report_id;
  INSERT INTO public.report_findings
    (report_id, tenant_id, finding_key, category, severity, page_slug, page_name, problem, metric)
  SELECT v_report_id, p_tenant_id,
    e->>'id', e->>'category', e->>'severity',
    NULLIF(e->>'page_slug',''), e->>'page_name', e->>'problem', e->>'metric'
  FROM jsonb_array_elements(p_findings) AS e;
  RETURN v_report_id;
END $$;

REVOKE ALL ON FUNCTION public.insert_report_and_findings(uuid,text,text,int,int,jsonb) FROM public, anon, authenticated;
