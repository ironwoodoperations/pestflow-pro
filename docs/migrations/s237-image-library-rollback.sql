-- S237a rollback — image_library table + trigger + storage DELETE policy
DROP POLICY IF EXISTS social_uploads_tenant_delete ON storage.objects;
DROP TRIGGER IF EXISTS image_library_immutable_columns_trigger ON image_library;
DROP FUNCTION IF EXISTS enforce_image_library_immutable_columns();
DROP TABLE IF EXISTS image_library;  -- drops its policies + indexes
NOTIFY pgrst, 'reload schema';
