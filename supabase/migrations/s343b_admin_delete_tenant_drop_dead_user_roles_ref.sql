-- S343b — admin_delete_tenant: remove the reference to a dropped table.
--
-- APPLIED IN PRODUCTION 2026-09-05 (migration id 20260905020512) WITH NO FILE.
-- This is that file, written from the LIVE object so a fresh database
-- reproduces today's state. Verified byte-identical: md5(pg_get_functiondef())
-- = 54937fa95988c4cc7ec401b2b10be307, length 4730.
--
-- ⚠️ DO NOT VERIFY THIS BY GREPPING FOR 'user_roles'. That substring is STILL
-- PRESENT below — in the comment recording the removal. A substring check
-- returns TRUE for a correctly-fixed function and has already produced one
-- near-miss. Anchor on the md5 above, not on the string.
--
-- WHY IT EXISTS. admin_delete_tenant had TWO blockers and had never once
-- completed a run:
--
--   1. S343 fixed the last-admin trigger, which raised at line 59.
--   2. Execution then reached line 66 and died here, on
--      `DELETE FROM public.user_roles` — a table S273 dropped when
--      tenant_users became the roles SSOT.
--
-- The second was unreachable while the first still raised, which is why static
-- reading never surfaced it and only running the function did. That is the
-- reason a deleted tenant left 17 orphan page_content rows behind: the function
-- reported failure and the operator moved on, and nothing had been cleaned up.
--
-- The orphan cleanup itself is unchanged — profiles rows for users who belong
-- to no remaining tenant are still deleted. Only the dead statement is gone.

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
    -- S343b: the DELETE FROM public.user_roles that stood here referenced a
    -- table dropped by S273 and made this function unrunnable. Removed.
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

-- Verify after applying:
--   SELECT md5(pg_get_functiondef(p.oid)), length(pg_get_functiondef(p.oid))
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname='public' AND p.proname='admin_delete_tenant';
--   -- expect 54937fa95988c4cc7ec401b2b10be307 / 4730
