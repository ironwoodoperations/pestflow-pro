-- S262 — tenants.entitlement: canonical 4-tier access scale (1=Starter..4=Elite),
-- decoupled from payment. Phased (D2): nullable-first -> backfill -> CHECK.
-- SET NOT NULL is a SEPARATE later migration, applied with the provision-tenant deploy.

alter table public.tenants add column if not exists entitlement smallint;

update public.tenants t set entitlement = least(greatest(
  case
    when jsonb_typeof(s.value->'tier') = 'number' then (s.value->>'tier')::int
    when lower(s.value->>'tier') = 'elite' then 4
    when lower(s.value->>'tier') = 'pro' then 3
    when lower(s.value->>'tier') in ('growth','grow') then 2
    else 1
  end, 1), 4)
from public.settings s
where s.tenant_id = t.id and s.key = 'subscription';

update public.tenants set entitlement = 4 where id in (
  '1611b16f-381b-4d4f-ba3a-fbde56ad425b',  -- Dang (Elite guinea-pig, pays $149)
  '9215b06b-3eb5-49a1-a16e-7ff214bf6783',  -- master / demo / operator
  'd6b1e4f7-5a4c-4daf-919e-4c7adda6ebbf',  -- Heartland (Elite fixture)
  'e7c2f5a8-6b5d-4eb0-a2af-5d8beebebcc0',  -- Metro (Elite fixture)
  'b4f9c2d5-3e2a-4b8d-af7c-2a5e8b4d9c3f'   -- Urban Strike (Elite fixture)
);
update public.tenants set entitlement = 1 where id = 'c5a0d3e6-4f3b-4c9e-b08d-3b6f9c5eadae';  -- Apex (Starter fixture)
update public.tenants set entitlement = 2 where id = '9e7c9b69-d961-4f20-b78e-8fd86dd244b4';  -- ZZ Dryrun (Growth fixture; was string "elite")
update public.tenants set entitlement = 3 where id = 'a3e8b1c4-2d1f-4a7c-9e6b-1f4d7a3c8b2e';  -- Coastal (Pro fixture)

update public.tenants set entitlement = 1 where entitlement is null;

alter table public.tenants add constraint tenants_entitlement_check check (entitlement between 1 and 4);
