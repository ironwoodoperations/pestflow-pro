-- S320 ROLLBACK — restores storage.objects policies to their 2026-09-02 pre-S320 state.
--
-- NOT TIMESTAMP-PREFIXED ON PURPOSE. The Supabase CLI reads the leading 14 digits as a
-- migration version; a timestamped rollback would be picked up and applied in sequence.
-- Same convention as s308_*_rollback.sql and s309_*_rollback.sql.
--
-- ⚠️ READ BEFORE RUNNING. This restores the hardcoded literal
--     auth.uid() = '5181b30a-265f-4a70-a323-bf6e3c53641b'::uuid
-- which is admin@pestflowpro.com — the account whose password is published on the
-- marketing homepage. Running this re-grants that account INSERT/UPDATE/DELETE on
-- EVERY tenant's logo, including Dang's. It also restores the profiles dependency that
-- blocks uploads for any admin without a profiles row.
--
-- That is what rolling back MEANS here, and the file restores the prior state exactly
-- rather than inventing a safer halfway house. If the goal is only to undo the
-- tenant-asset changes, run the tenant-assets/social-uploads/videos section and LEAVE
-- THE LOGOS SECTION ALONE — the logos fix is a security fix and should outlive a
-- functional revert.
--
-- Expressions below are copied from pg_get_expr(pol.polqual/polwithcheck) as read live
-- on 2026-09-02, not reconstructed from memory.

BEGIN;

-- ── logos — ⚠️ RESTORES THE PUBLISHED CREDENTIAL ──────────────────────────────
DROP POLICY IF EXISTS logos_insert_tenant_or_operator ON storage.objects;
CREATE POLICY logos_insert_tenant_or_operator ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK ((bucket_id = 'logos'::text) AND (((storage.foldername(name))[1] = (current_tenant_id())::text) OR (auth.uid() = '5181b30a-265f-4a70-a323-bf6e3c53641b'::uuid)));

DROP POLICY IF EXISTS logos_update_tenant_or_operator ON storage.objects;
CREATE POLICY logos_update_tenant_or_operator ON storage.objects
  FOR UPDATE TO authenticated
  USING ((bucket_id = 'logos'::text) AND (((storage.foldername(name))[1] = (current_tenant_id())::text) OR (auth.uid() = '5181b30a-265f-4a70-a323-bf6e3c53641b'::uuid)))
  WITH CHECK ((bucket_id = 'logos'::text) AND (((storage.foldername(name))[1] = (current_tenant_id())::text) OR (auth.uid() = '5181b30a-265f-4a70-a323-bf6e3c53641b'::uuid)));

DROP POLICY IF EXISTS logos_delete_tenant_or_operator ON storage.objects;
CREATE POLICY logos_delete_tenant_or_operator ON storage.objects
  FOR DELETE TO authenticated
  USING ((bucket_id = 'logos'::text) AND (((storage.foldername(name))[1] = (current_tenant_id())::text) OR (auth.uid() = '5181b30a-265f-4a70-a323-bf6e3c53641b'::uuid)));

-- ── tenant-assets ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_upload_assets ON storage.objects;
CREATE POLICY tenant_upload_assets ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK ((bucket_id = 'tenant-assets'::text) AND ((storage.foldername(name))[1] = (current_tenant_id())::text));

DROP POLICY IF EXISTS tenant_update_assets ON storage.objects;
CREATE POLICY tenant_update_assets ON storage.objects
  FOR UPDATE TO authenticated
  USING ((bucket_id = 'tenant-assets'::text) AND ((storage.foldername(name))[1] = (current_tenant_id())::text))
  WITH CHECK ((bucket_id = 'tenant-assets'::text) AND ((storage.foldername(name))[1] = (current_tenant_id())::text));

DROP POLICY IF EXISTS tenant_delete_assets ON storage.objects;
CREATE POLICY tenant_delete_assets ON storage.objects
  FOR DELETE TO authenticated
  USING ((bucket_id = 'tenant-assets'::text) AND ((storage.foldername(name))[1] = (current_tenant_id())::text));

DROP POLICY IF EXISTS tenant_read_assets ON storage.objects;
CREATE POLICY tenant_read_assets ON storage.objects
  FOR SELECT TO authenticated
  USING ((bucket_id = 'tenant-assets'::text) AND ((storage.foldername(name))[1] = (current_tenant_id())::text));

-- ── social-uploads ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_upload_social ON storage.objects;
CREATE POLICY tenant_upload_social ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK ((bucket_id = 'social-uploads'::text) AND ((storage.foldername(name))[1] = (current_tenant_id())::text));

DROP POLICY IF EXISTS social_uploads_tenant_delete ON storage.objects;
CREATE POLICY social_uploads_tenant_delete ON storage.objects
  FOR DELETE TO authenticated
  USING ((bucket_id = 'social-uploads'::text) AND ((storage.foldername(name))[1] = (current_tenant_id())::text));

DROP POLICY IF EXISTS tenant_read_social ON storage.objects;
CREATE POLICY tenant_read_social ON storage.objects
  FOR SELECT TO authenticated
  USING ((bucket_id = 'social-uploads'::text) AND ((storage.foldername(name))[1] = (current_tenant_id())::text));

-- ── videos ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_upload_videos ON storage.objects;
CREATE POLICY tenant_upload_videos ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK ((bucket_id = 'videos'::text) AND ((storage.foldername(name))[1] = (current_tenant_id())::text));

DROP POLICY IF EXISTS tenant_read_videos ON storage.objects;
CREATE POLICY tenant_read_videos ON storage.objects
  FOR SELECT TO authenticated
  USING ((bucket_id = 'videos'::text) AND ((storage.foldername(name))[1] = (current_tenant_id())::text));

COMMIT;
