# Hotfix QA — AI Campaigns tier gate Elite → Pro

**Branch:** `hotfix/campaigns-tier-pro-not-elite`. Backend-only constant/string/comment change across three edge functions — no UI, no runtime data path change, so no browser QA applies. Static verification only.

## Static checks

| Check | Result |
|---|---|
| `grep -rn ELITE_TIER supabase/ src/` | ✅ **ZERO** matches |
| Literal `4` remaining in any tier comparison | ✅ none — all three are `tier < PRO_TIER` |
| `PRO_TIER = 3` defined + referenced consistently per file | ✅ (generate-social-batch, process-campaign-job, ai-proxy) |
| Error messages updated | ✅ `'AI Campaigns require the Pro plan.'` + `{ message: 'Pro tier required' }` |
| `_shared/aiAuth.ts` untouched (`campaign_generation: 3`) | ✅ unchanged |
| Other call sites of `ELITE_TIER` outside the 3 files | ✅ none (repo-wide grep) |
| `tsc` / `eslint` | N/A to these files — `tsconfig.json` excludes `supabase`; `eslint.config.js` ignores `supabase/functions/**` (Deno, URL imports). Changes are constant/string/comment-only with no new symbols, so no type/lint impact. `deno` is not installed in CC Web to run `deno check`. |

## Grep evidence (post-change)
```
grep -rn "ELITE_TIER" supabase/ src/   →  (no output)
generate-social-batch/index.ts:17  const PRO_TIER = 3
generate-social-batch/index.ts:50  ... tier < PRO_TIER ... 'AI Campaigns require the Pro plan.'
process-campaign-job/index.ts:24   const PRO_TIER = 3
process-campaign-job/index.ts:103  ... tier < PRO_TIER) return await fail('subscription_lapsed')
ai-proxy/index.ts:35   const PRO_TIER = 3   // internal purposes are Pro+ (§12)
ai-proxy/index.ts:141  ... tier < PRO_TIER) { await logI(403); return json(403, { error: { message: 'Pro tier required' } }) }
```

## Post-merge functional check (orchestrator, after redeploy)
- A **Pro (tier 3)** tenant can submit `generate-social-batch` → 202 (no longer 403 "Elite plan").
- `process-campaign-job` runs for a tier-3 tenant (no `subscription_lapsed` from the tier gate).
- ai-proxy `/internal` accepts a tier-3 acting tenant (no "Pro tier required" 403).
- A **tier ≤ 2** tenant still gets the 403 at all three layers.

## Verdict
Code complete + statically green. No redeploy in this PR (orchestrator redeploys the three functions via MCP post-merge). One deploy flag raised in REVIEW re: ai-proxy `verify_jwt`.
