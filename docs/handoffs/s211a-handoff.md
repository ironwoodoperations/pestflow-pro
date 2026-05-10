# S211a — apikey gates on provision-tenant + publish-scheduled-posts

**Branch:** `s211a-c3-clean-apikey-gates`
**PR:** TBD (opened as draft)
**Pattern:** mechanical replay of notify-new-lead@v33 (PR #55, S200) and send-sms@v35 (PR #56, S202).

## Files changed

**Edge functions (gated, refactored to handler/import.meta.main pattern):**
- `supabase/functions/publish-scheduled-posts/index.ts` — apikey gate, drift cleanup (stripped dead `specificPostId` body parse path), v-bumped comment header to reference S211a
- `supabase/functions/provision-tenant/index.ts` — `x-pfp-internal-key` gate (Option 3 split — see PR description)

**New tests (5 cases each, mock fetch, exercise exported `handler` directly):**
- `supabase/functions/publish-scheduled-posts/index.test.ts`
- `supabase/functions/provision-tenant/index.test.ts`

**Caller updates (add gate header to outbound `fetch` to provision-tenant):**
- `supabase/functions/stripe-webhook/index.ts` — adds `x-pfp-internal-key` to the fetch at L90
- `supabase/functions/ironwood-provision/index.ts` — adds `x-pfp-internal-key` to the fetch at L61 alongside the existing `apikey: SUPABASE_SERVICE_ROLE_KEY` (no collision with distinct header names)

**Migration SQL (staged, NOT applied — claude.ai applies via Supabase MCP after merge + deploy):**
- `docs/migrations/s211a-publish-scheduled-posts-cron-rewrite.sql` — new cron body sources `apikey` from `vault.decrypted_secrets.publish_scheduled_posts_internal_secret`
- `docs/migrations/s211a-rollback.sql` — restores pre-S211a cron body (no apikey header)

## Test cases verified (5 + 5)

`publish-scheduled-posts/index.test.ts`:
1. apikey header missing → 401, zero downstream calls
2. apikey header wrong → 401, zero downstream calls
3. apikey correct + valid empty body → 200, returns `{ fired, published, failed }` shape
4. apikey correct + body `{ post_id: ... }` → 200, post_id ignored after S211a drift cleanup
5. `PUBLISH_SCHEDULED_POSTS_INTERNAL_SECRET` unset → 500, zero downstream calls

`provision-tenant/index.test.ts`:
1. `x-pfp-internal-key` missing → 401, zero downstream calls
2. `x-pfp-internal-key` wrong → 401, zero downstream calls
3. `apikey: SECRET` present (wrong header name) → 401 — regression guard for the Option 3 split, ensures the gate ignores `apikey` by design
4. `x-pfp-internal-key` correct + valid body → gate passes (downstream provisioning logic exercised; the assertion is gate did NOT short-circuit at 401 + at least one downstream call attempted)
5. `PROVISION_TENANT_INTERNAL_SECRET` unset → 500, zero downstream calls

## Prerequisites checklist (Scott — already done before session start)

- [x] Vault entries created via Dashboard:
  - `publish_scheduled_posts_internal_secret` (64 hex)
  - `provision_tenant_internal_secret` (64 hex)
- [x] Edge function env vars set via Dashboard → Edge Functions → Manage secrets:
  - `PUBLISH_SCHEDULED_POSTS_INTERNAL_SECRET` (matches vault byte-for-byte)
  - `PROVISION_TENANT_INTERNAL_SECRET` (matches vault byte-for-byte)

## Post-merge actions

**Scott:**
- Merge PR (after Perplexity + Gemini validator gate clears in claude.ai).

**claude.ai (via MCP, in stated order — code-first sequencing per S163):**
1. Redeploy edge functions (both with `--no-verify-jwt` per S210 lesson):
   ```
   supabase functions deploy publish-scheduled-posts --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt
   supabase functions deploy provision-tenant       --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt
   supabase functions deploy stripe-webhook         --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt
   supabase functions deploy ironwood-provision     --project-ref biezzykcgzkrwdgqpsar
   ```
   (ironwood-provision keeps verify_jwt:true — it is the JWT-verified wrapper. Per its existing comment on L1.)
2. Apply `docs/migrations/s211a-publish-scheduled-posts-cron-rewrite.sql` via Supabase MCP `apply_migration`.
3. Wait one cron tick (≤5min). Verify Edge Function logs:
   - publish-scheduled-posts: next invocation returns 200, no `auth failed` log entries
   - provision-tenant: next test provision (real or via MCP-triggered call) succeeds; no `auth failed` log entries

## Validator gate (claude.ai pre-merge)

Auth-adjacent change → Perplexity + Gemini gate runs in claude.ai. Narrow questions:

1. **Header-merge behavior** — the Option 3 split was driven by JS object-literal last-wins on the source side and WHATWG comma-merge on the wire. The split (provision-tenant uses `x-pfp-internal-key`; publish-scheduled-posts keeps `apikey`) eliminates the trap on the only function where collision exists. Validator question: does any Deno or Supabase Edge Runtime quirk reverse this analysis? (Expected: no.)

2. **Vault read in pg_cron body** — `(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ...)` inside `cron.schedule(... $$ ... $$)` body. S199 trigger-jwt-rewrite establishes vault reads work from row triggers; pg_cron is a different invocation context. Validator question: any pg_cron-specific gotchas (timing, security context, definer rights)? (Expected: works the same — both run as the cron owner, which is `postgres` by default.)

If validators conflict, default fail-closed (S165 precedent).

## Out of scope (logged, NOT fixed in this PR)

- **`apikey: SUPABASE_SERVICE_ROLE_KEY` in ironwood-provision/index.ts:66 is dead code.** stripe-webhook → provision-tenant works without it (only sends `Authorization: Bearer`), proving the platform `apikey` isn't required for `verify_jwt: false` calls. Belongs in a hygiene PR. Add to v78 backlog at session close.

- The other 19 unaudited `verify_jwt: false` edge functions (S211b/S212/S213/S214).

## Caveat from CC Web

- Cron rewrite migration NOT applied. SQL staged at `docs/migrations/s211a-publish-scheduled-posts-cron-rewrite.sql`; claude.ai applies after merge + redeploys.
- Edge functions NOT redeployed. claude.ai handles via Supabase MCP after merge.
- Validator gate NOT run. claude.ai runs Perplexity + Gemini before merge per S210 protocol.
