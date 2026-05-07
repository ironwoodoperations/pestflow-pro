-- Create sms_queue table for quiet-hours-gated SMS dispatch.
-- See s199 b19 for FL FTSA + OK OTPA compliance context.
CREATE TABLE IF NOT EXISTS public.sms_queue (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  to_phone        text NOT NULL,
  message         text NOT NULL,
  type            text NOT NULL,
  target_send_at  timestamptz NOT NULL,
  status          text NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued','sending','sent','failed')),
  attempts        smallint NOT NULL DEFAULT 0,
  last_error      text,
  textbelt_response jsonb,
  textbelt_key_used text, -- which key resolved (for debug; NEVER log full key)
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_queue_due
  ON public.sms_queue (target_send_at)
  WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS idx_sms_queue_tenant_status
  ON public.sms_queue (tenant_id, status, created_at DESC);

ALTER TABLE public.sms_queue ENABLE ROW LEVEL SECURITY;

-- Service role only. Operators don't read this table directly.
-- (No policies = no access for non-service-role JWTs. Service role bypasses RLS.)

COMMENT ON TABLE public.sms_queue IS
  'Quiet-hours-gated SMS dispatch queue. Rows inserted by send-sms when message
   falls outside 8 AM-8 PM in recipient timezone for FL/OK recipients.
   Drained by process-sms-queue cron worker every 5 minutes.';

NOTIFY pgrst, 'reload schema';
