-- s255 set_tenant_secret RPC + audit — ROLLBACK
--
-- Drops the WRITE-path RPC. Apply only if the S255 write path is being reverted.
-- The audit table is dropped too, but ONLY if you accept losing the secret-write
-- audit trail; comment out the DROP TABLE line to keep history.

DROP FUNCTION IF EXISTS public.set_tenant_secret(uuid, text, text);

-- Keep this commented unless you explicitly want to discard the audit trail:
-- DROP TABLE IF EXISTS public.tenant_secret_audit;

NOTIFY pgrst, 'reload schema';
