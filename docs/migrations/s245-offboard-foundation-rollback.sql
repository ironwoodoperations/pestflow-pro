-- ============================================================================
-- S245 PR1 — ROLLBACK of s245-offboard-foundation.sql
-- ============================================================================
-- Restores admin_delete_tenant to its pre-S245 2-arg form and drops the
-- audit/queue tables + setter fns. Apply via MCP if PR1 must be reverted.
-- WARNING: dropping the tables discards offboard audit/outbox history — only
-- run if no offboard has executed, or after exporting those tables.
-- ============================================================================

-- 1. restore the original 2-arg RPC (drop the 6-arg S245 version first)
drop function if exists public.admin_delete_tenant(uuid, boolean, text, uuid, uuid, text);

create function public.admin_delete_tenant(p_tenant_id uuid, p_confirm boolean default false)
  returns jsonb
  language plpgsql
  security definer
  set search_path to 'public'
as $function$
DECLARE
  v_slug         text;
  v_protected    boolean;
  v_admin_users  uuid[];
  v_zernio       text[];
  v_orphans      uuid[];
  v_counts       jsonb;
BEGIN
  -- 1. existence + protection guard
  SELECT slug, is_protected INTO v_slug, v_protected
  FROM public.tenants WHERE id = p_tenant_id;

  IF v_slug IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tenant_not_found', 'tenant_id', p_tenant_id);
  END IF;
  IF v_protected THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tenant_is_protected',
                              'tenant_id', p_tenant_id, 'slug', v_slug);
  END IF;

  -- 2. capture pre-delete inventory
  SELECT array_agg(DISTINCT tu.user_id) INTO v_admin_users
  FROM public.tenant_users tu WHERE tu.tenant_id = p_tenant_id;

  SELECT array_agg(DISTINCT s.value->>'zernio_profile_id') INTO v_zernio
  FROM public.settings s
  WHERE s.tenant_id = p_tenant_id AND s.key = 'integrations'
    AND coalesce(s.value->>'zernio_profile_id','') <> '';

  v_counts := jsonb_build_object(
    'settings',      (SELECT count(*) FROM public.settings      WHERE tenant_id = p_tenant_id),
    'page_content',  (SELECT count(*) FROM public.page_content  WHERE tenant_id = p_tenant_id),
    'service_areas', (SELECT count(*) FROM public.service_areas WHERE tenant_id = p_tenant_id),
    'blog_posts',    (SELECT count(*) FROM public.blog_posts    WHERE tenant_id = p_tenant_id),
    'faqs',          (SELECT count(*) FROM public.faqs          WHERE tenant_id = p_tenant_id),
    'image_library', (SELECT count(*) FROM public.image_library WHERE tenant_id = p_tenant_id),
    'tenant_users',  coalesce(array_length(v_admin_users,1), 0)
  );

  -- 3. dry-run (default): no mutation
  IF NOT p_confirm THEN
    RETURN jsonb_build_object(
      'ok', true, 'dry_run', true, 'tenant_id', p_tenant_id, 'slug', v_slug,
      'would_delete', v_counts,
      'admin_users', coalesce(to_jsonb(v_admin_users), '[]'::jsonb),
      'zernio_profiles', coalesce(to_jsonb(v_zernio), '[]'::jsonb),
      'note', 'pass p_confirm => true to execute');
  END IF;

  -- 4. EXECUTE (whole function body is one transaction => atomic)
  DELETE FROM public.service_areas WHERE tenant_id = p_tenant_id;
  DELETE FROM public.page_content  WHERE tenant_id = p_tenant_id;
  DELETE FROM public.tenants       WHERE id = p_tenant_id;

  -- 5. resolve orphaned admin users and clear their NO-ACTION refs
  v_orphans := ARRAY(
    SELECT u FROM unnest(coalesce(v_admin_users, '{}'::uuid[])) AS u
    WHERE NOT EXISTS (SELECT 1 FROM public.tenant_users tu WHERE tu.user_id = u)
  );

  IF coalesce(array_length(v_orphans,1),0) > 0 THEN
    DELETE FROM public.user_roles WHERE user_id = ANY(v_orphans);
    DELETE FROM public.profiles   WHERE id      = ANY(v_orphans);
  END IF;

  RETURN jsonb_build_object(
    'ok', true, 'dry_run', false, 'deleted', true,
    'tenant_id', p_tenant_id, 'slug', v_slug,
    'deleted_counts', v_counts,
    'orphan_auth_user_ids', coalesce(to_jsonb(v_orphans), '[]'::jsonb),
    'zernio_profiles_to_delete_externally', coalesce(to_jsonb(v_zernio), '[]'::jsonb),
    'next_steps', 'GoTrue admin.deleteUser(orphan_auth_user_ids[]) + delete zernio profiles via Zernio API');
END;
$function$;

revoke all on function public.admin_delete_tenant(uuid, boolean) from public, anon, authenticated;
grant execute on function public.admin_delete_tenant(uuid, boolean) to service_role;

-- 2. drop setters
drop function if exists public.offboard_set_audit_state(uuid, text);
drop function if exists public.offboard_mark_queue_item(uuid, text, text, boolean);

-- 3. drop append-only trigger + guard
drop trigger if exists tenant_offboard_audit_append_only on public.tenant_offboard_audit;
drop function if exists public.tenant_offboard_audit_guard();

-- 4. drop tables
drop table if exists public.tenant_offboard_queue;
drop table if exists public.tenant_offboard_audit;

NOTIFY pgrst, 'reload schema';
-- ============================================================================
-- END S245 PR1 rollback.
-- ============================================================================
