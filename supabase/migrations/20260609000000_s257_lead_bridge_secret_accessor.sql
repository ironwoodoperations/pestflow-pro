-- ============================================================================
-- S257 — get_lead_bridge_internal_secret() accessor (repo-truth backfill)
-- ============================================================================
-- REPO-TRUTH BACKFILL ONLY. Already live in production (biezzykcgzkrwdgqpsar),
-- applied via MCP. No new behavior. Idempotent (CREATE OR REPLACE + guarded grants).
--
-- WHY: the lead-bridge-dispatch edge fn cannot read vault.decrypted_secrets via
-- the PostgREST data API (.schema('vault')) because the vault schema is not
-- exposed to PostgREST. This SECURITY DEFINER accessor in the exposed `public`
-- schema is the working pattern; the edge fn calls it via supabase.rpc().
-- service_role-only EXECUTE.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_lead_bridge_internal_secret()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  _secret text;
BEGIN
  SELECT decrypted_secret INTO _secret
  FROM vault.decrypted_secrets
  WHERE name = 'lead_bridge_dispatch_internal_secret';
  RETURN _secret;  -- NULL if absent; caller treats NULL as misconfigured
END;
$function$;

REVOKE ALL ON FUNCTION public.get_lead_bridge_internal_secret() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_lead_bridge_internal_secret() FROM anon;
REVOKE ALL ON FUNCTION public.get_lead_bridge_internal_secret() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_lead_bridge_internal_secret() TO service_role;

NOTIFY pgrst, 'reload schema';
