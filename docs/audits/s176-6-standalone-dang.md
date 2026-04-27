# S176.6 — Standalone Dang Repo Audit

## Punchline (top of file)
- Path D viability: **VIABLE WITH CAVEATS**
- Estimated session count for Path D: **3–5 sessions** (range: 3–5)
- Single biggest gating factor: Data created in PestFlow Pro since the S100 migration (leads, blog posts, testimonials, location edits) lives in PFP's Supabase (`biezzykcgzkrwdgqpsar`) — returning to Path D requires a data reconciliation step before cutting over.

---

## Repo basics
- Latest commit: `ff2527b16cc7d8e48dc625447106bd590d97fdc4` on 2026-04-08 — "chore: redirect admin to PestFlow Pro dashboard"
- Framework: React 18.3.1 + Vite 5.4.19
- Routing: react-router-dom 6.30.1
- Node version: unspecified (no `.nvmrc` or `.node-version`)
- Build script: `node scripts/generate-sitemap.mjs && vite build`

---

## Supabase wiring
- Client init file: `src/integrations/supabase/client.ts:5`
- Project ID detected: `bqavwwqebcsshsdrvczz`
- Same project as PestFlow Pro (`biezzykcgzkrwdgqpsar`)? **NO**
- Env var convention: `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`
- Committed `.env` note: The `.env` file is committed to the repo and contains the anon (publishable) key. This is **not** a secret — the anon key is a public client key by design. No service-role key found. No secrets alert.
- Implication for admin wiring: The standalone already points to its own independent Supabase project; there is no dependency on PestFlow Pro's DB for the public site or forms. Admin wiring for Path D is self-contained — it reverts the last commit and re-enables the standalone admin panel that already exists in the repo.

---

## Page inventory

