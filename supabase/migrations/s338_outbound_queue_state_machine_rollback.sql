-- S338 ROLLBACK — drop the four state-machine functions.
--
-- SAFE ONLY WHILE NOTHING CALLS THEM. As of S339 the worker
-- (process-outbound-queue) calls claim() and complete() on every run, and
-- complete() calls backoff(). Dropping these while the worker is scheduled
-- leaves every claimed job stuck in 'processing' until its lease expires, then
-- re-claimed and stuck again — an infinite lease churn with no progress.
--
-- ORDER MATTERS: complete() depends on backoff(), so backoff goes last.
--
-- Deliberately NOT CASCADE. If something has come to depend on these, the drop
-- should FAIL and name the dependent rather than quietly removing it.
--
-- BEFORE RUNNING: unschedule the cron job that POSTs process-outbound-queue,
-- and check nothing is mid-flight:
--   SELECT status, count(*) FROM public.outbound_integration_queue GROUP BY 1;

DROP FUNCTION IF EXISTS public.outbound_queue_requeue(uuid, text, text, uuid);
DROP FUNCTION IF EXISTS public.outbound_queue_complete(uuid, text, text, text, integer);
DROP FUNCTION IF EXISTS public.outbound_queue_claim(integer, interval);
DROP FUNCTION IF EXISTS public.outbound_queue_backoff(integer);

NOTIFY pgrst, 'reload schema';
