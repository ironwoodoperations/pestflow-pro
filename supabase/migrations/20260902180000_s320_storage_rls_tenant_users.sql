-- S320 — storage.objects RLS: remove a published credential, and stop reading profiles.
--
-- DO NOT APPLY FROM THE REPO. Claude.ai applies this after merge, then re-reads
-- pg_policy and re-tests an upload as a no-profiles-row admin. A migration file
-- containing the right SQL and a database carrying the right policy are DIFFERENT
-- CLAIMS — S319 shipped three broken functions past a green test that asserted
-- against source text instead of the artifact. Verify against pg_policy.
--
-- ── FINDING 1 — a published credential was hardcoded into three policies ────────
-- logos_{insert,update,delete}_tenant_or_operator each carried
--     OR auth.uid() = '5181b30a-265f-4a70-a323-bf6e3c53641b'::uuid
-- That UUID is admin@pestflowpro.com, whose password is published on the marketing
-- homepage. S308 deleted its operators row as a security fix and missed these, so it
-- retained INSERT/UPDATE/DELETE on EVERY tenant's logo, Dang's included.
-- Replaced with public.is_operator(), the SECURITY DEFINER helper S308 built for this.
-- It follows the operators table, so removing an operator now removes them here too —
-- which is exactly what failed to happen last time.
--
-- ── FINDING 2 — the tenant predicate read profiles ──────────────────────────────
-- current_tenant_id() is `select tenant_id from profiles where id = auth.uid()`.
-- Accounts provisioned without a profiles row (S273/S308 retired that dependency)
-- get NULL, so `(storage.foldername(name))[1] = current_tenant_id()::text` is NULL,
-- the policy fails closed, and the upload is refused. Reproduced live 2026-09-02:
-- precisionlawnsystems@yahoo.com and scott@homeflowpro.ai both have NO profiles row
-- and cannot upload to their own tenants.
--
-- THE MIGRATION WAS STARTED AND NOT FINISHED. reports_admin_read on this same table
-- ALREADY uses the tenant_users shape below. Both patterns sit side by side today;
-- this finishes the job.
--
-- ── WRITE vs READ, stated rather than assumed ──────────────────────────────────
-- WRITES (INSERT/UPDATE/DELETE) require role = 'admin', matching reports_admin_read.
-- Replacing or DELETING a client's logo or hero image is an administrative act, and
-- these policies carry DELETE. Least privilege for a destructive capability.
-- READS require any membership: a non-admin member who can see the admin UI needs to
-- see the images in it. Tightening reads would break viewing for no security gain.
--
-- Effective-grant delta, computed against live data 2026-09-02 (not estimated):
--   admin@dangpestcontrol.com      dang                  -> dang                  (same)
--   admin@ironwoodopsgrp.com       pls                   -> pls                   (same)
--   admin@pestflowpro.com          pestflow-pro          -> pestflow-pro          (same)
--   precisionlawnsystems@yahoo.com (none)                -> pls                   (THE FIX)
--   scott@homeflowpro.ai           (none)                -> pestflow-pro,vita-glow(THE FIX)
--   admin@demo.com                 pestflow-pro          -> 5 demo tenants        (CHANGES BOTH WAYS)
--   scottdevore2@gmail.com         (none)                -> (none) for writes,
--                                                           dang for reads
--
-- TWO deltas are NOT pure fixes and are called out for the reviewer:
--   * admin@demo.com LOSES pestflow-pro. It holds that only through profiles and is
--     not a tenant_users member of it. admin@pestflowpro.com is the member and keeps
--     it. If the demo login is used to manage the master tenant's assets, this is the
--     line that stops it.
--   * admin@demo.com GAINS the five demo tenants it is actually a member of.
--
-- OPERATORS ARE NOT GRANTED tenant-assets/social-uploads/videos here. is_operator()
-- is added to the logos bucket only, because that is where a hardcoded operator grant
-- already existed and is being replaced in kind. Widening operator reach to the other
-- buckets would be a privilege EXPANSION beyond this fix; if support needs it, that is
-- its own decision. Consequence: scott@homeflowpro.ai cannot upload to pls assets —
-- admin@ironwoodopsgrp.com is the pls admin and can.

