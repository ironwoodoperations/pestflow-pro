-- S213a rollback: remove rate_limit_events table and cleanup cron job.
SELECT cron.unschedule('rate-limit-cleanup');
DROP TABLE IF EXISTS public.rate_limit_events;
