-- S211a rollback: restore publish-scheduled-posts cron to its pre-S211a body
-- (no apikey header).
--
-- Apply IF S211a code is also reverted (or the gate env vars are missing in
-- prod) AND the cron is failing every tick with 401 from publish-scheduled-posts.
--
-- ROLLBACK ORDER:
--   1. Apply this migration via Supabase MCP (restores cron body).
--   2. (If reverting code as well) `git revert <S211a merge commit>` and merge.
--   3. (If reverting code as well) Redeploy both functions:
--        supabase functions deploy publish-scheduled-posts \
--          --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt
--        supabase functions deploy provision-tenant \
--          --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt
--   4. (Optional, manual via Dashboard) Remove env vars
--      PUBLISH_SCHEDULED_POSTS_INTERNAL_SECRET and
--      PROVISION_TENANT_INTERNAL_SECRET from Edge Function secrets.
--   5. (Optional, manual via Dashboard) Delete vault entries
--      publish_scheduled_posts_internal_secret and provision_tenant_internal_secret.
--
-- Steps 4 + 5 are NOT required for the cron to recover — they are hygiene only.

SELECT cron.unschedule('publish-scheduled-posts');

SELECT cron.schedule(
  'publish-scheduled-posts',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/publish-scheduled-posts',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
