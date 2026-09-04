-- S338 — page_content.tenant_id and seo_meta.tenant_id gain a real FK.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- UNTIMESTAMPED ON PURPOSE. ALREADY APPLIED. READ THIS BEFORE RENAMING IT.
--
-- Applied via apply_migration and stamped in schema_migrations as
-- s338_page_content_seo_meta_tenant_fk. apply_migration writes no file, so the
-- repo had no record. This file IS that record — so a fresh database
-- reproduces the state, and so a reader can see the shape without querying
-- production. A timestamped name would put it in the normal apply order and
-- re-run DDL that is already applied.
--
-- THIS IS THE FIFTH FILELESS BATCH IN THIS ARC. tenant_services (S335), the
-- three merge functions (S336), strip_settings_secrets (found in S336, still
-- unrecorded), and now these four. The pattern is worth naming: apply_migration
-- is convenient and leaves no trace, so the repo silently stops describing the
-- database. Every one of these files exists to close that gap after the fact.
--
-- VERIFIED AGAINST THE LIVE CONSTRAINTS on 2026-09-04 with
-- pg_get_constraintdef() and pg_constraint.convalidated — not transcribed:
--   page_content_tenant_id_fkey  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
--                                ON DELETE CASCADE   convalidated = true
--   seo_meta_tenant_id_fkey      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
--                                ON DELETE CASCADE   convalidated = true
--
-- ORPHAN CLEANUP HAPPENED FIRST, AND IS NOT REPRODUCED HERE. 17 page_content
-- rows belonging to the deleted tenant "CityShield Pest Defense" were removed
-- (owner-approved) so the constraint could validate: 167 -> 150 rows, every
-- live tenant unchanged. seo_meta had zero orphans. Live counts at the time of
-- writing: page_content 150, seo_meta 256.
--
-- A DELETE is deliberately NOT in this file. On a fresh database there are no
-- orphans to clean, and a blind "delete rows with no tenant" in a migration is
-- a data-loss instrument aimed at whatever state the next database happens to
-- be in. If a future environment fails to validate, look at what it holds.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- WHY IT MATTERS. Without the FK, deleting a tenant left its page_content and
-- seo_meta behind: invisible rows that no tenant owns, which is how 17
-- CityShield rows survived their tenant. ON DELETE CASCADE makes tenant
-- deletion complete by construction rather than by remembering.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'page_content_tenant_id_fkey') THEN
    ALTER TABLE public.page_content
      ADD CONSTRAINT page_content_tenant_id_fkey
      FOREIGN KEY (tenant_id) REFERENCES public.tenants (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seo_meta_tenant_id_fkey') THEN
    ALTER TABLE public.seo_meta
      ADD CONSTRAINT seo_meta_tenant_id_fkey
      FOREIGN KEY (tenant_id) REFERENCES public.tenants (id) ON DELETE CASCADE;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
