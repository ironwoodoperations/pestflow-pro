-- S345 — outbound_queue_claim returns idempotency_key.
--
-- APPLIED IN PRODUCTION 2026-09-05 (migration id 20260905031513) WITH NO FILE.
-- This is that file, written from the LIVE object so a fresh database
-- reproduces today's state. Verified byte-identical: md5(pg_get_functiondef())
-- = 4c6557f4fc3670f41caf862524545ec0, length 996.
--
-- WHY IT EXISTS. S345 built the Zernio idempotency plumbing and found it inert:
-- the column is live (uuid NOT NULL DEFAULT gen_random_uuid()) but the claim
-- RPC did not return it, so the worker never had a key to send. This widens
-- the result.
--
-- WHY DROP + CREATE AND NOT REPLACE. The RETURNS TABLE signature changes, and
-- CREATE OR REPLACE cannot change a function's result type — it fails with
-- 42P13. The drop is what makes the grant block below mandatory: a dropped
-- function takes its ACL with it, and a bare CREATE leaves EXECUTE at the
-- PUBLIC default. Without the REVOKE/GRANT this migration would silently widen
-- who can claim queue rows.

BEGIN;

DROP FUNCTION IF EXISTS public.outbound_queue_claim(integer, interval);

CREATE OR REPLACE FUNCTION public.outbound_queue_claim(p_limit integer DEFAULT 5, p_lease interval DEFAULT '00:15:00'::interval)
 RETURNS TABLE(id uuid, tenant_id uuid, kind text, payload jsonb, attempts integer, vendor_ref text, prior_status text, idempotency_key uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  WITH runnable AS (
    SELECT q.id, q.status AS prior
    FROM public.outbound_integration_queue q
    WHERE (q.status IN ('pending','retryable_failed') AND q.next_attempt_at <= now())
       OR (q.status = 'processing' AND q.claimed_at < now() - p_lease)
    ORDER BY q.next_attempt_at
    FOR UPDATE SKIP LOCKED
    LIMIT p_limit
  )
  UPDATE public.outbound_integration_queue q
  SET status = 'processing', claimed_at = now(), attempts = q.attempts + 1
  FROM runnable rn
  WHERE q.id = rn.id
  RETURNING q.id, q.tenant_id, q.kind, q.payload, q.attempts, q.vendor_ref,
            rn.prior, q.idempotency_key;
END;
$function$;

-- Reissue the ACL the DROP removed. This function claims and mutates queue rows
-- under SECURITY DEFINER; only the worker's service_role may call it.
REVOKE ALL ON FUNCTION public.outbound_queue_claim(integer, interval) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.outbound_queue_claim(integer, interval) FROM anon;
REVOKE ALL ON FUNCTION public.outbound_queue_claim(integer, interval) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.outbound_queue_claim(integer, interval) TO service_role;

COMMIT;

-- Verify after applying (expect exactly: postgres:EXECUTE, service_role:EXECUTE):
--   SELECT grantee, privilege_type FROM information_schema.routine_privileges
--   WHERE routine_schema='public' AND routine_name='outbound_queue_claim';
