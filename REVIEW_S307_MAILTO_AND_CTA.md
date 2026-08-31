# Review — S307: dead mailboxes and a dead homepage CTA — 2026-08-31

## Branch
`claude/demo-tier-badges-gating-1v74gr` (restarted from `main` @ `c7138eb`)

## What changed — 8 files, strings and links only

**Part A — 7 mailto addresses repointed** at live `homeflowpro.ai` groups.
**Part B — the homepage showcase** now advertises `apex-protect`, a real demo.

No auth, no gating, no thresholds, no DB, no edge functions.

## Validator gate — NOT APPLICABLE (recorded decision)

The Perplexity + Gemini gate covers changes to authorization, caching, payments,
RLS, or edge-function behaviour. **This PR changes none of them.** It edits the
literal text of `mailto:` hrefs, one image path, one anchor href, and three
display strings. No control flow is touched; no `minTier`, `canAccess`,
`PlanContext`, RLS policy or edge function appears in the diff. Skipping the gate
is therefore a recorded decision with a stated reason, not an omission.

## CI gates (run locally)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** — 0 errors |
| `npx eslint src --max-warnings 200` | **PASS** — 0 errors, 178 warnings (all pre-existing) |
| `npx vitest run` (full suite) | **PASS** — **42 files, 1164 tests, 0 failures** |
| `npm run build` (vite + next) | **PASS** |
| BL canary `-- src/shells app` | **empty** |

**The test that was expected to break did not**, and the reason matters: the
assertions at `:627` and `:629` call `stripPlatformIdentity()` **directly with a
literal string**. They are unit tests of the strip function, not a scan of what
components render. Removing `support@pestflow.ai` from the app does not remove it
from the function's contract, so the strip rule and both assertions stay exactly
as they were. Nothing was deleted, nothing was weakened, and no new strip entry
was needed — `homeflowpro.ai` contains no pest vocabulary for the guard to catch.

## Constraint compliance

| Constraint | Status |
|---|---|
| Only the enumerated addresses changed | **PASS** — 7 replacements, each asserted to match exactly once before writing |
| `FeatureGate.tsx:40` untouched | **PASS** — not in the changed set |
| Both original assertions intact | **PASS** — verified verbatim at `:627` / `:629`; that test passes |
| No tier threshold, gate or entitlement changed | **PASS** |
| No mailto converted to `notify-upgrade` | **PASS** |
| `support_tickets` / `support_replies` RLS untouched | **PASS** — not in the changed set |
| No DB writes, no edge function changes | **PASS** — zero DB/network operations this session |
| Green badge styling kept on the showcase badge | **PASS** — only the label text changed |

## Findings

### CRITICAL / HIGH
- none

### MEDIUM

**M1 — the brief's Part B edit list was one short, and the gap was an
accessibility defect.** The five enumerated edits change the chrome bar, badge,
`src`, `href` and link text — but **not `alt="Lone Star Pest Solutions"` at
`:33`**. Applying only the five would have left the image announcing the old,
non-existent company to every screen reader while the visible page said Apex.
That is exactly the self-contradiction the brief's own "all four or none" rule
exists to prevent, so I changed it to `alt="Apex Pest Protection"` as a sixth
edit. Flagged here rather than buried; revert it if you disagree.

### LOW

**L1 — `TrainingManual.tsx` has no `mailto` at all.** The prior session's
"seventh occurrence" was a misreading. Grep found two addresses in that file,
neither of them a link:
- `:517` — `<RefRow label="IT issues" value="support@homeflowpro.ai" />`. Already
  the live domain, and **plain display text, not an anchor**.
- `:483` — `<RefRow label="Demo admin email" value="admin@pestflowpro.com" />`.
  This is the **demo login credential**, documented in `CLAUDE.md` as
  `admin@pestflowpro.com / pf123demo`. It is an **auth identifier, not a
  mailbox** — nobody is meant to send mail to it, and changing it would break the
  documented demo login. **Correctly left alone.**

**L2 — one upgrade mailto points at an unverified domain, outside the brief.**
`src/components/admin/dashboard/PlanOverviewCard.tsx:43` sends upgrade requests
to **`scott@ironwoodoperations.com`**. That domain was not among the three you
confirmed dead, and was not in the replacement mapping, so I did not touch it —
but it is the same *class* of risk this PR exists to close: a plan-upgrade CTA on
the client dashboard whose deliverability nobody has checked. **Worth one minute
of verification.** If it bounces, it is a second silent revenue leak.

**L3 — two `Lone Star Pest Solutions` references survive, and both should.**
`MarketingSocial.tsx:22` and `:30` name it inside a **fake social-post mockup** —
no link, no LIVE badge, no claim of being a real tenant, and the surrounding copy
is illustrative ("Mosquito Season is Here", `#LoneStarPest`). It is set dressing,
not a false claim, so it fails the brief's "fix only if also live user-facing
links" test. Reported, not changed. Renaming it for consistency is a judgement
call for a copy session.

**L4 — `public/images/sites/lone-star-site.jpg` is now unreferenced.** 77 KB,
still on disk, no longer imported by anything. Left in place deliberately —
deleting an asset is not a copy fix, and it costs nothing until someone does an
asset audit.

## Notes for Scott

- **`planCardContent.ts:110` is the one that was actually costing money.** It
  backs `planChangeMailto()` behind "Contact us to switch" on the pricing cards
  in **every** tenant's Billing tab. Every upgrade and downgrade request a
  customer has sent from that button went to a mailbox that no longer exists.
- `PaymentSuccess.tsx:211` now goes to **billing@**, not support@ — a
  post-payment question is a billing question, per the mapping.
- Six of the seven now land on `support@homeflowpro.ai`; the exceptions are
  `sales@` (the pricing-card switch) and `billing@` (post-payment).
