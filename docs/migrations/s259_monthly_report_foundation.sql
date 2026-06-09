-- ============================================================================
-- S259 — Monthly Report foundation (repo-truth backfill)
-- ============================================================================
-- REPO-TRUTH TRAIL ONLY. This DDL is ALREADY APPLIED in production
-- (project biezzykcgzkrwdgqpsar) via MCP apply_migration. It is reproduced here
-- so the repo has a record; CC Web does NOT apply it (supabase/migrations/ is
-- guarded). Reconstructed verbatim from live introspection (pg_get_constraintdef,
-- pg_policies, storage.buckets, information_schema). Idempotent / guarded.
-- ============================================================================

-- ── report_jobs: the work queue (service_role only; NO read policy) ─────────
CREATE TABLE IF NOT EXISTS public.report_jobs (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL,
  period      text        NOT NULL,                 -- 'YYYY-MM'
  status      text        NOT NULL DEFAULT 'pending',
  attempts    integer     NOT NULL DEFAULT 0,
  last_error  text,
  started_at  timestamptz,
  finished_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT report_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT report_jobs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
  CONSTRAINT report_jobs_tenant_period_key UNIQUE (tenant_id, period),
  CONSTRAINT report_jobs_status_chk CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'complete'::text, 'failed'::text])))
);
ALTER TABLE public.report_jobs ENABLE ROW LEVEL SECURITY;
-- (No policy — the worker uses the service role, which bypasses RLS. Tenants
--  never read report_jobs directly.)

-- ── tenant_reports: the generated report index (admin-readable) ─────────────
CREATE TABLE IF NOT EXISTS public.tenant_reports (
  id             uuid        NOT NULL DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL,
  period         text        NOT NULL,              -- 'YYYY-MM'
  storage_path   text,                              -- object key within 'reports' bucket: {tenant_id}/{period}.html
  findings_count integer     NOT NULL DEFAULT 0,
  high_count     integer     NOT NULL DEFAULT 0,
  status         text        NOT NULL DEFAULT 'html_ready',
  generated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_reports_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_reports_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
  CONSTRAINT tenant_reports_tenant_period_key UNIQUE (tenant_id, period),
  CONSTRAINT tenant_reports_status_chk CHECK ((status = ANY (ARRAY['html_ready'::text, 'complete'::text, 'failed'::text])))
);
ALTER TABLE public.tenant_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_reports_admin_read ON public.tenant_reports;
CREATE POLICY tenant_reports_admin_read ON public.tenant_reports
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.tenant_id = tenant_reports.tenant_id AND tu.user_id = auth.uid() AND tu.role = 'admin'
  ));

-- ── tenant_users lookup index (membership checks in policies + worker) ──────
CREATE INDEX IF NOT EXISTS tenant_users_user_id_tenant_id_idx
  ON public.tenant_users (user_id, tenant_id);

-- ── Private Storage bucket 'reports' (public=false) ─────────────────────────
-- Object path contract: reports/{tenant_id}/{period}.html
-- (foldername[1] = tenant_id — the storage RLS below depends on this EXACT shape).
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS reports_admin_read ON storage.objects;
CREATE POLICY reports_admin_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'reports'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(objects.name))[1]
        AND tu.user_id = auth.uid()
        AND tu.role = 'admin'
    )
  );
