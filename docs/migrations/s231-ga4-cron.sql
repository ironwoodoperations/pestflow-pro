-- S231 Phase 4: GA4 weekly cron dispatcher.
-- Applied via Supabase MCP apply_migration (name: s231_ga4_cron) on 2026-05-19.
-- Pattern mirrors s230-gsc-cron.sql (queue-pull, vault key, pg_net invocation).
--
-- Architecture:
--  * Sunday 04:00 UTC (offset from GSC at 03:00 to avoid concurrent cold starts).
--  * Eligible = normalize_tier(subscription) >= 3 AND ga4_oauth_refresh_token set
--    in integrations AND ga4_property_id set AND no SUCCESSFUL run in the last 7 days.
--  * Freshness: errored runs do NOT count — failed tenants self-heal next tick.
--  * Invocation: pg_net.http_post to ga4-analytics with service-role Bearer.

CREATE OR REPLACE FUNCTION public.ga4_cron_dispatch()
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
    RAISE WARNING '[ga4_cron_dispatch] supabase_service_role_key missing from vault';
    RETURN;
  END IF;

  FOR v_tenant IN
    SELECT t.id
    FROM public.tenants t
    INNER JOIN public.settings s_sub
      ON s_sub.tenant_id = t.id AND s_sub.key = 'subscription'
    INNER JOIN public.settings s_int
      ON s_int.tenant_id = t.id AND s_int.key = 'integrations'
    LEFT JOIN (
      SELECT tenant_id, MAX(ran_at) AS last_success
      FROM public.ga4_runs WHERE status = 'success'
      GROUP BY tenant_id
    ) gr ON gr.tenant_id = t.id
    WHERE public.normalize_tier(s_sub.value) >= 3
      AND (s_int.value->>'ga4_oauth_refresh_token') IS NOT NULL
      AND (s_int.value->>'ga4_oauth_refresh_token') <> ''
      AND (s_int.value->>'ga4_property_id') IS NOT NULL
      AND (s_int.value->>'ga4_property_id') <> ''
      AND (gr.last_success IS NULL OR gr.last_success < now() - interval '7 days')
    ORDER BY gr.last_success ASC NULLS FIRST
    LIMIT 10
  LOOP
    PERFORM net.http_post(
      url := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/ga4-analytics',
      body := jsonb_build_object('tenant_id', v_tenant, 'source', 'cron'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', v_key,
        'Authorization', 'Bearer ' || v_key
      ),
      timeout_milliseconds := 60000
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.ga4_cron_dispatch() FROM public;
REVOKE EXECUTE ON FUNCTION public.ga4_cron_dispatch() FROM anon;
GRANT EXECUTE ON FUNCTION public.ga4_cron_dispatch() TO service_role;

-- Sunday 04:00 UTC weekly (offset from GSC at 03:00)
SELECT cron.schedule(
  'ga4-weekly-refresh',
  '0 4 * * 0',
  $$ SELECT public.ga4_cron_dispatch(); $$
);

NOTIFY pgrst, 'reload schema';
