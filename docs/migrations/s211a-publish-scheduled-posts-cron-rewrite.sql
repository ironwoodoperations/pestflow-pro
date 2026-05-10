-- S211a: rewrite the publish-scheduled-posts pg_cron schedule to inject the
-- in-source apikey gate value sourced from vault.decrypted_secrets.
--
-- Pattern: S199 trigger-jwt-rewrite (vault → header).
--
-- APPLY ORDER (code-first sequencing per S163):
--   1. Merge S211a PR.
--   2. Redeploy publish-scheduled-posts edge function:
--        supabase functions deploy publish-scheduled-posts \
--          --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt
--      (--no-verify-jwt is REQUIRED — supabase functions deploy flips
--      verify_jwt to true by default. S210 lesson.)
--   3. Verify env var PUBLISH_SCHEDULED_POSTS_INTERNAL_SECRET is set in the
--      Edge Functions secrets (Supabase Dashboard → Project Settings →
--      Edge Functions → Manage secrets) and matches the vault entry exactly.
--   4. Apply this migration via Supabase MCP.
--   5. Wait one cron tick (≤5min) and verify in Edge Function logs that
--      a) the next invocation succeeds (200 OK) and
--      b) no `[publish-scheduled-posts] auth failed` lines appear.
--
-- PREREQUISITES (Scott via Dashboard, BEFORE step 1):
--   - Vault entry: publish_scheduled_posts_internal_secret (64 hex)
--   - Edge fn secret: PUBLISH_SCHEDULED_POSTS_INTERNAL_SECRET (matches vault byte-for-byte)
--
-- ROLLBACK: see docs/migrations/s211a-rollback.sql

SELECT cron.unschedule('publish-scheduled-posts');

SELECT cron.schedule(
  'publish-scheduled-posts',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/publish-scheduled-posts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'publish_scheduled_posts_internal_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