BEGIN;

-- ── logos ──────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS logos_insert_tenant_or_operator ON storage.objects;
CREATE POLICY logos_insert_tenant_or_operator ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND (
      EXISTS (
        SELECT 1 FROM public.tenant_users tu
        WHERE tu.tenant_id::text = (storage.foldername(name))[1]
          AND tu.user_id = auth.uid()
          AND tu.role = 'admin'
      )
      OR public.is_operator()
    )
  );

DROP POLICY IF EXISTS logos_update_tenant_or_operator ON storage.objects;
CREATE POLICY logos_update_tenant_or_operator ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'logos'
    AND (
      EXISTS (
        SELECT 1 FROM public.tenant_users tu
        WHERE tu.tenant_id::text = (storage.foldername(name))[1]
          AND tu.user_id = auth.uid()
          AND tu.role = 'admin'
      )
      OR public.is_operator()
    )
  )
  WITH CHECK (
    bucket_id = 'logos'
    AND (
      EXISTS (
        SELECT 1 FROM public.tenant_users tu
        WHERE tu.tenant_id::text = (storage.foldername(name))[1]
          AND tu.user_id = auth.uid()
          AND tu.role = 'admin'
      )
      OR public.is_operator()
    )
  );

DROP POLICY IF EXISTS logos_delete_tenant_or_operator ON storage.objects;
CREATE POLICY logos_delete_tenant_or_operator ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos'
    AND (
      EXISTS (
        SELECT 1 FROM public.tenant_users tu
        WHERE tu.tenant_id::text = (storage.foldername(name))[1]
          AND tu.user_id = auth.uid()
          AND tu.role = 'admin'
      )
      OR public.is_operator()
    )
  );

-- ── tenant-assets ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_upload_assets ON storage.objects;
CREATE POLICY tenant_upload_assets ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'tenant-assets'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
        AND tu.role = 'admin'
    )
  );

DROP POLICY IF EXISTS tenant_update_assets ON storage.objects;
CREATE POLICY tenant_update_assets ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'tenant-assets'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
        AND tu.role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'tenant-assets'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
        AND tu.role = 'admin'
    )
  );

DROP POLICY IF EXISTS tenant_delete_assets ON storage.objects;
CREATE POLICY tenant_delete_assets ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'tenant-assets'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
        AND tu.role = 'admin'
    )
  );

-- READ: any membership, per the write/read split documented above.
DROP POLICY IF EXISTS tenant_read_assets ON storage.objects;
CREATE POLICY tenant_read_assets ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'tenant-assets'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
    )
  );

-- ── social-uploads ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_upload_social ON storage.objects;
CREATE POLICY tenant_upload_social ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'social-uploads'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
        AND tu.role = 'admin'
    )
  );

DROP POLICY IF EXISTS social_uploads_tenant_delete ON storage.objects;
CREATE POLICY social_uploads_tenant_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'social-uploads'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
        AND tu.role = 'admin'
    )
  );

DROP POLICY IF EXISTS tenant_read_social ON storage.objects;
CREATE POLICY tenant_read_social ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'social-uploads'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
    )
  );

-- ── videos ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_upload_videos ON storage.objects;
CREATE POLICY tenant_upload_videos ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'videos'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
        AND tu.role = 'admin'
    )
  );

DROP POLICY IF EXISTS tenant_read_videos ON storage.objects;
CREATE POLICY tenant_read_videos ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'videos'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
    )
  );

COMMIT;

-- NOT TOUCHED, deliberately:
--   authenticated_read_logos  — bucket_id = 'logos' for any authenticated user. Out of
--     scope: it is a READ on a bucket served publicly anyway, and narrowing it is a
--     separate decision with its own blast radius.
--   reports_admin_read        — already the target shape. Left byte-identical so the
--     diff shows only what changed.
