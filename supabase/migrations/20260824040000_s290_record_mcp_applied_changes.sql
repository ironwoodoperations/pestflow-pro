-- S290 — give a file to two changes that were applied through MCP and never had one.
--
-- Neither of these alters live state. Both are written so that re-applying them
-- against the current database is a no-op, and so that a database rebuilt from
-- migrations alone arrives at the same place. They exist because "applied via
-- MCP" and "in the repo" are different things, and the gap between them is
-- invisible until someone rebuilds.
--
-- WHAT THIS DOES NOT TRY TO FIX. 143 rows in supabase_migrations
-- .schema_migrations are stamped with no corresponding file, because
-- mcp__Supabase__apply_migration records a version without writing one. That is
-- a known, separate problem: reconciling it means reconstructing 143 statements
-- from live schema, and doing it half-way is worse than leaving it legible.
-- These two are in scope only because S289 and S290 depend on them directly.

-- ── 1. The ai-authority-dispatch cron ───────────────────────────────────────
--
-- Enqueues one ai_authority_jobs row per (tenant, prompt, enabled engine).
-- It was created via MCP and later moved from daily to MONTHLY to control
-- spend; the live schedule is '0 4 1 * *' (04:00 UTC on the 1st) and this
-- records that, it does not change it. S289's cost table is calculated against
-- this schedule — per-run equals per-month only because of this line.
--
-- cron.schedule() upserts by job name, so re-running rewrites the same values.
-- Guarded on pg_cron being installed so a local stack without it still applies.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'ai-authority-dispatch',
      '0 4 1 * *',
      'SELECT public.ai_authority_dispatch();'
    );
  else
    raise notice 's290: pg_cron not installed — skipping ai-authority-dispatch schedule';
  end if;
end $$;

-- ── 2. The settings.business_info.vertical backfill ─────────────────────────
--
-- 20260823210305_s281_business_info_vertical_check.sql added the CHECK
-- constraint but backfilled no values — at that point eight of nine tenants had
-- a NULL vertical. The values were set later, by hand through MCP, with no file.
-- Every vertical-keyed preset shipped in S283-S289 reads this column, so a
-- rebuild without it produces a platform where every preset resolves to neutral.
--
-- WRITES ONLY WHERE THE VERTICAL IS ABSENT. A tenant that already has one keeps
-- it, including a tenant that has since been corrected. This is a floor, not an
-- overwrite.
--
-- vita-glow is deliberately ABSENT from this list. Its trade is medical
-- aesthetics, which the CHECK constraint does not accept and no preset covers,
-- so its vertical stays NULL and it resolves to neutral copy. That is the
-- correct state, not a gap — see NEUTRAL_ADMIN_PRESET.
update public.settings s
set value = s.value || jsonb_build_object('vertical', v.vertical)
from (values
  ('dang',                 'pest'),
  ('pestflow-pro',         'pest'),
  ('apex-protect',         'pest'),
  ('coastal-pest',         'pest'),
  ('heartland-pest',       'pest'),
  ('metro-pest-concierge', 'pest'),
  ('urban-strike',         'pest'),
  ('pls',                  'irrigation')
) as v(slug, vertical)
join public.tenants t on t.slug = v.slug
where s.tenant_id = t.id
  and s.key = 'business_info'
  and s.value->>'vertical' is null;

notify pgrst, 'reload schema';