- Total distinct routes in standalone: **32** (including blog/:slug, /:slug dynamic fallback, and admin/*)
- Distinct user-facing content pages (non-admin, non-redirect, non-404): **28**

### Routes in standalone not in PestFlow Pro `page_content`:
- `/service-area` → `ServiceArea.tsx`
- `/reviews` → `ReviewsPage.tsx`
- `/blog` + `/blog/:slug` → `BlogPage.tsx`
- `/accessibility` → `AccessibilityPage.tsx`
- `/privacy-policy` → `PrivacyPolicy.tsx`
- `/terms-of-service` → `TermsOfService.tsx`
- `/jacksonville-tx` → `JacksonvilleTX.tsx` (hardcoded location page)
- `/longview-tx` → `LongviewTX.tsx` (hardcoded)
- `/lindale-tx` → `LindaleTX.tsx` (hardcoded)
- `/bullard-tx` → `BullardTX.tsx` (hardcoded)
- `/whitehouse-tx` → `WhitehouseTX.tsx` (hardcoded)
- `/:slug` → `SlugRouter.tsx` (dynamically renders DB location pages: tyler-tx, canton-tx, etc.)

### Pages in PestFlow Pro `page_content` but missing from standalone routes:
- `wasp-control` — PFP has both `wasp-control` and `wasp-hornet-control` as separate page_content rows; standalone only has `/wasp-hornet-control`

### Pages in both: **17**
(home, about, ant-control, bed-bug-control, contact, faq, flea-tick-control, mosquito-control, pest-control, quote, roach-control, rodent-control, scorpion-control, spider-control, termite-control, termite-inspections, wasp-hornet-control)

---

## SEO surface today
- Title source: **per-page via `SEO` component** (`src/components/SEO.tsx:1`) using `react-helmet-async` — every service and utility page passes its own `title` and `description` prop
- Per-page meta_description: **yes** — all pages using `<SEO>` pass explicit `description` prop
- Open Graph tags: **yes** — `og:title`, `og:description`, `og:type`, `og:url` (conditional on canonical) via `SEO.tsx:24-27`; `og:image` is hardcoded in `index.html` to `lovable.dev` placeholder image (needs update)
- Twitter card tags: **yes** — `twitter:card`, `twitter:title`, `twitter:description` via `SEO.tsx:29-31`; `twitter:image` similarly points to `lovable.dev` placeholder in `index.html`
- JSON-LD structured data: **Service + FAQPage on most service pages** — AntControl, MosquitoControl, SpiderControl, RodentControl, TermiteControl, BedBugControl, ScorpionControl, WaspHornetControl, RoachControl, FleaTickControl all have `Service` + `FAQPage` JSON-LD inline (e.g., `src/pages/AntControl.tsx:110-130`); LocationPage has `PestControlService` JSON-LD (`src/pages/LocationPage.tsx:94`); some pages (PestControlPage, ServicePage) have only `Service` schema without FAQPage
- sitemap.xml: **exists at `public/sitemap.xml`** — static snapshot in the repo; also **auto-generated at build time** by `scripts/generate-sitemap.mjs` which queries Supabase for `is_live=true` location pages and writes 7 location entries + all static routes; output points to `dangpestcontrol.com` (correct production domain)
- robots.txt: **exists at `public/robots.txt`** — allows all major crawlers and bots (Googlebot, Bingbot, Twitterbot, facebookexternalhit, *), references sitemap
- AIO-ready (FAQPage / HowTo / BreadcrumbList JSON-LD): **partial** — FAQPage schema on ~10 service pages ✓; `BreadcrumbList` exists as a UI component (`src/components/ui/breadcrumb.tsx`) but is **not** emitted as JSON-LD structured data; HowTo schema: **absent**

---

## Form / lead submission
- Quote form file: `src/pages/QuotePage.tsx:76`
- Contact form file: `src/pages/ContactPage.tsx:34`
- Submission destination (quote): Supabase table `leads` in project `bqavwwqebcsshsdrvczz`, then invokes edge function `notify-new-lead` + conditionally `send-sms-confirmation`

```ts
// src/pages/QuotePage.tsx:76-79
const { error } = await supabase.from("leads").insert(leadData);
if (error) throw error;
supabase.functions.invoke("notify-new-lead", { body: { ...leadData, form_type: 'quote' } }).catch(() => {});
```

- Submission destination (contact): Same `leads` table, same `notify-new-lead` edge function invocation with `form_type: 'contact'`

```ts
// src/pages/ContactPage.tsx:34-41
await supabase.from('leads').insert(leadData);
// ...
supabase.functions.invoke('notify-new-lead', { body: { ...leadData, form_type: 'contact' } }).catch(() => {});
```

- Currently functional? **yes** — writes to the standalone Supabase `leads` table, which was operational before migration. Whether `notify-new-lead` edge function is still deployed and active in `bqavwwqebcsshsdrvczz` is unverified in this read-only audit.

---

## Live deployment health
- `dang-pest-control.vercel.app` HTTP status: **200**
- `dang.pestflowpro.com` HTTP status: **200**
- Visual / structural drift between the two: **significant** — the two deployments are entirely different applications
- Notes:
  - `dang-pest-control.vercel.app` serves the standalone React SPA with Dang branding, proper `<title>Dang Pest Control | Tyler, TX Pest Control Services</title>`, OG tags, preloaded fonts (Bangers + Open Sans), and references `dangpestcontrol.com` image URLs
  - `dang.pestflowpro.com` serves the **PestFlow Pro admin shell** (`x-matched-path: /_admin/index.html`) — `<title>PestFlow Pro</title>`, preloads PFP JS chunks, has the PFP boot script for CSS vars — this is NOT the Dang public site
  - The public Dang site at `dang.pestflowpro.com` is not correctly configured to render the Dang shell (it falls through to the PFP admin index.html); the real live public site for Kirk's customers is `dangpestcontrol.com` (separate domain/deployment)

---

## Build sanity
- `npm run build` exit code: **0**
- Build time: **16.70s**
- Warnings worth flagging:
  - `Browserslist: browsers data (caniuse-lite) is 10 months old` — benign, cosmetic
  - `53 npm audit vulnerabilities (3 low, 13 moderate, 37 high)` — dependency security debt, requires `npm audit fix` pass; no build-breaking issues
- Errors: **clean** — 1816 modules transformed, zero TypeScript or Vite errors

---

## Dynamic content surface
- Holiday banner: **DB-driven** — reads from standalone Supabase `site_config` table, key `holiday_mode` (`src/hooks/useHolidayMode.ts:42-53`); 10 holiday themes defined; toggleable via admin panel
- Reviews / testimonials: **hybrid** — static hardcoded reviews as fallback + live Google reviews fetched from `fetch-google-reviews` edge function in standalone Supabase (`src/pages/ReviewsPage.tsx:68`); static testimonials section also present in some page components
- Service area: **DB-driven** — location pages fetched from `location_data` table in standalone Supabase (`src/pages/LocationPage.tsx:52`); 5 hardcoded TX city pages (JacksonvilleTX, LongviewTX, LindaleTX, BullardTX, WhitehouseTX) plus `SlugRouter.tsx` for DB-driven location slug routing

---

## Git state
- Remote: `https://github.com/ironwoodoperations/dang-pest-control.git`
- Branches:
  - `main` (only branch)
  - `remotes/origin/HEAD -> origin/main`
  - `remotes/origin/main`
- Active branches that look in-progress: **none** — single main branch, last commit is the admin redirect from 2026-04-08

---

## Path D session count breakdown
- **Bucket 1 (SEO/AIO upgrades to standalone): 1–2 sessions**
  - Add BreadcrumbList JSON-LD schema to service and location pages (currently only a UI component, not structured data output)
  - Add HowTo schema to applicable service pages
  - Fix `og:image` and `twitter:image` from `lovable.dev` placeholder to real Dang image
  - Verify/add FAQPage JSON-LD to remaining service pages that lack it (PestControlPage, TermiteInspections, etc.)
  - Add Article JSON-LD to blog post pages
  - These are all additive, no DB changes, low risk

- **Bucket 2 (admin wiring — restore standalone admin): 0.5–1 session**
  - Revert the last commit (`ff2527b`) that added the `AdminRedirect` to PFP — the standalone repo already has a complete admin panel (`src/pages/AdminPage.tsx`, `src/pages/AdminOnboarding.tsx`, `src/components/admin/`) pointing to `bqavwwqebcsshsdrvczz`
  - Re-point `admin.dangpestcontrol.com` DNS back to the standalone Vercel project (was presumably configured before S100)
  - Verify Kirk's admin credentials still work in the standalone Supabase
  - **Data reconciliation required**: any leads, blog posts, testimonials, or location data Kirk has created/edited through PFP's admin since S100 (2026-04-08) lives in `biezzykcgzkrwdgqpsar` and would NOT be in the standalone DB — this data must be manually exported and re-imported to `bqavwwqebcsshsdrvczz` before cutover

- **Bucket 3 (cleanup of Dang from PestFlow Pro): 1–2 sessions**
  - Remove `src/shells/dang/` directory from PFP (custom Dang shell components)
  - Remove Dang tenant row from tenants table (or simply deactivate — careful: this is a paying client row)
  - Remove/archive Dang data from PFP Supabase (`biezzykcgzkrwdgqpsar`): leads migrated from standalone, blog posts, testimonials, location_data
  - Update `dang.pestflowpro.com` Vercel domain binding (remove or redirect)
  - Remove `dang` slug from PFP routing if applicable

- **Total: 3–5 sessions**

---

## Risk inventory

### High risks
- **Data loss / divergence**: Kirk may have used the PFP admin since Apr 8, 2026 to create leads, blog posts, or edit location data. That data is in `biezzykcgzkrwdgqpsar` only. Going Path D without a careful export-import means Kirk permanently loses that data. No automated sync exists.
- **Admin credential validity in standalone Supabase**: Dang's auth user (`admin@dangpestcontrol.com`) exists in `bqavwwqebcsshsdrvczz`. If that project has been idle since Apr 8 and the anon/service-role keys haven't been rotated, credentials should still work — but this is unverified. If the standalone Supabase project has been paused (Supabase pauses inactive free-tier projects after 7 days), it would need to be restored.
- **`notify-new-lead` edge function**: Form submissions call this edge function in `bqavwwqebcsshsdrvczz`. Whether it is still deployed, has valid env vars (email keys, etc.), and is actively delivering email notifications is unverified — Kirk may have received no lead notifications since the standalone site went live.

### Medium risks
- **npm audit: 37 high-severity vulnerabilities**: Need an `npm audit fix` pass before treating this as production-ready. Likely dependency version bumps; may require minor code changes.
- **OG image points to `lovable.dev`**: The `og:image` and `twitter:image` in `index.html` are placeholder URLs from the Lovable.dev builder scaffold. Social media link previews for `dangpestcontrol.com` show a Lovable logo, not Dang branding.
- **`dang-pest-control.vercel.app` vs `dangpestcontrol.com`**: The live customer-facing domain is `dangpestcontrol.com` (Kirk's own domain, presumably CNAME'd to the Vercel project). The Vercel project `dang-pest-control.vercel.app` is the backing deployment. This domain configuration is outside the repo and unverified in this audit.
- **Hardcoded location pages**: JacksonvilleTX, LongviewTX, LindaleTX, BullardTX, WhitehouseTX are hardcoded TSX files. Tyler and Canton are DB-driven via SlugRouter. Any new service areas Kirk adds in the admin panel use SlugRouter, but the 5 hardcoded pages would need manual maintenance if city content changes.

### Low risks
- **Browserslist stale warning**: Cosmetic, run `npx update-browserslist-db@latest` once.
- **`wasp-control` page**: PFP has a separate `wasp-control` page_content entry; standalone only has `wasp-hornet-control`. Minor content gap — combined page in standalone is sufficient.
- **Blog slug routing**: `/blog/:slug` and `/blog` both route to `BlogPage.tsx` which handles both list and single-post views. This is functional but means a direct URL to a blog post slug would only work if the slug is in the DB.

---

## Open questions for Scott
1. **Has Kirk actually used the PFP admin since April 8?** If yes, what actions did he take (new leads, new blog posts, location edits)? This determines how much data reconciliation work Path D requires.
2. **Is the standalone Supabase project `bqavwwqebcsshsdrvczz` currently active or paused?** Supabase pauses free-tier projects after 7 days of inactivity. If it has been paused since Apr 8, leads from `dangpestcontrol.com` contact forms have been failing silently.
3. **Is `notify-new-lead` still configured and delivering email?** Kirk's lead notifications from the live `dangpestcontrol.com` site depend on this edge function. If it stopped working at any point, Kirk may have missed leads.
4. **What is `admin.dangpestcontrol.com` currently pointing to?** Before S100 it presumably pointed to the standalone admin. After the redirect commit, it redirects to PFP. If going Path D, DNS needs to stay pointed at the standalone Vercel project.
5. **Is this a billing decision?** Kirk pays for PFP (Elite tier). If Path D means he exits PFP, does the Stripe subscription get cancelled? Or does he get some hybrid deal (PFP for analytics/reporting, standalone for public site)?
