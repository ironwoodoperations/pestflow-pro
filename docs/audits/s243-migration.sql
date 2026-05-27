-- S243 — AI proxy backing objects.
-- STAGED REFERENCE ONLY — not under supabase/migrations/ (that dir is protected).
-- Scott applies this via Supabase MCP (apply_migration) from the orchestration
-- chat when Wave 3 code is ready to deploy. See cutover runbook A2.9 step 2.
--
-- (1) ai_proxy_log — one row per terminal proxy outcome (success AND rejections),
--     for billing + abuse attribution. Service-role only (RLS denies by default).
-- (2) check_and_record_rate_limit — atomic per-key window check (advisory lock
--     serializes check+insert; kills the select-then-insert race). search_path=''
--     hardening for the SECURITY DEFINER function.
-- (3) supporting index on rate_limit_events(key, created_at).

-- ── (1) ai_proxy_log ────────────────────────────────────────────────────────
create table if not exists public.ai_proxy_log (
  id            bigserial primary key,
  tenant_id     uuid,            -- null if rejected before tenant resolves
  user_id       uuid,            -- null on 401 (no JWT)
  feature       text,            -- null if 400 invalid-feature
  model         text,            -- null for non-Anthropic outcomes
  input_tokens  int,             -- null unless Anthropic responded
  output_tokens int,             -- null unless Anthropic responded
  status        int not null,    -- 200 | 400 | 401 | 403 | 429 | upstream 4xx/5xx
  created_at    timestamptz not null default now()
);

alter table public.ai_proxy_log enable row level security;
-- No policies → only the service role (which bypasses RLS) can read/write.

create index if not exists ai_proxy_log_tenant_time_idx
  on public.ai_proxy_log (tenant_id, created_at desc);
create index if not exists ai_proxy_log_feature_status_idx
  on public.ai_proxy_log (feature, status, created_at desc);

-- ── (2) atomic rate-limit function (R4) ─────────────────────────────────────
create or replace function public.check_and_record_rate_limit(
  p_key text,
  p_window_seconds int,
  p_max_count int
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  -- serialize check+insert per key within this transaction
  perform pg_advisory_xact_lock(hashtext(p_key));
  select count(*) into v_count
    from public.rate_limit_events
    where key = p_key
      and created_at >= now() - (p_window_seconds || ' seconds')::interval;
  if v_count >= p_max_count then
    return false;
  end if;
  insert into public.rate_limit_events(key) values (p_key);
  return true;
end;
$$;

revoke all on function public.check_and_record_rate_limit(text, int, int) from public, anon, authenticated;

-- ── (3) supporting index ────────────────────────────────────────────────────
-- NOTE: rate_limit_events_key_time_idx (key, created_at DESC) from
-- 20260511000000_s213a_rate_limit_events.sql already serves the count query.
-- This ASC index is added per explicit request; safe to drop if deemed
-- redundant in review.
create index if not exists rate_limit_events_key_created_at_idx
  on public.rate_limit_events (key, created_at);
