-- S164 b10/b11 Rollback Script
-- Run if Part 0 or Part B need to be reverted.
-- Safe to run in any order; all ops use IF EXISTS.

-- Rollback Part 0b: drop CHECK constraint on settings.seo.service_areas
ALTER TABLE public.settings
  DROP CONSTRAINT IF EXISTS seo_service_areas_shape;

-- Rollback Part 0a: drop forward-compat columns from service_areas
ALTER TABLE public.service_areas
  DROP COLUMN IF EXISTS place_id,
  DROP COLUMN IF EXISTS state;

-- Notify PostgREST to reload schema after DDL changes
NOTIFY pgrst, 'reload schema';

-- NOTE: Part B code changes (shared helper, provision-tenant rewrite,
-- LocationsTab sync, Onboarding sync, shell b9 empty state) must be
-- reverted via git revert of the Part B commit.
