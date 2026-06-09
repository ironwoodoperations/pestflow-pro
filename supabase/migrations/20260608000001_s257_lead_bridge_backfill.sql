-- ============================================================================
-- S257 — Lead Bridge dispatch infrastructure (repo-truth backfill)
-- ============================================================================
-- REPO-TRUTH BACKFILL ONLY. Every object below is ALREADY LIVE in production
-- (project biezzykcgzkrwdgqpsar); it was applied via MCP (apply_migration /
-- execute_sql) and never landed in supabase/migrations/ (the cron.schedule left
-- no trail at all). This file makes the repo reflect live reality. It
-- introduces NO new DB behavior. Everything is guarded (IF NOT EXISTS /
-- OR REPLACE / DROP-then-CREATE / cron de-dupe) so re-running via
-- `supabase db reset` reproduces current production state.
--
-- Dependencies assumed already present (created by earlier migrations / the
-- Supabase platform): extensions pg_cron + pg_net, table public.tenants,
-- table public.tenant_users, table public.leads, and the Vault secrets
-- 'supabase_service_role_key' and 'lead_bridge_dispatch_internal_secret'.
--
-- All DDL below is taken verbatim from live introspection (pg_get_functiondef,
-- pg_get_constraintdef, pg_indexes, pg_policy, pg_get_triggerdef, cron.job).
-- ============================================================================


-- ── 1. tenants.pestflow_platform_company_id column + partial index ──────────
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS pestflow_platform_company_id uuid;

CREATE INDEX IF NOT EXISTS tenants_pestflow_platform_company_id_idx
  ON public.tenants USING btree (pestflow_platform_company_id)
  WHERE (pestflow_platform_company_id IS NOT NULL);


-- ── 2. public.lead_bridge_queue table + indexes + RLS ───────────────────────
CREATE TABLE IF NOT EXISTS public.lead_bridge_queue (
  id                uuid        NOT NULL DEFAULT gen_random_uuid(),
  tenant_id         uuid        NOT NULL,
  pro_lead_id       uuid        NOT NULL,
  target_url        text        NOT NULL,
  status            text        NOT NULL DEFAULT 'pending'::text,
  attempts          integer     NOT NULL DEFAULT 0,
  last_status_code  integer,
  last_error        text,
  platform_lead_id  uuid,
  next_attempt_at   timestamptz NOT NULL DEFAULT now(),
  last_attempted_at timestamptz,
  delivered_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_bridge_queue_pkey PRIMARY KEY (id),
  CONSTRAINT lead_bridge_queue_status_check
    CHECK ((status = ANY (ARRAY['pending'::text, 'delivered'::text, 'failed'::text, 'dead'::text]))),
  CONSTRAINT lead_bridge_queue_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
  CONSTRAINT lead_bridge_queue_pro_lead_uniq UNIQUE (tenant_id, pro_lead_id)
);

-- Reconciler "due" lookup: pending/failed rows ordered by next_attempt_at.
CREATE INDEX IF NOT EXISTS lead_bridge_queue_due_idx
  ON public.lead_bridge_queue USING btree (next_attempt_at)
  WHERE (status = ANY (ARRAY['pending'::text, 'failed'::text]));

-- Per-tenant browse.
CREATE INDEX IF NOT EXISTS lead_bridge_queue_tenant_idx
  ON public.lead_bridge_queue USING btree (tenant_id, created_at);

-- RLS: tenant members can READ their own queue rows; writes are service-role
-- only (service_role bypasses RLS, so no write policy exists — matches live).
ALTER TABLE public.lead_bridge_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lead_bridge_queue_tenant_read ON public.lead_bridge_queue;
CREATE POLICY lead_bridge_queue_tenant_read
  ON public.lead_bridge_queue
  FOR SELECT
  TO authenticated
  USING (tenant_id IN (
    SELECT tenant_users.tenant_id
    FROM tenant_users
    WHERE (tenant_users.user_id = auth.uid())
  ));


-- ── 3. RPC public.trigger_lead_bridge_dispatch() (S257) ─────────────────────
-- AFTER INSERT trigger fn: logs the pending queue row in-txn (survives a pg_net
-- drop), then fire-and-forget POSTs to the dispatch edge fn. IDs only, fail-soft.
CREATE OR REPLACE FUNCTION public.trigger_lead_bridge_dispatch()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _fn_url          text := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/lead-bridge-dispatch';
  _platform_url    text := 'https://iyoiaugljuwfveqysngb.functions.supabase.co/lead-receiver';
  _service_key     text;
  _internal_secret text;
  _platform_company_id uuid;
  _queue_id        uuid;
