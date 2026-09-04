-- S338 ROLLBACK — drop provision_tenant_atomic.
--
-- SAFE AS OF S339, because NOTHING CALLS IT YET: provision-tenant still does
-- its work over separate round trips. Dropping it today changes no behaviour.
--
-- ONCE provision-tenant CALLS IT, THIS IS NOT A ROLLBACK — it is an outage.
-- Every new tenant creation would fail at the RPC. At that point the correct
-- rollback is whatever the caller change ships with.
--
-- It depends on public.merge_setting_value (S336) and inserts into
-- public.outbound_integration_queue; dropping either of those first will make
-- this function fail at RUNTIME rather than at drop time, since PL/pgSQL
-- resolves names when it executes.

DROP FUNCTION IF EXISTS public.provision_tenant_atomic(jsonb);

NOTIFY pgrst, 'reload schema';
