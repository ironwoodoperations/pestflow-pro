-- S335 — public.tenant_services. The per-tenant service SELECTION.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- UNTIMESTAMPED ON PURPOSE. READ THIS BEFORE RENAMING IT.
--
-- This DDL is ALREADY APPLIED to production. It was applied via apply_migration
-- and is stamped in supabase_migrations.schema_migrations as
--
--     version 20260904164258   name s335_tenant_services_inert
--
-- but apply_migration does not write a file, so the repo had no record of it.
-- This file IS that record: it exists so a fresh database reproduces the same
-- state, and so a reader can see the shape without querying production.
--
-- Giving it a timestamped name would place it in the normal apply order and
-- re-run the DDL on an environment that already has it. Every statement below
-- is guarded (IF NOT EXISTS / DO-block on pg_constraint), so a re-run is
-- harmless — but the guards are the seatbelt, not the reason. The name is.
--
-- VERIFIED AGAINST THE LIVE OBJECT on 2026-09-04, not transcribed from a brief:
-- columns from information_schema.columns, constraints via
-- pg_get_constraintdef(), indexes from pg_indexes, comment from
-- obj_description(). 77 rows across 7 tenants at the time of writing.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- WHAT THIS TABLE IS. The catalog — what a trade COULD sell — lives in
-- TypeScript at shared/lib/serviceCatalog.ts and is consumed by both trees.
-- This table answers the different question: what does THIS tenant sell.
-- There is deliberately NO catalog projection table; a second authoritative
-- copy of the catalog is the drift defect the extraction just removed.
--
-- INERT. Nothing reads this table yet. No RLS policy, no read path, no write
-- path. It is created and seeded ahead of the code so that the read path can
-- land as a reviewable change against data that already exists and has already
-- been checked against page_content.

create table if not exists public.tenant_services (
  id           uuid        primary key default gen_random_uuid(),
  tenant_id    uuid        not null references public.tenants (id) on delete cascade,
  service_slug text        not null,
  created_at   timestamptz not null default now()
);

-- One row per (tenant, service). Also the ON CONFLICT target the seed and any
-- future re-provision will use, so re-selecting a service is idempotent.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tenant_services_tenant_slug_key'
  ) then
    alter table public.tenant_services
      add constraint tenant_services_tenant_slug_key unique (tenant_id, service_slug);
  end if;
end $$;

-- Slug shape, enforced in the database rather than trusted from the caller.
-- Matches the slugs the catalog actually holds; serviceCatalog.test.ts asserts
-- every catalog slug satisfies this exact regex, so a slug that could not be
-- stored here can never enter the catalog either.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tenant_services_slug_shape'
  ) then
    alter table public.tenant_services
      add constraint tenant_services_slug_shape
      check (service_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  end if;
end $$;

-- Every read will be "the services for THIS tenant".
create index if not exists tenant_services_tenant_id_idx
  on public.tenant_services using btree (tenant_id);

-- RLS ON, ZERO POLICIES — deny-all for anon and authenticated, while
-- service_role bypasses it. This is the safe state for an inert table: no app
-- role can read or write it by accident before the read path is designed.
-- Policies land WITH that read path, under a validator gate.
alter table public.tenant_services enable row level security;

comment on table public.tenant_services is
  'S335. Per-tenant service selection; the catalog itself lives in TypeScript (shared/lib). INERT: nothing reads this yet. RLS enabled with NO policies by design -- deny-all for app roles, service_role bypasses. Policies land with the read path, under a validator gate.';

-- NO SEED HERE, deliberately. Production's 77 rows were derived from each
-- tenant's existing page_content rows — data a fresh database does not have.
-- Seeding fixed slugs for tenants that do not exist would fabricate selections,
-- which is the S290 defect in a new costume. A fresh database gets the empty
-- table; real tenants get rows when provisioning writes them.

notify pgrst, 'reload schema';
