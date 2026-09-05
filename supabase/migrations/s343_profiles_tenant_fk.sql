-- S343 ITEM 5 — profiles.tenant_id gains a real FK, ON DELETE CASCADE.
--
-- ⚠️  NOT APPLIED BY THE PR THAT ADDS THIS FILE. CC Web does not apply
-- migrations. Claude.ai runs the orphan audit and applies it.
--
-- UNTIMESTAMPED ON PURPOSE, same as s338_page_content_seo_meta_tenant_fk.sql:
-- it is applied out of band via apply_migration, which stamps schema_migrations
-- without writing a file, so a timestamped name here would re-run applied DDL.
--
-- ═══ THE GAP ═══
--
-- Verified live on 2026-09-05 with pg_constraint — not transcribed. profiles
-- carries exactly two constraints:
--
--   profiles_pkey      PRIMARY KEY (id)
--   profiles_id_fkey   FOREIGN KEY (id) REFERENCES auth.users(id)
--
-- `tenant_id` is NOT NULL but completely unconstrained, so deleting a tenant
-- leaves a profile pointing at a tenant that no longer exists. This is the THIRD
-- table found in that state: page_content and seo_meta were both given the same
-- FK in S338 after an orphan audit turned up 17 rows belonging to a tenant that
-- had been deleted months earlier.
--
-- ═══ WHY CASCADE ═══
--
-- The same reason it was right in S338: it is what the FK would have done all
-- along, and it makes tenant deletion complete BY CONSTRUCTION rather than by
-- admin_delete_tenant remembering to clean up. That function already deletes
-- profiles for users left with no tenant_users row; once this FK exists, the
-- cascade has already removed them and that DELETE becomes a no-op. Belt and
-- braces, in the right order.
--
-- HONEST CAVEAT. profiles.tenant_id is a single binding, so if one user were
-- ever a member of two tenants, deleting the tenant their profile points at
-- would remove the profile while a tenant_users row survived elsewhere. That is
-- not reachable today: provision-tenant's collision guard refuses to bind an
-- existing admin to a second tenant (S220 B2a), and tenant_id is NOT NULL so
-- there is no unbound state to fall back to. Recorded rather than defended
-- against, because defending against it would mean inventing a policy nobody
-- has asked for.
--
-- ORPHAN AUDIT RUN BEFORE WRITING THIS: 0 orphans out of 6 profiles, so the
-- constraint validates immediately with no cleanup step.
--
-- A DELETE IS DELIBERATELY NOT IN THIS FILE, for the reason s338 already
-- documents: on a fresh database there are no orphans to clean, and a blind
-- "delete rows with no tenant" inside a migration is a data-loss instrument
-- aimed at whatever state the next database happens to hold. If a future
-- environment fails to validate, look at what it holds.

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_tenant_id_fkey') then
    alter table public.profiles
      add constraint profiles_tenant_id_fkey
      foreign key (tenant_id) references public.tenants(id) on delete cascade;
  end if;
end $$;
