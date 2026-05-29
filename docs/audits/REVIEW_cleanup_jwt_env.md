# Review — cleanup: pin verify_jwt + drop VITE_ANTHROPIC_API_KEY

**Branch:** `cleanup/jwt-config-and-env` · No source/tests/migrations/frontend. Config + docs only. **No redeploy in this PR.**

## Item 3 — `supabase/config.toml` verify_jwt pins ✅ DONE
Only `ai-proxy` needed a change; the other two were already `false`; `generate-social-batch` stays `true`.

| block | before | after |
|---|---|---|
| `[functions.ai-proxy]` (L11) | `verify_jwt = true` | `verify_jwt = false` |
| `[functions.process-campaign-job]` (L18) | `verify_jwt = false` | unchanged (already false) |
| `[functions.tag-image-vision]` (L20) | `verify_jwt = false` | unchanged (already false) |
| `[functions.generate-social-batch]` (L15) | `verify_jwt = true` | unchanged (stays true — user context) |

Rationale (also as a comment in the file): the dashboard "Verify JWT" toggle has flipped back ON after redeploys; pinning `false` in `config.toml` is the durable fix for CLI/CC-Web redeploys. `ai-proxy` validates the user JWT inline (`requireAiCaller`) on the public route and uses HMAC delegation envelopes on `/internal` — and importantly the `/internal` callers (`process-campaign-job`, `tag-image-vision`) send the envelope with **no** JWT, so a gateway `verify_jwt=true` would have rejected those service-to-service calls at the edge. `false` is required for that path to work; auth is enforced in-handler. `process-campaign-job`/`tag-image-vision` run in cron/service-role contexts (internal-secret / vault-key authed). `generate-social-batch` is user-context, so gateway JWT verification stays on.

Rest of file untouched.

## Item 6 — `.env.example` remove `VITE_ANTHROPIC_API_KEY` ⛔ BLOCKED → deferred
**Not done — file is protected.** `.env.example:3` (`VITE_ANTHROPIC_API_KEY=your-anthropic-key-here`) matches the `\.env` pattern in `.claude/hooks/protect-files.sh` (the pattern intends `.env`/`.env.local` but also catches the committed `.env.example` template). Per task rule, halted — did not attempt to unprotect.

Exact intended change (for a future authorized PR): **delete** `.env.example:3` `VITE_ANTHROPIC_API_KEY=your-anthropic-key-here` (no stub/comment replacement). This naturally bundles with **item 5** (CI grep-guard widening) and the edge-fn cleanup PR (items 2/4) — they all concern eliminating direct-Anthropic / banned-env references. Note for Scott: the `\.env` pattern is broad enough to catch `.env.example`; you may want to narrow it (e.g. `(^|/)\.env($|\.local)`) so committed templates stay editable — not changed here (hook is itself a protected concern).

## Item 5 — DEFERRED (not in this PR)
CI grep-guard widening would trip CI on scrape-prospect's existing direct Anthropic call before item 4 ships. Bundled WITH item 4 in the future authorized edge-fn cleanup PR — no allowlist hack, no draft-holding.

## Protected-files summary
- Touched: `supabase/config.toml` (not protected) ✅
- Skipped (protected): `.env.example` (matched `\.env`) — item 6 deferred.

## Risk
Config-only. The live effect (gateway stops pre-verifying JWT on `ai-proxy`) requires redeploy — **orchestrator redeploys post-merge** (see QA). Until redeploy, the deployed function keeps whatever the dashboard toggle currently holds; this PR makes the *intended* state durable in source.
