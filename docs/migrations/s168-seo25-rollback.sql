-- docs/migrations/s168-seo25-rollback.sql
-- S168 seo2.5 rollback: restores settings.business_info rows from
-- settings_backup_s168_seo25 table (created by S168.2 migration).
-- Drops the business_info_structured_shape CHECK constraint.
--
-- STAGED alongside S168.1 code per handoff §2 rule #5.
-- EXECUTE manually via Supabase SQL editor or MCP apply_migration
-- only if rollback of S168.2 is needed.
--
-- Post-rollback: git revert the S168.1 commit to restore the legacy
-- emitter behavior. Or leave the new emitter in place — it falls back
-- to parseAddress/parseHours when structured keys are absent.

BEGIN;

ALTER TABLE public.settings
  DROP CONSTRAINT IF EXISTS business_info_structured_shape;

UPDATE public.settings s
SET value = b.value
FROM public.settings_backup_s168_seo25 b
WHERE s.tenant_id = b.tenant_id
  AND s.key = 'business_info'
  AND b.key = 'business_info';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Post-rollback verification (run after commit):
SELECT tenant_id,
       value ? 'street_address'   AS has_street,
       value ? 'latitude'         AS has_lat,
       value ? 'hours_structured' AS has_hours
FROM public.settings
WHERE key = 'business_info';
-- Expected: all three columns false for all three tenants after rollback.
