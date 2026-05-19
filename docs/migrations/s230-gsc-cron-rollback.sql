-- S230 cron rollback
SELECT cron.unschedule('gsc-weekly-refresh');
DROP FUNCTION IF EXISTS public.gsc_cron_dispatch();
