-- S263 — Suggested-Fix Tier Layer (Report Fix-Chain): additive fix columns + RPC thread.
--
-- REPO-TRUTH SQL. Apply to the PestFlow Pro Supabase project (biezzykcgzkrwdgqpsar)
-- via MCP off the merged source (s263 spec §8). Placed in docs/migrations/ because
-- supabase/migrations/ is on the CLAUDE.md DO-NOT-TOUCH list (protect-files hook);
-- copy into supabase/migrations/ with human approval if db-reset reproduction is wanted.
--
-- Two additive, nullable columns on report_findings (zero risk to existing reads):
--   fix_field           — closed server-side enum naming the target column the apply
--                         writes to: intro | meta_title | meta_description |
--                         focus_keyword. NULL on non-applyable (site-wide / engagement
--                         / technical / keyword) findings. NEVER interpolated into SQL —
--                         the apply fn maps it through a hardcoded enum→column table
--                         (s263 spec §7 Seam 3).
--   fix_base_updated_at — optimistic-concurrency baseline: the target row's updated_at
--                         as it stood when the suggested fix was generated. The apply's
--                         UPDATE matches WHERE updated_at = this value so a row edited
--                         after the fix was generated is never silently clobbered
--                         (s263 spec §7 Seam 5).

ALTER TABLE public.report_findings ADD COLUMN IF NOT EXISTS fix_field text;
ALTER TABLE public.report_findings ADD COLUMN IF NOT EXISTS fix_base_updated_at timestamptz;

-- DB-level belt for the allow-list: the apply fn already rejects anything else with
-- 400; this is defense-in-depth so no writer can ever persist an off-list fix_field.
ALTER TABLE public.report_findings DROP CONSTRAINT IF EXISTS report_findings_fix_field_chk;
ALTER TABLE public.report_findings ADD CONSTRAINT report_findings_fix_field_chk
  CHECK (fix_field IS NULL OR fix_field IN ('intro','meta_title','meta_description','focus_keyword'));

-- Thread fix_field through the persist RPC so generate-monthly-report can stamp it.
-- fix_base_updated_at is intentionally NOT set here — it is stamped later by the apply
-- fn's mode='generate' path, when the suggested fix is generated. Verbatim-compatible
-- with the live s260 function plus the fix_field column.
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
    (report_id, tenant_id, finding_key, category, severity, page_slug, page_name, problem, metric, fix_field)
  SELECT v_report_id, p_tenant_id,
    e->>'id', e->>'category', e->>'severity',
    NULLIF(e->>'page_slug',''), e->>'page_name', e->>'problem', e->>'metric',
    NULLIF(e->>'fix_field','')
  FROM jsonb_array_elements(p_findings) AS e;
  RETURN v_report_id;
END $$;

REVOKE ALL ON FUNCTION public.insert_report_and_findings(uuid,text,text,int,int,jsonb) FROM public, anon, authenticated;
