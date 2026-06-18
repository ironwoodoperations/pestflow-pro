# Review — S273 PR #2b (invite + reset + set-password + Users tab) — 2026-06-18

## PR
#215 — S273 PR #2b: invite-team-member + password-reset + set-password + Users tab — `claude/laughing-mccarthy-cm6p7t`

## CI status (run locally; mirrors the Validate job)
- typecheck (`npx tsc --noEmit`): **PASS** (0 errors)
- lint (`npm run lint` = `eslint .`): **PASS** (0 errors; 180 warnings, all pre-existing `set-state-in-effect` style — deploy cap is 200)
- tests: **N/A locally** — no `npm test` script; CI runs Deno cross-tenant + pgTAP in a separate job that rebuilds migrations from a fixture (my pr2b migration is intentionally excluded there, so it can't break that job). The pr2b DDL is applied via MCP after review.
- build (`vite build`): **PASS**

## Findings

### CRITICAL (block ship)
- none

### HIGH (fix before /ship)
- [x] **Timing oracle re-opened in `password-reset-request`** — the success branch `await sendEmail(...)` before returning, so an existing-email response time = generateLink + Resend latency, which can exceed the 700 ms floor while a nonexistent email returns at ~700 ms. That is the exact oracle M3 closes. **FIXED:** the email send is detached via `EdgeRuntime.waitUntil()` (falls back to a non-awaited promise), so the response time no longer depends on send latency. `supabase/functions/password-reset-request/index.ts`.

### MEDIUM (fix this sprint)
- none

### LOW (note for later)
- [ ] `invite-team-member` resolves an existing-global user's id via `generateLink({type:'magiclink'})` and discards the token (never delivered). Mints a real-but-undelivered token that simply expires. Documented in-code; acceptable. A `getUserByEmail`-style admin lookup would avoid it if one becomes available. `supabase/functions/invite-team-member/index.ts`.
- [ ] CORS `Access-Control-Allow-Origin: '*'` on both new functions — acceptable (bearer-token auth, no cookies), but the repo's `_shared/cors.ts` wildcard-subdomain helper is the eventual convergence target. Consistent with the existing static-CORS functions.

## Scope check
- In spec: **yes** — matches the validator-passed `docs/specs/S273_pr2b_invite_reset_setpassword.md` file manifest (§6) exactly. No files outside the manifest except `REVIEW_*.md` (this note) and the Login "Forgot password?" entry point (the reset feature's required trigger; noted in spec §2).
- Drive-by edits: **none**.

## Tenant isolation check
- `invite-team-member`: tenant_id is **server-derived** (caller's `profiles.tenant_id`), never from the body; admin gate re-read fresh via `get_my_tenant_role` (strict `=== 'admin'`); membership row written with the server-derived tenant. ✓
- `password-reset-request`: tenant derived **server-side from the Origin/Referer host**, never the body. ✓
- `list_tenant_members()`: takes **no** caller tenant arg — derives `current_tenant_id()`, strict `= 'admin'` (NULL fails closed). ✓
- `tenant_users_block_last_admin` trigger fires on every write path (service-role bypasses RLS but not triggers). ✓
- Client `useTenantRole()` is the single role source; gate is UX-only, server is authoritative (documented). ✓

## Secret lens
- No hardcoded keys; service-role/anon keys from `Deno.env`. Invite/reset **links are never logged** (only `err.message` on catch). ✓

## Recommendation
**Ready for /ship after the HIGH fix lands** (fix applied on this branch in the same review pass). CI must go green and the two DDL objects + edge-fn deploys + `verify_jwt` toggles are applied by Scott via MCP/deploy after merge (and re-checked: invite ON, reset OFF). SPF/DKIM/DMARC on `pestflow.ai` is a pre-launch prereq (spec deployment note).
