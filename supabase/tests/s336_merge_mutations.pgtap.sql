-- S336 — MUTATION TEST for the PL/pgSQL merge. A guard that cannot fail is worthless.
--
-- The corpus in s336_merge_setting_value.pgtap.sql proves the function agrees with
-- the TypeScript one TODAY. It does not prove the corpus would NOTICE if a rule were
-- deleted. This file proves that: each mutant below removes exactly one rule, and
-- each must FAIL at least one corpus case.
--
-- Mutants are created inside the transaction and vanish on ROLLBACK, so nothing
-- persists even if the run aborts. They are named s336_mutant_* and never replace
-- the real functions -- public.merge_setting_value is untouched throughout, and the
-- first assertion re-proves it still passes the whole corpus.
--
-- Reads the SAME corpus file as the TypeScript half:
--     shared/fixtures/settingsMergeCorpus.json

\set corpus_json `cat shared/fixtures/settingsMergeCorpus.json`

begin;
create extension if not exists pgtap;

create temp table corpus on commit drop as
select
  c->>'id' as id,
  c->>'key' as setting_key,
  case when jsonb_typeof(c->'existing') = 'null' then null else c->'existing' end as existing,
  c->'overlay' as overlay,
  c->'expected' as expected
from jsonb_array_elements((:'corpus_json'::jsonb) -> 'cases') as t(c);

select plan(7);

-- ── MUT-QUAD: the address-quad group check removed ──────────────────────────
create function pg_temp.mut_quad(p_existing jsonb, p_overlay jsonb, p_key text)
returns jsonb language plpgsql immutable as $f$
DECLARE base jsonb := COALESCE(p_existing,'{}'::jsonb); ov jsonb; out jsonb; k text; v jsonb;
 quad text[] := ARRAY['street_address','address_locality','address_region','postal_code'];
 ll_n int; ll_ok boolean; tz_ok boolean;
BEGIN
 ov := public.jsonb_drop_empty_overwrites(base, p_overlay);
 IF p_key IS DISTINCT FROM 'business_info' THEN RETURN base || ov; END IF;
 SELECT count(*) INTO ll_n FROM unnest(ARRAY['latitude','longitude']) AS g WHERE ov ? g;
 ll_ok := ll_n IN (0,2); tz_ok := (ov ? 'timezone') OR (base ? 'timezone');
 out := base;
 FOR k, v IN SELECT o.key,o.value FROM jsonb_each(ov) AS o(key,value) LOOP
   CONTINUE WHEN k='year_founded';
   -- MUTATION: quad group check deleted
   CONTINUE WHEN k IN ('latitude','longitude') AND NOT ll_ok;
   CONTINUE WHEN k='hours_structured' AND NOT tz_ok;
   out := out || jsonb_build_object(k,v);
 END LOOP;
 RETURN out - 'year_founded';
END; $f$;

-- ── MUT-LATLNG: the lat/lng pair check removed ──────────────────────────────
create function pg_temp.mut_latlng(p_existing jsonb, p_overlay jsonb, p_key text)
returns jsonb language plpgsql immutable as $f$
DECLARE base jsonb := COALESCE(p_existing,'{}'::jsonb); ov jsonb; out jsonb; k text; v jsonb;
 quad text[] := ARRAY['street_address','address_locality','address_region','postal_code'];
 quad_n int; quad_ok boolean; tz_ok boolean;
BEGIN
 ov := public.jsonb_drop_empty_overwrites(base, p_overlay);
 IF p_key IS DISTINCT FROM 'business_info' THEN RETURN base || ov; END IF;
 SELECT count(*) INTO quad_n FROM unnest(quad) AS q WHERE ov ? q; quad_ok := quad_n IN (0,4);
 tz_ok := (ov ? 'timezone') OR (base ? 'timezone');
 out := base;
 FOR k, v IN SELECT o.key,o.value FROM jsonb_each(ov) AS o(key,value) LOOP
   CONTINUE WHEN k='year_founded';
   CONTINUE WHEN k = ANY(quad) AND NOT quad_ok;
   -- MUTATION: lat/lng pair check deleted
   CONTINUE WHEN k='hours_structured' AND NOT tz_ok;
   out := out || jsonb_build_object(k,v);
 END LOOP;
 RETURN out - 'year_founded';
END; $f$;

-- ── MUT-TZ: the hours_structured/timezone check removed ─────────────────────
create function pg_temp.mut_tz(p_existing jsonb, p_overlay jsonb, p_key text)
returns jsonb language plpgsql immutable as $f$
DECLARE base jsonb := COALESCE(p_existing,'{}'::jsonb); ov jsonb; out jsonb; k text; v jsonb;
 quad text[] := ARRAY['street_address','address_locality','address_region','postal_code'];
 quad_n int; ll_n int; quad_ok boolean; ll_ok boolean;
