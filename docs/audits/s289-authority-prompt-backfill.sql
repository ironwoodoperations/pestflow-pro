-- S289 — AI Authority prompt backfill. GENERATED, NOT APPLIED.
-- Review, then apply via MCP. Idempotent: each insert is guarded by
-- "not exists (… where x.tenant_id = t.id)", so re-running is a no-op and
-- a tenant that already has prompts (dang) is never touched.
-- Generated from a live-data snapshot read 2026-08-24.
--
-- DEMO TENANTS EXCLUDED (apex-protect, coastal-pest, heartland-pest, metro-pest-concierge, urban-strike).
-- They are invented businesses with no domain; searching the live web for
-- them costs money and writes confirmed-zero rows that would skew any
-- cross-tenant average.
--
-- OPERATOR TENANT EXCLUDED (pestflow-pro).
-- Not a demo (demo_mode.active is false) and not a client either: it is the
-- PestFlow Pro product itself, carrying pest demo scaffolding it never used.
-- The predicate is "the tenant public.operator_tenant_id() names" — the S273
-- resolver that already gates provisioning_status RLS — so every tenant it
-- does not name is a client and a new client needs no list update.
--
-- BOTH FILTERS LIVE IN scripts/generate-authority-backfill.ts, not in this
-- file: hand-editing the output would leave the next regeneration silently
-- wrong. Each insert additionally carries an operator_tenant_id() guard, so
-- the applied SQL is correct even if this snapshot has gone stale.

-- dang  (vertical: pest, tier 4, 2 enabled engine(s))  10 prompt(s)
--   (already seeded by hand — counted in the cost total, not re-inserted)

-- pls  (vertical: irrigation, tier 3, 2 enabled engine(s))  10 prompt(s)
insert into ai_authority_prompts (tenant_id, prompt_text, active)
select t.id, v.prompt_text, true from tenants t,
  (values
    ('Precision Lawn Systems LLC reviews'),
    ('best sprinkler systems in Hawkins TX'),
    ('sprinkler systems Holly Lake Ranch TX'),
    ('best sprinkler systems company Lindale TX'),
    ('sprinkler systems services Longview TX'),
    ('sprinkler systems near me Tyler TX'),
    ('drainage Hawkins TX reviews'),
    ('best drainage in Holly Lake Ranch TX'),
    ('drainage Lindale TX'),
    ('best drainage company Longview TX')
  ) as v(prompt_text)
where t.slug = 'pls'
  and t.id <> public.operator_tenant_id()   -- belt-and-braces: the generator already excluded it
  and not exists (select 1 from ai_authority_prompts x where x.tenant_id = t.id);

-- vita-glow  (vertical: NULL, tier 3, 2 enabled engine(s))  1 prompt(s)
insert into ai_authority_prompts (tenant_id, prompt_text, active)
select t.id, v.prompt_text, true from tenants t,
  (values
    ('Vita Glow Wellness reviews')
  ) as v(prompt_text)
where t.slug = 'vita-glow'
  and t.id <> public.operator_tenant_id()   -- belt-and-braces: the generator already excluded it
  and not exists (select 1 from ai_authority_prompts x where x.tenant_id = t.id);

