-- s254 get_tenant_secret RPC — ROLLBACK
--
-- Drops the Vault reader RPC created by s254-get-tenant-secret-rpc.sql.
-- Only run this after the edge functions have been reverted to read secrets
-- from settings.integrations (otherwise the read path breaks). Dropping the
-- function while functions still call it makes getTenantSecret() fail-soft to
-- NULL (no crash), but the secrets become unreadable.

DROP FUNCTION IF EXISTS public.get_tenant_secret(uuid, text);

NOTIFY pgrst, 'reload schema';