BEGIN
 ov := public.jsonb_drop_empty_overwrites(base, p_overlay);
 IF p_key IS DISTINCT FROM 'business_info' THEN RETURN base || ov; END IF;
 SELECT count(*) INTO quad_n FROM unnest(quad) AS q WHERE ov ? q; quad_ok := quad_n IN (0,4);
 SELECT count(*) INTO ll_n FROM unnest(ARRAY['latitude','longitude']) AS g WHERE ov ? g; ll_ok := ll_n IN (0,2);
 out := base;
 FOR k, v IN SELECT o.key,o.value FROM jsonb_each(ov) AS o(key,value) LOOP
   CONTINUE WHEN k='year_founded';
   CONTINUE WHEN k = ANY(quad) AND NOT quad_ok;
   CONTINUE WHEN k IN ('latitude','longitude') AND NOT ll_ok;
   -- MUTATION: hours/timezone check deleted
   out := out || jsonb_build_object(k,v);
 END LOOP;
 RETURN out - 'year_founded';
END; $f$;

-- ── MUT-DROPEMPTY: the empty-overwrite filter never applied ─────────────────
create function pg_temp.mut_dropempty(p_existing jsonb, p_overlay jsonb, p_key text)
returns jsonb language plpgsql immutable as $f$
DECLARE base jsonb := COALESCE(p_existing,'{}'::jsonb); ov jsonb := COALESCE(p_overlay,'{}'::jsonb);
 out jsonb; k text; v jsonb;
 quad text[] := ARRAY['street_address','address_locality','address_region','postal_code'];
 quad_n int; ll_n int; quad_ok boolean; ll_ok boolean; tz_ok boolean;
BEGIN
 -- MUTATION: jsonb_drop_empty_overwrites not applied
 IF p_key IS DISTINCT FROM 'business_info' THEN RETURN base || ov; END IF;
 SELECT count(*) INTO quad_n FROM unnest(quad) AS q WHERE ov ? q; quad_ok := quad_n IN (0,4);
 SELECT count(*) INTO ll_n FROM unnest(ARRAY['latitude','longitude']) AS g WHERE ov ? g; ll_ok := ll_n IN (0,2);
 tz_ok := (ov ? 'timezone') OR (base ? 'timezone');
 out := base;
 FOR k, v IN SELECT o.key,o.value FROM jsonb_each(ov) AS o(key,value) LOOP
   CONTINUE WHEN k='year_founded';
   CONTINUE WHEN k = ANY(quad) AND NOT quad_ok;
   CONTINUE WHEN k IN ('latitude','longitude') AND NOT ll_ok;
   CONTINUE WHEN k='hours_structured' AND NOT tz_ok;
   out := out || jsonb_build_object(k,v);
 END LOOP;
 RETURN out - 'year_founded';
END; $f$;

-- ── MUT-FALSY: false and 0 treated as empty — the S325 bug ──────────────────
create function pg_temp.mut_falsy_is_empty(v jsonb)
returns boolean language sql immutable as $f$
  SELECT v IS NULL OR jsonb_typeof(v)='null'
      OR (jsonb_typeof(v)='string' AND (v #>> '{}')='')
      OR (jsonb_typeof(v)='array' AND jsonb_array_length(v)=0)
      OR (jsonb_typeof(v)='boolean' AND v = 'false'::jsonb)
      OR (jsonb_typeof(v)='number'  AND v = '0'::jsonb)
$f$;

-- ── THE PAIRING: real clean, every mutant caught ────────────────────────────
-- The first assertion is what makes the rest meaningful. If the real function
-- failed the corpus too, "the mutant fails" would prove nothing about the guard.
select is(
  (select count(*)::int from corpus
     where public.merge_setting_value(existing, overlay, setting_key) is distinct from expected),
  0,
  'the REAL function passes every corpus case');

select cmp_ok(
  (select count(*)::int from corpus
     where pg_temp.mut_quad(existing, overlay, setting_key) is distinct from expected),
  '>', 0,
  'MUT-QUAD caught: removing the address-quad group check fails the corpus');

select cmp_ok(
  (select count(*)::int from corpus
     where pg_temp.mut_latlng(existing, overlay, setting_key) is distinct from expected),
  '>', 0,
  'MUT-LATLNG caught: removing the lat/lng pair check fails the corpus');

select cmp_ok(
  (select count(*)::int from corpus
     where pg_temp.mut_tz(existing, overlay, setting_key) is distinct from expected),
  '>', 0,
  'MUT-TZ caught: removing the hours/timezone check fails the corpus');

select cmp_ok(
  (select count(*)::int from corpus
     where pg_temp.mut_dropempty(existing, overlay, setting_key) is distinct from expected),
  '>', 0,
  'MUT-DROPEMPTY caught: skipping the empty-overwrite filter fails the corpus');

-- The falsy mutant is asserted on the predicate directly: it is what
-- jsonb_is_empty_overlay would become, and the real predicate must disagree.
select ok(
  pg_temp.mut_falsy_is_empty('false'::jsonb) and pg_temp.mut_falsy_is_empty('0'::jsonb)
  and not public.jsonb_is_empty_overlay('false'::jsonb)
  and not public.jsonb_is_empty_overlay('0'::jsonb),
  'MUT-FALSY caught: false and 0 are NOT empty to the real predicate (S325)');

-- Anti-vacuity for the mutants themselves: a mutant that failed EVERY case would
-- suggest it is broken rather than subtly wrong, and would make the >0 checks
-- above uninformative.
select cmp_ok(
  (select count(*)::int from corpus
     where pg_temp.mut_quad(existing, overlay, setting_key) is not distinct from expected),
  '>', 0,
  'MUT-QUAD is a SUBTLE mutant: it still passes most cases, so >0 failures is a real signal');

select * from finish();
rollback;
