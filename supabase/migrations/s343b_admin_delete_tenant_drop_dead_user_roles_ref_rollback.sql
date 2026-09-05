-- ROLLBACK for s343b_admin_delete_tenant_drop_dead_user_roles_ref.sql
--
-- ⚠️ APPLYING THIS RESTORES A FUNCTION THAT CANNOT RUN. Read this before you do.
--
-- The statement it puts back — DELETE FROM public.user_roles — targets a table
-- S273 DROPPED. Postgres does not resolve table names in a plpgsql body until
-- execution, so this creates cleanly and then fails at runtime with 42P01 the
-- moment a confirmed delete reaches it. After applying this, admin_delete_tenant
-- goes back to what it was for months: a function that has never completed, that
-- half-deletes a tenant and leaves orphan rows behind, and that reports failure
-- after the tenant row is already gone.
--
-- It exists because the convention is that every migration has one, and because
-- a rollback that silently improved on the state it claims to restore would be
-- lying about what it does. THE HONEST POSITION IS THAT THERE IS NO SAFE
-- ROLLBACK HERE: the forward migration removed dead code, and reinstating dead
-- code cannot be safe. If the forward migration must be undone for an unrelated
-- reason, take this body and delete the user_roles line again.
--
-- The reinstated line is NOT reconstructed from the removal comment. It is
-- verbatim from docs/migrations/s245-offboard-foundation.sql:207, where the
-- original function was first defined, immediately above the profiles delete.

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_delete_tenant(p_tenant_id uuid, p_confirm boolean DEFAULT false, p_slug_confirmation text DEFAULT NULL::text, p_request_id uuid DEFAULT NULL::uuid, p_operator_id uuid DEFAULT NULL::uuid, p_operator_email text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_slug         text;
  v_protected    boolean;
  v_admin_users  uuid[];
  v_zernio       text[];
  v_orphans      uuid[];
  v_counts       jsonb;
  v_request_id   uuid;
BEGIN
  SELECT slug, is_protected INTO v_slug, v_protected
  FROM public.tenants WHERE id = p_tenant_id;

  IF v_slug IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tenant_not_found', 'tenant_id', p_tenant_id);
  END IF;
  IF v_protected THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tenant_is_protected',
                              'tenant_id', p_tenant_id, 'slug', v_slug);
  END IF;

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

  IF NOT p_confirm THEN
    RETURN jsonb_build_object(
      'ok', true, 'dry_run', true, 'tenant_id', p_tenant_id, 'slug', v_slug,
      'would_delete', v_counts,
      'admin_users', coalesce(to_jsonb(v_admin_users), '[]'::jsonb),
      'zernio_profiles', coalesce(to_jsonb(v_zernio), '[]'::jsonb),
      'note', 'pass p_confirm => true (with p_slug_confirmation) to execute');
  END IF;

  IF NOT pg_try_advisory_xact_lock(hashtext(p_tenant_id::text)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'offboard_in_progress', 'tenant_id', p_tenant_id);
  END IF;

  IF p_slug_confirmation IS DISTINCT FROM v_slug THEN
    RETURN jsonb_build_object('ok', false, 'error', 'slug_mismatch', 'expected', v_slug);
  END IF;

  DELETE FROM public.service_areas WHERE tenant_id = p_tenant_id;
  DELETE FROM public.page_content  WHERE tenant_id = p_tenant_id;
  DELETE FROM public.tenants       WHERE id = p_tenant_id;

  v_orphans := ARRAY(
    SELECT u FROM unnest(coalesce(v_admin_users, '{}'::uuid[])) AS u
    WHERE NOT EXISTS (SELECT 1 FROM public.tenant_users tu WHERE tu.user_id = u)
  );
  IF coalesce(array_length(v_orphans,1),0) > 0 THEN
    DELETE FROM public.user_roles WHERE user_id = ANY(v_orphans);
    DELETE FROM public.profiles   WHERE id      = ANY(v_orphans);
  END IF;

  v_request_id := coalesce(p_request_id, gen_random_uuid());
  INSERT INTO public.tenant_offboard_audit
    (request_id, tenant_id, slug_snapshot, operator_id, operator_email, mode,
     preview_counts, committed_orphan_auth_ids, committed_zernio_ids, final_state)
  VALUES
    (v_request_id, p_tenant_id, v_slug, p_operator_id, p_operator_email, 'confirm',
     v_counts, v_orphans, v_zernio, 'committed');

  INSERT INTO public.tenant_offboard_queue (request_id, tenant_id, slug_snapshot, target_type, target_id)
  SELECT v_request_id, p_tenant_id, v_slug, 'auth_user', u::text
  FROM unnest(coalesce(v_orphans, '{}'::uuid[])) AS u
  ON CONFLICT (request_id, target_type, target_id) DO NOTHING;

  INSERT INTO public.tenant_offboard_queue (request_id, tenant_id, slug_snapshot, target_type, target_id)
  SELECT v_request_id, p_tenant_id, v_slug, 'zernio', z
  FROM unnest(coalesce(v_zernio, '{}'::text[])) AS z
  WHERE coalesce(z,'') <> ''
  ON CONFLICT (request_id, target_type, target_id) DO NOTHING;

  RETURN jsonb_build_object(
    'ok', true, 'dry_run', false, 'deleted', true,
    'request_id', v_request_id,
    'tenant_id', p_tenant_id, 'slug', v_slug,
    'deleted_counts', v_counts,
    'queued', jsonb_build_object(
      'auth',   coalesce(to_jsonb(v_orphans), '[]'::jsonb),
      'zernio', coalesce(to_jsonb(v_zernio),  '[]'::jsonb)));
END;
$function$;

COMMIT;
