-- S235: Outscraper reviews integration setup
-- Migration name: s235_outscraper_reviews_setup
--
-- Creates:
--   1. Partial unique index on testimonials for upsert deduplication
--   2. Extends rate_limit_events cleanup to 12h (supports 6h outscraper rate window)
--   3. outscraper_cron_dispatch() SECURITY DEFINER function
--   4. Daily cron job at 2am UTC
--
-- Post-migration manual step (Scott):
--   Run in Supabase SQL Editor:
--     SELECT encode(gen_random_bytes(48), 'base64');
--   Then:
--     SELECT vault.create_secret('<generated_value>', 'outscraper_cron_internal_secret');
--
-- Also required (Scott, in Supabase Dashboard → Settings → Edge Functions → Secrets):
--   Add OUTSCRAPER_API_KEY with the API key from app.outscraper.com

-- 1. Partial unique index — deduplicates Outscraper-sourced testimonials only.
--    Legacy source='Google' rows with google_review_id=NULL are completely unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS testimonials_tenant_google_review_id_unique
  ON public.testimonials (tenant_id, google_review_id)
  WHERE google_review_id IS NOT NULL;

-- 2. Extend rate_limit_events row retention from 1h → 12h.
--    This preserves rate-limit rows for the 6-hour outscraper manual-refresh window.
--    The existing api-quote 1-hour rate limit is unaffected — its query still filters
--    by created_at > NOW() - INTERVAL '1 hour'; stale rows beyond 1h simply don't count.
SELECT cron.schedule(
  'rate-limit-cleanup',
  '0 * * * *',
  $$ DELETE FROM public.rate_limit_events WHERE created_at < NOW() - INTERVAL '12 hours' $$
);

-- 3. SQL dispatcher function: called by cron, fans out one HTTP POST per eligible tenant
CREATE OR REPLACE FUNCTION public.outscraper_cron_dispatch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  r RECORD;
  cutoff_days INTEGER;
  internal_secret TEXT;
BEGIN
  SELECT decrypted_secret INTO internal_secret
  FROM vault.decrypted_secrets WHERE name = 'outscraper_cron_internal_secret';

  IF internal_secret IS NULL THEN
    RAISE WARNING '[outscraper_cron_dispatch] outscraper_cron_internal_secret not found in vault — aborting';
    RETURN;
  END IF;

  FOR r IN
    SELECT
      t.id AS tenant_id,
      (s_sub.value->>'tier')::text AS tier_raw,
      (s_int.value->>'outscraper_last_synced_at')::timestamptz AS last_synced
    FROM tenants t
    JOIN settings s_sub ON s_sub.tenant_id = t.id AND s_sub.key = 'subscription'
    JOIN settings s_int ON s_int.tenant_id = t.id AND s_int.key = 'integrations'
    WHERE t.archived_at IS NULL
      AND COALESCE(
        NULLIF(s_int.value->>'google_cid', ''),
        NULLIF(s_int.value->>'google_fid', ''),
        NULLIF(s_int.value->>'google_place_id', '')
      ) IS NOT NULL
  LOOP
    -- Resolve tier string or integer to cutoff cadence
    -- Handles both numeric ('4') and string ('elite', 'pro', 'grow') formats
    cutoff_days := CASE
      WHEN r.tier_raw IN ('4', 'elite', 'Elite') THEN 7
      WHEN r.tier_raw IN ('3', 'pro', 'Pro')     THEN 7
      WHEN r.tier_raw IN ('2', 'grow', 'Grow', 'growth', 'Growth') THEN 15
      ELSE 30  -- tier 1 / starter / unknown — monthly
    END;

    IF r.last_synced IS NULL OR r.last_synced < NOW() - (cutoff_days || ' days')::interval THEN
      PERFORM net.http_post(
        url := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/outscraper-reviews',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', internal_secret
        ),
        body := jsonb_build_object(
          'tenant_id', r.tenant_id::text,
          'mode', CASE WHEN r.last_synced IS NULL THEN 'initial' ELSE 'incremental' END
        )
      );
      RAISE LOG '[outscraper_cron_dispatch] queued tenant=% mode=%',
        r.tenant_id, CASE WHEN r.last_synced IS NULL THEN 'initial' ELSE 'incremental' END;
    END IF;
  END LOOP;
END;
$$;

-- 4. Daily cron at 2am UTC
SELECT cron.schedule(
  'outscraper-daily-dispatch',
  '0 2 * * *',
  $$SELECT public.outscraper_cron_dispatch();$$
);
