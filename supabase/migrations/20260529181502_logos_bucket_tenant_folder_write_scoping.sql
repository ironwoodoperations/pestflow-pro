-- Logos bucket — folder-scoped write policies (tenant-or-operator).
--
-- Applied to production via Supabase MCP apply_migration on 2026-05-29 18:15:02 UTC
-- (schema_migrations.version = 20260529181502, name = logos_bucket_tenant_folder_write_scoping).
-- This file is the REPO AUDIT-TRAIL SYNC of that change (precedent: PR #133). No
-- re-apply happens from this file — filename version matches the recorded version,
-- so the Supabase CLI skips it on `db reset` / `migration up`.
--
-- Why: the logos bucket previously had two duplicate authenticated write-policy
-- sets (`allow_authenticated_*_logos` + `authenticated_logos_*`) that did not
-- enforce per-tenant folder scoping, allowing any authenticated user to write
-- across all tenants' logos paths. Replaced with three tenant-folder-scoped
-- write policies that also permit the Ironwood operator UUID (so Scott's
-- console-driven uploads still work). The PUBLIC-READ SELECT policy
-- (`authenticated_read_logos`, added by 20260529151005) is INTENTIONALLY
-- UNTOUCHED — read RLS is not the enforcement point for a public-read bucket
-- with legacy mixed paths.

-- ── Drop both legacy duplicate write-policy sets ──
DROP POLICY IF EXISTS "allow_authenticated_insert_logos" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_update_logos" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_delete_logos" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_logos_insert"        ON storage.objects;
DROP POLICY IF EXISTS "authenticated_logos_update"        ON storage.objects;
DROP POLICY IF EXISTS "authenticated_logos_delete"        ON storage.objects;

-- ── Idempotency: drop the new policies first so this file is safe to re-run ──
DROP POLICY IF EXISTS "logos_insert_tenant_or_operator" ON storage.objects;
DROP POLICY IF EXISTS "logos_update_tenant_or_operator" ON storage.objects;
DROP POLICY IF EXISTS "logos_delete_tenant_or_operator" ON storage.objects;

-- ── Folder-scoped write policies — tenant's own folder OR the Ironwood operator ──
CREATE POLICY "logos_insert_tenant_or_operator" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND (
      (storage.foldername(name))[1] = (current_tenant_id())::text
      OR auth.uid() = '5181b30a-265f-4a70-a323-bf6e3c53641b'::uuid
    )
  );

CREATE POLICY "logos_update_tenant_or_operator" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'logos'
    AND (
      (storage.foldername(name))[1] = (current_tenant_id())::text
      OR auth.uid() = '5181b30a-265f-4a70-a323-bf6e3c53641b'::uuid
    )
  )
  WITH CHECK (
    bucket_id = 'logos'
    AND (
      (storage.foldername(name))[1] = (current_tenant_id())::text
      OR auth.uid() = '5181b30a-265f-4a70-a323-bf6e3c53641b'::uuid
    )
  );

CREATE POLICY "logos_delete_tenant_or_operator" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos'
    AND (
      (storage.foldername(name))[1] = (current_tenant_id())::text
      OR auth.uid() = '5181b30a-265f-4a70-a323-bf6e3c53641b'::uuid
    )
  );
