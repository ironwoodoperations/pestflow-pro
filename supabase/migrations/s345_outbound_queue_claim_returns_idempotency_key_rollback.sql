-- ROLLBACK for s345_outbound_queue_claim_returns_idempotency_key.sql
--
-- Restores the pre-S345 signature, taken verbatim from
-- supabase/migrations/s338_outbound_queue_state_machine.sql — NOT reconstructed.
--
-- WHAT THIS COSTS. The worker reads idempotency_key from the claim result. After
-- this rollback that column is absent, the key is undefined, and
-- buildZernioCreateHeaders stops sending the Idempotency-Key header — by
-- design, since S345 sends it only when a key is present. The queue keeps
-- working; it loses its strongest duplicate-create defence and falls back to
-- the 409 body and the name lookup. Deploy a worker build that does not expect
-- the column, or accept that degradation knowingly.
--
-- Same DROP + CREATE + grant reasoning as the forward migration.

BEGIN;

DROP FUNCTION IF EXISTS public.outbound_queue_claim(integer, interval);

CREATE OR REPLACE FUNCTION public.outbound_queue_claim(p_limit integer DEFAULT 5, p_lease interval DEFAULT '00:15:00'::interval)
 RETURNS TABLE(id uuid, tenant_id uuid, kind text, payload jsonb, attempts integer, vendor_ref text, prior_status text)
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
  RETURNING q.id, q.tenant_id, q.kind, q.payload, q.attempts, q.vendor_ref, rn.prior;
END;
$function$;

REVOKE ALL ON FUNCTION public.outbound_queue_claim(integer, interval) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.outbound_queue_claim(integer, interval) FROM anon;
REVOKE ALL ON FUNCTION public.outbound_queue_claim(integer, interval) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.outbound_queue_claim(integer, interval) TO service_role;

COMMIT;
