-- Customer-#2 readiness sanity sweep: tenant isolation hardening.
--
-- Finding A — anon SELECT leaks on social_posts + social_campaigns:
--   Both tables had `USING (true)` anon-role SELECT policies, exposing 42 social_posts
--   (incl. 2 drafts + 1 scheduled-unpublished + 21 AI-generated) and 6 social_campaigns
--   across all tenants to anyone with the public anon key. Fix: drop the policies.
--   Authenticated tenant users still have access via `tenant_isolation_*` policies;
--   service role still bypasses RLS as usual.
--
-- Finding B (partial) — storage.objects cross-tenant exposure on tenant-assets:
--   Existing policies checked only `bucket_id = 'tenant-assets'`, allowing any
--   authenticated user to read/insert/update/delete any of the 97 objects across all
--   tenants. Fix: replace with tenant-folder-scoped policies that match the existing
--   pattern on social-uploads + videos buckets. Death-audit confirmed all 97 paths
--   are tenant-UUID-prefixed.
--
-- Finding B (cross-bucket SELECT) — replace `authenticated_read_tenant_buckets`:
--   This policy let any authenticated user list paths across all four buckets. Replaced
--   with narrower per-bucket policies (tenant-scoped for tenant-assets; preserved-broad
--   for logos until legacy-path cleanup lands).
--
-- Finding B (deferred — logos):
--   Logos bucket has legacy mixed paths (slug-prefixed `dang/logo.svg`, bare filenames,
--   `wizard/...` onboarding artifacts). Cannot apply UUID-folder scoping without
--   breaking Dang's existing logo URL. Logos write-policy tightening is deferred to a
--   separate cleanup migration after path normalization.

-- ── Finding A ──
DROP POLICY IF EXISTS "social_posts_anon_read"     ON public.social_posts;
DROP POLICY IF EXISTS "social_campaigns_anon_read" ON public.social_campaigns;

-- ── Finding B: tenant-assets ──
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_read_tenant_buckets" ON storage.objects;

CREATE POLICY "tenant_read_assets" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'tenant-assets'
    AND (storage.foldername(name))[1] = (current_tenant_id())::text
  );

CREATE POLICY "tenant_upload_assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'tenant-assets'
    AND (storage.foldername(name))[1] = (current_tenant_id())::text
  );

CREATE POLICY "tenant_update_assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'tenant-assets'
    AND (storage.foldername(name))[1] = (current_tenant_id())::text
  )
  WITH CHECK (
    bucket_id = 'tenant-assets'
    AND (storage.foldername(name))[1] = (current_tenant_id())::text
  );

CREATE POLICY "tenant_delete_assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'tenant-assets'
    AND (storage.foldername(name))[1] = (current_tenant_id())::text
  );

-- ── Preserve broad read on logos (legacy paths) until cleanup migration ──
CREATE POLICY "authenticated_read_logos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'logos');
