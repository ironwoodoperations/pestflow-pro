# Review — S305: outscraper-reviews manual-refresh gate → tenants.entitlement — 2026-08-28

## Branch
`claude/demo-tier-badges-gating-1v74gr` (restarted from `main` @ `9d544aa`; the
prior PR #305 for this branch name is merged and closed)

## What changed

One file, one gate. `supabase/functions/outscraper-reviews/index.ts`:

- The manual-refresh tier gate no longer reads `settings.subscription.tier`.
  It calls `check_tenant_access(p_tenant_id, 4)` — the same SECURITY DEFINER
  RPC six other edge functions already use, which reads `tenants.entitlement`.
- `parseTier` deleted (orphaned; zero remaining references repo-wide).
- Comment added naming `tenants.entitlement` as the S262 source of truth.

Net: **13 insertions, 14 deletions, 1 file.**

## ⚠️ Validator gate — NOT RUN (blocked)

**This PR must not merge until Scott records both verdicts in this section.**

Wave 3 requires a Perplexity + Gemini validator gate, conservative-wins, because
this touches edge-function authorization behavior. **Neither tool is reachable
from this Claude Code Web session** — no Perplexity or Gemini MCP server is
connected. The gate was therefore **not attempted**, and **no placeholder verdict
has been written**. Wave 3 is **incomplete**, deliberately.

The question to put to both models:

> Does reading entitlement from `tenants` under service role, inside a function
> with `verify_jwt=false`, introduce any authorization weakening versus the
> `settings.subscription` read it replaces, given `requireTenantUser` has already
> established membership for the requested tenant?

**Framing that should make the gate quick — and it is the honest framing, not a
softener.** This change does **not** introduce a new entitlement read path. It
**deletes** a bespoke one and adopts the established SECURITY DEFINER access RPC
that already governs the AI proxy, social posting, campaign jobs and
`apply-finding-fix`. The gate is evaluating *reuse of an existing audited
primitive*, not a new mechanism. Verified properties of that primitive:

```
check_tenant_access(p_tenant_id uuid, p_required_tier integer) RETURNS boolean
  LANGUAGE sql · SECURITY DEFINER · SET search_path TO 'public' · owner postgres
  body: select exists (select 1 from public.tenants
                       where id = p_tenant_id and entitlement >= p_required_tier)
  EXECUTE: service_role = TRUE · authenticated = FALSE · anon = FALSE
  exactly ONE signature (the S273 collapse; no PGRST203 overload ambiguity)
```

## Why the RPC rather than the direct read the brief specified

The brief prescribed `serviceClient.from('tenants').select('entitlement')`.
Wave 1 found that would have been **the only direct entitlement read in a gate
anywhere in the codebase** — all six existing gates go through
`check_tenant_access`, and `apply-finding-fix/index.ts:170` already performs this
exact Elite/tier-4 check that way. A direct read is a second site that a future
change to the access rule would not reach. Raised at the Wave 1 stop; **Scott
confirmed the RPC and stated the brief was wrong on this point.**

## Order-of-operations correction to the brief

The brief states non-configured tenants "422 at `buildOutscraperQuery` before the
tier gate is reached." **Reversed.** The tier gate is at :98 (inside the
`!isCronCall` block); the integrations read and `buildOutscraperQuery` are at
:127+. A non-Elite tenant with no Google identifier gets **403, not 422**. This
does not change the fix — it changes the expected values in the QA table, which
Scott then supplied corrected. The QA report uses the corrected table.

## CI gates (run locally)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** — 0 errors |
| `npx eslint src --max-warnings 200` | **PASS** — 0 errors, 178 pre-existing warnings |
| `npm run build` (vite + next) | **PASS** |
| BL canary `git diff --name-only origin/main -- src/shells app` | **empty** |

## Constraint compliance

| Constraint | Status |
|---|---|
| Threshold unchanged (Elite, ≥ 4) | **PASS** — `p_required_tier: 4`; pls at Pro still 403 |
| 403 body string byte-identical | **PASS** — `'Manual refresh requires Elite plan (tier 4)'` unchanged |
| Cron bypass untouched | **PASS** — gate stays inside `if (!isCronCall)`; no line in that path altered |
| 6-hour rate limit untouched | **PASS** — not in the diff |
| Outscraper call / response parsing / `stripVaultSecrets` untouched | **PASS** — not in the diff |
| `verify_jwt` unchanged | **PASS** — `supabase/config.toml` is not in the changed set; `[functions.outscraper-reviews] verify_jwt = false` stands |
| No `settings.subscription` VALUES altered in the DB | **PASS** — only read-only `select` statements were issued this session |
| `_shared/auth/` not edited | **PASS** — not in the changed set |
| Function NOT deployed from the branch | **PASS** — no deploy attempted; see below |
| `parseTier` removed, zero references | **PASS** — verified repo-wide across `supabase/`, `src/`, `shared/` |
| Diff touches no other edge function | **PASS** — one file |

## Deployment posture

**Not deployed, deliberately.** Per the S229 lesson (deployed-ahead-of-repo
state), Scott deploys byte-exact from `main` via MCP **after** merge, then
verifies with `get_edge_function`. Nothing in this session touched the deployed
function.

## Findings

### CRITICAL / HIGH
- none

### MEDIUM

**M1 — the gate and the button disagreed, and the button was the correct one.**
Worth recording because it inverts the intuition. `TestimonialsTab.tsx:318` wraps
Refresh Now in `<FeatureGate minTier={4}>`, and `FeatureGate` reads `usePlan()` →
`tenants.entitlement`. So the **frontend has been reading the source of truth all
along** while the **server** read the drifting copy. The practical exposure was
therefore not a hidden button but the reverse: a stale-HIGH
`settings.subscription.tier` on a tenant whose `entitlement` is below 4 would
have let a **direct API call** succeed with the UI correctly hiding the control.
No tenant is in that state today (all nine aligned), which is why this ships as a
no-op. Closed by this change.

### LOW

**L1 — `parseTier`'s string branches described a tier vocabulary nothing else
uses.** It coerced `'elite'`/`'pro'`/`'grow'`/`'growth'` and bare numerals. S262
removed the string→number coercion from the client for exactly this reason (the
client-vs-edge drift where string-`'elite'` passed on one side and failed on the
other). This was the last surviving instance of that coercion. Deleted with the
gate, not separately.

**L2 — six tenants carry an empty-string `google_place_id` key.** Surfaced while
building the QA table: `settings.integrations` has the key present but blank for
every tenant except dang and pls. Harmless — `buildOutscraperQuery` treats blank
as absent — but a `? 'google_place_id'` presence test reads as "configured" and
is not. Noted so a future audit does not miscount configured tenants as seven.
Not touched.

## Notes for Scott

- The change is a **behavioral no-op today** and that is the acceptance
  criterion, not a caveat: all nine tenants have `entitlement ==
  settings.subscription.tier`, so any observable difference would mean the change
  is wrong. The nine-row old-vs-new proof is in the QA report; every row matches.
- After this merges, **zero gating reads of `settings.subscription` remain** in
  the repo. The key is cosmetic metadata everywhere, as the ROADMAP has claimed
  since S262 — the claim becomes true rather than nearly true.
- The ROADMAP amendment I drafted at S304 close (narrowing the "settings.subscription
  is display metadata" entry to note this exception) should be **rewritten as
  resolved** rather than added as an open caveat, once this merges.
