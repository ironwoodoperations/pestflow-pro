-- Rollback for s199 sms_queue table creation.
-- Apply only if b19 is being fully reverted. Safe to apply: table is greenfield,
-- no other code reads from it.
DROP INDEX IF EXISTS public.idx_sms_queue_tenant_status;
DROP INDEX IF EXISTS public.idx_sms_queue_due;
DROP TABLE IF EXISTS public.sms_queue;
NOTIFY pgrst, 'reload schema';
