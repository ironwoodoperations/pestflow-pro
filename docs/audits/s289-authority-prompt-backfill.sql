-- S289 — AI Authority prompt backfill. GENERATED, NOT APPLIED.
-- Review, then apply via MCP. Idempotent: each insert is guarded by
-- "not exists (… where x.tenant_id = t.id)", so re-running is a no-op and
-- a tenant that already has prompts (dang) is never touched.
-- Generated from a live-data snapshot read 2026-08-24.
--
-- DEMO TENANTS EXCLUDED (apex-protect, coastal-pest, heartland-pest, metro-pest-concierge, urban-strike).
-- They are invented businesses with no domain; searching the live web for
-- them costs money and writes confirmed-zero rows that would skew any
-- cross-tenant average. The filter lives in the generator script, so
-- regenerating this file cannot silently re-include them.

-- dang  (vertical: pest, tier 4, 2 enabled engine(s))  10 prompt(s)
--   (already seeded by hand — counted in the cost total, not re-inserted)

-- pestflow-pro  (vertical: pest, tier 4, 2 enabled engine(s))  10 prompt(s)
insert into ai_authority_prompts (tenant_id, prompt_text, active)
select t.id, v.prompt_text, true from tenants t,
  (values
    ('PestFlow Pro reviews'),
    ('best pest control in Tyler TX'),
    ('termite control Tyler TX'),
    ('best termite inspections company Tyler TX'),
    ('spider control services Tyler TX'),
    ('roach control near me Tyler TX'),
    ('ant control Tyler TX reviews'),
    ('best mosquito control in Tyler TX'),
    ('scorpion control Tyler TX'),
    ('best bed bug control company Tyler TX')
  ) as v(prompt_text)
where t.slug = 'pestflow-pro'
  and not exists (select 1 from ai_authority_prompts x where x.tenant_id = t.id);

-- pls  (vertical: irrigation, tier 3, 2 enabled engine(s))  10 prompt(s)
insert into ai_authority_prompts (tenant_id, prompt_text, active)
select t.id, v.prompt_text, true from tenants t,
  (values
    ('Precision Lawn Systems LLC reviews'),
    ('best sprinkler systems in Hawkins TX'),
    ('drainage Hawkins TX'),
    ('best pump systems company Hawkins TX'),
    ('sod dirt work services Hawkins TX'),
    ('retaining walls near me Hawkins TX'),
    ('sprinkler systems Holly Lake Ranch TX reviews'),
    ('best drainage in Holly Lake Ranch TX'),
    ('pump systems Holly Lake Ranch TX'),
    ('best sod dirt work company Holly Lake Ranch TX')
  ) as v(prompt_text)
where t.slug = 'pls'
  and not exists (select 1 from ai_authority_prompts x where x.tenant_id = t.id);

-- vita-glow  (vertical: NULL, tier 3, 2 enabled engine(s))  1 prompt(s)
insert into ai_authority_prompts (tenant_id, prompt_text, active)
select t.id, v.prompt_text, true from tenants t,
  (values
    ('Vita Glow Wellness reviews')
  ) as v(prompt_text)
where t.slug = 'vita-glow'
  and not exists (select 1 from ai_authority_prompts x where x.tenant_id = t.id);

