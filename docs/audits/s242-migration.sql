-- ============================================================================
-- S242 Session 1 — AI Campaign Auto-Attach: backing schema (STAGED REFERENCE)
-- ============================================================================
-- NOT under supabase/migrations/ (that dir is protected). Scott applies these
-- via Supabase MCP `apply_migration` from the Claude.ai orchestration session,
-- one logical migration per section. CC Web does NOT apply these.
--
-- Project: biezzykcgzkrwdgqpsar (PRODUCTION). Live tenants: Ironclad/Dang + master.
-- Audit basis: docs/audits/s242-auto-attach-audit.md (no drift from design v3 §17).
-- Idempotent: ADD COLUMN IF NOT EXISTS + DO-guards on constraints/triggers, so
-- re-running a section is safe.
--
-- APPLY ORDER:
--   M1 social_campaigns  →  M2 image_library  →  M3 campaign_jobs (+trigger)
--   →  M4 delegation_jti  →  M5 ai_proxy_log cols  →  M6 RPC  →  M7 cron (LAST)
-- M7 (cron) must be applied ONLY AFTER the 3 edge fns are deployed & reachable.
-- ============================================================================


-- ── M1 — social_campaigns: image-strategy columns (design §5 Migration 1) ───
ALTER TABLE public.social_campaigns
  ADD COLUMN IF NOT EXISTS image_strategy TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS image_strategy_folder TEXT NULL,
  ADD COLUMN IF NOT EXISTS image_strategy_image_id UUID NULL
    REFERENCES public.image_library(id) ON DELETE SET NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'image_strategy_known') THEN
    ALTER TABLE public.social_campaigns
      ADD CONSTRAINT image_strategy_known
      CHECK (image_strategy IN ('none','folder','ai_vision','fixed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'image_strategy_config_matches') THEN
    ALTER TABLE public.social_campaigns
      ADD CONSTRAINT image_strategy_config_matches CHECK (
        (image_strategy = 'folder'   AND image_strategy_folder IS NOT NULL AND image_strategy_image_id IS NULL)
        OR (image_strategy = 'ai_vision' AND image_strategy_folder IS NULL  AND image_strategy_image_id IS NULL)
        OR (image_strategy = 'fixed'  AND image_strategy_image_id IS NOT NULL AND image_strategy_folder IS NULL)
        OR (image_strategy = 'none'   AND image_strategy_folder IS NULL  AND image_strategy_image_id IS NULL)
      );
  END IF;
END $$;
-- NOTE: social_campaigns.status is free-text (no CHECK); 'pending_generation' /
-- 'active' need no enum migration (audit F2).


-- ── M2 — image_library: vision-tagging columns + indexes (design §5 Mig 2) ──
ALTER TABLE public.image_library
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tag_status TEXT NULL,          -- NULL = historical, not yet enqueued
  ADD COLUMN IF NOT EXISTS tagged_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS tag_retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tag_last_attempted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS tag_last_error TEXT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'image_library_tag_status_known') THEN
    ALTER TABLE public.image_library
      ADD CONSTRAINT image_library_tag_status_known
      CHECK (tag_status IS NULL OR tag_status IN ('pending','processing','tagged','failed','skipped'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS image_library_tags_gin_idx
  ON public.image_library USING GIN (tags);
CREATE INDEX IF NOT EXISTS image_library_tag_pending_idx
  ON public.image_library (created_at) WHERE tag_status = 'pending';
CREATE INDEX IF NOT EXISTS image_library_tag_processing_idx
  ON public.image_library (tag_last_attempted_at) WHERE tag_status = 'processing';
-- Existing 18 active rows stay tag_status = NULL until enqueue_image_tagging_backfill
-- (M6) flips them to 'pending'. New uploads set 'pending' in app code (Session 2).


-- ── M3 — campaign_jobs table + RLS + indexes + enqueue trigger (design §5/§8) ─
CREATE TABLE IF NOT EXISTS public.campaign_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id),
  campaign_id       UUID NULL REFERENCES public.social_campaigns(id) ON DELETE SET NULL,
  status            TEXT NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued','processing','completed','failed')),
  request_body      JSONB NOT NULL,
  posts_requested   INTEGER NOT NULL,
  posts_created     INTEGER NOT NULL DEFAULT 0,
  posts_with_images INTEGER NOT NULL DEFAULT 0,
  last_error        TEXT NULL,
  started_at        TIMESTAMPTZ NULL,
  completed_at      TIMESTAMPTZ NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT batch_size_capped CHECK (posts_requested BETWEEN 1 AND 60)
);

CREATE INDEX IF NOT EXISTS campaign_jobs_queued_idx
  ON public.campaign_jobs (created_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS campaign_jobs_processing_idx
  ON public.campaign_jobs (started_at) WHERE status = 'processing';
CREATE INDEX IF NOT EXISTS campaign_jobs_tenant_idx
  ON public.campaign_jobs (tenant_id, created_at DESC);

ALTER TABLE public.campaign_jobs ENABLE ROW LEVEL SECURITY;
-- Tenant admins read their own jobs (frontend realtime in Session 2). No client
-- INSERT/UPDATE policy → writes happen only via service-role (generate-social-batch
-- + process-campaign-job), which bypasses RLS. Service-role code still applies an
-- explicit tenant_id predicate (defense-in-depth, standing rule 5).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
                 AND tablename='campaign_jobs' AND policyname='campaign_jobs_tenant_select') THEN
    CREATE POLICY campaign_jobs_tenant_select ON public.campaign_jobs
      FOR SELECT TO authenticated
      USING (tenant_id = (SELECT public.current_tenant_id()));
  END IF;
END $$;

-- INSERT trigger → fire-and-forget pg_net POST to the process-campaign-job worker.
-- Mirrors the S199 trigger_notify_new_lead pattern. SECURITY DEFINER + empty
-- search_path; everything schema-qualified. Reads the worker apikey from vault.
CREATE OR REPLACE FUNCTION public.trigger_process_campaign_job()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_secret text;
BEGIN
  IF NEW.status = 'queued' THEN
    SELECT decrypted_secret INTO v_secret
      FROM vault.decrypted_secrets
      WHERE name = 'process_campaign_job_internal_secret';
    IF v_secret IS NULL OR v_secret = '' THEN
      RAISE WARNING '[campaign_jobs_enqueue] vault secret missing; job % left queued for reaper/manual kick', NEW.id;
      RETURN NEW;
    END IF;
    PERFORM net.http_post(
      url     := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/process-campaign-job',
      headers := jsonb_build_object('Content-Type','application/json','apikey', v_secret),
      body    := jsonb_build_object('job_id', NEW.id)
    );
  END IF;
  RETURN NEW;
-- Fail-soft (mirrors trigger_notify_new_lead): a dispatch error must NOT roll
-- back the job INSERT. The job stays 'queued'; reaper/manual re-kick recovers it.
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[campaign_jobs_enqueue] dispatch failed for job %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS campaign_jobs_enqueue ON public.campaign_jobs;
CREATE TRIGGER campaign_jobs_enqueue
  AFTER INSERT ON public.campaign_jobs
  FOR EACH ROW EXECUTE FUNCTION public.trigger_process_campaign_job();


-- ── M4 — delegation_jti: envelope replay protection (design §5 Mig 4 / §9) ──
CREATE TABLE IF NOT EXISTS public.delegation_jti (
  jti        UUID PRIMARY KEY,
  purpose    TEXT NOT NULL,
  caller     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS delegation_jti_cleanup_idx ON public.delegation_jti (created_at);
ALTER TABLE public.delegation_jti ENABLE ROW LEVEL SECURITY;
-- No policies → service-role only (ai-proxy /internal inserts; reaper cron deletes).


-- ── M5 — ai_proxy_log: actor-chain columns (design §11) ─────────────────────
ALTER TABLE public.ai_proxy_log
  ADD COLUMN IF NOT EXISTS caller            TEXT NULL,
  ADD COLUMN IF NOT EXISTS acting_user       UUID NULL,
  ADD COLUMN IF NOT EXISTS purpose           TEXT NULL,
  ADD COLUMN IF NOT EXISTS jti               UUID NULL,
  ADD COLUMN IF NOT EXISTS batch_cardinality INTEGER NULL;
-- User-direct (S243) rows: caller='frontend', acting_user=user_id, purpose=feature,
-- jti=NULL, batch_cardinality=1. Envelope rows: all five from the envelope claims.


-- ── M6 — controlled backfill RPC (design §5 backfill / §6) ──────────────────
-- Operator fires manually in Session 2 AFTER monitoring is in place:
--   SELECT public.enqueue_image_tagging_backfill(5);   -- repeat until 0 returned
-- Flips up to chunk_size historical rows (tag_status IS NULL) to 'pending'. The
-- upload trigger / nightly cron then tags them. Returns # rows enqueued this call.
CREATE OR REPLACE FUNCTION public.enqueue_image_tagging_backfill(chunk_size integer DEFAULT 5)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH picked AS (
    SELECT id FROM public.image_library
      WHERE tag_status IS NULL AND deleted_at IS NULL
      ORDER BY created_at ASC
      LIMIT GREATEST(chunk_size, 0)
      FOR UPDATE SKIP LOCKED
  )
  UPDATE public.image_library il
     SET tag_status = 'pending'
    FROM picked
   WHERE il.id = picked.id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.enqueue_image_tagging_backfill(integer) FROM public, anon, authenticated;


-- ── M7 — pg_cron entries — APPLY LAST (after all 3 edge fns are deployed) ───
-- Reaper: stuck-job + stuck-tag recovery + jti GC. Pure SQL, runs every 5 min.
CREATE OR REPLACE FUNCTION public.s242_reaper()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  UPDATE public.campaign_jobs
     SET status='failed', last_error='timeout', completed_at=NOW()
   WHERE status='processing' AND started_at < NOW() - INTERVAL '10 minutes';

  UPDATE public.image_library
     SET tag_status='pending', tag_last_error='reaper_recovery'
   WHERE tag_status='processing' AND tag_last_attempted_at < NOW() - INTERVAL '10 minutes';

  DELETE FROM public.delegation_jti WHERE created_at < NOW() - INTERVAL '10 minutes';
END;
$$;
REVOKE ALL ON FUNCTION public.s242_reaper() FROM public, anon, authenticated;

SELECT cron.schedule('s242-reaper', '*/5 * * * *', 'SELECT public.s242_reaper();');

-- Nightly vision tagging batch (03:00 UTC). apikey carries the internal secret;
-- tag-image-vision (verify_jwt:false) compares it constant-time before doing work.
SELECT cron.schedule(
  's242-tag-image-vision-nightly',
  '0 3 * * *',
  $cron$
  SELECT net.http_post(
    url     := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/tag-image-vision',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey', (SELECT decrypted_secret FROM vault.decrypted_secrets
                 WHERE name = 'tag_image_vision_internal_secret')
    ),
    body    := '{"mode":"batch","limit":50}'::jsonb
  );
  $cron$
);
-- ============================================================================
-- END S242 staged migration. After M7, smoke-test per QA_REPORT_S242_session1.md.
-- ============================================================================
