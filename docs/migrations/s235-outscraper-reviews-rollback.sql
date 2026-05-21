-- S235 rollback
SELECT cron.unschedule('outscraper-daily-dispatch');
SELECT cron.unschedule('rate-limit-cleanup');
-- Re-add original 1h cleanup
SELECT cron.schedule('rate-limit-cleanup', '0 * * * *',
  $$ DELETE FROM public.rate_limit_events WHERE created_at < NOW() - INTERVAL '1 hour' $$);
DROP FUNCTION IF EXISTS public.outscraper_cron_dispatch();
DROP INDEX IF EXISTS public.testimonials_tenant_google_review_id_unique;
