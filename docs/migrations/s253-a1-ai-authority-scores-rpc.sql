-- S253 / A1 — AI Authority scoring RPC (OPERATOR-APPLIED via MCP).
--
-- This is a checked-in artifact, NOT auto-applied (supabase/migrations/ is
-- protected; the worker code ships in the same PR). Apply this alongside the
-- dispatch/drain cron functions as the final wiring step.
--
-- WHY an RPC: the score denominator is "total scheduled jobs per (tenant, engine,
-- window)", which lives in ai_authority_jobs. That table is operator-only RLS — a
-- tenant's Reports tile cannot read it. This SECURITY DEFINER function returns the
-- per-engine, per-week aggregates the tile needs, after asserting the caller owns
-- the tenant (or is the Ironwood operator). It exposes ONLY counts — never
-- raw_response. The frontend scorer turns these aggregates into 0-100 scores +
-- EWMA trendlines.
--
-- Denominator rule (validator #1 silent-wrong-score fix): denom = jobs in terminal
-- measurement states ('done','error') — an 'error' job has NO snapshot, so counting
-- it correctly LOWERS the rate instead of being silently dropped. 'pending'/'running'
-- (not yet attempted) and 'skipped_cost_cap' (deliberate cost/disabled skip) are
-- excluded. The numerators come from snapshots. Trailing 56-day (8-week) window.

create or replace function public.get_ai_authority_scores(p_tenant uuid)
returns table (
  engine        public.ai_authority_engine,
  week_index    int,          -- 0 = current week ... 7 = 8 weeks ago
  week_start    date,
  denom         int,          -- scheduled measurement attempts (done + error)
  completed     int,          -- 'done' jobs (for the 40-run calibration threshold)
  snapshots     int,          -- snapshot rows present (≈ completed)
  cited         int,
  mentioned     int,
  position_sum  bigint,       -- sum of non-null positions (avg = sum/n in app)
  position_n    int,
  sov_sum       numeric,      -- sum of non-null share_of_voice
  sov_n         int
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_master constant uuid := '9215b06b-3eb5-49a1-a16e-7ff214bf6783';
begin
  -- Authorization: caller must own the tenant, or be the Ironwood operator.
  if current_tenant_id() is distinct from p_tenant
     and current_tenant_id() is distinct from v_master then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with jobs_b as (
    select
      j.engine,
      floor(extract(epoch from (now() - j.scheduled_for)) / 604800)::int as wk,
      count(*) filter (where j.status in ('done','error')) as denom,
      count(*) filter (where j.status = 'done')            as completed
    from ai_authority_jobs j
    where j.tenant_id = p_tenant
      and j.scheduled_for >= now() - interval '56 days'
      and j.scheduled_for <= now()
    group by 1, 2
  ),
  snaps_b as (
    select
      s.engine,
      floor(extract(epoch from (now() - s.captured_at)) / 604800)::int as wk,
      count(*)                                                   as snapshots,
      count(*) filter (where s.cited)                            as cited,
      count(*) filter (where s.mentioned and not s.parse_failed) as mentioned,
      coalesce(sum(s.position) filter (where s.position is not null), 0) as position_sum,
      count(s.position)                                          as position_n,
      coalesce(sum(s.share_of_voice) filter (where s.share_of_voice is not null), 0) as sov_sum,
      count(s.share_of_voice)                                    as sov_n
    from ai_authority_snapshots s
    where s.tenant_id = p_tenant
      and s.captured_at >= now() - interval '56 days'
    group by 1, 2
  )
  select
    coalesce(jb.engine, sb.engine)                         as engine,
    coalesce(jb.wk, sb.wk)                                 as week_index,
    (now()::date - (coalesce(jb.wk, sb.wk) * 7))           as week_start,
    coalesce(jb.denom, 0)                                  as denom,
    coalesce(jb.completed, 0)                              as completed,
    coalesce(sb.snapshots, 0)                              as snapshots,
    coalesce(sb.cited, 0)                                  as cited,
    coalesce(sb.mentioned, 0)                              as mentioned,
    coalesce(sb.position_sum, 0)                           as position_sum,
    coalesce(sb.position_n, 0)                             as position_n,
    coalesce(sb.sov_sum, 0)                                as sov_sum,
    coalesce(sb.sov_n, 0)                                  as sov_n
  from jobs_b jb
  full outer join snaps_b sb on sb.engine = jb.engine and sb.wk = jb.wk
  where coalesce(jb.wk, sb.wk) between 0 and 7
  order by 1, 2;
end;
$$;

revoke all on function public.get_ai_authority_scores(uuid) from public;
grant execute on function public.get_ai_authority_scores(uuid) to authenticated;

notify pgrst, 'reload schema';

-- ── Rollback ────────────────────────────────────────────────────────────────
-- drop function if exists public.get_ai_authority_scores(uuid);
-- notify pgrst, 'reload schema';
