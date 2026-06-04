# QA Report — S253 / A1: AI Authority Score

**Date:** 2026-06-04
**Branch:** `feat/s253-a1-ai-authority`
**Verdict:** ✅ PASS (unit + build). ⚠️ Edge functions could not be deployed/exercised in this environment (no Deno, no Supabase local) — runtime verification of the worker/proxies happens at operator deploy.

## What was run

| # | Check | Result |
|---|-------|--------|
| 1 | `npx vitest run` (scoped: scorer + match + parsers) | ✅ **22/22 passed** |
| 2 | `npx tsc -p tsconfig.app.json` — MY files only | ✅ 0 errors in new files (pre-existing errors elsewhere, untouched) |
| 3 | `npx tsc --noEmit` (root: app/shared/middleware, the CI gate) | ✅ exit 0 |
| 4 | `npm run build:vite` (frontend bundles with the tile) | ✅ built; ReportsTab chunk 83.2 kB |
| 5 | CI Anthropic-guard simulation (`grep api.anthropic.com src/ supabase/functions/ --exclude-dir=ai-proxy`) | ✅ no match |
| 6 | `npm run lint` regression check (stash compare) | ✅ **0 new errors** (main baseline 123 errors / 601 warnings pre-exists; this PR: same 123 errors, +1 warning) |

## Verification matrix (mapped to the task's 6 gates)

1. **Adapters normalize a mock engine response → ParsedCitation** — ✅ `parsers.test.ts`: `parsePerplexity` (citations[] + search_results fallback), `parseOpenAI` (url_citation annotations), `parseClaude` (web_search_tool_result). Each yields correct `cited/mentioned/position/share_of_voice`.
2. **`cited` exact-hostname matching** — ✅ `match.test.ts`: tenant `acmepest.com` (and `www.`) match; competitor `acmepestpros.com`/`notacmepest.com` do **not** (substring guard); tracked Yelp listing matches by host+path, a different `/biz/` does not.
3. **raw_response not readable via the tenant view** — ✅ verified at the schema level: `ai_authority_snapshots_tenant` view columns exclude `raw_response` (confirmed via `information_schema`); the tile/hook read the RPC + view only. (Worker writes both `parsed_result` and `raw_response` to the base table — code path in `ai-authority-worker`.)
4. **Scorer denominator = total scheduled, not snapshot count** — ✅ `score.test.ts`: `denom:50, completed:40 (10 errored), cited:25` → score **23** (uses 25/50=.5), NOT the inflated 25/40=.625→28.
5. **`google_aio` refuses while disabled** — ✅ `parseGoogleAioStub` always `parse_failed`; worker gate skips any engine not in `PROXY_FN` or with `adapter_enabled!=true` → `skipped_cost_cap` (code review). claude_web likewise skipped (unwired).
6. **Tile: locked tiles above tier; "Calibrating" under 40 runs** — ✅ `score.test.ts` calibration (null score, `Calibrating X/40`); tile renders `LockedCard` when engine not in tier and no historical data, `ComingSoonCard` for claude_web, `ScoreCard` otherwise (logic reviewed; full RTL render not in repo's test setup).

## Not verifiable here (operator deploy step)
- Worker/proxy runtime (Deno) — deploy `ai-authority-worker`, `ai-authority-perplexity`, `ai-authority-openai` (`verify_jwt:false`); set Edge-Function secret `AI_AUTHORITY_INTERNAL_SECRET` (= vault `ai_authority_internal_secret`); apply `docs/migrations/s253-a1-ai-authority-scores-rpc.sql` via MCP.
- End-to-end snapshot write + RLS (`raw_response` invisible to tenant) — confirm with a live job after deploy.
- `ai-proxy` regression — smoke-test one existing AI feature post-deploy (only the shared-helper import changed).

## Operator follow-ups (post-merge)
1. Deploy the 3 new edge functions.
2. Set `AI_AUTHORITY_INTERNAL_SECRET`.
3. Apply the scoring RPC.
4. Apply dispatch/drain cron (writes `tier_slug` + `engine` per job at enqueue).
5. Optional: set `claude_web` `adapter_enabled=false` to avoid enqueuing skipped jobs (worker skips them safely regardless).
