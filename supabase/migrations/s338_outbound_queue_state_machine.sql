-- S338 — the outbound queue STATE MACHINE. Four functions.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- UNTIMESTAMPED ON PURPOSE. ALREADY APPLIED (stamped
-- s338_outbound_queue_state_machine). Bodies read from the LIVE objects on
-- 2026-09-04 with pg_get_functiondef(); volatility, security and grants from
-- pg_proc. Not transcribed from a brief. See the fileless-batch note in
-- s338_page_content_seo_meta_tenant_fk.sql.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- THE DIVISION OF LABOUR. The database owns the state machine; the worker owns
-- only the question "what did the vendor do?". That is deliberate: leasing,
-- backoff, attempt exhaustion and the unknown dead-end are exactly the things a
-- worker gets wrong under concurrency or when it is killed mid-flight.
--
-- claim() ALREADY sets status='processing', claimed_at=now() and increments
-- attempts. A worker must not re-do any of it.

-- ── backoff ─────────────────────────────────────────────────────────────────
-- Jittered so a batch of jobs that failed together does not retry in lockstep.
CREATE OR REPLACE FUNCTION public.outbound_queue_backoff(p_attempts integer)
 RETURNS interval
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
 SET search_path TO ''
AS $function$
  SELECT (CASE p_attempts
            WHEN 1 THEN interval '1 minute'
            WHEN 2 THEN interval '5 minutes'
            WHEN 3 THEN interval '30 minutes'
            WHEN 4 THEN interval '2 hours'
            ELSE        interval '12 hours'
          END) * (1.0 + (random() * 0.2))   -- +0-20% jitter
$function$;

-- ── claim ───────────────────────────────────────────────────────────────────
-- FOR UPDATE SKIP LOCKED so concurrent workers never hand the same job out
-- twice. Two classes are runnable: genuinely due work, and a 'processing' row
-- whose LEASE HAS EXPIRED — a worker that died mid-flight.
--
-- NOTE WHAT IS ABSENT: 'unknown' is not selectable. That is the dead end, and
-- it is enforced here rather than trusted to the worker.
--
-- prior_status is returned so the worker can tell a fresh job from a re-claimed
-- one. A prior of 'processing' means the previous attempt may have SENT its
-- request before dying, which is a reconcile-before-create signal.
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

-- ── complete ────────────────────────────────────────────────────────────────
-- The four outcomes are the worker's entire vocabulary, and the mapping from
-- outcome to status is owned HERE, not by the caller:
--   succeeded -> succeeded
--   unknown   -> unknown          (a dead end; never auto-retried)
--   terminal  -> failed_terminal
--   retryable -> retryable_failed, or failed_terminal once attempts are spent
--
-- vendor_ref uses coalesce so a known ref is NEVER unset by a later attempt
-- that did not observe one. Losing it would destroy the only thing that makes
-- an unknown row reconcilable.
CREATE OR REPLACE FUNCTION public.outbound_queue_complete(p_id uuid, p_outcome text, p_vendor_ref text DEFAULT NULL::text, p_error text DEFAULT NULL::text, p_max_attempts integer DEFAULT 5)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_attempts int;
  v_next     text;
BEGIN
  IF p_outcome NOT IN ('succeeded','retryable','unknown','terminal') THEN
    RAISE EXCEPTION 'outbound_queue_complete: bad outcome %', p_outcome USING ERRCODE = '22023';
  END IF;

  SELECT q.attempts INTO v_attempts
  FROM public.outbound_integration_queue q WHERE q.id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'outbound_queue_complete: job % not found', p_id USING ERRCODE = '22023';
  END IF;

  v_next := CASE
    WHEN p_outcome = 'succeeded' THEN 'succeeded'
    WHEN p_outcome = 'unknown'   THEN 'unknown'
    WHEN p_outcome = 'terminal'  THEN 'failed_terminal'
    WHEN v_attempts >= p_max_attempts THEN 'failed_terminal'
    ELSE 'retryable_failed'
  END;

  UPDATE public.outbound_integration_queue q
  SET status     = v_next,
      claimed_at = NULL,                                  -- releases the lease
      vendor_ref = coalesce(p_vendor_ref, q.vendor_ref),  -- never unset a known ref
      last_error = CASE WHEN p_outcome = 'succeeded' THEN NULL ELSE left(p_error, 2000) END,
      next_attempt_at = CASE
        WHEN v_next = 'retryable_failed' THEN now() + public.outbound_queue_backoff(v_attempts)
        ELSE q.next_attempt_at
      END
  WHERE q.id = p_id;

  RETURN v_next;
END;
$function$;

-- ── requeue ─────────────────────────────────────────────────────────────────
-- The ONLY way a finished job runs again. An audited UPDATE, never a new row,
-- because UNIQUE(tenant_id,kind) is what stops a duplicate vendor create.
--
-- THE GUARD THAT MATTERS is the last one: an 'unknown' zernio_profile with no
-- vendor_ref cannot be requeued at all. Reconcile against the vendor first, or
-- a duplicate profile is minted. That refusal is the database enforcing the
-- rule the worker is also written to respect — belt and braces, on purpose.
CREATE OR REPLACE FUNCTION public.outbound_queue_requeue(p_tenant uuid, p_kind text, p_reason text, p_by uuid DEFAULT NULL::uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_status text; v_ref text;
BEGIN
  IF coalesce(btrim(p_reason),'') = '' THEN
    RAISE EXCEPTION 'outbound_queue_requeue: a reason is required' USING ERRCODE = '22023';
  END IF;

  SELECT q.status, q.vendor_ref INTO v_status, v_ref
  FROM public.outbound_integration_queue q
  WHERE q.tenant_id = p_tenant AND q.kind = p_kind FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'outbound_queue_requeue: no % job for tenant %', p_kind, p_tenant USING ERRCODE = '22023';
  END IF;

  IF v_status NOT IN ('failed_terminal','unknown','cancelled') THEN
    RAISE EXCEPTION 'outbound_queue_requeue: refusing to requeue a job in status % (only failed_terminal, unknown, cancelled)', v_status
      USING ERRCODE = '22023';
  END IF;

  IF v_status = 'unknown' AND p_kind = 'zernio_profile' AND coalesce(v_ref,'') = '' THEN
    RAISE EXCEPTION 'outbound_queue_requeue: job is UNKNOWN with no vendor_ref. Reconcile against the vendor before requeueing, or a duplicate profile will be created.'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.outbound_integration_queue q
  SET status = 'pending', attempts = 0, claimed_at = NULL, next_attempt_at = now(),
      requeued_at = now(), requeued_by = p_by, requeue_reason = btrim(p_reason)
  WHERE q.tenant_id = p_tenant AND q.kind = p_kind;

  RETURN 'pending';
END;
$function$;

-- ── Grants ──────────────────────────────────────────────────────────────────
-- Postgres grants EXECUTE to PUBLIC by default on creation. CREATE OR REPLACE
-- does not reset grants, but a future DROP-and-recreate would restore the
-- default, so the revokes are restated rather than assumed.
DO $$
DECLARE sig text;
BEGIN
  FOREACH sig IN ARRAY ARRAY[
    'public.outbound_queue_backoff(integer)',
    'public.outbound_queue_claim(integer, interval)',
    'public.outbound_queue_complete(uuid, text, text, text, integer)',
    'public.outbound_queue_requeue(uuid, text, text, uuid)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, authenticated', sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', sig);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
