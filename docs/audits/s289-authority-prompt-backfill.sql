-- S289 — AI Authority prompt backfill. GENERATED, NOT APPLIED.
-- Review, then apply via MCP. Idempotent: each insert is guarded by
-- "not exists (… where x.tenant_id = t.id)", so re-running is a no-op and
-- a tenant that already has prompts (dang) is never touched.
-- Generated from a live-data snapshot read 2026-08-24.

-- apex-protect  (vertical: pest, tier 4, 3 engine(s))  10 prompt(s)
insert into ai_authority_prompts (tenant_id, prompt_text, active)
select t.id, v.prompt_text, true from tenants t,
  (values
    ('Apex Pest Protection reviews'),
    ('best pest control in Austin TX'),
    ('termite control Austin TX'),
    ('best termite inspections company Austin TX'),
    ('spider control services Austin TX'),
    ('roach control near me Austin TX'),
    ('ant control Austin TX reviews'),
    ('best mosquito control in Austin TX'),
    ('scorpion control Austin TX'),
    ('best bed bug control company Austin TX')
  ) as v(prompt_text)
where t.slug = 'apex-protect'
  and not exists (select 1 from ai_authority_prompts x where x.tenant_id = t.id);

-- coastal-pest  (vertical: pest, tier 4, 3 engine(s))  10 prompt(s)
insert into ai_authority_prompts (tenant_id, prompt_text, active)
select t.id, v.prompt_text, true from tenants t,
  (values
    ('Coastal Pest Co. reviews'),
    ('best pest control in Galveston TX'),
    ('termite control Galveston TX'),
    ('best termite inspections company Galveston TX'),
    ('spider control services Galveston TX'),
    ('roach control near me Galveston TX'),
    ('ant control Galveston TX reviews'),
    ('best mosquito control in Galveston TX'),
    ('scorpion control Galveston TX'),
    ('best bed bug control company Galveston TX')
  ) as v(prompt_text)
where t.slug = 'coastal-pest'
  and not exists (select 1 from ai_authority_prompts x where x.tenant_id = t.id);

-- heartland-pest  (vertical: pest, tier 4, 3 engine(s))  10 prompt(s)
insert into ai_authority_prompts (tenant_id, prompt_text, active)
select t.id, v.prompt_text, true from tenants t,
  (values
    ('Heartland Pest Co. reviews'),
    ('best pest control in Springfield MO'),
    ('termite control Springfield MO'),
    ('best termite inspections company Springfield MO'),
    ('spider control services Springfield MO'),
    ('roach control near me Springfield MO'),
    ('ant control Springfield MO reviews'),
    ('best mosquito control in Springfield MO'),
    ('scorpion control Springfield MO'),
    ('best bed bug control company Springfield MO')
  ) as v(prompt_text)
where t.slug = 'heartland-pest'
  and not exists (select 1 from ai_authority_prompts x where x.tenant_id = t.id);

-- metro-pest-concierge  (vertical: pest, tier 4, 3 engine(s))  10 prompt(s)
insert into ai_authority_prompts (tenant_id, prompt_text, active)
select t.id, v.prompt_text, true from tenants t,
  (values
    ('Metro Pest Concierge reviews'),
    ('best pest control in Houston TX'),
    ('termite control Houston TX'),
    ('best termite inspections company Houston TX'),
    ('spider control services Houston TX'),
    ('roach control near me Houston TX'),
    ('ant control Houston TX reviews'),
    ('best mosquito control in Houston TX'),
    ('scorpion control Houston TX'),
    ('best bed bug control company Houston TX')
  ) as v(prompt_text)
where t.slug = 'metro-pest-concierge'
  and not exists (select 1 from ai_authority_prompts x where x.tenant_id = t.id);

-- pestflow-pro  (vertical: pest, tier 4, 3 engine(s))  10 prompt(s)
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

-- urban-strike  (vertical: pest, tier 4, 3 engine(s))  10 prompt(s)
insert into ai_authority_prompts (tenant_id, prompt_text, active)
select t.id, v.prompt_text, true from tenants t,
  (values
    ('Urban Strike Pest Defense reviews'),
    ('best pest control in Dallas TX'),
    ('termite control Dallas TX'),
    ('best termite inspections company Dallas TX'),
    ('spider control services Dallas TX'),
    ('roach control near me Dallas TX'),
    ('ant control Dallas TX reviews'),
    ('best mosquito control in Dallas TX'),
    ('scorpion control Dallas TX'),
    ('best bed bug control company Dallas TX')
  ) as v(prompt_text)
where t.slug = 'urban-strike'
  and not exists (select 1 from ai_authority_prompts x where x.tenant_id = t.id);

-- pls  (vertical: irrigation, tier 3, 2 engine(s))  10 prompt(s)
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

-- vita-glow  (vertical: NULL, tier 3, 2 engine(s))  1 prompt(s)
insert into ai_authority_prompts (tenant_id, prompt_text, active)
select t.id, v.prompt_text, true from tenants t,
  (values
    ('Vita Glow Wellness reviews')
  ) as v(prompt_text)
where t.slug = 'vita-glow'
  and not exists (select 1 from ai_authority_prompts x where x.tenant_id = t.id);

