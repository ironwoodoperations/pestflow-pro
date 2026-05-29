# Cleanup QA — auth edge-fn batch

**Branch:** `cleanup/auth-edge-fn-batch`. Edge functions (Deno) + config + CI. No `src/` change → no UI QA. Static verification + the migrated runtime path described for the orchestrator's post-deploy check.

## Static checks

| Check | Result |
|---|---|
| Widened guard `grep -rEn "https://api\.anthropic\.com\|VITE_ANTHROPIC" src/ supabase/functions/ --exclude-dir=ai-proxy` | ✅ **0 hits** |
| `ANTHROPIC_API_KEY` in `supabase/functions/scrape-prospect/` | ✅ **ZERO** |
| `.env.example` contains `VITE_ANTHROPIC_API_KEY` | ✅ removed |
| `protect-files.sh` diff (relax→edit→restore) | ✅ **none** (restored byte-for-byte) |
| `npx tsc --noEmit` | ✅ 0 errors (no `src/` changed) |
| `npm run lint` | ✅ unchanged from main (no `src/` changed) |
| config.toml three blocks `verify_jwt=false` + generate-social-batch `true` | ✅ already correct (no change) |
| Change set = only the 5 authorized files | ✅ (.env.example, ci.yml, aiAuth.ts, scrape-prospect/index.ts, scrape-prospect/analyzeSite.ts) |
| Edge fns are Deno (URL imports) → excluded from Node tsc/eslint; `deno` not installed in CC Web | ⚠ no `deno check` available — changes verified by read + wiring grep |

## Wiring verification
- `aiAuth.ts`: `export const IRONWOOD_OPERATOR_USER_IDS`; `AiFeature | 'scrape_prospect_analyze'`; `FEATURE_TIER.scrape_prospect_analyze = 'operator'`.
- `scrape-prospect/index.ts`: `import { IRONWOOD_OPERATOR_USER_IDS }`; `!IRONWOOD_OPERATOR_USER_IDS.has(user.id)`; `analyzeSite(homepage.markdown, aiProxyUrl, authHeader)` (3 args ↔ new signature); `aiProxyRes`/`aiProxyData`.
- `analyzeSite.ts`: signature `(markdown, aiProxyUrl, authHeader)`; posts `feature:'scrape_prospect_analyze', tenant_id:null, system, messages`.

## Post-deploy functional check (orchestrator, after redeploy of scrape-prospect + ai-proxy)
1. Operator (`admin@pestflowpro.com`, uuid `5181b30a-…`) runs an Ironwood prospect scrape → `scraped` fields populate (extraction via ai-proxy) and `siteRecreation` returns real values (analyzeSite via ai-proxy), not just `DEFAULT`.
2. `ai_proxy_log` shows two `feature='scrape_prospect_analyze'` rows (operator path, `tenant_id` null, model pinned `claude-sonnet-4-6`).
3. A non-operator JWT → scrape-prospect 403; and if it reached ai-proxy, the operator lane 403s on the UUID allowlist.
4. ANTHROPIC_API_KEY Edge Function Secret on scrape-prospect can be removed (no longer read).

## Verdict
Statically complete + green. One flagged deviation (Item 5 `https://`-scheme guard pattern) for orchestrator sign-off before merge. Draft PR — not for auto-merge.