BEGIN
  -- Only dispatch for tenants connected to Platform.
  SELECT pestflow_platform_company_id INTO _platform_company_id
  FROM public.tenants WHERE id = NEW.tenant_id;

  IF _platform_company_id IS NULL THEN
    RETURN NEW;  -- not connected; skip silently (expected, not a failure)
  END IF;

  -- ── LOG ON INTENT: write the pending queue row in THIS transaction ──────
  -- Survives a pg_net drop. ON CONFLICT makes the trigger idempotent if a lead
  -- row is somehow re-inserted with the same id.
  INSERT INTO public.lead_bridge_queue (tenant_id, pro_lead_id, target_url, status)
  VALUES (NEW.tenant_id, NEW.id, _platform_url, 'pending')
  ON CONFLICT (tenant_id, pro_lead_id) DO NOTHING
  RETURNING id INTO _queue_id;

  IF _queue_id IS NULL THEN
    RETURN NEW;  -- already queued (duplicate insert); reconciler/dispatch owns it
  END IF;

  -- ── Fire async dispatch (best-effort). Reconciler covers any drop. ──────
  SELECT decrypted_secret INTO _service_key
  FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key';
  SELECT decrypted_secret INTO _internal_secret
  FROM vault.decrypted_secrets WHERE name = 'lead_bridge_dispatch_internal_secret';

  IF _service_key IS NULL OR _service_key = '' OR _service_key = 'placeholder'
     OR _internal_secret IS NULL OR _internal_secret = '' THEN
    RAISE WARNING '[lead-bridge-dispatch] missing vault secret; pending row left for reconciler';
    RETURN NEW;  -- pending row already written; reconciler will retry
  END IF;

  PERFORM net.http_post(
    url     := _fn_url,
    body    := jsonb_build_object('queue_id', _queue_id, 'pro_lead_id', NEW.id, 'tenant_id', NEW.tenant_id),
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer ' || _service_key,
                 'apikey',        _internal_secret
               )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[lead-bridge-dispatch] trigger error: %', SQLERRM;
  RETURN NEW;  -- fail-soft: never block lead capture
END;
$function$;


-- ── 4. RPC public.reconcile_lead_bridge_queue() (S257) ──────────────────────
-- pg_cron reconciler: marks attempts>=5 as dead, re-fires due pending/failed
-- rows (batch 50) with exponential backoff 2,4,8,16,32 min. Returns # fired.
CREATE OR REPLACE FUNCTION public.reconcile_lead_bridge_queue()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _fn_url          text := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/lead-bridge-dispatch';
  _service_key     text;
  _internal_secret text;
  _row             record;
  _fired           integer := 0;
BEGIN
  SELECT decrypted_secret INTO _service_key
  FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key';
  SELECT decrypted_secret INTO _internal_secret
  FROM vault.decrypted_secrets WHERE name = 'lead_bridge_dispatch_internal_secret';

  IF _service_key IS NULL OR _internal_secret IS NULL THEN
    RAISE WARNING '[reconcile_lead_bridge_queue] missing vault secret; aborting tick';
    RETURN 0;
  END IF;

  -- Mark rows that have exhausted retries as dead (cap = 5).
  UPDATE public.lead_bridge_queue
    SET status = 'dead'
    WHERE status IN ('pending','failed')
      AND attempts >= 5;

  -- Re-fire due rows. Cap the batch so a backlog can't stampede pg_net.
  FOR _row IN
    SELECT id, pro_lead_id, tenant_id
    FROM public.lead_bridge_queue
    WHERE status IN ('pending','failed')
      AND attempts < 5
      AND next_attempt_at <= now()
    ORDER BY next_attempt_at
    LIMIT 50
  LOOP
    -- Bump attempt + schedule next with exponential backoff:
    -- 2min * 2^attempts → 2,4,8,16,32 min. Dispatch fn flips to 'delivered' on 200.
    UPDATE public.lead_bridge_queue
      SET attempts          = attempts + 1,
          last_attempted_at = now(),
          next_attempt_at   = now() + (interval '2 minutes' * power(2, attempts))
      WHERE id = _row.id;

    PERFORM net.http_post(
      url     := _fn_url,
      body    := jsonb_build_object('queue_id', _row.id, 'pro_lead_id', _row.pro_lead_id, 'tenant_id', _row.tenant_id),
      headers := jsonb_build_object(
                   'Content-Type',  'application/json',
                   'Authorization', 'Bearer ' || _service_key,
                   'apikey',        _internal_secret
                 )
    );
    _fired := _fired + 1;
  END LOOP;

  RETURN _fired;
END;
$function$;


-- ── 5. Trigger on_lead_insert_bridge (S257) ─────────────────────────────────
DROP TRIGGER IF EXISTS on_lead_insert_bridge ON public.leads;
CREATE TRIGGER on_lead_insert_bridge
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.trigger_lead_bridge_dispatch();


-- ── 6. pg_cron reconciler schedule (S257) ───────────────────────────────────
-- Guarded so re-running doesn't create a duplicate job: unschedule-if-exists,
-- then (re)schedule. Live jobname: 'reconcile-lead-bridge-queue', every 5 min.
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reconcile-lead-bridge-queue') THEN
    PERFORM cron.unschedule('reconcile-lead-bridge-queue');
  END IF;
  PERFORM cron.schedule(
    'reconcile-lead-bridge-queue',
    '*/5 * * * *',
    $job$SELECT public.reconcile_lead_bridge_queue();$job$
  );
END
$cron$;


-- ── 7. Reload PostgREST schema cache ────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
