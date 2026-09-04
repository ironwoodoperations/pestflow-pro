-- S341 STEP 4 — ROLLBACK: narrow settings_business_info_vertical_valid back to
-- 'pest' | 'irrigation'.
--
-- ⚠️  SAFE ONLY WHILE NO TENANT CARRIES vertical = 'lawn'. Adding a CHECK
-- validates existing rows, so if a lawn tenant has been provisioned this
-- statement FAILS rather than silently dropping their data — which is the
-- correct behaviour and the reason there is no `not valid` here.
--
-- Check before running:
--
--   select tenant_id from public.settings
--   where key = 'business_info' and value ->> 'vertical' = 'lawn';
--
-- If that returns rows, this rollback is not the right tool: the tenants must
-- be migrated off lawn first, which is a decision, not a migration.

alter table public.settings
  drop constraint if exists settings_business_info_vertical_valid;

alter table public.settings
  add constraint settings_business_info_vertical_valid
  check (
    key <> 'business_info'
    or (value ->> 'vertical') is null
    or (value ->> 'vertical') = any (array['pest', 'irrigation'])
  );
