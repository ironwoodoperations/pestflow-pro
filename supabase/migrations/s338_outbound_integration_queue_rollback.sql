-- S338 ROLLBACK — drop the outbound queue table.
--
-- DESTRUCTIVE, AND MORE SO THAN IT LOOKS. Rows here are PROMISES that a vendor
-- side effect will be attempted. Dropping the table does not cancel the
-- promise; it forgets it. Any tenant whose zernio_profile row had not yet
-- succeeded loses the record that it was ever owed one, and nothing will
-- reconcile it.
--
-- Worse: an 'unknown' row is the ONLY record that a request was sent and its
-- outcome never observed. Dropping it discards the single piece of evidence
-- that a vendor-side profile might already exist — which is exactly the state
-- where a later re-provision would mint a duplicate.
--
-- SAFE ONLY WHILE THE TABLE IS EMPTY OR ENTIRELY 'succeeded'. Check first:
--   SELECT status, count(*) FROM public.outbound_integration_queue GROUP BY 1;
--
-- Deliberately NOT CASCADE: provision_tenant_atomic inserts into this table, so
-- a CASCADE would silently drop provisioning. Let the drop FAIL and say so.

DROP TABLE IF EXISTS public.outbound_integration_queue;

NOTIFY pgrst, 'reload schema';
