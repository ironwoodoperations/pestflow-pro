# Hotfix Review — AI Campaigns tier gate Elite (4) → Pro (3)

**Branch:** `hotfix/campaigns-tier-pro-not-elite` (off `main`) · Backend constants/strings/comments only. No migrations, no frontend, no `aiAuth.ts`, no other edge functions.

## Bug
S242 Session 1 hardcoded `ELITE_TIER = 4` in three edge functions gating the AI Campaigns async flow. Canonical spec `pestflow-pro-pricing-features.md` feature matrix — row **"AI campaign batch posting" → Pro+ ($349)**. The Elite gate locked paying Pro tenants out of a feature they're entitled to. Note: the public-route map in `_shared/aiAuth.ts` already had `campaign_generation: 3` (Pro) — correct, left untouched; the three async functions were the only places out of sync.

## Per-file changes (before → after)

### `supabase/functions/generate-social-batch/index.ts` (verify_jwt:true)
- L3 (header): `re-verifies Elite tier` → `re-verifies Pro tier`
- L17: `const ELITE_TIER = 4` → `const PRO_TIER = 3`
- L47: `// Elite gate (re-checked…` → `// Pro gate (re-checked…`
- L50: `tier < ELITE_TIER` → `tier < PRO_TIER`; `'AI Campaigns require the Elite plan.'` → `'AI Campaigns require the Pro plan.'`

### `supabase/functions/process-campaign-job/index.ts` (verify_jwt:false)
- L24: `const ELITE_TIER = 4` → `const PRO_TIER = 3`
- L103: `tier < ELITE_TIER` → `tier < PRO_TIER` (failure path `subscription_lapsed` — generic, unchanged; L100 comment is tier-agnostic, unchanged)

### `supabase/functions/ai-proxy/index.ts` (internal route only; public route untouched)
- L35: `const ELITE_TIER = 4   // internal purposes are all Elite-only (§12)` → `const PRO_TIER = 3   // internal purposes are Pro+ (§12)`
- L138 (step 8 comment): `— Elite only` → `— Pro+ only`
- L141: `tier < ELITE_TIER` → `tier < PRO_TIER`; `{ error: { message: 'Elite tier required' } }` → `{ error: { message: 'Pro tier required' } }`
- **L9 (beyond the prescribed 4 — flagged):** header doc comment listing internal-route checks said `… resource-ownership + Elite-tier + rate-limit`; changed `Elite-tier` → `Pro-tier`. This comment literally describes the gate changed at L141 — leaving it would be a stale doc bug contradicting the new behavior. Comment-only, zero runtime impact.

## Verification (see QA report)
- `grep -rn ELITE_TIER supabase/ src/` → **ZERO**
- No literal `4` remains in any tier-comparison; all three are `tier < PRO_TIER` (=3)
- `PRO_TIER` defined + used consistently within each file
- `aiAuth.ts` NOT touched (`campaign_generation: 3` intact)

## Flag for orchestrator (deploy)
The task's redeploy note lists **ai-proxy with verify_jwt:False**, but `ai-proxy/index.ts:12` header says `DEPLOY (verify_jwt:true — do NOT pass --no-verify-jwt)` (it serves a public JWT route + an HMAC-delegation internal route). Confirm the intended `verify_jwt` for ai-proxy before redeploy — do not blindly flip it to false.

## Risk
Minimal. Loosens a gate from tier≥4 to tier≥3 in three coordinated spots; no schema, no API shape change. Error-message copy changes Elite→Pro (user-facing, intended).
