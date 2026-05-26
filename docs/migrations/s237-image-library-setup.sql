-- S237a — image_library table + indexes + RLS + immutable-column trigger
-- Applied to production via Supabase MCP apply_migration as: s237_image_library_table_and_rls
-- Spec: docs/audits/s237-image-library-spec.md  | Gate: docs/audits/s237-validator-gate.md
-- Validator gate GREEN with amendments A (CHECKs), B (SELECT-wrapped policies + NULL guard),
-- C (immutable-column trigger). Storage DELETE policy is a SEPARATE file.

CREATE TABLE IF NOT EXISTS image_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bucket_id text NOT NULL DEFAULT 'social-uploads',
  storage_path text NOT NULL,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  width integer,
  height integer,
  folder text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT image_library_path_unique UNIQUE (bucket_id, storage_path),
  CONSTRAINT image_library_path_tenant_prefix
    CHECK (storage_path LIKE tenant_id::text || '/%'),
  CONSTRAINT image_library_bucket_id_known
    CHECK (bucket_id IN ('social-uploads', 'tenant-assets'))
);

CREATE INDEX IF NOT EXISTS idx_image_library_tenant_active
  ON image_library (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_image_library_folder
  ON image_library (tenant_id, folder) WHERE deleted_at IS NULL;

ALTER TABLE image_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY image_library_tenant_select ON image_library
  FOR SELECT TO authenticated
  USING (
    (SELECT current_tenant_id()) IS NOT NULL
    AND tenant_id = (SELECT current_tenant_id())
    AND deleted_at IS NULL
  );

CREATE POLICY image_library_tenant_insert ON image_library
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT current_tenant_id()) IS NOT NULL
    AND tenant_id = (SELECT current_tenant_id())
  );

CREATE POLICY image_library_tenant_update ON image_library
  FOR UPDATE TO authenticated
  USING (
    (SELECT current_tenant_id()) IS NOT NULL
    AND tenant_id = (SELECT current_tenant_id())
  )
  WITH CHECK (
    (SELECT current_tenant_id()) IS NOT NULL
    AND tenant_id = (SELECT current_tenant_id())
  );

-- Amendment C: lock tenant_id / storage_path / bucket_id once inserted.
-- Postgres RLS cannot reference OLD, so this is a BEFORE UPDATE trigger.
CREATE OR REPLACE FUNCTION enforce_image_library_immutable_columns()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
BEGIN
  IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
    RAISE EXCEPTION 'image_library.tenant_id is immutable';
  END IF;
  IF NEW.storage_path IS DISTINCT FROM OLD.storage_path THEN
    RAISE EXCEPTION 'image_library.storage_path is immutable';
  END IF;
  IF NEW.bucket_id IS DISTINCT FROM OLD.bucket_id THEN
    RAISE EXCEPTION 'image_library.bucket_id is immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER image_library_immutable_columns_trigger
  BEFORE UPDATE ON image_library
  FOR EACH ROW
  EXECUTE FUNCTION enforce_image_library_immutable_columns();

NOTIFY pgrst, 'reload schema';
