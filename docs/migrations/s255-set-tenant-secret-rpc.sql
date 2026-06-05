-- s255 set_tenant_secret RPC + audit table  (STAGED — apply via MCP)
--
-- NOTE ON LOCATION: staged in docs/migrations/ (not supabase/migrations/)
-- because supabase/migrations/ is protected by .claude/hooks/protect-files.sh,
-- and the project convention stages MCP-applied SQL here (cf.
-- s254-get-tenant-secret-rpc.sql). Claude.ai applies this via the Supabase MCP.
--
-- WRITE path for the 4 per-tenant Vault secrets. Companion to the S254 read
-- path (get_tenant_secret). Backs the set-tenant-secret edge function.
--
-- ──────────────────────────────────────────────────────────────────────────
-- SECURITY MODEL (S255 validator gate)
-- ──────────────────────────────────────────────────────────────────────────
-- REQUIRED CHANGE 1 — ownership enforced INSIDE the RPC via auth.uid():
--   This function is SECURITY DEFINER (it must reach vault.*), but it does NOT
--   trust p_tenant_id. It re-derives the caller via auth.uid() and authorizes
--   against public.tenant_users (the tenant-membership table; role='admin')
--   BEFORE any Vault write. The edge function calls this with the USER'S JWT
--   (PostgREST role 'authenticated'), so auth.uid() is the real caller. If it
--   were ever called with service_role, auth.uid() is NULL and we RAISE — fail
--   CLOSED, never open.
--
-- REQUIRED CHANGE 2 — concurrency-safe (no TOCTOU): a transaction-scoped
--   advisory lock keyed on tenant+secret serializes concurrent saves so two
--   "absent" readers can't both call vault.create_secret and collide on the
--   unique name. Semantics = last-writer-wins (acceptable for admin-entered
--   secrets). Lock auto-releases at COMMIT/ROLLBACK.
--
-- REQUIRED CHANGE 3 — clear/disconnect: a NULL/empty p_secret_value DELETEs the
--   Vault secret (this Vault build exposes no vault.delete_secret, so we DELETE
--   FROM vault.secrets by id) so the read path stops fetching a stale token.
--
-- NO PLAINTEXT IN LOGS: the secret value is never placed in a RAISE/log. The
--   Vault name + description are metadata (NOT encrypted) — kept non-sensitive.
--
-- AUDIT: every mutation writes a row to public.tenant_secret_audit
--   (actor, tenant, secret name, action, timestamp) — NEVER the value.
--
-- NAMING — CRITICAL: identical to the read path. Raw UUID WITH HYPHENS,
--   underscore-joined:  'tenant_' || p_tenant_id::text || '_' || p_secret_name
--   Do NOT replace hyphens. A mismatch would split-brain read vs write names.
--
-- Rollback: docs/migrations/s255-set-tenant-secret-rpc-rollback.sql

-- ── Audit table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenant_secret_audit (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  secret_name   text NOT NULL,
  action        text NOT NULL,              -- created | updated | deleted | noop
  actor_user_id uuid,                       -- auth.uid() of the admin who acted
  created_at    timestamptz NOT NULL DEFAULT now()
  -- intentionally NO column for the secret value
);

-- Lock the audit table down: no anon/authenticated access. The SECURITY DEFINER
-- RPC (owned by postgres) inserts regardless of RLS; clients can never read it.
ALTER TABLE public.tenant_secret_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tenant_secret_audit FROM PUBLIC, anon, authenticated;

-- ── RPC ──────────────────────────────────────────────────────────────────--
CREATE OR REPLACE FUNCTION public.set_tenant_secret(
  p_tenant_id   uuid,
  p_secret_name text,
  p_secret_value text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_uid    uuid;
  v_name   text;
  v_id     uuid;
  v_action text;
BEGIN
  -- ── authn: real caller, never the param ────────────────────────────────
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    -- Reached only if the caller used service_role / no JWT. Fail CLOSED.
    RAISE EXCEPTION 'unauthorized: no authenticated user';
  END IF;

  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id required';
  END IF;

  -- ── secret-name allowlist (only the 4 migrated secrets) ────────────────
  IF p_secret_name NOT IN (
    'facebook_access_token',
    'ga4_oauth_refresh_token',
    'gsc_oauth_refresh_token',
    'textbelt_api_key'
  ) THEN
    RAISE EXCEPTION 'secret name not allowed: %', p_secret_name;
  END IF;

  -- ── authz: caller must be an admin OF THIS tenant (authoritative) ───────
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_id = p_tenant_id
      AND user_id   = v_uid
      AND role      = 'admin'
  ) THEN
    RAISE EXCEPTION 'unauthorized for tenant';
  END IF;

  v_name := 'tenant_' || p_tenant_id::text || '_' || p_secret_name;

  -- ── concurrency: serialize create/update for this tenant+secret ─────────
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(p_tenant_id::text || '_' || p_secret_name)
  );

  SELECT id INTO v_id
  FROM vault.decrypted_secrets
  WHERE name = v_name
  LIMIT 1;

  IF p_secret_value IS NULL OR pg_catalog.btrim(p_secret_value) = '' THEN
    -- ── clear / disconnect ───────────────────────────────────────────────
    IF v_id IS NOT NULL THEN
      DELETE FROM vault.secrets WHERE id = v_id;   -- no vault.delete_secret in this build
      v_action := 'deleted';
    ELSE
      v_action := 'noop';
    END IF;
  ELSIF v_id IS NOT NULL THEN
    -- ── update existing (preserves name + description) ────────────────────
    PERFORM vault.update_secret(v_id, p_secret_value);
    v_action := 'updated';
  ELSE
    -- ── create new (description is non-sensitive metadata) ────────────────
    PERFORM vault.create_secret(
      p_secret_value,
      v_name,
      'PestFlow per-tenant integration secret (S255)'
    );
    v_action := 'created';
  END IF;

  -- ── audit (never the value) ────────────────────────────────────────────
  INSERT INTO public.tenant_secret_audit (tenant_id, secret_name, action, actor_user_id)
  VALUES (p_tenant_id, p_secret_name, v_action, v_uid);

  RETURN v_action;
END;
$function$;

COMMENT ON FUNCTION public.set_tenant_secret(uuid, text, text) IS
  's255: SECURITY DEFINER writer for per-tenant Vault secrets. Re-derives caller via auth.uid() and authorizes against tenant_users(role=admin); advisory-locked create/update; NULL value deletes. EXECUTE granted to authenticated (called with the user JWT).';

-- ── EXECUTE grant + invocation path ─────────────────────────────────────────
-- The edge function calls this through PostgREST with the user's JWT, so the
-- caller role is 'authenticated'. Grant EXECUTE there only; the in-function
-- auth.uid() + tenant_users check is the real boundary. service_role/anon must
-- not reach it (anon has no auth.uid() and would fail closed anyway).
REVOKE ALL ON FUNCTION public.set_tenant_secret(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_tenant_secret(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_tenant_secret(uuid, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
