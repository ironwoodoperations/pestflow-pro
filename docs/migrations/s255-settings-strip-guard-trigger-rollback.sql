-- s255 settings-strip GUARD TRIGGER — ROLLBACK
--
-- Removes the pre-strip guard. Do NOT run this after the destructive strip
-- (s254-strip-settings-secrets.sql) has been applied unless you have another
-- guarantee that no write path re-introduces the 4 secret keys — the trigger is
-- the permanent belt-and-suspenders against re-leak.

DROP TRIGGER IF EXISTS settings_strip_secrets ON public.settings;
DROP FUNCTION IF EXISTS public.tg_strip_settings_secrets();

-- Keep the observability sink unless you explicitly want to discard hit history:
-- DROP TABLE IF EXISTS public.tenant_secret_strip_hits;
