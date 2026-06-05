-- s255 settings-strip GUARD TRIGGER  (STAGED — apply via MCP, the PRE-STRIP GATE)
--
-- NOTE ON LOCATION: staged in docs/migrations/ per project convention (the
-- supabase/migrations/ dir is protected by .claude/hooks/protect-files.sh).
-- Claude.ai applies this via the Supabase MCP.
--
-- ──────────────────────────────────────────────────────────────────────────
-- PURPOSE (S255 validator gate — REQUIRED CHANGE 4)
-- ──────────────────────────────────────────────────────────────────────────
-- This is the gate that makes the destructive strip (s254-strip-settings-
-- secrets.sql) provably safe. It fires BEFORE INSERT OR UPDATE on
-- public.settings and, for the 'integrations' row, neutralizes any of the 4
-- vault-managed secret keys that a missed write path might still be pushing.
-- A re-leak therefore becomes an OBSERVABLE event, not a silent regression.
--
-- SEQUENCING (do NOT reorder):
--   1. Merge + deploy the S255 write-path PR (onboarding/provision/admin writes
--      route secrets to Vault and strip them from settings payloads).
--   2. Apply THIS trigger and observe ~48h (or until zero hits in the logs /
--      tenant_secret_strip_hits table below).
--   3. Only then apply s254-strip-settings-secrets.sql (the one-time strip).
-- The trigger then stays in place permanently as belt-and-suspenders.
--
-- ──────────────────────────────────────────────────────────────────────────
-- RAISE vs SILENT-STRIP — RECOMMENDATION
-- ──────────────────────────────────────────────────────────────────────────
-- The validators preferred a hard RAISE in staging to surface missed paths.
-- This repo has NO separate staging DB — the trigger is observed in PRODUCTION
-- against live tenants (Dang) with customer #2 imminent. A hard RAISE there
-- would FAIL a real admin's Save (and could lose the non-secret keys in the
-- same payload) the moment any path was missed.
--
-- RECOMMENDED (default below): SILENT-STRIP + RAISE WARNING + an observability
-- row. This neutralizes the leak (removes the 4 keys), keeps the admin's save
-- working, and records every hit (server log WARNING + public.
-- tenant_secret_strip_hits) so the 48h "did we miss a path?" question is
-- answered with the same fidelity as a hard RAISE — without breaking anyone.
-- Switch to the HARD-RAISE variant (commented at the bottom) only if you want a
-- loud failure and accept the live-save risk.
--
-- Rollback: docs/migrations/s255-settings-strip-guard-trigger-rollback.sql

-- ── observability sink: one row per neutralized write ───────────────────────
CREATE TABLE IF NOT EXISTS public.tenant_secret_strip_hits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid,
  op          text,          -- INSERT | UPDATE
  hit_keys    text[],        -- which of the 4 keys were present (names only)
  created_at  timestamptz NOT NULL DEFAULT now()
  -- intentionally NO column for any secret value
);
ALTER TABLE public.tenant_secret_strip_hits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tenant_secret_strip_hits FROM PUBLIC, anon, authenticated;

-- ── trigger function (DEFAULT: silent-strip + warn + record) ────────────────
CREATE OR REPLACE FUNCTION public.tg_strip_settings_secrets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_hit_keys text[] := '{}';
  v_key      text;
BEGIN
  IF NEW.key <> 'integrations' OR NEW.value IS NULL THEN
    RETURN NEW;
  END IF;

  FOREACH v_key IN ARRAY ARRAY[
    'facebook_access_token',
    'ga4_oauth_refresh_token',
    'gsc_oauth_refresh_token',
    'textbelt_api_key'
  ] LOOP
    IF NEW.value ? v_key THEN
      v_hit_keys := pg_catalog.array_append(v_hit_keys, v_key);
      NEW.value := NEW.value - v_key;   -- neutralize: drop the secret key
    END IF;
  END LOOP;

  IF pg_catalog.array_length(v_hit_keys, 1) IS NOT NULL THEN
    -- key NAMES only — never the values
    RAISE WARNING '[strip-guard] neutralized secret keys % on settings.integrations for tenant %',
      v_hit_keys, NEW.tenant_id;
    INSERT INTO public.tenant_secret_strip_hits (tenant_id, op, hit_keys)
    VALUES (NEW.tenant_id, TG_OP, v_hit_keys);
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS settings_strip_secrets ON public.settings;
CREATE TRIGGER settings_strip_secrets
  BEFORE INSERT OR UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_strip_settings_secrets();

-- ──────────────────────────────────────────────────────────────────────────
-- HARD-RAISE VARIANT (alternative) — uncomment to fail loudly instead.
-- Replaces the body's neutralize/record block with an exception. Use only if a
-- breaking failure on a missed live admin save is acceptable.
-- ──────────────────────────────────────────────────────────────────────────
-- CREATE OR REPLACE FUNCTION public.tg_strip_settings_secrets()
-- RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
-- DECLARE v_key text;
-- BEGIN
--   IF NEW.key <> 'integrations' OR NEW.value IS NULL THEN RETURN NEW; END IF;
--   FOREACH v_key IN ARRAY ARRAY['facebook_access_token','ga4_oauth_refresh_token','gsc_oauth_refresh_token','textbelt_api_key'] LOOP
--     IF NEW.value ? v_key THEN
--       RAISE EXCEPTION '[strip-guard] settings.integrations may not contain secret key % (tenant %) — route it through set-tenant-secret', v_key, NEW.tenant_id;
--     END IF;
--   END LOOP;
--   RETURN NEW;
-- END; $$;
