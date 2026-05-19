-- S231 Phase 4 rollback
SELECT cron.unschedule('ga4-weekly-refresh');
DROP FUNCTION IF EXISTS public.ga4_cron_dispatch();
