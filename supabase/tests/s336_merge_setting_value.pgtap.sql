-- S336 — the SQL half of the SHARED merge corpus.
--
-- The S334 gate (Perplexity condition 8) requires the TypeScript merge and the
-- PL/pgSQL merge to be tested against the SAME cases until the TS path no
-- longer performs persistence merges. The other half is
-- shared/lib/settingsMerge.corpus.test.ts, reading THIS SAME FILE:
--
--     shared/fixtures/settingsMergeCorpus.json
--
-- ONE data file, TWO consumers. Two corpora would drift, and drift is the
-- defect this whole arc removes. A case that passes vitest and fails here IS
-- THE FINDING — do not "fix" it by editing the expectation on one side.
--
-- The corpus is read at run time with psql's \set + backticks rather than being
-- restated here, so there is no second copy to fall out of date.

\set corpus_json `cat shared/fixtures/settingsMergeCorpus.json`

begin;
create extension if not exists pgtap;

create temp table corpus on commit drop as
select
  c->>'id'                                                                     as id,
  c->>'key'                                                                    as setting_key,
  case when jsonb_typeof(c->'existing') = 'null' then null else c->'existing' end as existing,
  c->'overlay'                                                                 as overlay,
  c->'expected'                                                                as expected
from jsonb_array_elements((:'corpus_json'::jsonb) -> 'cases') as t(c);

-- One assertion per case, plus the fixed assertions below.
select plan((select count(*)::int from corpus) + 9);

-- ── ANTI-VACUITY FIRST ───────────────────────────────────────────────────────
-- A per-case loop over an EMPTY corpus passes silently and proves nothing. If
-- the file failed to load, or \set produced an empty string, these fail loudly
-- before any merge is exercised.
select cmp_ok((select count(*)::int from corpus), '>=', 28,
  'corpus loaded and holds at least the 28 verified cases');

select cmp_ok((select count(*)::int from corpus where setting_key = 'business_info'), '>=', 10,
  'corpus exercises the business_info grouped-key path');

select cmp_ok((select count(*)::int from corpus where setting_key <> 'business_info'), '>=', 10,
  'corpus exercises the generic shallow path');

select is((select count(distinct id)::int from corpus), (select count(*)::int from corpus),
  'every case id is unique');

-- ── THE CORPUS ───────────────────────────────────────────────────────────────
select is(
  public.merge_setting_value(existing, overlay, setting_key),
  expected,
  id
) from corpus;

-- ── The merge is neither identity nor replacement ────────────────────────────
-- Every case above is an equality against a literal, so a merge returning
-- `existing` unchanged would satisfy a surprising number of them. These pin
-- both bounds directly.
select is(
  public.merge_setting_value('{"a":"old"}'::jsonb, '{"a":"new"}'::jsonb, 'branding'),
  '{"a":"new"}'::jsonb,
  'NOT identity: a non-empty overlay value wins');

select is(
  public.merge_setting_value('{"a":"keep"}'::jsonb, '{"b":"new"}'::jsonb, 'branding'),
  '{"a":"keep","b":"new"}'::jsonb,
  'NOT replacement: an unnamed existing key survives');

-- ── The helper must NOT reimplement the secret strip ─────────────────────────
-- trg_strip_settings_secrets stays authoritative. A second copy of the vault
-- key list inside the merge is exactly the drift this arc removes, so the merge
-- must pass those keys through untouched and let the trigger strip them at the
-- row write. If someone "helpfully" adds stripping here, this fails.
select is(
  public.merge_setting_value(
    '{}'::jsonb,
    '{"facebook_access_token":"tok","ga4_oauth_refresh_token":"r","gsc_oauth_refresh_token":"g","textbelt_api_key":"k"}'::jsonb,
    'integrations'),
  '{"facebook_access_token":"tok","ga4_oauth_refresh_token":"r","gsc_oauth_refresh_token":"g","textbelt_api_key":"k"}'::jsonb,
  'merge does NOT strip vault keys — the trigger is the only stripper');

-- WHY THE TRIGGER ITSELF IS NOT ASSERTED HERE, and what was done instead.
--
-- The brief asks to assert trg_strip_settings_secrets still fires on a write
-- whose value came through the helper. It cannot run in THIS job: the CI fixture
-- schema has no settings table, and -- the finding -- public.strip_settings_secrets
-- HAS NO MIGRATION FILE IN THE REPO. It is a third live object created by
-- apply_migration without one (tenant_services and these merge functions were the
-- first two). There is nothing for CI to install, and writing a copy into a
-- fixture is exactly the second copy of the vault key list this arc removes.
--
-- So it was verified against PRODUCTION on 2026-09-04 instead, inside a
-- transaction that was rolled back: a value built by merge_setting_value carrying
-- all four vault keys was upserted into settings.integrations, and the trigger
-- stripped all four while a non-secret key in the same object survived. Rollback
-- verified clean afterwards -- no residue in the row, no observation row, and
-- updated_at unmoved.
--
-- What IS asserted here is the half that belongs to this PR and is testable: the
-- merge does not strip those keys itself, so the trigger remains the only
-- stripper. Writing a migration file for strip_settings_secrets is its own task.

-- ── Grants ───────────────────────────────────────────────────────────────────
-- Postgres grants EXECUTE to PUBLIC by default on function creation. The
-- migration revokes it; this asserts the LIVE catalog rather than the migration
-- text, which is the only thing that can catch a drop-and-recreate restoring
-- the default.
select ok(
  not has_function_privilege('anon', 'public.merge_setting_value(jsonb,jsonb,text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.merge_setting_value(jsonb,jsonb,text)', 'EXECUTE'),
  'merge_setting_value: no anon or authenticated EXECUTE');

select ok(
  has_function_privilege('service_role', 'public.merge_setting_value(jsonb,jsonb,text)', 'EXECUTE'),
  'merge_setting_value: service_role CAN execute');

select * from finish();
rollback;
