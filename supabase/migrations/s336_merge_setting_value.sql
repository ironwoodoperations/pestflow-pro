-- S336 — the DATABASE-SIDE settings merge. Three pure functions.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- UNTIMESTAMPED ON PURPOSE. READ THIS BEFORE RENAMING IT.
--
-- This DDL is ALREADY APPLIED to production, via apply_migration, stamped in
-- supabase_migrations.schema_migrations as `s336_merge_setting_value`.
-- apply_migration writes no file, so the repo had no record of it. This file IS
-- that record: so a fresh database reproduces the same state, and so a reader
-- can see the bodies without querying production.
--
-- A timestamped name would place it in the normal apply order and re-run DDL
-- that is already applied. CREATE OR REPLACE makes that harmless, but the
-- guards are the seatbelt and the name is the reason.
--
-- BODIES READ FROM THE LIVE OBJECTS on 2026-09-04 with pg_get_functiondef(),
-- volatility/parallel/security from pg_proc, grants from
-- information_schema.routine_privileges. Not transcribed from a brief.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- WHY THIS EXISTS. provision-tenant reads a settings row, merges in TypeScript,
-- and upserts — three round trips per key and a lost-update window between the
-- read and the write. S330 shipped the closest safe alternative reachable
-- without a migration and explicitly did NOT claim to have closed that race.
-- Closing it needs the merge to happen INSIDE one statement, which needs these.
--
-- THE S334 GATE, Perplexity condition 8, is explicit that a bare `jsonb ||` is
-- NOT acceptable and that a GENERIC deep merge is NOT acceptable either. Both
-- would corrupt real data:
--   * `||` alone is shallow but has no empty-overlay rule, so a re-provision
--     writing `wizard.x || body.x || ''` blanks every field the operator left
--     empty.
--   * a deep merge would recursively combine `hours_structured` and
--     `integrations.zernio_accounts` instead of replacing them, inventing
--     hybrid objects that were never written.
-- So: SHALLOW, with a per-key policy, and business_info validated as GROUPS.
--
-- ONE COROLLARY WORTH STATING, because it is counter-intuitive: blanking ONE
-- member of the address quad preserves the WHOLE OLD ADDRESS. The blank is
-- dropped as an empty overwrite, which leaves three of four, and the group
-- check then drops all three. NOT three updated and one kept — that would be an
-- old street with a new ZIP.
--
-- NOT SECURITY DEFINER, deliberately. These are pure functions over their
-- arguments: they read no table and need no privilege of their own. The caller
-- (service_role, and later the provisioning RPC) already has what it needs.
-- SET search_path = '' with every object schema-qualified, so an attacker who
-- can create objects cannot shadow a call inside them.
--
-- IMMUTABLE is load-bearing for the pgTAP suite, which calls them in a plain
-- SELECT over a VALUES list.

-- ── 1. Is this overlay value "nothing the operator typed"? ──────────────────
-- The database twin of isEmptyOverlayValue in shared/lib/settingsMerge.ts.
--
-- `false` and `0` are NOT empty. They are meaningful settings values
-- (demo_mode.active, seo.noindex, subscription.tier) and treating them as
-- absent is the falsy bug this codebase already paid for in S325.
--
-- An empty ARRAY *is* empty: provision-tenant writes `seo.service_areas: []` as
-- a placeholder for a later step to repair, and that placeholder must not wipe
-- a populated list when the later step is skipped or fails.
CREATE OR REPLACE FUNCTION public.jsonb_is_empty_overlay(v jsonb)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
 SET search_path TO ''
