-- S237a QA fix — applied to prod via MCP as: s237_image_library_select_policy_fix
-- PostgreSQL evaluates the post-UPDATE row against the SELECT policy, so having
-- `deleted_at IS NULL` in the SELECT policy made soft-delete (setting deleted_at)
-- fail with RLS error 42501. Move the active-row filter to the client; the
-- SELECT policy stays tenant-scoped, so tenant isolation is unchanged.
DROP POLICY IF EXISTS image_library_tenant_select ON image_library;
CREATE POLICY image_library_tenant_select ON image_library
  FOR SELECT TO authenticated
  USING (
    (SELECT current_tenant_id()) IS NOT NULL
    AND tenant_id = (SELECT current_tenant_id())
  );
NOTIFY pgrst, 'reload schema';
