-- ============================================================================
-- S256 — set_tenant_secret SQLSTATE mapping (repo-truth backfill)
-- ============================================================================
-- REPO-TRUTH BACKFILL ONLY. This object is ALREADY LIVE in production
-- (project biezzykcgzkrwdgqpsar); it was applied via MCP and never landed in
-- supabase/migrations/. This file makes the repo reflect live reality. It
-- introduces NO new DB behavior. Re-running via `supabase db reset` reproduces
-- current production state (CREATE OR REPLACE is idempotent).
--
-- S256 fix captured here: the ownership-denial and no-auth RAISEs carry explicit
-- SQLSTATEs so the set-tenant-secret edge function can map them by error code,
-- not message text:
--   * not-an-admin   -> ERRCODE '42501' (insufficient_privilege)  -> edge fn 403
--   * no auth.uid()  -> ERRCODE '28000' (invalid_authorization)   -> edge fn 401
-- (Previously a bare RAISE mis-mapped the ownership denial to 500.)
--
-- Definition below is the verbatim live pg_get_functiondef output.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_tenant_secret(p_tenant_id uuid, p_secret_name text, p_secret_value text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_uid        uuid := auth.uid();
  v_is_admin   boolean;
  v_vault_name text;
  v_existing   uuid;
  v_action     text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'set_tenant_secret: no authenticated user' USING ERRCODE = '28000';
  END IF;
  IF p_tenant_id IS NULL OR p_secret_name IS NULL THEN
    RAISE EXCEPTION 'set_tenant_secret: tenant_id and secret_name required';
  END IF;

  -- allowlist (same 4 keys as the read RPC)
  IF p_secret_name NOT IN
     ('facebook_access_token','ga4_oauth_refresh_token','gsc_oauth_refresh_token','textbelt_api_key') THEN
    RAISE EXCEPTION 'set_tenant_secret: secret name not allowed: %', p_secret_name;
  END IF;

  -- AUTHORITATIVE ownership check: caller must be an admin of THIS tenant (tenant_users truth)
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_id = p_tenant_id AND user_id = v_uid AND role = 'admin'
  ) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'set_tenant_secret: not an admin of tenant %', p_tenant_id USING ERRCODE = '42501';
  END IF;

  -- canonical name MUST match get_tenant_secret exactly (raw UUID with hyphens)
  v_vault_name := 'tenant_' || p_tenant_id::text || '_' || p_secret_name;

  -- serialize concurrent writes for this tenant+secret (TOCTOU-safe)
  PERFORM pg_advisory_xact_lock(hashtext(v_vault_name));

  SELECT id INTO v_existing FROM vault.secrets WHERE name = v_vault_name;

  IF p_secret_value IS NULL OR length(btrim(p_secret_value)) = 0 THEN
    -- clear / disconnect
    IF v_existing IS NOT NULL THEN
      DELETE FROM vault.secrets WHERE id = v_existing;
    END IF;
    v_action := 'delete';
  ELSIF v_existing IS NOT NULL THEN
    PERFORM vault.update_secret(v_existing, p_secret_value);
    v_action := 'update';
  ELSE
    PERFORM vault.create_secret(p_secret_value, v_vault_name,
      'Per-tenant integration secret (set via admin)');
    v_action := 'set';
  END IF;

  INSERT INTO public.secret_write_audit(acted_by, tenant_id, secret_name, action)
  VALUES (v_uid, p_tenant_id, p_secret_name, v_action);

  RETURN v_action;
END;
$function$;
