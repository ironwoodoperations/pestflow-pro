# s247 — Tier-Gate UX QA Report

Target (Wave 2 approved): **MediaTab "Tag with AI Vision"** (per-image + bulk) — pre-emptive upgrade prompt replaces the raw Pro/tier-3 403. CTA = `notify-upgrade` (with optional, escaped `feature` field).

## ⚠️ Browser QA not runnable here (CC Web headless)
The kickoff's Wave-4 requires clicking each surface as tier-3/tier-4 and checking the **Network tab** + **before/after screenshots**. CC Web has no browser, so those must be done locally before merge. Static verification below; manual steps enumerated.

## Static checks
| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `eslint` (new + changed files) | ✅ clean |
| `vite build` | ✅ built |
| Anthropic guard (`src/` + `supabase/functions/` excl. ai-proxy) | ✅ pass |
| Backend gate untouched (`tag-image-vision`, `ai-proxy`) | ✅ not modified |
| `notify-upgrade` backward compatible (BillingTab caller still valid) | ✅ `feature` optional; omitted → no email line |
| New field escaped before email embed | ✅ `escapeHtml(feature.trim().slice(0,120))` |
| Prompt names tier from helper, not literal | ✅ `tierInfo(3).name === 'Pro'` |

## Manual browser QA — TO RUN before merge
1. **Tier 1/2 (under Pro):** open Media tab → tag buttons show an **amber lock** (not green sparkle). Click a per-image tag and the "Tag untagged (N)" button → **UpgradePrompt opens naming "Pro" / "$349/mo"**, **no `tag-image-vision` request in the Network tab**, no raw failure toast/badge. **[SCREENSHOT before/after]**
2. **"Request upgrade" CTA:** click it → `notify-upgrade` returns 200, success toast, prompt shows "Request sent". Confirm the sales email arrives with the **"Triggered by: AI Vision tagging"** line.
3. **Tier 3 (Pro):** tag buttons are green sparkles; tagging works normally (no prompt) — no over-block regression.
4. **Tier 4 (Elite):** tagging works normally (`canAccess(3)` true). **[no-regression confirmation]**
5. **Defense-in-depth:** for an entitled (≥Pro) tenant force a 403 (e.g. simulate sub lapse) → still degrades via the retained toast + red "Tag failed" badge.
6. Cross-check the prompt's tier name == `tierInfo(3).name` ("Pro", not "Elite").

## Tenant-isolation (kickoff §9.7)
N/A to this change — no RLS/data-scope changes. `notify-upgrade` remains `requireTenantAdmin`-gated to the caller's own tenant; `requestUpgrade` sends only the caller's `tenant_id` from context.

## Gate status
- **Validator gate: RATIFIED** (orchestrator) — WebSearch substitution accepted for the two settled questions; mitigations approved.
- **Backend confirmed intact** (orchestrator): ai-proxy `FEATURE_TIER` image_tagging = Pro/3, tenant tier check fails **closed**.

## Two human-only gates remain (PR stays DRAFT until both clear)
1. **Browser QA (Scott, local)** — the manual steps above (tier 1/2 prompt + no network call; tier 3/4 no regression).
2. **Merged-source review (Scott→orchestrator, at merge)** — confirm escape-at-interpolation + optional `feature` default on the final merged `notify-upgrade/index.ts`; MCP deployed-parity check after merge.

## Verdict
Code complete + statically green; validator gate ratified. Browser/network/screenshot QA + merged-source review pending (human-only) — PR held as draft until both clear.
