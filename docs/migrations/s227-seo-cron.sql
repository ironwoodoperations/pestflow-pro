-- S227 Phase 4: queue-pull cron dispatcher.
-- Applied via Supabase MCP apply_migration (name: s227_seo_cron) on 2026-05-18.
-- supabase/migrations/ is protected by protect-files.sh; DDL recorded here for
-- PR review (S224/Phase-1 precedent). Migration history is canonical.
--
-- Architecture (C2/Q1 reconciliations baked in):
--  * every 30 min, batch of 3 oldest-due tenants
--  * eligible = normalize_tier(subscription) >= 3  AND  seo_analytics configured
--    with a target_domain  AND  no SUCCESSFUL run in the last 7 days
--  * freshness = MAX(seo_runs.ran_at) WHERE status='success' (locked: errored
--    runs do NOT count fresh, so failed tenants self-heal next tick)
--  * invocation = pg_net.http_post to the seo-analytics edge fn with the
--    service-role key as Bearer (edge fn's JWT-role cron-bypass, shipped v8).
--    Body includes source:'cron' for intent/forward-compat (the actual bypass
--    discriminator is the service_role JWT claim, not this field).

-- Tier normalizer: settings.subscription.value -> int.
-- Dirty data tolerated: "4" (numeric string) and "pro" both seen (death audit).
-- CLAUDE.md map: Starter1 / Grow2 / Pro3 / Elite4.
CREATE OR REPLACE FUNCTION public.normalize_tier(p_sub jsonb)
RETURNS int
LANGUAGE sql
IMMUTABLE
SET search_path TO 'pg_catalog', 'public'
AS $$
  SELECT CASE
    WHEN (p_sub->>'tier') ~ '^[0-9]+$' THEN (p_sub->>'tier')::int
    WHEN lower(coalesce(p_sub->>'tier', p_sub->>'plan_name', '')) = 'starter' THEN 1
    WHEN lower(coalesce(p_sub->>'tier', p_sub->>'plan_name', '')) = 'grow'    THEN 2
    WHEN lower(coalesce(p_sub->>'tier', p_sub->>'plan_name', '')) = 'pro'     THEN 3
    WHEN lower(coalesce(p_sub->>'tier', p_sub->>'plan_name', '')) = 'elite'   THEN 4
    ELSE 0
  END;
$$;

-- Dispatcher: picks <=3 oldest-due eligible tenants, fires the edge fn each.
CREATE OR REPLACE FUNCTION public.seo_cron_dispatch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  v_key    text;
  v_tenant uuid;
BEGIN
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key';
  IF v_key IS NULL THEN
    RAISE WARNING '[seo_cron_dispatch] supabase_service_role_key missing from vault';
    RETURN;
  END IF;

  FOR v_tenant IN
    SELECT t.id
    FROM public.tenants t
    INNER JOIN public.settings s_sub
      ON s_sub.tenant_id = t.id AND s_sub.key = 'subscription'
    INNER JOIN public.settings s_seo
      ON s_seo.tenant_id = t.id AND s_seo.key = 'seo_analytics'
    LEFT JOIN (
      SELECT tenant_id, MAX(ran_at) AS last_success
      FROM public.seo_runs WHERE status = 'success'
      GROUP BY tenant_id
    ) sr ON sr.tenant_id = t.id
    WHERE public.normalize_tier(s_sub.value) >= 3
      AND s_seo.value ? 'target_domain'
      AND (sr.last_success IS NULL OR sr.last_success < now() - interval '7 days')
    ORDER BY sr.last_success ASC NULLS FIRST
    LIMIT 3
  LOOP
    PERFORM net.http_post(
      url := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/seo-analytics',
      body := jsonb_build_object('tenant_id', v_tenant, 'source', 'cron'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', v_key,
        'Authorization', 'Bearer ' || v_key
      ),
      timeout_milliseconds := 120000
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_tier(jsonb) FROM public;
REVOKE ALL ON FUNCTION public.seo_cron_dispatch() FROM public;
REVOKE EXECUTE ON FUNCTION public.normalize_tier(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.seo_cron_dispatch() FROM anon;
GRANT EXECUTE ON FUNCTION public.normalize_tier(jsonb) TO authenticated, service_role;

-- 30-minute queue-pull. cron job runs as the scheduling (postgres) role.
SELECT cron.schedule(
  'seo-analytics-dispatch',
  '*/30 * * * *',
  $$ SELECT public.seo_cron_dispatch(); $$
);

NOTIFY pgrst, 'reload schema';
