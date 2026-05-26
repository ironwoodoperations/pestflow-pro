-- S237a backfill — import existing social-uploads objects into image_library.
-- Idempotent (ON CONFLICT DO NOTHING). Maps each object to its real tenant via
-- the first path segment. Expected: 17 rows total (Dang 5, Demo 12).
-- width/height left NULL (storage metadata exposes only size + mimetype).
INSERT INTO image_library
  (tenant_id, bucket_id, storage_path, original_filename, mime_type, size_bytes, folder, uploaded_by)
SELECT
  ((storage.foldername(o.name))[1])::uuid,
  'social-uploads',
  o.name,
  split_part(o.name, '/', array_length(string_to_array(o.name, '/'), 1)),
  COALESCE(o.metadata->>'mimetype', 'image/jpeg'),
  COALESCE((o.metadata->>'size')::bigint, 0),
  NULL,   -- folder: unfiled
  NULL    -- uploaded_by: unknown for pre-existing manual uploads
FROM storage.objects o
WHERE o.bucket_id = 'social-uploads'
  AND (storage.foldername(o.name))[1] ~ '^[0-9a-fA-F-]{36}$'
  AND EXISTS (SELECT 1 FROM tenants t WHERE t.id = ((storage.foldername(o.name))[1])::uuid)
ON CONFLICT (bucket_id, storage_path) DO NOTHING;
