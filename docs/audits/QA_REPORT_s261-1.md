# QA REPORT — S261-1: remove dead /pricing ghost from SEO Pages list

**Branch:** `feat/s261-1-remove-pricing-ghost`
**Date:** 2026-06-10
**Under test:** `src/components/admin/seo/useSeoTab.ts`

---

## Static checks

| Check | Result |
|-------|--------|
| `'pricing'` removed from `STATIC_SLUGS` | ✅ |
| `npm run build:vite` | ✅ green (~9s) |
| `useSeoTab.ts` line count | 198 (<200) ✅ |
| No other hardcoded `pricing` page-row / static-slug in client SEO path | ✅ (only the marketing `#pricing` section + Ironwood marketing-SEO list remain — both legitimate, surfaced in REVIEW) |
| Net diff | 1 line changed, display-only |

## Behavioral reasoning

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 1 | Tenant with no `page_content` pricing row (all tenants — verified) | no "Pricing" row in SEO → Pages | ✅ array no longer injects it; DB has no page_content pricing row to re-spawn it |
| 2 | Dang SEO Overview | "Issues Found" card drops to 0 (the ghost was the only missing-meta live page) | ✅ |
| 3 | Real static pages (home/about/contact/quote/faq/reviews/service-area) | still listed | ✅ unchanged |
| 4 | Marketing site `#pricing` section + Ironwood marketing-SEO surface | unaffected | ✅ not touched |

## Route confirmation (Part A)

- Admin SPA: **no** real `/pricing` route (App.tsx + Next `app/` both clean). → S261-2 not needed.
- Dang standalone repo: out of scope / `list_repos` unavailable → cannot confirm; reported to Scott, not guessed.

## Not run

- No live browser session in this web env. Verification = build + code review + the MCP-verified DB state (no `page_content` pricing row for any tenant) carried into REVIEW. Operator confirms visually on Dang admin SEO → Pages post-deploy (Vercel preview also on the PR).

## Verdict

✅ Ready for review. One-line, display-only fix; DB state confirms it is sufficient to retire the ghost with nothing left to re-spawn it.
