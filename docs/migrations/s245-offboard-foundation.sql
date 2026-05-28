-- ============================================================================
-- S245 PR1 — one-click offboard: durable foundation (STAGED REFERENCE)
-- ============================================================================
-- NOT under supabase/migrations/ (protected). The ORCHESTRATOR (Claude.ai)
-- applies this via Supabase MCP `apply_migration`, then validates live against a
-- throwaway zz- tenant BEFORE PR2 (consumers) is merged. CC Web does not apply.
--
-- Project: biezzykcgzkrwdgqpsar (PRODUCTION).
-- Ordered: tables -> append-only trigger -> setter fns -> RPC replace -> reload.
-- The ship-blocker fix: cleanup intent is persisted INSIDE the delete txn
-- (audit + queue), not merely returned to the caller.
-- Rollback: docs/migrations/s245-offboard-foundation-rollback.sql (same commit).
-- ============================================================================

-- ── 1. tenant_offboard_audit (append-only) ──────────────────────────────────
create table if not exists public.tenant_offboard_audit (
  id                        uuid primary key default gen_random_uuid(),
  request_id                uuid not null,
  tenant_id                 uuid,                 -- snapshot; no FK (tenant is being deleted)
  slug_snapshot             text,
  operator_id               uuid,
  operator_email            text,
  mode                      text check (mode in ('confirm')),
  preview_counts            jsonb,
  committed_orphan_auth_ids uuid[],
  committed_zernio_ids      text[],
  final_state               text check (final_state in
                              ('committed','cleanup_partial','cleanup_complete','failed'))
                            default 'committed',
  created_at                timestamptz default now()
);
alter table public.tenant_offboard_audit enable row level security;
-- No policies → service_role only (bypasses RLS); anon/authenticated have no access.

create index if not exists tenant_offboard_audit_request_idx
  on public.tenant_offboard_audit (request_id);

-- Append-only guard: DELETE always blocked; UPDATE blocked unless the txn-local
-- writer flag is set — which ONLY offboard_set_audit_state does. Direct UPDATE
-- (even by service_role) is refused.
create or replace function public.tenant_offboard_audit_guard()
  returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'tenant_offboard_audit is append-only (DELETE blocked)';
  end if;
  if coalesce(current_setting('app.offboard_audit_writer', true), '') <> 'on' then
    raise exception 'tenant_offboard_audit is append-only (use offboard_set_audit_state to advance final_state)';
  end if;
  return new;
end;
$$;

drop trigger if exists tenant_offboard_audit_append_only on public.tenant_offboard_audit;
create trigger tenant_offboard_audit_append_only
  before update or delete on public.tenant_offboard_audit
  for each row execute function public.tenant_offboard_audit_guard();

-- ── 2. tenant_offboard_queue (outbox; idempotent per target) ─────────────────
create table if not exists public.tenant_offboard_queue (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid not null,
  tenant_id     uuid,
  slug_snapshot text,
  target_type   text check (target_type in ('auth_user','zernio')),
  target_id     text not null,
  status        text check (status in ('pending','done','skipped_404','failed')) default 'pending',
  attempts      int default 0,
  last_error    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (request_id, target_type, target_id)
);
alter table public.tenant_offboard_queue enable row level security;
-- No policies → service_role only.

create index if not exists tenant_offboard_queue_pending_idx
  on public.tenant_offboard_queue (created_at) where status = 'pending';
create index if not exists tenant_offboard_queue_request_idx
  on public.tenant_offboard_queue (request_id);

-- ── 3. SECURITY DEFINER setters (advance rows without granting raw UPDATE) ───
create or replace function public.offboard_mark_queue_item(
  p_id uuid, p_status text, p_last_error text default null, p_increment_attempts boolean default false)
  returns void
  language plpgsql security definer set search_path = public
as $$
begin
  if p_status not in ('pending','done','skipped_404','failed') then
    raise exception 'invalid queue status %', p_status;
  end if;
  update public.tenant_offboard_queue
     set status     = p_status,
         last_error = coalesce(p_last_error, last_error),
         attempts   = attempts + (case when p_increment_attempts then 1 else 0 end),
         updated_at = now()
   where id = p_id;
