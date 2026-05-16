-- S221 hardening: resolve Supabase advisor findings introduced by the
-- provisioning_status table.
--   * function_search_path_mutable — pin search_path on the trigger fn
--   * auth_rls_initplan — wrap auth.uid() in a scalar subselect so it's
--     evaluated once per query instead of per row
--   * unindexed_foreign_key — add covering index on operator_user_id FK

ALTER FUNCTION public.update_provisioning_status_updated_at() SET search_path = '';

DROP POLICY IF EXISTS "master_admin_read_provisioning_status" ON public.provisioning_status;
CREATE POLICY "master_admin_read_provisioning_status"
  ON public.provisioning_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.tenants t ON t.id = p.tenant_id
      WHERE p.id = (SELECT auth.uid())
        AND t.slug = 'pestflow-pro'
        AND p.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS provisioning_status_operator_user_id_idx
  ON public.provisioning_status (operator_user_id)
  WHERE operator_user_id IS NOT NULL;
