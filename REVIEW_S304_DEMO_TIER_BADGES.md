# Review — S304: Demo tier badges + gating copy on the demo surfaces — 2026-08-28

## Branch
`claude/demo-tier-badges-gating-1v74gr`

## What shipped

A prospect on pestflowpro.ai can now see which plan each demo runs on **before**
clicking in, and reads one plain-English line telling them that anything locked
inside is a real plan boundary — not a broken button.

| File | Change |
|---|---|
| `src/lib/demoTenants.ts` | `tier: 1 \| 2 \| 3 \| 4` added to `DemoTenant`, populated on all five entries |
| `src/pages/demos/DemoCard.tsx` | tier badge on the eyebrow row + gating copy line |
| `src/pages/demos/DemosPage.tsx` | hero subhead states the plan dimension |
| `src/pages/demos/DemosAdminPage.tsx` | hero subhead states the plan dimension |
| `src/pages/marketing/ClientMockupCarousel.tsx` | plan pill in the browser-chrome bar |

Tier values mirror the entitlements already live in prod. **No migration was
written** — per the brief, `tenants.entitlement` was set via MCP in the prior
session and this diff only reflects those values on the marketing surfaces.

## CI gates (run locally)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** — 0 errors |
| `npx eslint src --max-warnings 200` | **PASS** — 0 errors, 178 warnings (all pre-existing `no-explicit-any` in intake/ironwood; cap is 200) |
| `npx eslint` on the 5 touched files | **PASS** — 0 errors, **0 warnings** |
| `npm run build` (`vite build` + `next build`) | **PASS** |

Bundle: no meaningful delta. The demos route is lazy-loaded; the change adds one
`tierInfo` import (a 4-entry object map already in the bundle via `BillingTab` /
`UpgradePrompt`) plus ~20 lines of JSX.

## BL canary

```
$ git diff --name-only origin/main..HEAD -- src/shells app
(empty)
```

**PASS.** No shell files, no `app/` files. Card + copy only. Full changed set is
the five files in the table above.

## Constraint compliance

| Constraint | Status |
|---|---|
| No tier-name/price literals introduced | **PASS** — every name and price resolves through `tierInfo()`. The strings `'Growth'`, `'Starter'`, `'Pro'`, `'Elite'` and the numbers `149/249/349/499` appear nowhere in this diff |
| `tierInfo.ts` TIERS map untouched | **PASS** — not opened for edit |
| `PlanContext` / `useTierGate` / `UpgradePrompt` untouched | **PASS** — not in the changed set |
| No per-tenant special-casing | **PASS** — `DemoCard` branches on `tier >= 4` only (a tier property, not a slug). No slug appears in any conditional |
| No migration for entitlement values | **PASS** — no file under `supabase/migrations/` touched |
| Branch + PR only | **PASS** — committed to the feature branch; `main` untouched |

## Wave 1 discovery — what it changed about the plan

**1a — `DEMO_TENANTS` consumers.** Four files. The homepage carousel the brief
flagged as "not located" is **`src/pages/marketing/ClientMockupCarousel.tsx`**,
rendered by `src/pages/marketing/sections/MarketingHero.tsx:63`. It maps
`DEMO_TENANTS` into a local `TABS` array at module scope. `DemoCard.tsx` imports
the `DemoTenant` *type* and the URL helpers, not the array.

**1b — no stale subscription surface exists.** Stated explicitly per work item
2e: **the grep found nothing to fix.** No frontend file reads
`settings.subscription` at all. A Starter demo therefore **cannot** display
"Elite / $499" anywhere in its own dashboard. Full grep output is in the QA
report; the load-bearing detail is that `BillingTab.tsx:163,165` — the only place
a plan name and price render to a logged-in client — reads
`usePlan()` → `tenants.entitlement` → `tierInfo()`, and carries an S262 comment
saying it no longer reads `settings.subscription`. Every other `plan_name` /
`monthly_price` hit in `src/` is the Ironwood CRM **`prospects` table columns**
(a different data path — `ProspectList.tsx:189,191` renders
`prospects.plan_name`, not tenant settings) or a provisioning **write**.

**1c — `shortLabel`.** Exactly one consumer: `ClientMockupCarousel.tsx:7`, as the
tab-pill label. Not read by `DemoCard.tsx`. **Its meaning was not changed** — the
new `tier` field is additive and independent.

## Findings

### CRITICAL / HIGH
- none

### MEDIUM

**M1 — `DemoTenant.tier` is a hand-maintained mirror of `tenants.entitlement`.**
It can drift if an operator changes a demo tenant's entitlement in the DB without
updating this file. This is inherent to the surface: `/demos` and the homepage
render with **no tenant session**, so they cannot read `tenants.entitlement` for
five different tenants — there is no authenticated context and no public RPC
exposing it. Mitigations applied: a file-header comment states the mirror
relationship and says to update `tier` when an entitlement changes, and the field
is a `1 | 2 | 3 | 4` union so a typo'd value fails typecheck. Drift here is
cosmetic only — real gating is unaffected, and a prospect who clicks in still hits
the true `UpgradePrompt` boundary from S247. If Scott wants this
self-healing later, the clean fix is a public RPC returning
`(slug, entitlement)` for demo-flagged tenants only; deliberately **not** built
here, as it is new surface area beyond a card-and-copy session.

### LOW

**L1 — `outscraper-reviews` still gates on `settings.subscription.tier`.**
`supabase/functions/outscraper-reviews/index.ts:112` reads
`settings.subscription.tier` to gate manual review refresh at tier 4, rather than
`tenants.entitlement`. Found during the 1b sweep. It **renders nothing**, so it is
not the "stale display" case 2e asked about, and the demo tenants'
`settings.subscription` values were aligned to their entitlements in the prior
session, so it behaves correctly today. But it is the last gating read of the
cosmetic key that S262 otherwise retired — worth a follow-up so entitlement is
genuinely the only gate. **Not fixed here:** out of scope for a card + copy diff,
and the brief explicitly says this session does not build or change gating.

**L2 — carousel plan pill was a judgment call.** Work item 2b names
`DemoCard.tsx` only. I added a compact plan pill to the homepage carousel's
browser-chrome bar too, because 1a directed that the carousel be treated as an
in-scope consumer and the stated Goal is a prospect **on pestflowpro.ai** seeing
the plan before opening a demo — the homepage is where that prospect actually
lands first. It is four lines, reads `tierInfo(t.tier).name`, and is trivially
revertible if Scott wants the homepage left alone.

## Notes for Scott

- Nothing here changes what any demo can or cannot do. S247's `UpgradePrompt`
  already handled the click-time boundary; this session only makes the plan
  visible beforehand.
- Pro appearing twice (Apex + Urban Strike) is intentional per the brief — the
  ~80% target mix — and the two cards read correctly side by side.
- Copy was kept at a fifth-grade reading level with no internal code names:
  the words "tier", "entitlement", and "gate" appear nowhere in user-facing text.
  Elite gets its own sentence since no plan sits above it.