AS $function$
  SELECT v IS NULL
      OR jsonb_typeof(v) = 'null'
      OR (jsonb_typeof(v) = 'string' AND (v #>> '{}') = '')
      OR (jsonb_typeof(v) = 'array'  AND jsonb_array_length(v) = 0)
$function$;

-- ── 2. Drop overlay entries that would replace real data with nothing ───────
-- The twin of dropEmptyOverwrites. Returned as a NEW overlay rather than
-- applied, so it composes: business_info runs this first and then applies the
-- grouped-key rules to what survives. Two rules, each in one place.
--
-- Note the condition: an empty overlay value is dropped ONLY when the existing
-- value is non-empty. Writing '' over an absent or already-empty key is allowed,
-- because that is not destruction.
CREATE OR REPLACE FUNCTION public.jsonb_drop_empty_overwrites(p_existing jsonb, p_overlay jsonb)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
 SET search_path TO ''
AS $function$
  SELECT COALESCE(jsonb_object_agg(o.k, o.v), '{}'::jsonb)
  FROM jsonb_each(COALESCE(p_overlay, '{}'::jsonb)) AS o(k, v)
  WHERE NOT (
        public.jsonb_is_empty_overlay(o.v)
    AND NOT public.jsonb_is_empty_overlay(COALESCE(p_existing, '{}'::jsonb) -> o.k)
  )
$function$;

-- ── 3. THE merge ────────────────────────────────────────────────────────────
-- Everything in `existing` survives unless the overlay names it with a
-- meaningful value. Deleting a key is deliberately not expressible: every
-- caller writes a subset, and a merge that could also delete would reintroduce
-- the whole-replacement defect it exists to prevent.
--
-- SHALLOW for every key except business_info. Nested objects and arrays are
-- replaced WHOLE — `integrations.zernio_accounts` and `hours_structured` are
-- owned values, not things to deep-merge.
--
-- business_info alone gets grouped-key validation, because
-- business_info_structured_shape is a CHECK: a partial address quad, a lone
-- latitude, or hours_structured with no timezone raises 23514 and fails the
-- WHOLE upsert. Validating the groups BEFORE the row write turns a transaction
-- abort into a dropped field.
CREATE OR REPLACE FUNCTION public.merge_setting_value(p_existing jsonb, p_overlay jsonb, p_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE PARALLEL SAFE
 SET search_path TO ''
AS $function$
DECLARE
  base    jsonb := COALESCE(p_existing, '{}'::jsonb);
  ov      jsonb;
  out     jsonb;
  k       text;
  v       jsonb;
  quad    text[] := ARRAY['street_address','address_locality','address_region','postal_code'];
  quad_n  int;
  ll_n    int;
  quad_ok boolean;
  ll_ok   boolean;
  tz_ok   boolean;
BEGIN
  IF p_existing IS NOT NULL AND jsonb_typeof(p_existing) <> 'object' THEN
    RAISE EXCEPTION 'merge_setting_value: existing value for key % is %, expected object',
      p_key, jsonb_typeof(p_existing) USING ERRCODE = '22023';
  END IF;
  IF p_overlay IS NOT NULL AND jsonb_typeof(p_overlay) <> 'object' THEN
    RAISE EXCEPTION 'merge_setting_value: overlay for key % is %, expected object',
      p_key, jsonb_typeof(p_overlay) USING ERRCODE = '22023';
  END IF;

  ov := public.jsonb_drop_empty_overwrites(base, p_overlay);

  -- Every key EXCEPT business_info: shallow merge. Nested objects and arrays are
  -- replaced whole -- see the per-key note in the migration header.
  IF p_key IS DISTINCT FROM 'business_info' THEN
    RETURN base || ov;
  END IF;

  -- ── business_info: the grouped-key rules from shared/lib/businessInfoMerge.ts ──
  -- These exist because business_info_structured_shape is a CHECK: a partial
  -- address quad, a lone latitude, or hours_structured without timezone raises
  -- 23514 and fails the WHOLE upsert. Validated as GROUPS, before the row write.
  SELECT count(*) INTO quad_n FROM unnest(quad) AS q WHERE ov ? q;
  quad_ok := quad_n IN (0, 4);

  SELECT count(*) INTO ll_n
  FROM unnest(ARRAY['latitude','longitude']) AS g WHERE ov ? g;
  ll_ok := ll_n IN (0, 2);

  -- hours_structured is legal only when timezone is present in the RESULT --
  -- from the overlay or from what was already there. NOT symmetric: timezone
  -- alone is fine.
  tz_ok := (ov ? 'timezone') OR (base ? 'timezone');

  out := base;
  FOR k, v IN SELECT o.key, o.value FROM jsonb_each(ov) AS o(key, value) LOOP
    CONTINUE WHEN k = 'year_founded';                        -- business_info_no_year_founded
    CONTINUE WHEN k = ANY(quad) AND NOT quad_ok;
    CONTINUE WHEN k IN ('latitude','longitude') AND NOT ll_ok;
    CONTINUE WHEN k = 'hours_structured' AND NOT tz_ok;
    out := out || jsonb_build_object(k, v);
  END LOOP;

  -- Stripped from BOTH sides: the forbidden key can never appear in the output,
  -- even if the existing row somehow carries one.
  RETURN out - 'year_founded';
END;
$function$;

-- ── Grants ──────────────────────────────────────────────────────────────────
-- Postgres grants EXECUTE to PUBLIC by default on function creation, and
-- CREATE OR REPLACE does NOT reset grants — but a future DROP-and-recreate
-- would restore the default, so the revokes are restated here rather than
-- assumed. Live state on 2026-09-04: postgres:EXECUTE, service_role:EXECUTE,
-- and nothing for anon or authenticated.
DO $$
DECLARE sig text;
BEGIN
  FOREACH sig IN ARRAY ARRAY[
    'public.jsonb_is_empty_overlay(jsonb)',
    'public.jsonb_drop_empty_overwrites(jsonb, jsonb)',
    'public.merge_setting_value(jsonb, jsonb, text)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, authenticated', sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', sig);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
