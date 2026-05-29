# Cleanup Review — auth edge-fn batch

**Branch:** `cleanup/auth-edge-fn-batch` (off `main` @ 2dceec7). Edge functions + config + CI only. No migrations, no frontend, no `requireTenantUser.ts`, no `provision-tenant`, no other edge functions.

## Item 1 — config.toml audit (NO CHANGE NEEDED)
Already correct on `main` (set by #129). Pre-PR == post-PR:

| Block | verify_jwt |
|---|---|
| `[functions.ai-proxy]` | `false` ✅ |
| `[functions.process-campaign-job]` | `false` ✅ |
| `[functions.tag-image-vision]` | `false` ✅ |
| `[functions.generate-social-batch]` | `true` ✅ (present & true — allowed) |

## Item 3 — .env.example
`#129`'s commit message claimed this, but the line was still present on `main`. Removed line 3 `VITE_ANTHROPIC_API_KEY=...` (no replacement). `.env.example` matches the `\.env` protect pattern, so used the authorized relax→edit→restore on `.claude/hooks/protect-files.sh` — **the hook is restored byte-for-byte (zero diff), not committed.**

## Item 4 — scrape-prospect → ai-proxy operator route + UUID auth

### Pre-work confirmed
- **ai-proxy public route** accepts `{ feature, tenant_id (nullable), max_tokens, messages, system?, temperature? }`, returns Anthropic-native `data` (`data.content[0].text` parsing unchanged), pins `model`, adds `anthropic-version`. Operator features pass `tenant_id: null` through.
- **aiAuth.ts** — `FEATURE_TIER` maps features→tier|`'operator'`; `redirect_map` was the only `'operator'` feature. `IRONWOOD_OPERATOR_USER_IDS` = **{ `5181b30a-265f-4a70-a323-bf6e3c53641b` }** (admin@pestflowpro.com) — the same identity scrape-prospect previously gated by email.

### 4a — aiAuth.ts
- `AiFeature` union: `+ 'scrape_prospect_analyze'` (grouped with `redirect_map`)
- `FEATURE_TIER`: `+ scrape_prospect_analyze: 'operator'`
- `const IRONWOOD_OPERATOR_USER_IDS` → `export const` (**Option A — single source of truth**; future operator additions land here only)

### 4b — UUID auth (security fix, not style)
```
- if (authError || !user || user.email !== 'admin@pestflowpro.com') {
+ if (authError || !user || !IRONWOOD_OPERATOR_USER_IDS.has(user.id)) {
```
Email is mutable identity (recycling, identity drift, multi-identity auto-linking, homograph bypass — flagged by Perplexity & Gemini). Authorization now keys on immutable `user.id` via the imported allowlist. **Option A** chosen (no import cycle: scrape-prospect → aiAuth is one-way; aiAuth does not import scrape-prospect).

### 4c — both Anthropic calls → ai-proxy public/operator
Two direct callers existed in `scrape-prospect/` (the task named one):
1. `index.ts` EXTRACTION_PROMPT fetch → ai-proxy (`feature:'scrape_prospect_analyze'`, `tenant_id:null`, forwards operator Bearer). Vars renamed `anthropicRes→aiProxyRes`, `anthropicData→aiProxyData`. No `model`/`anthropic-version` sent. Fail-closed (no direct fallback).
2. **`analyzeSite.ts` fetch** (line 53) — the second caller. Signature changed `(markdown, anthropicApiKey)` → `(markdown, aiProxyUrl, authHeader)`; same ai-proxy route + feature (forwards `system`). Its `DEFAULT` return on `!res.ok` is graceful degradation for an optional suggestion — **not** an Anthropic fallback. Migrating it was required for the Item 5 guard to pass (it's in the authorized `scrape-prospect/*` dir).
- `const ANTHROPIC_API_KEY = …` removed (now unused; **zero references** in scrape-prospect). The Edge Function Secret can be removed by the orchestrator post-merge.

## Item 5 — CI grep-guard widening (⚠️ DEVIATION — orchestrator review)
Widened from `src/` to `src/ supabase/functions/ --exclude-dir=ai-proxy`.

**Deviation from the task's literal pattern:** the task suggested `api\.anthropic\.com` (bare domain). That false-positives on legitimate doc comments — `process-campaign-job/index.ts:8` and `tag-image-vision/index.ts:11` both say *"NEVER calls api.anthropic.com directly"* — and **those two files are NOT in the authorized edit set**, so I cannot reword them. Every real API call uses the full `https://api.anthropic.com/v1/messages`, while the comments omit the scheme. So the guard pattern is **`https://api\.anthropic\.com|VITE_ANTHROPIC`** — strict on actual calls across all files (including the two unauthorized ones), ignores prose. This is *not* an allowlist/exclude of any file. Flagging for orchestrator sign-off since it differs from the prescribed regex.

## Validator-gate self-check ✅
- aiAuth union + FEATURE_TIER include `scrape_prospect_analyze: 'operator'` ✅
- scrape-prospect imports `IRONWOOD_OPERATOR_USER_IDS` (Option A) ✅
- Authorization header is **forwarded** from the incoming request, not synthesized ✅
- No `https://api.anthropic.com` fetch remains in scrape-prospect (or anywhere outside ai-proxy) ✅
- Zero `ANTHROPIC_API_KEY` references in scrape-prospect ✅
- Widened guard returns 0 hits ✅

## Excluded (intentional)
provision-tenant URL `.com→.ai` — separate PR after customer #2.
