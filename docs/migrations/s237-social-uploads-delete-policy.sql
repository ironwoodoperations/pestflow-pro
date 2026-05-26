-- S237a — storage.objects DELETE policy for social-uploads (tenant-scoped).
-- Separate from the table migration so a storage-privilege failure cannot roll
-- back table creation. Soft-delete is the v1 path; this enables a future
-- hard-delete / reconciliation cleanup fn without a new migration.
-- social-uploads SELECT (tenant_read_social) + INSERT (tenant_upload_social)
-- already exist with the same predicate — do NOT recreate them.
CREATE POLICY social_uploads_tenant_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'social-uploads'
    AND (storage.foldername(name))[1] = current_tenant_id()::text
  );