end;
$$;
revoke all on function public.offboard_mark_queue_item(uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function public.offboard_mark_queue_item(uuid, text, text, boolean) to service_role;

create or replace function public.offboard_set_audit_state(p_request_id uuid, p_final_state text)
  returns void
  language plpgsql security definer set search_path = public
as $$
begin
  if p_final_state not in ('committed','cleanup_partial','cleanup_complete','failed') then
    raise exception 'invalid final_state %', p_final_state;
  end if;
  perform set_config('app.offboard_audit_writer', 'on', true);   -- txn-local; lets the guard pass
  update public.tenant_offboard_audit set final_state = p_final_state where request_id = p_request_id;
  perform set_config('app.offboard_audit_writer', 'off', true);
end;
$$;
revoke all on function public.offboard_set_audit_state(uuid, text) from public, anon, authenticated;
grant execute on function public.offboard_set_audit_state(uuid, text) to service_role;

-- ── 4. admin_delete_tenant — REPLACE with the audited/outboxed signature ─────
-- New params change the arg signature, so the old 2-arg function must be DROPPED
-- (else Postgres keeps both overloads). Atomic within this migration txn.
drop function if exists public.admin_delete_tenant(uuid, boolean);

create function public.admin_delete_tenant(
  p_tenant_id        uuid,
  p_confirm          boolean default false,
  p_slug_confirmation text default null,
  p_request_id       uuid default null,
  p_operator_id      uuid default null,
  p_operator_email   text default null)
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
  v_request_id   uuid;
BEGIN
  -- (a) existence + protection guard — returns BEFORE any mutation (unchanged)
  SELECT slug, is_protected INTO v_slug, v_protected
  FROM public.tenants WHERE id = p_tenant_id;

  IF v_slug IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tenant_not_found', 'tenant_id', p_tenant_id);
  END IF;
  IF v_protected THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tenant_is_protected',
                              'tenant_id', p_tenant_id, 'slug', v_slug);
  END IF;

  -- capture pre-delete inventory (shared by dry-run + confirm)
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

  -- (dry-run) default: no mutation (unchanged shape)
  IF NOT p_confirm THEN
    RETURN jsonb_build_object(
      'ok', true, 'dry_run', true, 'tenant_id', p_tenant_id, 'slug', v_slug,
      'would_delete', v_counts,
      'admin_users', coalesce(to_jsonb(v_admin_users), '[]'::jsonb),
      'zernio_profiles', coalesce(to_jsonb(v_zernio), '[]'::jsonb),
      'note', 'pass p_confirm => true (with p_slug_confirmation) to execute');
  END IF;

  -- (b) single-flight guard — refuse concurrent offboards of the same tenant
  IF NOT pg_try_advisory_xact_lock(hashtext(p_tenant_id::text)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'offboard_in_progress', 'tenant_id', p_tenant_id);
  END IF;

  -- (c) typed-confirmation gate — slug must match (no mutation if not)
  IF p_slug_confirmation IS DISTINCT FROM v_slug THEN
    RETURN jsonb_build_object('ok', false, 'error', 'slug_mismatch', 'expected', v_slug);
  END IF;

  -- (e) EXECUTE — whole body is one txn => atomic (delete order unchanged)
  DELETE FROM public.service_areas WHERE tenant_id = p_tenant_id;  -- ON DELETE RESTRICT blocker
  DELETE FROM public.page_content  WHERE tenant_id = p_tenant_id;  -- no FK to tenants
  DELETE FROM public.tenants       WHERE id = p_tenant_id;          -- cascades ~15 tables

  -- resolve orphaned admin users (no longer in ANY tenant_users) and clear refs
  v_orphans := ARRAY(
    SELECT u FROM unnest(coalesce(v_admin_users, '{}'::uuid[])) AS u
    WHERE NOT EXISTS (SELECT 1 FROM public.tenant_users tu WHERE tu.user_id = u)
  );
  IF coalesce(array_length(v_orphans,1),0) > 0 THEN
    DELETE FROM public.user_roles WHERE user_id = ANY(v_orphans);
    DELETE FROM public.profiles   WHERE id      = ANY(v_orphans);
  END IF;

  -- (f) durable audit row INSIDE the delete txn (source of truth)
  v_request_id := coalesce(p_request_id, gen_random_uuid());
  INSERT INTO public.tenant_offboard_audit
    (request_id, tenant_id, slug_snapshot, operator_id, operator_email, mode,
     preview_counts, committed_orphan_auth_ids, committed_zernio_ids, final_state)
  VALUES
    (v_request_id, p_tenant_id, v_slug, p_operator_id, p_operator_email, 'confirm',
     v_counts, v_orphans, v_zernio, 'committed');

  -- (g) outbox rows: one per orphan auth user + one per zernio profile
  INSERT INTO public.tenant_offboard_queue (request_id, tenant_id, slug_snapshot, target_type, target_id)
  SELECT v_request_id, p_tenant_id, v_slug, 'auth_user', u::text
  FROM unnest(coalesce(v_orphans, '{}'::uuid[])) AS u
  ON CONFLICT (request_id, target_type, target_id) DO NOTHING;

  INSERT INTO public.tenant_offboard_queue (request_id, tenant_id, slug_snapshot, target_type, target_id)
  SELECT v_request_id, p_tenant_id, v_slug, 'zernio', z
  FROM unnest(coalesce(v_zernio, '{}'::text[])) AS z
  WHERE coalesce(z,'') <> ''
  ON CONFLICT (request_id, target_type, target_id) DO NOTHING;

  -- (h) convenience return; tables are the source of truth
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

revoke all on function public.admin_delete_tenant(uuid, boolean, text, uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.admin_delete_tenant(uuid, boolean, text, uuid, uuid, text)
  to service_role;

-- ── 5. reload PostgREST schema cache ─────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
-- ============================================================================
-- END S245 PR1 forward migration.
-- ============================================================================
