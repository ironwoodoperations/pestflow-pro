-- S338 — public.outbound_integration_queue. The durable outbound work table.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- UNTIMESTAMPED ON PURPOSE. ALREADY APPLIED (stamped
-- s338_outbound_integration_queue). See the note in
-- s338_page_content_seo_meta_tenant_fk.sql — this is the fifth fileless batch
-- in the arc and every one of these files exists to close that gap.
--
-- READ FROM THE LIVE OBJECT on 2026-09-04: columns from
-- information_schema.columns, constraints via pg_get_constraintdef(), indexes
-- from pg_indexes, the comment byte-exact from obj_description(). RLS enabled,
-- ZERO policies, 0 rows at the time of writing.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- WHAT THIS IS. The S334 gate resolved question A to answer A2: outbound vendor
-- work is enqueued INSIDE the provisioning transaction rather than fired after
-- commit. A row here is a promise the side effect will be ATTEMPTED — not that
-- it succeeded.
--
-- UNIQUE (tenant_id, kind) IS PERMANENT AND DELIBERATE. It is not a dedupe
-- convenience that a later change may relax. Zernio's create endpoint has no
-- idempotency key, so if this slot could ever be freed and re-filled, a second
-- POST would mint a duplicate vendor profile. Re-running work is therefore an
-- AUDITED UPDATE (outbound_queue_requeue), never a new row.
--
-- THE STATUS SET encodes the distinction the whole design turns on:
--   pending / retryable_failed  runnable; claim picks these up
--   processing                  leased to a worker
--   succeeded / failed_terminal / cancelled   finished
--   unknown                     THE REQUEST WAS SENT AND THE OUTCOME WAS NOT
--                               OBSERVED. A dead end on purpose: claim never
--                               returns it, and requeue refuses it for
--                               zernio_profile while vendor_ref is null.
--
-- RLS ON, ZERO POLICIES — deny-all for anon and authenticated; service_role
-- bypasses. The correct posture for a table only the worker and the
-- provisioning RPC touch. Policies would land with a UI that reads it.

CREATE TABLE IF NOT EXISTS public.outbound_integration_queue (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  kind            text        NOT NULL,
  payload         jsonb       NOT NULL DEFAULT '{}'::jsonb,
  status          text        NOT NULL DEFAULT 'pending',
  attempts        integer     NOT NULL DEFAULT 0,
  last_error      text,
  vendor_ref      text,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  claimed_at      timestamptz,
  requeued_at     timestamptz,
  requeued_by     uuid,
  requeue_reason  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'outbound_queue_tenant_kind_key') THEN
    ALTER TABLE public.outbound_integration_queue
      ADD CONSTRAINT outbound_queue_tenant_kind_key UNIQUE (tenant_id, kind);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'outbound_queue_kind_valid') THEN
    ALTER TABLE public.outbound_integration_queue
      ADD CONSTRAINT outbound_queue_kind_valid
      CHECK (kind = ANY (ARRAY['zernio_profile'::text, 'outscraper_initial'::text]));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'outbound_queue_status_valid') THEN
    ALTER TABLE public.outbound_integration_queue
      ADD CONSTRAINT outbound_queue_status_valid
      CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'succeeded'::text,
                                 'retryable_failed'::text, 'unknown'::text,
                                 'failed_terminal'::text, 'cancelled'::text]));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'outbound_queue_attempts_nonneg') THEN
    ALTER TABLE public.outbound_integration_queue
      ADD CONSTRAINT outbound_queue_attempts_nonneg CHECK (attempts >= 0);
  END IF;

  -- status='processing' and claimed_at are the SAME FACT. Enforcing the
  -- biconditional means a lease cannot leak: you cannot be processing without a
  -- claim time, and you cannot hold a claim time without being processing.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'outbound_queue_claim_consistent') THEN
    ALTER TABLE public.outbound_integration_queue
      ADD CONSTRAINT outbound_queue_claim_consistent
      CHECK (((status = 'processing'::text) = (claimed_at IS NOT NULL)));
  END IF;

  -- A requeue without a reason is an unexplained mutation of vendor-facing
  -- state. The biconditional makes the audit trail non-optional.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'outbound_queue_requeue_audited') THEN
    ALTER TABLE public.outbound_integration_queue
      ADD CONSTRAINT outbound_queue_requeue_audited
      CHECK (((requeued_at IS NULL) = (requeue_reason IS NULL)));
  END IF;
END $$;

-- Partial, matching how the claim query actually reads the table.
CREATE INDEX IF NOT EXISTS outbound_queue_runnable_idx
  ON public.outbound_integration_queue USING btree (next_attempt_at)
  WHERE (status = ANY (ARRAY['pending'::text, 'retryable_failed'::text]));

CREATE INDEX IF NOT EXISTS outbound_queue_claimed_idx
  ON public.outbound_integration_queue USING btree (claimed_at)
  WHERE (status = 'processing'::text);

CREATE INDEX IF NOT EXISTS outbound_queue_tenant_idx
  ON public.outbound_integration_queue USING btree (tenant_id);

ALTER TABLE public.outbound_integration_queue ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.outbound_integration_queue IS
  'S338. Durable outbound work enqueued INSIDE the provisioning transaction (S334 A2). A row is a promise the side effect will be ATTEMPTED, not that it succeeded. UNIQUE(tenant_id,kind) is permanent by design: Zernio has no idempotency key, so a freed slot could mint a duplicate vendor profile. Requeue = audited UPDATE, never a new row. RLS on, no policies.';

NOTIFY pgrst, 'reload schema';
