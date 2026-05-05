# Apex Migration Parity Audit

**Session:** S192
**Date:** 2026-05-05
**Scope:** Verify Next.js parity for the apex Vite content currently rendered at `pestflowpro.com/*` via the bold-local PublicShell. Determine what gaps must be filled before migrating the demo content off apex onto `demo.pestflowpro.com` (Next.js).

---

## TL;DR

**Parity is essentially complete: 24 of 24 apex content routes have a Next.js equivalent under `app/tenant/[slug]/`.** The pest-service routes consolidate into a single dynamic `[service]` route, and the location routes (`/:slug`) flow through that same handler. The only gap is `/sitemap.xml` (Vite has a dynamic generator; Next.js has nothing). Apex `/pricing` is SaaS-marketing content, not demo content, so it stays on the marketing landing flow rather than migrating.

The migration's real blocker is **not page parity** but **routing wiring**: middleware sends `demo.pestflowpro.com/*` requests to `/tenant/demo/*` and `resolveTenantBySlug('demo')` won't match the master tenant (slug=`pestflow-pro`). Two viable fixes — see "Required middleware/resolver change" below. Internal-link updates are confined to 3 files in `src/pages/marketing/sections/`. Verdict: this is a **2-PR implementation arc** (subdomain wiring + link updates + middleware change in one PR; Vite cleanup in a follow-up), not a build-out.

Migration also incidentally retires the 13 outstanding Pexels URLs without further work: deletion of `src/shells/bold-local/` (2 URLs) and `src/data/pestVideos.ts` (11 URLs) becomes safe once apex `/*` returns 404.

---

## Apex Vite route inventory

Every route currently rendered under `<PublicShell>` on apex (per `src/App.tsx`):

| Path | Vite component | File | Notes |
|---|---|---|---|
| `/` | `RootRoute` → MarketingLanding (apex only) or Index | `src/pages/Index.tsx` | Apex `/` → MarketingLanding; subdomain `/` → Index. **Stays unchanged.** |
| `/contact` | ContactPage | `src/pages/ContactPage.tsx` | Demo content |
| `/quote` | QuotePage | `src/pages/QuotePage.tsx` | Demo content |
| `/about` | About | `src/pages/About.tsx` | Demo content |
| `/faq` | FAQPage | `src/pages/FAQPage.tsx` | Demo content |
| `/reviews` | ReviewsPage | `src/pages/ReviewsPage.tsx` | Demo content |
| `/service-area` | ServiceArea | `src/pages/ServiceArea.tsx` | Demo content |
| `/blog` | BlogPage | `src/pages/BlogPage.tsx` | Demo content |
| `/blog/:slug` | BlogPostPage | `src/pages/BlogPostPage.tsx` | Demo content |
| `/pricing` | Pricing | `src/pages/Pricing.tsx` | **SaaS pricing**, not demo |
| `/terms` | ClientTermsPage | `src/components/shared/ClientTermsPage.tsx` | Demo content |
| `/privacy` | ClientPrivacyPage | `src/components/shared/ClientPrivacyPage.tsx` | Demo content |
| `/sms-terms` | ClientSmsTermsPage | `src/components/shared/ClientSmsTermsPage.tsx` | Demo content |
| `/sitemap.xml` | Sitemap | `src/pages/Sitemap.tsx` | Dynamic per-tenant sitemap |
| `/spider-control` | SpiderControl | `src/pages/SpiderControl.tsx` | Demo content (12 pest routes) |
| `/mosquito-control` | MosquitoControl | `src/pages/MosquitoControl.tsx` | |
| `/ant-control` | AntControl | `src/pages/AntControl.tsx` | |
| `/wasp-hornet-control` | WaspHornetControl | `src/pages/WaspHornetControl.tsx` | |
| `/roach-control` | RoachControl | `src/pages/RoachControl.tsx` | |
| `/flea-tick-control` | FleaTickControl | `src/pages/FleaTickControl.tsx` | |
| `/rodent-control` | RodentControl | `src/pages/RodentControl.tsx` | |
| `/scorpion-control` | ScorpionControl | `src/pages/ScorpionControl.tsx` | |
| `/bed-bug-control` | BedBugControl | `src/pages/BedBugControl.tsx` | |
| `/pest-control` | PestControlPage | `src/pages/PestControlPage.tsx` | |
| `/termite-control` | TermiteControl | `src/pages/TermiteControl.tsx` | |
| `/termite-inspections` | TermiteInspections | `src/pages/TermiteInspections.tsx` | |
| `/:slug` | SlugRouter | `src/pages/SlugRouter.tsx` | Routes location/dynamic slugs (e.g., `/tyler-tx`) |
| `*` | NotFound (under PublicShell) | `src/pages/NotFound.tsx` | Catch-all |

