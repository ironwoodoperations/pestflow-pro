-- ============================================================================
-- S245 PR2 — vault-read auth helper for process-offboard-queue (STAGED)
-- ============================================================================
-- Apply via MCP BEFORE deploying process-offboard-queue. An edge fn (supabase-js
-- / PostgREST) cannot read the `vault` schema directly, so — mirroring the
-- trigger_notify_new_lead precedent of reading vault inside a SECURITY DEFINER
-- function — this getter returns the one internal key the cron worker needs.
-- service_role-only; never exposed to anon/authenticated.
-- Prereq: vault secret `process_offboard_queue_internal_secret` (already staged).
-- ============================================================================

create or replace function public.offboard_queue_internal_secret()
  returns text
  language sql
  security definer
  set search_path = public
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'process_offboard_queue_internal_secret';
$$;

revoke all on function public.offboard_queue_internal_secret() from public, anon, authenticated;
grant execute on function public.offboard_queue_internal_secret() to service_role;

NOTIFY pgrst, 'reload schema';
-- Rollback: DROP FUNCTION IF EXISTS public.offboard_queue_internal_secret();
