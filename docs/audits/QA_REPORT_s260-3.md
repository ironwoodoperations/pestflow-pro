# QA REPORT — S260-3: "Needs update" badges on SEO → Pages list

**Branch:** `feat/s260-3-needs-update-badges`
**Date:** 2026-06-10
**Under test:** `useSeoTab.ts` (data), `SeoPagesTab.tsx` (render), `seoTypes.ts` (types)

---

## Build / static checks

| Check | Result |
|-------|--------|
| `npm run build:vite` | ✅ built in ~10s |
| SEOTab chunk | 41 kB ✅ |
| main `index` chunk | 270 kB — under 450 kB cap ✅ |
| Line counts | SeoPagesTab 173, useSeoTab 198, seoTypes 89 — all <200 ✅ |
| Query selects only `page_slug, severity` | ✅ (no `problem`/`suggested_fix`) |
| Site-wide findings excluded | ✅ `.not('page_slug','is',null)` |
| Multi-row read uses plain `await` (no `.maybeSingle()`) | ✅ |

## Live-data verification (Dang tenant `1611b16f-381b-4d4f-ba3a-fbde56ad425b`)

Read-only SQL against prod `report_findings` (`is_resolved=false`):

**Per-slug open findings → expected badge:**

| Severity bucket | Slugs (count) | Expected badge color |
|---|---|---|
| medium (top) | about (3), accessibility (2), contact (2), quote (1), termite-inspections (2) | amber |
| low | ant-control, bed-bug-control, flea-tick-control, mosquito-control, pest-control, privacy, roach-control, rodent-control, scorpion-control, sms-terms, spider-control, termite-control, terms, wasp-control, wasp-hornet-control (1 each) | slate |
| site-wide (null) | 3 findings | **no badge** (excluded) |

- **20/20 page-scoped slugs resolve to a real Pages-tab row** (all present in `page_content`) — verified by cross-join SQL. Every badged slug maps to a visible row, so no "orphan" findings.
- **Top-severity reduce confirmed:** `about` has 3 findings with a medium present → badge shows amber "Needs update (3)". Pure-low slugs → slate.
- **Site-wide exclusion confirmed:** the 3 `page_slug IS NULL` findings (Search visibility) are filtered by the query and never reach a row → no mis-badging, no crash.

## Behavioral matrix (reasoned over code + live data)

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 1 | Page with open findings | "Needs update (n)" pill below SEO status, severity-colored | ✅ |
| 2 | Page with no findings | no pill; `needsUpdate` falsy | ✅ |
| 3 | Page has both meta + findings | "✓ Configured" AND "Needs update" both show (flex-col) | ✅ distinct pills |
| 4 | Multiple findings, mixed severity | count = total; color = highest severity | ✅ `SEVERITY_RANK` reduce |
| 5 | Site-wide finding | does not badge any row | ✅ excluded in query |
| 6 | Search by name/url | unaffected (badge is display-only) | ✅ filter logic untouched |
| 7 | Type/status/SEO filters | unaffected | ✅ |
| 8 | Tenant with zero findings | no badges anywhere; list renders normally | ✅ empty `findingMap` |

## Deviation from the task's QA sample (reported, not "fixed")

The spec expected Privacy/Terms/SMS Terms to be clean (no badge). Live data shows each has **1 low finding** (also `accessibility`), so they **will** show a slate "Needs update" badge. This is correct behavior for S260-3 — the badge mirrors `report_findings`. The underlying findings come from the edge function (likely the all-images-empty LOW rule, not suppressed for legal slugs), which is **out of scope** here (the task says do not touch the edge function). Flagged in REVIEW for a later session.

## Not run

- No live browser session in this web environment. Verification is build + direct DB cross-check of the exact data the component reads, plus code review of the render path. Operator can confirm visually on the Dang admin SEO → Pages tab post-deploy (Vercel preview also available on the PR).

## Verdict

✅ Ready for review. Badge renders from live findings, severity/count correct, site-wide excluded, filters intact, under size caps, no tier gating, no `problem`/`suggested_fix` exposure.
