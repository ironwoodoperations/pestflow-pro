# S306 handoff — the lock knew the tier and told the customer the wrong one

One PR, **#307, merged `5d428f1`.** Copy only: 4 files, no `minTier` value
changed, no call site edited.

**Durable lessons only.** Narrative is in `PROJECT_MANIFEST.d/`; perishable state
in `docs/ROADMAP.md`.

---

## 0. A prop used for the decision and ignored for the explanation

`FeatureGate` accepted `minTier`, used it to decide whether to lock, and then
**hardcoded "Growth"** into the panel that explains the lock. Six of the eleven
default-panel gates therefore told the customer to upgrade to a plan that was not
the one they needed — and a customer already **on** Growth was told to upgrade to
the plan they were already paying for.

> **Worse than no lock.** A missing feature reads as "not included". A lock naming
> the plan you already bought reads as **broken software**, and it destroys the
> upsell at the one moment the customer had actually reached for the feature.

**The gates were all correct.** Every `minTier` was right, `canAccess` was right,
the thresholds were right. Only the sentence was wrong. That is why it survived:
nothing misbehaved, no test failed, and the bug was invisible to anyone not
holding a specific plan while clicking a specific feature.

> **A value can be authoritative for control flow and absent from the
> explanation, and no test that asserts behaviour will ever notice.** The gate
> "worked" in every sense a test measures.

## 1. One edit, eleven call sites, zero call-site edits

The fix was entirely inside the component: `const target = tierInfo(minTier)`,
then name and price from `target`. **Six mislabeled gates fixed without touching
a single call site**, because the wrong string lived in exactly one place.

The five call sites passing a custom `fallback` were untouched and unaffected —
`FeatureGate` returns the fallback **before** any of the changed code runs. Their
copy was already correct, hand-written, and naming the right tier.

> **The blast radius of a copy bug is set by where the copy lives, not by how
> many places display it.** Eleven surfaces shared one defect because they shared
> one string; five surfaces were immune because they owned theirs.

## 2. A verification step that cannot pass without breaking a constraint

The session brief asked for a grep proving **zero** hardcoded tier names outside
`tierInfo.ts`. It cannot reach zero. One of the surviving hits —
`TestimonialsTab.tsx:326`, `title="Upgrade to Elite to enable manual refresh"` —
sits **inside the `fallback` prop** of the FeatureGate at `:318`, one of the five
call sites the same brief marked DO NOT TOUCH.

> **Two requirements in one brief contradicted each other, and only running the
> check surfaced it.** The resolution was to report the contradiction and narrow
> the expectation to `"Upgrade to Growth\|Growth and above"` — which passes at
> zero — rather than silently failing the stated check or silently violating the
> stated constraint. Neither silence would have been visible in the diff.

## 3. Reachability is a property of the environment, and it changed nothing about honesty

The brief specified a demo walk: coastal-pest's SEO tab, Social → Campaigns,
urban-strike, heartland, metro. **None of it happened.** The session's network
policy denies `*.pestflowpro.ai`, not merely the apex:

```
coastal-pest.pestflowpro.ai:443   gateway answered 403 to CONNECT
urban-strike.pestflowpro.ai:443   gateway answered 403 to CONNECT
```

`admin@demo.com` was unreachable, so no live admin tab could be opened, let alone
screenshotted. What was done instead: a local harness rendering the **real**
`FeatureGate` against the **real** `tierInfo`, with **only** `usePlan` stubbed,
mounting all eleven default-panel sites at their exact production `minTier` and
`featureName`, and reading the rendered strings back out of the DOM.

> **That proves the copy resolves. It does not prove live tenant behaviour.**
> Recording which of the two was achieved is the whole point — a harness result
> filed under a heading that says "demo walk" would have been a false pass, and
> the next session would have inherited a verification it did not have.

The brief itself named the trap: **the Analytics tab is not a valid check.** It
renders the already-correct `fallback` copy, so it would have looked like a pass
while testing nothing that changed.

## 4. A screenshot can be evidence of one thing and not another

`cdn.tailwindcss.com` is proxy-blocked too, so the harness page rendered
unstyled. The image is therefore evidence of **text**, not of appearance. The
amber padlock was confirmed by reading the `class` attribute out of the DOM
(`text-amber-500`), never by looking at the picture — the picture shows a black
icon, because no stylesheet loaded.

> **State what an artifact evidences, not what it appears to show.** An unstyled
> screenshot presented as visual proof would have been wrong in both directions:
> it under-sells the copy verification and over-sells the colour.

## 5. Two padlocks were gray against a standing order

`CLAUDE.md` non-negotiable: *"Amber padlocks on gated features (not gray)."*

- `Dashboard.tsx:132` had **no colour class at all**, inheriting `#d1d5db` from
  the button's inline style. The brief asked for this one to be checked; it was
  wrong.
- `FeatureGate.tsx` own panel icon was `text-gray-400` — the same violation, in
  the file already being edited, one line from the code being changed.

Both are now `text-amber-500`, matching `UpgradePrompt`. The second was one line
beyond the literal brief and is flagged as such in `REVIEW_S306`, not buried.

> **A standing order does not stop applying at the edge of a brief's enumerated
> list.** But acting on it outside that list has to be *stated*, or it is
> indistinguishable from scope creep.

## 6. A gate that can never fire

`ReportsTab.tsx:79` is `<FeatureGate minTier={1}>`. `PlanContext` fail-restricts
to **1** for any unreadable or absent entitlement, so `canAccess(1)` is
**always true** and that panel is unreachable in production. The harness only
rendered it by forcing a viewer tier of 0, which cannot occur.

> Dead code wearing a gate's clothes. Harmless, and its copy is now correct if it
> ever did fire — but whether Analytics should be gated at all is a **product**
> question, so the `minTier` was left alone.

---

## Verified live state (2026-08-28)

- **Merged `5d428f1`.** `FeatureGate` resolves name and price from
  `tierInfo(minTier)`; **zero** `"Upgrade to Growth"` or `"Growth and above"`
  anywhere in `src`; no `minTier` value changed; the five `fallback` call sites
  byte-identical to their pre-merge state.
- mailto corrected to `support@homeflowpro.ai` — it had pointed at
  `support@pestflowpro.ai` while the subject line interpolated `PLATFORM_NAME`
  (**HomeFlow Pro**), so the address and the brand in the same string disagreed.
- CI green on the merged head: `Validate`, `ci`, `Auth isolation`, Vercel.
- **NOT verified: live tenant behaviour.** See §3. No demo walk occurred.

## Open / pending (carried to next)

1. **Scott verifies post-merge** on **coastal-pest** → SEO tab and
   Social → **Campaigns** tab (must now read *Upgrade to Pro ($349/mo)*), and
   **urban-strike** → Social Analytics (*Upgrade to Elite ($499/mo)*).
   **The Analytics tab is NOT a valid check** — it renders the already-correct
   fallbacks and will show a false pass.
2. **support mailto sweep** — six addresses in `src`, inconsistent three ways;
   two are a **bare domain** whose routing is unconfirmed. Full block in
   `docs/ROADMAP.md`.
3. Four hardcoded tier names still outside `tierInfo`, plus the one inside a
   protected fallback. ROADMAP.
4. `ReportsTab.tsx:79` dead tier-1 gate (§6). ROADMAP.
5. Carried from S305: `check_tenant_access` hardening; outscraper cron apikey
   rotation. Both in ROADMAP, both unscoped.