Demo content rows in DB for master tenant `pestflow-pro` (id `9215b06b-3eb5-49a1-a16e-7ff214bf6783`): **15 page_content rows, 7 service_areas, 4 blog_posts**. Verified via Supabase MCP.

---

## Next.js route inventory

Every route file under `app/`:

| Path under app/ | URL pattern (after middleware rewrite) | Component / behavior |
|---|---|---|
| `app/page.tsx` | `pestflowpro.com/` direct hit (rare; middleware rewrites to Vite) | Default Next.js placeholder (unreachable in prod) |
| `app/api/revalidate/route.ts` | `*/api/revalidate` | API endpoint |
| `app/tenant/[slug]/layout.tsx` | wraps every tenant page | Theme-switched nav/footer (bold-local, clean-friendly, modern-pro, rustic-rugged, metro-pro) |
| `app/tenant/[slug]/page.tsx` | `<sub>.pestflowpro.com/` | Tenant home — theme-switched (`bold-local`, `clean-friendly`, `rustic-rugged`, default modern-pro) |
| `app/tenant/[slug]/about/page.tsx` | `<sub>.pestflowpro.com/about` | About page |
| `app/tenant/[slug]/contact/page.tsx` | `/contact` | Contact form |
| `app/tenant/[slug]/quote/page.tsx` | `/quote` | Quote multi-step form |
| `app/tenant/[slug]/faq/page.tsx` | `/faq` | FAQ |
| `app/tenant/[slug]/reviews/page.tsx` | `/reviews` | Reviews |
| `app/tenant/[slug]/service-area/page.tsx` | `/service-area` | Service-area landing |
| `app/tenant/[slug]/blog/page.tsx` | `/blog` | Blog index |
| `app/tenant/[slug]/blog/[post]/page.tsx` | `/blog/<post>` | Blog post |
| `app/tenant/[slug]/terms/page.tsx` | `/terms` | Terms |
| `app/tenant/[slug]/privacy/page.tsx` | `/privacy` | Privacy |
| `app/tenant/[slug]/sms-terms/page.tsx` | `/sms-terms` | SMS terms |
| `app/tenant/[slug]/[service]/page.tsx` | `/<service-or-location-slug>` | Dynamic — handles 12 pest services + service-area location slugs (mirrors Vite's `SlugRouter`) |
| `app/tenant/[slug]/not-found.tsx` | catch-all | Tenant NotFound |

`SERVICE_DATA` in `app/tenant/[slug]/_lib/serviceData.ts` covers all 12 pest service slugs (`pest-control`, `ant-control`, `roach-control`, `rodent-control`, `mosquito-control`, `termite-control`, `termite-inspections`, `spider-control`, `bed-bug-control`, `wasp-hornet-control`, `scorpion-control`, `flea-tick-control`). The `[service]` route's branch logic at `app/tenant/[slug]/[service]/page.tsx:41` falls back to `getLocation()` when the slug isn't in `SERVICE_SLUGS`, so location URLs like `/tyler-tx` resolve from the `service_areas` table.

---

## Parity diff

| Apex Vite path | Next.js equivalent | Status | Notes |
|---|---|---|---|
| `/` | `app/tenant/[slug]/page.tsx` | Match | Master apex `/` keeps MarketingLanding; demo subdomain `/` renders the home |
| `/contact` | `contact/page.tsx` | Match | |
| `/quote` | `quote/page.tsx` | Match | |
| `/about` | `about/page.tsx` | Match | |
| `/faq` | `faq/page.tsx` | Match | |
| `/reviews` | `reviews/page.tsx` | Match | |
| `/service-area` | `service-area/page.tsx` | Match | |
| `/blog` | `blog/page.tsx` | Match | |
| `/blog/:slug` | `blog/[post]/page.tsx` | Match | URL param renamed `:slug` → `[post]` (cosmetic) |
| `/pricing` | — | **Out of scope** | This is the SaaS pricing page (`Starter $99 / Pro $199 / Agency $399`), not the demo tenant's pricing. Belongs to the marketing landing flow, not the demo. After migration it will 404 on apex. Confirm with Scott whether it should move under the marketing landing (`pestflowpro.com/pricing`) or stay 404. Currently linked from `MarketingPricing.tsx` (an active section component) which has no actual `/pricing` link — appears the SaaS pricing is rendered inline in the landing page now. **Verify if `/pricing` is still linked from anywhere in the marketing landing before flipping to 404.** |
| `/terms` | `terms/page.tsx` | Match | |
| `/privacy` | `privacy/page.tsx` | Match | |
| `/sms-terms` | `sms-terms/page.tsx` | Match | |
| `/sitemap.xml` | — | **Gap** | Vite generates dynamically from `service_areas` table; no Next.js equivalent at `app/tenant/[slug]/sitemap.ts`. After migration, `pestflowpro.com/sitemap.xml` 404s and `demo.pestflowpro.com/sitemap.xml` will too unless built. Optional — can remove the sitemap line from `public/robots.txt` instead of building. |
| `/spider-control` etc. (12 pest routes) | `[service]/page.tsx` | Match | Handled by single dynamic route via `SERVICE_DATA` map |
| `/:slug` (location pages) | `[service]/page.tsx` (fallback branch) | Match | Same dynamic route; falls through to `getLocation()` for non-pest slugs |
| `*` (NotFound) | `not-found.tsx` | Match | |

**Conclusion:** zero blocking parity gaps. One optional gap (`/sitemap.xml`), one out-of-scope page (`/pricing`).

---

## Internal link audit

### `src/pages/marketing/sections/*` (the active marketing landing imported by `MarketingHome.tsx`)

These currently point at `pestflow-pro.pestflowpro.com` (the *current* slug-based subdomain that also resolves the master tenant via Next.js). After the migration, the canonical demo URL becomes `demo.pestflowpro.com`. Since `pestflow-pro.pestflowpro.com` will continue to resolve (slug-based fallback in middleware + Next.js `resolveTenantBySlug` work as-is for that hostname), these links will not break — but they should be updated to the new canonical for consistency and SEO.

| File | Line | Current value | Required new value |
|---|---|---|---|
| `src/pages/marketing/sections/MarketingHero.tsx` | 48 | `https://pestflow-pro.pestflowpro.com` | `https://demo.pestflowpro.com` |
| `src/pages/marketing/sections/MarketingHero.tsx` | 51 | `https://pestflow-pro.pestflowpro.com/admin` | `https://demo.pestflowpro.com/admin` |
| `src/pages/marketing/sections/MarketingCRM.tsx` | 52 | `https://pestflow-pro.pestflowpro.com/admin` | `https://demo.pestflowpro.com/admin` |
| `src/pages/marketing/sections/MarketingCRM.tsx` | 89 | `https://pestflow-pro.pestflowpro.com/admin` | `https://demo.pestflowpro.com/admin` |

### `src/pages/marketing/ClientMockupCarousel.tsx`

| Line | Current value | Required new value |
|---|---|---|
| 8 | `pestflow-pro.pestflowpro.com` (label "Demo Site") | `demo.pestflowpro.com` |

### `src/pages/marketing/MarketingFeatures.tsx`

| Line | Current value | Required new value |
|---|---|---|
| 39 | `pestflow-pro.pestflowpro.com/admin` (display text) | `demo.pestflowpro.com/admin` |

> Note: this file is reachable only via `src/pages/MarketingLanding.tsx` (an *unused* legacy landing page; App.tsx imports `pages/marketing/MarketingHome.tsx`, not `pages/MarketingLanding.tsx`). The legacy landing imports the top-level `MarketingHero/CTA/Features/Pricing` components which are dead code. Strictly speaking these don't render today, but they should still be updated or deleted to prevent stale references.

### Top-level legacy `src/pages/marketing/{MarketingHero,MarketingCTA}.tsx`

Each defines `DEMO` and `ADMIN` constants pointing at `pestflow-pro.pestflowpro.com`. **Dead code** (only consumed by the unused `src/pages/MarketingLanding.tsx`). Recommend deletion as side-cleanup.

### Admin dashboard

| File | Line | Current value | Status |
|---|---|---|---|
| `src/components/admin/onboarding/StepReview.tsx` | 87 | `https://pestflowpro.com/terms-of-service` | **Already broken** — Vite has `/terms`, not `/terms-of-service`. Side finding, file separately. |
| `src/components/admin/onboarding/StepReview.tsx` | 102 | `https://pestflowpro.com/privacy-policy` | **Already broken** — Vite has `/privacy`, not `/privacy-policy`. Side finding. |
| `src/pages/admin/Login.tsx` | 111 | `https://pestflowpro.com` | OK (apex root stays MarketingLanding) |
| `src/components/admin/UpgradeCards.tsx` | 46 | `mailto:support@pestflowpro.com…` | OK (mailto, not URL) |
| `src/components/admin/BillingTab.tsx` | 217 | `mailto:support@pestflowpro.com…` | OK |

`<slug>.pestflowpro.com` references in `BillingTab`, `Step1BusinessInfo`, `Step6Review`, `OnboardingTab`, `DomainSection`, `ClientSetupPayment` are all per-tenant subdomain construction (using form data, not master). Unaffected by the migration.

---

## External reference scan

### `public/robots.txt`

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /intake/
Sitemap: https://pestflowpro.com/sitemap.xml
```

The sitemap line will 404 after migration. **Either remove the line, or update it** (probably to `https://demo.pestflowpro.com/sitemap.xml` once a Next.js sitemap is built — see "Recommended implementation sequence" below).

The `Disallow: /admin` lines stay correct: apex `/admin*` still routes to Vite admin shell.

### `vercel.json` redirects

Contains 30+ `permanent: true` redirects mapping legacy trailing-slash URLs (`/about/` → `/about`, `/blog/<old-post>/` → `/blog`, etc.). These were SEO-preservation redirects from a prior site. Post-migration, the destinations themselves 404 on apex. Two interpretations:

- **Keep them:** harmless 308 redirects landing on a 404 page — wastes one round-trip.
- **Delete them:** cleaner, no behavior change other than skipping the 308.

Recommend deletion as a follow-up cleanup PR. **Not blocking.**

### Schema.org / OpenGraph URLs

Generated dynamically using `siteUrl` constructed from `params.slug`:

| File | Line | Pattern |
|---|---|---|
| `app/tenant/[slug]/layout.tsx` | 53 | `https://${params.slug}.pestflowpro.com` |
| `app/tenant/[slug]/page.tsx` | 75 | `https://${params.slug}.pestflowpro.com` |
| `app/tenant/[slug]/[service]/page.tsx` | 155 | `https://${params.slug}.pestflowpro.com` |
| `app/tenant/[slug]/blog/[post]/page.tsx` | 24 | `https://${params.slug}.pestflowpro.com` |
| `app/tenant/[slug]/about/page.tsx` | 43 | `https://${params.slug}.pestflowpro.com` |

For the master tenant rendered at `demo.pestflowpro.com`, the URL param `params.slug` will be `'demo'` (the subdomain), so `siteUrl` becomes `https://demo.pestflowpro.com` — **correct**, IF the middleware rewrites pass `demo` straight through and IF `resolveTenantBySlug('demo')` succeeds (currently it won't; see next section).

If we instead translate `demo` → `pestflow-pro` at middleware level (Option A below), `params.slug` becomes `'pestflow-pro'` and `siteUrl` becomes `https://pestflow-pro.pestflowpro.com` — **wrong canonical**. So Option B is preferred for SEO correctness.

### Footer "Powered by PestFlow Pro" links

All 5 Next.js shell footers point at `https://pestflowpro.com` (apex root → MarketingLanding). **Stays correct** post-migration since apex root is unchanged. No action needed.

### Tests

`shared/lib/seoSchema.test.ts` uses `https://acme.pestflowpro.com` and `https://x.pestflowpro.com` as test fixture site URLs — unaffected by migration.

---

## Subdomain routing verification

### Current state

- **`tenants.subdomain` for master tenant:** `NULL` (verified via Supabase MCP: `SELECT subdomain FROM tenants WHERE slug='pestflow-pro'` → `null`)
- **Vite-side resolver** (`src/lib/subdomainRouter.ts`): checks `tenants.subdomain` first, then falls back to `tenants.slug`. Already supports a `'demo'` subdomain pointing at any tenant.
- **Next.js-side resolver** (`shared/lib/tenant/resolve.ts:53-66`): `resolveTenantBySlug(slug)` queries `tenants` filtering by `slug` only — **does NOT consult `tenants.subdomain`**. This is the wiring gap.
- **Middleware** (`middleware.ts:41-59`): apex → Vite SPA, `/admin*` → Vite SPA, `dang` → Vite SPA, everything else rewrites `<sub>.pestflowpro.com/<path>` → `/tenant/<sub>/<path>`.

### What breaks if you do nothing

`demo.pestflowpro.com/about` → middleware rewrites to `/tenant/demo/about` → `app/tenant/[slug]/about/page.tsx` runs with `params.slug = 'demo'` → `resolveTenantBySlug('demo')` returns `null` → `notFound()` → 404 for the entire demo subdomain.

### Two viable fixes

**Option A — middleware translation (simpler, no DB change):**

Add a `SUBDOMAIN_ALIASES` map in `middleware.ts`:
```ts
const SUBDOMAIN_ALIASES: Record<string, string> = { 'demo': 'pestflow-pro' };
const slug = SUBDOMAIN_ALIASES[extractedSubdomain] ?? extractedSubdomain;
url.pathname = `/tenant/${slug}${suffix}`;
```
Pros: no DB change, no resolver change, works immediately.
Cons: `params.slug` becomes `'pestflow-pro'` so the `siteUrl` constant in tenant pages constructs `https://pestflow-pro.pestflowpro.com` (wrong canonical for SEO/schema).

**Option B — generalized subdomain field (correct, recommended):**

1. Update `resolveTenantBySlug` in `shared/lib/tenant/resolve.ts` to query `.or('slug.eq.<value>,subdomain.eq.<value>')` (or rename param to `slugOrSubdomain`).
2. Set `tenants.subdomain = 'demo'` for the master tenant via SQL UPDATE.
3. Optionally: update layout/page files to construct `siteUrl` from `tenant.subdomain ?? tenant.slug` so the canonical URL is `https://demo.pestflowpro.com` (instead of `https://pestflow-pro.pestflowpro.com`).

Pros: clean, generalizes for any future tenant wanting a custom subdomain (Scott already plans this for clients), correct SEO canonicals.
Cons: requires DB UPDATE + resolver change.

**Recommendation: Option B.** The canonical-URL correctness matters for SEO, and the resolver generalization is on the roadmap anyway.

### Vercel domain config

`vercel.json` has no `domains` or `crons` block. Vercel project's domain settings are configured outside the repo. The wildcard `*.pestflowpro.com` (presumed in place since `pestflow-pro.pestflowpro.com`, `lone-star-pest-solutions.pestflowpro.com`, `dang.pestflowpro.com` all resolve today) covers `demo.pestflowpro.com` automatically — **no Vercel config change needed**, just a DNS confirmation that the wildcard or specific A/CNAME for `demo` exists in DNS. Treat as "verify in Vercel dashboard" rather than a code task.

---

## Required middleware change

### Current logic (verbatim, `middleware.ts:28-60`)

```ts
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const hostname = host.split(':')[0].toLowerCase();
  const { pathname } = req.nextUrl;

  // Local dev pure localhost: pass through so /_tenant/* direct URLs work
  if (process.env.NODE_ENV !== 'production' && hostname === 'localhost') {
    return NextResponse.next();
  }

  const slug = extractSubdomain(host);

  // Apex (prod) → Vite SPA handles marketing + /ironwood
  if (!slug) {
    return NextResponse.rewrite(new URL('/_admin/index.html', req.url));
  }

  // Client admin on any subdomain → Vite SPA
  if (pathname.startsWith('/admin')) {
    return NextResponse.rewrite(new URL('/_admin/index.html', req.url));
  }

  // Dang is NOT migrated — stays on Vite
  if (slug === 'dang') {
    return NextResponse.rewrite(new URL('/_admin/index.html', req.url));
  }

  // Subdomain public shell → Next.js App Router
  const url = req.nextUrl.clone();
  const suffix = pathname === '/' ? '' : pathname;
  url.pathname = `/tenant/${slug}${suffix}`;
  return NextResponse.rewrite(url);
}
```

### Required new behavior

- **`pestflowpro.com/`** → Vite SPA (MarketingLanding). Unchanged.
- **`pestflowpro.com/admin*`** → Vite SPA. Unchanged.
- **`pestflowpro.com/<anything else>`** → 404 (not Vite SPA). `NextResponse.rewrite(new URL('/_not-found', req.url))` or return a 404 response directly.
- **`pestflowpro.com/ironwood*`** → Vite SPA (Scott's Ironwood Ops console — verify before locking down apex).
- **`demo.pestflowpro.com/*`** → Next.js (via Option B resolver fix above).
- **`dang.pestflowpro.com/*`** → Vite SPA. Unchanged.
- **All other `*.pestflowpro.com/*`** → Next.js. Unchanged.

The proposed apex branch becomes:
```ts
if (!slug) {
  // apex pestflowpro.com
  if (pathname === '/' || pathname.startsWith('/admin') || pathname.startsWith('/ironwood')) {
    return NextResponse.rewrite(new URL('/_admin/index.html', req.url));
  }
  // anything else on apex → 404
  return NextResponse.rewrite(new URL('/apex-404', req.url));
  // OR: const r = NextResponse.next(); r.status = 404; return r; — but rewriting to a real not-found page is cleaner
}
```

**Decision needed:** does Scott want `/ironwood*` to stay on apex (current behavior) or move to a separate subdomain too? Audit assumes stays on apex.

---

## Recommended implementation sequence

### PR 1 — Subdomain wiring + middleware lockdown + internal links (one atomic PR)

1. **DB:** `UPDATE tenants SET subdomain='demo' WHERE id='9215b06b-3eb5-49a1-a16e-7ff214bf6783'` (master tenant). Apply via Supabase migration.
2. **Resolver:** `shared/lib/tenant/resolve.ts` — change `resolveTenantBySlug` to accept slug-or-subdomain, query `.or('slug.eq.<v>,subdomain.eq.<v>')`. Rename function to `resolveTenantBySlugOrSubdomain` for clarity (or keep name + update internals only).
3. **siteUrl construction:** in the 5 layout/page files that build `siteUrl`, replace `params.slug` with `tenant.subdomain ?? tenant.slug` so master tenant's canonical becomes `https://demo.pestflowpro.com`.
4. **Middleware:** apex non-`/`-non-`/admin*`-non-`/ironwood*` → 404. `dang` carve-out stays.
5. **Marketing internal links:** update 3 files in `src/pages/marketing/sections/` (MarketingHero × 2, MarketingCRM × 2) and 2 files in `src/pages/marketing/` (ClientMockupCarousel, MarketingFeatures) to point at `demo.pestflowpro.com`.
6. **`public/robots.txt`:** drop the `Sitemap:` line OR update to `demo.pestflowpro.com/sitemap.xml` (depends on whether step 7 ships).
7. **(Optional) Next.js sitemap:** add `app/tenant/[slug]/sitemap.ts` mirroring `src/pages/Sitemap.tsx` core-routes list. **Skip if Scott considers sitemap.xml low-priority**; can ship as a follow-up.

Pre-merge verification:
- Manual smoke-test `demo.pestflowpro.com/{,/about,/quote,/spider-control,/tyler-tx}` on a Vercel preview deploy.
- Manual smoke-test `pestflowpro.com/`, `pestflowpro.com/admin/login`, `dang.pestflowpro.com/` — must continue working.
- Smoke-test `pestflowpro.com/about` — must 404 (not bold-local Vite).

### PR 2 — Vite cleanup (after PR 1 merged + verified in production)

1. `git rm -rf src/shells/bold-local/` — last live Vite public shell.
2. `git rm -rf src/data/pestVideos.ts` and remove the 13 `src/pages/<pest>.tsx` imports of `PEST_VIDEOS`.
3. `git rm src/components/PublicShell.tsx` and the 28 PublicShell route wrappers in `src/App.tsx` for `/about`, `/contact`, `/quote`, etc.
4. `git rm src/pages/{About,FAQPage,ReviewsPage,ServiceArea,BlogPage,BlogPostPage,Pricing,QuotePage,ContactPage,Index,SlugRouter,LocationPage,SpiderControl,...,TermiteInspections}.tsx`. (Keep `Login`, `IronwoodOps`, `IronwoodLogin`, `IntakePage`, `IntakeSuccess`, `PaymentSuccess`, `Sitemap`, `NotFound` — admin/ironwood + intake flow are still on Vite.)
5. `git rm src/components/PestPageTemplate.tsx`, `src/pages/SlugRouter.tsx`.
6. Drop the `'bold-local'` member of `TemplateName` if it has no remaining consumers; collapse `PublicShell` switch logic in unused contexts.
7. Re-run dormancy grep to confirm no orphans.

**Phase 1b Pexels cleanup completion:** the 13 outstanding URLs (2 in bold-local + 11 in pestVideos) disappear in step 2 of PR 2. **Stages D and E from the original Phase 1b plan are not needed as separate work** — they fold into this larger arc.

### PR 3 (cleanup) — optional follow-up

- Delete `vercel.json` legacy redirects (30+ entries).
- Delete dead `src/pages/MarketingLanding.tsx` and the legacy top-level `src/pages/marketing/Marketing{Hero,CTA,Features,Pricing}.tsx` files.
- Delete `src/pages/Pricing.tsx` if unreachable after Vite trim.
- Audit `src/components/admin/onboarding/StepReview.tsx` lines 87, 102 for the broken terms-of-service / privacy-policy URLs (already broken pre-migration; fix to `/terms` / `/privacy` or to legal page paths on the marketing landing).

---

## Side findings

- **Stage C (PR #38) was not merged.** `app/tenant/[slug]/_shells/rustic-rugged/RusticRuggedResComFac.tsx` still contains the 6 Pexels URLs in this checkout. Per the new plan, that's intentional: rustic-rugged Next.js shell is reachable via clean-friendly's parallel structure, and per the apex-migration arc, the Pexels work consolidates into PR 2 above (alongside bold-local cleanup). Stage C as a separate PR can be closed without merging.
- **`src/components/admin/onboarding/StepReview.tsx` has two pre-existing broken links:** `pestflowpro.com/terms-of-service` (line 87) and `pestflowpro.com/privacy-policy` (line 102). The Vite routes are `/terms` and `/privacy`. These already 404 today; flagging for follow-up fix.
- **Marketing landing has dead code:** `src/pages/MarketingLanding.tsx` and the top-level `src/pages/marketing/{MarketingHero,MarketingCTA,MarketingFeatures,MarketingPricing}.tsx` are not referenced by `App.tsx`. The active landing imports from `pages/marketing/MarketingHome.tsx` → `./sections/*`. Recommend deletion in PR 3.
- **`tenants.subdomain` field has zero current users:** all 3 tenants (`pestflow-pro`, `dang`, `cityshield-pest-defense`) have NULL. Setting master to `'demo'` will be the first use of the field. Vite resolver already supports it; only Next.js resolver is the gap.
- **Demo content is well-populated:** master tenant has 15 page_content rows, 7 service_areas, and 4 blog_posts. No content-shape issues blocking the demo site from rendering completely.
- **`/ironwood*` was not in the migration brief.** Currently `pestflowpro.com/ironwood*` works via Vite SPA. The apex lockdown logic must explicitly preserve `/ironwood*` alongside `/` and `/admin*` or it will 404 along with the demo content. Confirm with Scott before drafting PR 1.
- **Tag pushes from CC Web continue to 403** (per Stage A precedent). Continue using SHA-based rollback references rather than git tags.
