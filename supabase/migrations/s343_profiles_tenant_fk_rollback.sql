-- S343 ITEM 5 — ROLLBACK: drop profiles.tenant_id's foreign key.
--
-- Dropping a constraint never fails on existing data, so this is always safe to
-- run. What it restores is the DEFECT: deleting a tenant will once again leave
-- its profiles behind as rows pointing at a tenant that does not exist.
--
-- If you roll this back, the orphan audit becomes a manual chore again — that is
-- the state page_content and seo_meta were in until S338.

alter table public.profiles
  drop constraint if exists profiles_tenant_id_fkey;
