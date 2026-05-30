# s248 — QA Report (tier-gate borderlines)

## Static checks
| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| eslint on changed files | ✅ 0 errors (2 warnings — pre-existing patterns) |
| `vite build` | ✅ built |
| Anthropic guard | ✅ pass |
| Backend untouched (`ai-proxy`, `post-to-social`) | ✅ no edits |
| Reuses #134 components | ✅ `useTierGate`, `UpgradePrompt`, `tierInfo`, `requestUpgrade` |

## ⚠️ Preview QA impossible (hostname-routed SPA)
Verification is **merge-then-verify-on-prod**. Per kickoff: all tenants are currently Elite — temporarily downgrade master `9215b06b-3eb5-49a1-a16e-7ff214bf6783` to **tier 2** (Grow) via MCP to test the Starter-locked path, then restore to tier 4.

> The downgrade target tier matters: we want to verify **Starter (tier 1)** behavior, so set the master subscription to `{tier: 1, plan_name: 'Starter', monthly_price: 149}` for the test, then restore to `{tier: 4, plan_name: 'Elite', monthly_price: 499}`.

## Manual on-prod verification — TO RUN after merge

**As Starter (tier 1):**
1. Open the social composer → confirm the schedule card shows the new **amber-lock** "Post scheduling is available on the Grow plan and above." with an **"Upgrade to Grow"** button. **[SCREENSHOT before/after]**
2. Click "Upgrade to Grow" → `UpgradePrompt` modal opens naming **"Grow"** ($249/mo). **[no `post-to-social` request in the Network tab, no `ai-proxy` request]**
3. Click "Request upgrade to Grow" → `notify-upgrade` returns 200; success toast; modal flips to "Request sent". **[Network: notify-upgrade only]**
4. The Publish button still reads **"Copy & Post Manually"** for Starter and the manual copy-paste flow still works (insert as `status='sent'`, copy-paste toast).
5. Defensive guard — even if a Starter somehow reaches `getSmartSchedule` directly (e.g. dev console), it must call `onUpgradeRequired` and fire **no** `ai-proxy` request.

**As Grow / Pro / Elite (tier ≥ 2) — no-regression:**
6. Open the composer → the schedule mode radios (`Post now / Schedule for later / ✨ Smart Schedule`) are visible normally; **no** amber lock card.
7. Pick **Smart Schedule** → click "Get Best Time" → composer_schedule call succeeds; `smartSchedule` populates. **No** upgrade modal opens.
8. Pick **Schedule for later** with a future datetime → click "Publish Now" → `post-to-social` is called (Network tab); post scheduled.
9. Default flow (`Post now` → Publish Now) still works.

**After verification:** restore master to tier 4 via MCP.

## Verdict
Code complete + statically green. On-prod verification (per the steps above) pending — to be run after merge, with the temporary master downgrade per kickoff.
