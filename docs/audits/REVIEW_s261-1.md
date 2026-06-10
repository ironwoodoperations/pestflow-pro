# REVIEW — S261-1: remove dead /pricing ghost from SEO Pages list

**Branch:** `feat/s261-1-remove-pricing-ghost`
**Change:** Remove `'pricing'` from `STATIC_SLUGS` in `src/components/admin/seo/useSeoTab.ts`.

---

## Symptom

Admin SEO → Pages showed a "Pricing" row (`/pricing`, Static, Live, SEO "Missing"). It was the **only** thing driving the "1 Issue Found / 1 live page missing SEO metadata" card on the SEO Overview + Pages tabs. `/pricing` is a dead page we don't use.

## Root cause

The Pages list is built from a union of `page_content` + the hardcoded `STATIC_SLUGS` array + `service_areas` + `blog_posts` (`useSeoTab.ts` → `loadAll()`) — **not** from crawling the live site. `'pricing'` was hardcoded in `STATIC_SLUGS`, so the row rendered regardless of whether a real route or backing `seo_meta` row existed. Its `seo_meta` row was deleted MCP-side in S260, so the ghost read "Missing".

## DB STATE — verified MCP-side at S261 kickoff

- **seo_meta:** Dang (`1611b16f-381b-4d4f-ba3a-fbde56ad425b`) has **NO `'pricing'` row** — the S260 delete took. The "Missing" state was therefore purely the `STATIC_SLUGS` array driving a row with no backing `seo_meta` — exactly the diagnosed cause.
- **seo_meta** also carries a `'pricing'` row for **6 other tenants** (incl. master/operator `9215b06b-…` and the dry-run/template tenants). These do **not** affect Dang's SEO card, but they confirm the ghost would recur on any tenant once the union runs — which is why the **array edit (this PR), not a per-tenant DB delete, is the correct fix.**
- **page_content:** **ZERO** rows with a `'pricing'` page_slug for **any** tenant. So removing `'pricing'` from `STATIC_SLUGS` is **SUFFICIENT** — no `page_content` row will survive to re-spawn the ghost. This array edit alone drops Dang's "Issues Found" card to 0.

## Part A — does a real /pricing route exist? (route confirmation)

**Admin SPA repo (`ironwoodoperations/pestflow-pro`): NO real `/pricing` route.**
- `src/App.tsx` router has no `/pricing` (routes: `/`, `/admin/login`, `/admin/onboarding`, `/admin/onboarding-live`, `/admin`, `/ironwood/login`, `/ironwood/*`, `/payment-success`, `/intake/:token`, `/intake-success`, `/demos`, `/demos/admin`, `/terms`, `/privacy`, `*`).
- No `app/**/pricing` route directory in the Next.js tree.

**Non-route `pricing` references found (left untouched):**
- `src/pages/marketing/sections/MarketingPricing.tsx` — a `<section id="pricing">` on the marketing home (`/`), reached by same-page anchor scroll (`scrollTo('pricing')` in `MarketingNav.tsx:39` / `MarketingFooter.tsx:6`). Legitimate marketing-page section, **not** a route.
- `src/components/ironwood/IronwoodSEO.tsx:12` — a separate hardcoded `MARKETING_PAGES` list (`{ slug: 'pricing', label: 'Pricing' }`) driving the **Ironwood Ops** SEO surface for the PFP *marketing-site* tenant (`9215b06b`), **not** the client SEO Pages list. The marketing site genuinely has a pricing section and `seo_meta` legitimately has a `pricing` row for `9215b06b`. **Surfaced, deliberately not changed** — different, legitimate surface.
- Other hits (`pricingConfig` imports, training-manual/CRM copy, demo-seed text, metric-help copy) are unrelated to page routing.

**Dang public site (separate standalone Next.js repo, dangpestcontrol.com):** NOT in this session's repo scope, and the `list_repos` tool is unavailable here — so I **cannot confirm** whether an `app/pricing` route exists there. **Not guessed.** If a real `/pricing` route lives in the Dang repo, Scott removes it there (per task).

→ Since no real route exists in the admin SPA, **S261-2 (route removal) is not needed.**

## Change

```diff
- const STATIC_SLUGS = ['home','about','contact','quote','pricing','faq','reviews','service-area']
+ const STATIC_SLUGS = ['home','about','contact','quote','faq','reviews','service-area']
```

Display-only — hides no real page, changes no real route, touches no caching/auth/RLS/payments/edge behavior (validator gate N/A).

## Expected after merge + deploy

Pricing row disappears from SEO → Pages; SEO Overview "Issues Found" drops to 0 (62/63 "SEO Configured" was only short because of this ghost).

## Checks
- ✅ Vite build green; `useSeoTab.ts` 198 lines (<200).
- ✅ grep confirms no other hardcoded `pricing` page-row / static-slug in the client SEO Pages path (the two remaining hits are the marketing section + the Ironwood marketing-SEO surface, both legitimate and surfaced above).
