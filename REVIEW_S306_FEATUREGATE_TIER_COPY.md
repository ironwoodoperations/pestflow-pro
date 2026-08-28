# Review — S306: FeatureGate names the plan it actually requires — 2026-08-28

## Branch
`claude/demo-tier-badges-gating-1v74gr` (restarted from `main` @ `f643775`)

## What changed — 4 files, copy only

| File | Change |
|---|---|
| `src/components/common/FeatureGate.tsx` | lock-panel copy resolves from `tierInfo(minTier)`; mailto fixed; padlock amber |
| `src/components/admin/social/ComposerScheduler.tsx` | two "Growth" literals → `tierInfo(SCHEDULING_TIER)` |
| `src/components/admin/social/ConnectionsModal.tsx` | "Growth" + `$249/mo` literals → `tierInfo(CONNECT_TIER)` |
| `src/pages/admin/Dashboard.tsx` | padlock tooltip from the gate map via `tierInfo`; icon amber |

**One edit fixed all six mislabeled gates. No call site was edited**, exactly as
the brief predicted — the fix is entirely inside the component.

## Validator gate — NOT APPLICABLE (recorded decision, not an omission)

The Perplexity + Gemini gate applies to changes in authorization, caching,
payments, RLS, or edge-function behaviour. **This PR changes none of them.**
`minTier` values are untouched, `canAccess` is untouched, `usePlan` /
`PlanContext` are untouched, no network call, no DB read or write, no edge
function. The diff alters **only the strings a lock panel displays after the
gate has already decided to lock**. Skipping the gate here is therefore a
recorded scoping decision with a stated reason, not a gap.

## CI gates (run locally)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** — 0 errors |
| `npx eslint src --max-warnings 200` | **PASS** — 0 errors, 178 warnings (all pre-existing) |
| `npm run build` (vite + next) | **PASS** |
| BL canary `git diff --name-only origin/main -- src/shells app` | **empty** |

The one warning on a file I touched (`Dashboard.tsx` — `'template' is assigned
a value but never used`) was **verified pre-existing** by re-linting the pristine
file from `main`: it reports at line 70 there and line 71 here, the shift being
my one-line import. Not introduced.

## Constraint compliance

| Constraint | Status |
|---|---|
| No `minTier` VALUE changed | **PASS** — no numeric threshold appears in the diff |
| The five `fallback` call sites untouched | **PASS** — none in the changed set; the `if (fallback) return` early return is byte-identical |
| FeatureGate and UpgradePrompt not merged | **PASS** |
| mailto not converted to `notify-upgrade` | **PASS** — address corrected only |
| No badges added to ungated controls | **PASS** |
| `SocialTab.tsx:139/:161` `<></>` children preserved | **PASS** — not in the changed set |
| No DB writes, no edge function changes | **PASS** — zero DB/network operations this session |

## Findings

### CRITICAL / HIGH
- none

### MEDIUM

**M1 — the verification grep in the brief cannot reach zero, and one reason is a
constraint you set.** The brief's expected result is "zero hits outside
tierInfo.ts". Five hits survive. **All five are pre-existing, all are outside the
brief's stated scope (§3 enumerates three *Growth* strings, and those three are
fixed), and one of them is inside a file the brief explicitly protects:**

> `TestimonialsTab.tsx:326` — `title="Upgrade to Elite to enable manual refresh"`
> sits **inside the `fallback` prop** of the FeatureGate at `:318`, one of the five
> DO-NOT-TOUCH sites.

So the grep as written can only reach zero by violating "do not edit the five
fallback call sites". **The expected result needs restating, not the code
changing.** Proposed replacement, which passes today:

```
grep -rn "Upgrade to Growth\|Growth and above" src
→ zero hits.  (All Growth-labelled copy now resolves from tierInfo.)
```

The other four survivors are **currently accurate** — each names the tier its own
gate actually requires — but they are hardcoded, so they are the same latent class
as the Dashboard tooltip you asked me to fix "anyway". Logged as L1, not fixed.

### LOW

**L1 — four more hardcoded tier names, correct today, unscoped.**
`BlogPostEditor.tsx:164` (Pro), `SocialTab.tsx:195` (Pro),
`SeoInlineEditor.tsx:107` (Pro), `ReportNextSteps.tsx:65` (Ironwood report prose,
"Pro or Elite" — arguably genuine marketing copy rather than a gate label). Each
should read from `tierInfo` for the same reason the Dashboard tooltip now does.
Deliberately not touched: they are not in the brief's enumerated scope, and
widening a copy PR on my own judgement is how scope creep starts.

**L2 — `ReportsTab.tsx:79` is `minTier={1}`, a gate that can never fire.**
`PlanContext` fail-restricts to tier 1 for any unreadable or absent entitlement,
so `canAccess(1)` is **always true** and this panel is unreachable in production.
The harness only rendered it by forcing a viewer tier of 0, which cannot occur.
Harmless, and its copy is now correct if it ever did fire. **Not fixed —
changing a `minTier` value is explicitly out of scope**, and this is a threshold
question (should Analytics be gated at all?), which is a product decision.

**L3 — two padlocks were gray, against a CLAUDE.md non-negotiable.** "Amber
padlocks on gated features (not gray)." `Dashboard.tsx:132` had **no** colour
class at all, inheriting `#d1d5db` from the button's inline style — you asked me
to check this one, and it was wrong; fixed with a one-line `text-amber-500`.
**I also fixed FeatureGate's own panel padlock**, which was `text-gray-400` — the
same violation, in the file already being edited, and matching `UpgradePrompt`'s
amber lock. That is one line beyond the literal brief; flagged here rather than
buried, and trivially revertible if you'd rather it stay gray.

## Notes for Scott

- The copy now reads as one product with `UpgradePrompt`: both say
  "…the {Plan} plan ($X/mo) and above", both name the target from `tierInfo`.
- **The live demo walk was impossible from this session** and the QA report says
  so plainly rather than substituting something and calling it done: the proxy
  policy-denies `*.pestflowpro.ai` (403 on CONNECT, same as the apex in S304), so
  the demo subdomains are unreachable and `admin@demo.com` cannot be logged in.
  Verified instead by rendering the **real** `FeatureGate` against the **real**
  `tierInfo` in a local harness, stubbing only `usePlan`. That proves the copy at
  every gate; it does not prove the tabs render as expected in a live tenant.
