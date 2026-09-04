-- S341 STEP 4 — widen settings_business_info_vertical_valid to admit 'lawn'.
--
-- ⚠️  NOT APPLIED BY THE PR THAT ADDS THIS FILE, AND THE ORDER IS THE POINT.
--
-- CC Web cannot apply migrations. Claude.ai applies this via MCP AFTER the PR
-- merges, once steps 1-3 are on main:
--
--   1. supabase/functions/_shared/provisioningSeed.ts  SEED_VERTICALS + VERTICAL_SEED.lawn
--   2. shared/lib/businessInfoMerge.ts                 checkBusinessInfoShape's literal
--   3. src/lib/adminVerticalPreset.ts                  VERTICAL_OPTIONS
--   4. THIS FILE                                       the CHECK
--
-- WHY LAST, and this is not ceremony. getVerticalCopy and getSchemaVocabulary
-- both THROW for a vertical that has no preset, and both are called from
-- layout.tsx. Widen the CHECK before the presets ship and a single JSONB edit
-- — `settings.value->>'vertical' = 'lawn'` on one row, no deploy involved —
-- 500s that tenant's entire public site.
--
-- A key with no constraint behind it is inert. A constraint with no key behind
-- it is an outage. So the keys land first and this lands last.
--
-- Until this is applied, choosing lawn in the wizard fails at WRITE TIME with
-- 23514. That is the safe failure, and it is the intended state between merge
-- and apply.
--
-- UNTIMESTAMPED DELIBERATELY. A <timestamp>_*.sql name is one the CLI applies
-- in the normal order. This is applied out of band via MCP, so a timestamped
-- name would re-run the same DDL a second time.
--
-- The pre-change definition, read from pg_constraint before writing this file
-- rather than transcribed:
--
--   CHECK (((key <> 'business_info'::text)
--       OR ((value ->> 'vertical'::text) IS NULL)
--       OR ((value ->> 'vertical'::text) = ANY (ARRAY['pest'::text, 'irrigation'::text]))))
--
-- The only change below is 'lawn' joining that ARRAY. The key <> 'business_info'
-- and IS NULL escapes are preserved verbatim: the first leaves every other
-- settings key unconstrained, the second keeps an unrecorded vertical legal,
-- and dropping either would reject rows that are valid today.

alter table public.settings
  drop constraint if exists settings_business_info_vertical_valid;

alter table public.settings
  add constraint settings_business_info_vertical_valid
  check (
    key <> 'business_info'
    or (value ->> 'vertical') is null
    or (value ->> 'vertical') = any (array['pest', 'irrigation', 'lawn'])
  );
