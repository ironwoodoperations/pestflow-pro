# QA Report — S307: mailto sweep + homepage CTA

**Date:** 2026-08-31
**Branch:** `claude/demo-tier-badges-gating-1v74gr` (from `main` @ `c7138eb`)
**QA author:** Claude Code
**Verdict:** ✅ PASS — 7 addresses repointed, showcase repointed at a live demo,
full suite green (1164 tests) with both protected assertions intact, required
grep returns zero, BL canary empty.

## Checks walked

| # | Check | Expected | Actual | Result |
|---|-------|----------|--------|--------|
| 1 | 7 enumerated addresses replaced | 7 | 7, each asserted to match exactly once before writing | ✅ |
| 2 | `FeatureGate.tsx:40` untouched | unchanged | not in changed set | ✅ |
| 3 | Dead-domain mailto grep | **zero** | **zero** | ✅ |
| 4 | Full test suite | green | **42 files, 1164 tests, 0 failures** | ✅ |
| 5 | Assertion `:627` (`acme.pestflowpro.ai`) | intact | intact, verbatim | ✅ |
| 6 | Assertion `:629` (`support@pestflow.ai`) | intact | intact, verbatim | ✅ |
| 7 | `adminRenderedStrings` suite | green | 57 tests passed | ✅ |
| 8 | `apex-protect-site.jpg` exists | yes | 128,195 bytes | ✅ |
| 9 | Showcase internally consistent | no stale refs | 0 `lone-star` refs remain in that file | ✅ |
| 10 | Badge keeps green styling | only label changes | styling untouched, `LIVE`→`DEMO` | ✅ |
| 11 | `tsc` / `eslint` / `build` | clean | 0 / 0 errors / PASS | ✅ |
| 12 | BL canary `src/shells` + `app` | empty | empty | ✅ |
| 13 | No DB writes | none | zero DB operations this session | ✅ |

## Part A — the 8 addresses

| # | File:line | Old address | New address |
|---|---|---|---|
| 1 | `src/lib/planCardContent.ts:110` | `sales@pestflowpro.ai` | **`sales@homeflowpro.ai`** |
| 2 | `src/pages/PaymentSuccess.tsx:211` | `admin@pestflowpro.com` | **`billing@homeflowpro.ai`** |
| 3 | `src/components/admin/social/SocialUpgradeNudge.tsx:25` | `support@pestflow.ai` | **`support@homeflowpro.ai`** |
| 4 | `src/components/admin/social/ConnectionsModal.tsx:133` | `support@pestflow.ai` | **`support@homeflowpro.ai`** |
| 5 | `src/components/admin/UpgradeCards.tsx:110` | `support@pestflowpro.ai` | **`support@homeflowpro.ai`** |
| 6 | `src/components/admin/reports/AIAuthorityTile.tsx:82` | `support@pestflowpro.ai` | **`support@homeflowpro.ai`** |
| 7 | `src/components/common/LockedSectionCard.tsx:10` | `support@pestflowpro.ai` | **`support@homeflowpro.ai`** |
| 8 | `src/components/ironwood/TrainingManual.tsx` | **VERIFY ONLY — no change** | see below |

**#1 is the one that was costing money.** `planChangeMailto()` sits behind
"Contact us to switch" on the pricing cards in **every** tenant's Billing tab.

**#8, verified: `TrainingManual.tsx` contains NO `mailto` at all.** The prior
session's "seventh occurrence" was a misreading. Two addresses exist in the file,
neither a link:

```
483:  <RefRow label="Demo admin email" value="admin@pestflowpro.com" />
517:  <RefRow label="IT issues"        value="support@homeflowpro.ai" />
```

`:517` is already the live domain and is display text, not an anchor. **`:483` is
the demo LOGIN CREDENTIAL** — `CLAUDE.md` documents it as
`admin@pestflowpro.com / pf123demo`. It is an auth identifier, not a mailbox;
changing it would break the documented demo login. **Correctly left alone.**

### Required grep — verbatim

```
$ grep -rn "pestflowpro\.ai\|pestflow\.ai\|pestflowpro\.com" src --include=*.tsx --include=*.ts | grep mailto
(no output above = ZERO hits)
```

**ZERO hits.** Every remaining `mailto:` in `src` now resolves to a live mailbox
or a runtime-interpolated recipient:

```
      6  mailto:support@homeflowpro.ai
      3  mailto:scott@homeflowpro.ai
      3  mailto:sales@homeflowpro.ai
      1  mailto:billing@homeflowpro.ai
      1  mailto:scott@ironwoodoperations.com     <- NOT in scope; see L2 below
      5  mailto:${…}                             <- lead/prospect addresses, runtime
```

**One address outside the brief is worth a minute of your time.**
`src/components/admin/dashboard/PlanOverviewCard.tsx:43` points upgrade requests
at **`scott@ironwoodoperations.com`**. That domain was not among the three you
confirmed dead and was not in the mapping, so it was **not changed** — but it is
the same class of risk as #1: a plan-upgrade CTA on the client dashboard whose
deliverability is unverified.

## Part B — the showcase

`src/pages/marketing/sections/MarketingWebsiteShowcase.tsx`, **six** edits:

| line | before | after |
|---|---|---|
| 26 | `lone-star-pest-solutions.pestflowpro.ai` | `apex-protect.pestflowpro.ai` |
| 28 | badge `LIVE` | badge `DEMO` *(green styling unchanged)* |
| 32 | `/images/sites/lone-star-site.jpg` | `/images/sites/apex-protect-site.jpg` |
| **33** | **`alt="Lone Star Pest Solutions"`** | **`alt="Apex Pest Protection"`** |
| 62 | `https://lone-star-pest-solutions.pestflowpro.ai` | `https://apex-protect.pestflowpro.ai` |
| 66 | `See a live example →` | `See a live demo →` |

**Line 33 was not in the brief's list of five.** Left unchanged, the image would
have announced "Lone Star Pest Solutions" to every screen reader while the
visible page said Apex — the same self-contradiction the "all four or none" rule
exists to prevent. Changed as a sixth edit and flagged as **M1** in the REVIEW.

### Asset confirmed present

```
$ ls -la public/images/sites/apex-protect-site.jpg
-rw-r--r-- 1 root root 128195 Aug 26 18:23 public/images/sites/apex-protect-site.jpg
```

### Every `lone-star` reference in the repo — verbatim

```
$ grep -rn "lone-star\|Lone Star" src/ public/images/ (tracked sources only)
src/pages/marketing/sections/MarketingSocial.tsx:22:          <div style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', fontFamily: F.b }}>Lone Star Pest Solutions</div>
src/pages/marketing/sections/MarketingSocial.tsx:30:        <div style={{ fontSize: 11, color: '#22c55e', fontFamily: F.b, marginTop: 4 }}>Lone Star Pest Solutions</div>
--- asset still on disk (unreferenced, not deleted): ---
public/images/sites/lone-star-site.jpg
```

Two survive, **both correctly**:

- **`MarketingSocial.tsx:22` and `:30`** — the name appears inside a **fake
  social-post mockup**: no link, no LIVE badge, no claim of being a real tenant,
  surrounded by illustrative copy ("Mosquito Season is Here", `#LoneStarPest`).
  It is set dressing, not a false claim, so it fails the brief's "fix only if
  also live user-facing links" test. **Reported, not changed.**
- **`public/images/sites/lone-star-site.jpg`** — now unreferenced (77 KB). Left
  on disk; deleting an asset is not a copy fix.

Build artifacts under `public/_admin/` also match, but that path is **gitignored**
(`.gitignore:39`) and is regenerated on every build — not source.

## Test results

```
Test Files  42 passed (42)
     Tests  1164 passed (1164)
  Duration  7.23s
```

`adminRenderedStrings.test.tsx` — **57 passed**, including:

```
✓ S297 — the guard cannot pass vacuously > the platform strip covers the domain
  and the tag-split brand, and strips nothing else
```

**Neither assertion needed touching, and here is why** — they call
`stripPlatformIdentity()` **directly with a literal argument**:

```
627:  expect(PEST_VOCAB_STRICT.test(stripPlatformIdentity('acme.pestflowpro.ai'))).toBe(false);
629:  expect(PEST_VOCAB_STRICT.test(stripPlatformIdentity('support@pestflow.ai'))).toBe(false);
```

They test the **function's contract**, not what any component renders. Removing
`support@pestflow.ai` from the app does not remove it from that contract, so the
strip rule stays and both assertions pass unmodified. No new strip entry was
needed either: `homeflowpro.ai` contains no pest vocabulary for the guard to
catch. **Nothing was deleted or weakened to make the suite pass.**
