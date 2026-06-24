# Dang Pest Control → PestFlow Pro (`dang-pfp`) — Teardown & Migration-Start Baseline

**Phase:** 0/1 (idle-capacity rehearsal + parity-baseline capture)
**Date:** 2026-06-24
**Status:** Torn down, baselined, documented. **Decisions LOCKED (§0.1). NO build, NO provision, NO cutover, NO DB writes.**
**Source of truth:** live `dangpestcontrol.com` (raw HTML + post-hydration render) + shared PFP Supabase `biezzykcgzkrwdgqpsar`, tenant `1611b16f-381b-4d4f-ba3a-fbde56ad425b`.

> This doc is scoped to a **full custom comic shell registered INSIDE `pestflow-pro`'s existing multi-tenant shell system** (NOT a separate repo) per the locked decisions, while retaining the full design/content/SEO detail. Dang is already a tenant in `pestflow-pro` (scoped by `tenant_id`); this migration replaces only the **public rendering layer** — retiring the standalone Vite repo (`ironwoodoperations/dang-pest-control` → dangpestcontrol.com) and serving Dang's public site from the same Next.js app that serves every other tenant subdomain. The live Vite site stays untouched and serving traffic on its own repo until parity is proven and cutover is separately approved.

---

## 0.1 LOCKED DECISIONS (owner sign-off 2026-06-24)

1. **Shell:** ✅ **Full custom comic shell, registered INSIDE `pestflow-pro`'s existing multi-tenant shell system** (`src/shells/`, alongside `bold-local` and `modern-pro`), selected by the same `template`/theme mechanism. **NOT a separate repo.** Reproduce the live comic site identically — same site, served via the standard Next.js tenant path instead of the standalone Vite repo. The comic shell becomes a reusable third shell for any future high-design tenant. Rationale: keeping Dang in its own repo would defeat the purpose of the migration — the whole point is to fold Dang into the SaaS tenant rendering structure so dashboard edits become real and Dang stops being a maintenance island.
2. **Read path:** ✅ **Reuse the existing DANG tables directly** as the SSR read source. No re-normalize, no re-doing env vars/secrets. Condition: must stay low-risk and never touch the live site (satisfied — the build is a new shell + new tenant routing in `pestflow-pro` that only *reads* the shared DB; the live Vite site is a different repo and is never written to or deployed).
3. **SEO render source:** ✅ **Approved** — render `seo_meta` server-side with a per-route diff-and-take-better guard vs live post-hydration titles. Must not touch the live site (satisfied — the SSR work lives in `pestflow-pro`'s Next.js app and serves a `dang-pfp` preview path; the live `dangpestcontrol.com` Vite deploy is untouched until cutover).
4. **Path strategy:** ✅ **Keep like-for-like slugs** on `dang-pfp` (slugs carried over from the prior web vendor). **Map the full 1:1 301 set FIRST**, redirect every page, then expand later. Near-empty diff.
5. **Geo / address:** ✅ **Use `816 Riding Road, Tyler, TX 75703`** (owner's physical/home address) as the **canonical geo + schema address**. ⚠️ **NEVER render the street address in any customer-facing copy** — schema/structured-data only (the Google-can-see-it / public-cannot pattern for a home-based SAB). Reconcile the 3 conflicting coordinate sets to this address at build.
6. **Brand color:** ✅ **`#F26B0F`** (live hardcoded value) is canonical brand. DB `branding.primary_color = #F97316` is shadowed/ignored — do not use. Reproduce the live site identically; all image/media assets already in the DB/storage.
7. **Draft `seo_meta`/blog rows (9, no live URL):** ✅ **Leave the live content set exactly as-is** — whatever is currently live stays; whatever isn't, stays out. Claire owns blog publish state; do not publish or remove anything as part of the migration.
8. **Orphan `wasp-control` `page_content` row:** ✅ **Defer — record as a build-phase cleanup chore, do NOT delete now** (deletion is a live-DB write; out of scope this phase). Live route uses `wasp-hornet-control`.

---

## 0. Prereq check (egress)

✅ **Egress to `dangpestcontrol.com` is OPEN** — verified `HTTP 200` direct fetch this session. No Firecrawl allowlist update was needed for this teardown (used direct `curl` + headless Chromium render rather than the Firecrawl path). **Note for the build phase:** if the rebuild pipeline routes scraping through Firecrawl, the domain egress allowlist must still be confirmed to include `dangpestcontrol.com` before that step — it was not exercised here.

---

## 1. SEO BASELINE PER ROUTE — the parity target (match-or-beat)

### 1.1 The load-bearing finding (more precise than prior notes)

The earlier handoffs say "generic meta on every route." **That is only true of the raw HTML.** The full picture, verified this session:

- **Raw initial HTML** (what non-JS AI crawlers — GPTBot, PerplexityBot, ClaudeBot — see): **identical generic shell on EVERY route.** Same `<title>` ("Dang Pest Control | Tyler, TX Pest Control Services"), same description, **no canonical, zero structured data.** Confirmed across 15 routes.
- **Post-hydration** (what Google's WRS sees after JS execution): **`react-helmet-async` swaps per-page title + canonical + JSON-LD on MOST routes — but NOT all.** A subset of routes silently fail to swap and keep the generic fallback.

**So the true baseline is uneven and partly broken.** The SSR rebuild's job is **match-or-beat the BEST of what each route shows today** — and for the broken routes, SSR is a strict upgrade by default. This is the "so much more room to grow" headroom: even the working routes are invisible to AI crawlers because nothing is in raw HTML.

**The meta description never changes on any route** (always the generic homepage description) — even where title/canonical/schema swap correctly. Universal easy win for the rebuild.

### 1.2 Crawler-visibility matrix

| Layer | Title | Canonical | Structured data | Meta description |
|---|---|---|---|---|
| Raw HTML (AI crawlers, no-JS) | Generic, all routes | None | None | Generic |
| Post-hydration (Google WRS) | Per-page on most routes; generic on broken subset | Present on most; absent on broken subset | Present on most; absent on broken subset | **Generic everywhere** |

### 1.3 Per-route baseline (post-hydration = the parity floor Google currently indexes)

**Core pages**

| Route | Post-hydration title | Canonical | Schema | Status |
|---|---|---|---|---|
| `/` | Dang Pest Control - Professional Pest Services \| Dang Pest Control | ✅ `/` | LocalBusiness | OK (note doubled "\| Dang Pest Control" suffix) |
| `/about` | *generic* | ❌ none | none | **BROKEN — helmet doesn't swap** |
| `/contact` | *generic* | ❌ none | none | **BROKEN — helmet doesn't swap** |
| `/service-area` | *generic* | ❌ none | none | **BROKEN — helmet doesn't swap** |
| `/reviews` | *generic* | ❌ none | none | **BROKEN — helmet doesn't swap** |
| `/blog` | Blog \| Dang Pest Control | ✅ | Blog (lists 15 posts) | OK |
| `/faq` | Frequently Asked Questions \| Dang Pest Control | ✅ | FAQPage (10 Qs) | OK |

**Service pages** (all 12 — all OK, all canonical present)

| Route | Title | Schema |
|---|---|---|
| `/pest-control` | Pest Control Services in Tyler, TX \| Dang Pest Control | Service |
| `/ant-control` | Ant Control in Tyler, TX \| Dang Pest Control | Service + FAQPage |
| `/termite-control` | Termite Control in Tyler, TX \| Dang Pest Control | Service + FAQPage |
| `/termite-inspections` | Termite Inspections in Tyler, TX \| Dang Pest Control | Service (no FAQ) |
| `/spider-control` | Spider Control in Tyler, TX \| Dang Pest Control | Service + FAQPage |
| `/wasp-hornet-control` | Wasp & Hornet Control in Tyler, TX \| Dang Pest Control | Service + FAQPage |
| `/scorpion-control` | Scorpion Control in Tyler, TX \| Dang Pest Control | Service + FAQPage |
| `/rodent-control` | Rodent Control in Tyler, TX \| Dang Pest Control | Service + FAQPage |
| `/mosquito-control` | Mosquito Control in Tyler, TX \| Dang Pest Control | Service + FAQPage |
| `/flea-tick-control` | Flea & Tick Control in Tyler, TX \| Dang Pest Control | Service + FAQPage |
| `/roach-control` | Roach Control in Tyler, TX \| Dang Pest Control | Service + FAQPage |
| `/bed-bug-control` | Bed Bug Control in Tyler, TX \| Dang Pest Control | Service + FAQPage |

**Location pages** (18 — **INCONSISTENT; 5 are broken**). Working pattern: `Pest Control in {City}, TX | Dang Pest Control`; schema `PestControlService`.

| Route | Status |
|---|---|
| `/kilgore-tx`, `/canton-tx`, `/henderson-tx`, `/flint-tx`, `/athens-tx`, `/chapel-hill-tx`, `/gladewater-tx`, `/hideaway-tx`, `/chandler-tx`, `/gilmer-tx`, `/noonday-tx`, `/arp-tx`, `/tyler-tx` | ✅ OK (custom title + canonical + PestControlService) |
| `/bullard-tx` | ❌ **BROKEN** (generic, no canonical, no schema) |
| `/jacksonville-tx` | ❌ **BROKEN** |
| `/lindale-tx` | ❌ **BROKEN** |
| `/whitehouse-tx` | ❌ **BROKEN** |
| `/longview-tx` | ❌ **BROKEN** |

> **Quirks to fix in rebuild (free SEO wins):** (a) **doubled title suffix** — `/flint-tx` and all legal pages render `… | Dang Pest Control | Dang Pest Control`; (b) `/arp-tx` title is `Pest Control Arp, TX` (missing "in"), inconsistent with siblings.

**Blog posts** (15 live): pattern `{Post Title} | Dang Pest Control`, canonical present, `Article` schema. Verified on `/blog/why-mosquitoes-are-exploding-in-tyler-tx`. The `/blog` index also emits a `Blog` schema enumerating all 15 `BlogPosting` entries.

**Legal pages** (all OK title/canonical, no schema, **all have doubled suffix bug**): `/privacy-policy`, `/terms-of-service`, `/sms-policy`, `/accessibility`.

### 1.4 Parity rule for Phase 3 (per decision #3)

For each route, the SSR target must **emit, server-side (in raw HTML, not post-hydration):** the post-hydration title above (de-duplicated suffix), a self-referencing canonical, and the same JSON-LD type(s). For the **BROKEN** routes (about, contact, service-area, reviews, bullard, jacksonville, lindale, whitehouse, longview), emit a *proper* per-page title/canonical/schema — this is the upgrade. **All routes** additionally get a per-page meta description (currently generic everywhere) from `seo_meta.meta_description` (§3). **Guard:** per-route, diff DB `seo_meta` title vs live post-hydration title and take the better/longer-tail of the two so nothing currently ranking regresses.

---

## 2. FULL URL INVENTORY + 301 MAP (decision #4: keep slugs, map first)

**56 URLs in `sitemap.xml`** (7 core + 12 service + 18 location + 4 legal + 15 blog). `robots.txt` allows all except `/admin`, `/admin/`, `/api/`; references the sitemap.

### 2.1 Existing redirect (preserve)
- `/quote` → `/contact` (client-side; confirmed). Nav "Get Your Quote" button targets `/quote`, so this is live-traffic-bearing — **carry forward as a 301**.

### 2.2 301 map (decision #4 — like-for-like, full 1:1 first)
**Rule: every live path keeps its exact slug on `dang-pfp`.** Map all 56 sitemap URLs 1:1 (old `https://dangpestcontrol.com/<path>` → new `dang-pfp` `/<path>`) at cutover. Explicit non-identity entries:

| Old | New | Reason |
|---|---|---|
| `/quote` | `/contact` | Preserve existing redirect |
| `http://` + non-canonical host variants | `https://dangpestcontrol.com/<path>` | Force canonical scheme/host |
| trailing-slash variants (if any) | non-slash canonical | Normalize |

**No path renames** — slugs were inherited from the prior web vendor and are ranking; preserving them = zero equity risk. Expansion (new pages) happens after parity is proven, not during.

### 2.3 DB-vs-live slug mismatches (internal keys — keep OUT of the 301 map)
The **database** uses slash-less / sometimes different slugs than the **live URL**. These are read-path keys, not routes. Mapping for the SSR read layer:

| Live URL | `page_content` / `seo_meta` slug | Note |
|---|---|---|
| `/` | `home` | |
| `/privacy-policy` | `privacy` | |
| `/terms-of-service` | `terms` | |
| `/sms-policy` | `sms-terms` | |
| `/wasp-hornet-control` | `wasp-hornet-control` (live) **and** `wasp-control` (orphan) | Live reads `-hornet-`; `wasp-control` is orphan → cleanup chore (decision #8). |
| `/contact` | `contact` (+ `quote` row exists) | |

> ⚠️ The **leading-slash key mismatch** flagged in S274 (`seo:/x` written vs `seo:x` read) is a *standalone Vite key-store* artifact. The **`seo_meta` table** uses clean slash-less `page_slug` values — that's the correct read source for the rebuild. Don't replicate the slash bug.

---

## 3. SEO CONTENT IN THE DATABASE (the real per-page SEO source — decision #3)

`seo_meta` has **66 rows** for Dang. Columns: `page_slug, meta_title, meta_description, og_title, og_description, focus_keyword, user_edited`.

**Authoritative per-page SEO to render server-side.** DB titles/descriptions are richer than the hardcoded live build (e.g., DB `home` title = "Dang Pest Control | Mosquitos, Termites, Fleas, Ants & More"; DB descriptions are unique per page, unlike the generic live one). Rendering `seo_meta` server-side hits parity AND fixes the universal generic-description defect.

**Parity guard (per decision #3):** some DB `meta_title` values have artifacts (e.g. `about` = "...| pest control", `service-area` = "...| pest control Bullard TX" — trailing focus-keyword cruft; some >60 chars). Before cutover, **diff DB title vs live post-hydration title per route and take the better** so we never regress a currently-ranking title. §1.3 is the live side of that diff.

**Draft/orphan `seo_meta` rows (no live URL):** per **decision #7**, leave the live content set as-is — these are **out of parity/migration scope**, neither published nor removed. (Listed for awareness only: `5-signs-you-have-a-termite-problem`, `carpenter-bees-tyler-tx`, `black-widows-dangerous-east-texas-families-protect-home`, `bug-outbreaks-in-tylers-75703-zip-code-whats-causing-the-surge`, `how-to-keep-ants-out-of-your-kitchen-this-summer`, `pest-control-bullard-flint-whitehouse-tx`, `the-dangers-of-diy-pest-control`, `what-to-expect-from-your-first-pest-inspection`, `why-fall-is-prime-season-for-rodent-invasions`.) Claire owns blog publish state.

---

## 4. DESIGN / SHELL — full custom build spec (decision #1, #6)

### 4.1 Identity
**Custom comic-book brand ("DANG!" superhero theme).** Reproduce **identically** as a new shell `src/shells/dang/` (working name) registered alongside `bold-local` and `modern-pro`, selected via the same `template`/theme mechanism the other shells use. NOT expressible in the two stock shells — this is a genuine third shell, not a fork. DB `branding.theme = "modern-pro"` is ignored by the current live build and is wrong for the target — the rebuild selects the comic shell explicitly (set `branding.theme` to the new shell key as a build-phase chore). Do not trust the existing `branding.theme` value.

### 4.2 Design tokens (from compiled CSS — authoritative live values)

**Fonts**
- Display: **`Bangers, cursive`** (the comic-book brand font). `--font-display`.
- Body: **`Open Sans, sans-serif`**. `--font-body`.
- Google Fonts: `family=Bangers&family=Open+Sans:wght@400;600;700`.

**Color palette** (HSL as authored; hex):
| Token | HSL | Hex | Role |
|---|---|---|---|
| `--primary` | `28 100% 50%` | **`#F26B0F`** ✅ canonical (decision #6) | Brand orange (hero, primary CTA) |
| `--secondary` / `--yellow-cta` | `48 100% 50%` | yellow | Yellow CTA |
| `--accent` / `--cyan-accent` | `185 100% 45%` | cyan | Accent pops |
| `--orange-dark` | `20 100% 40%` | dark orange | gradients |
| `--orange-light` | `33 100% 55%` | light orange | gradients |
| `--brown-dark` | `22 45% 14%` | `#2b1b12`-ish | dark text/surfaces |
| `--foreground` | `20 40% 12%` | near-black brown | body text |
| `--radius` | `.75rem` | — | corner rounding |

> DB `branding.primary_color = #F97316` / `accent_color = #06B6D4` are **shadowed/ignored** — do not use. Live `#F26B0F` + cyan are canonical.

**Comic treatment:** `.text-comic` utility = signature class (Bangers + `uppercase` + `italic` on many instances) on eyebrows, service-card titles, headings. Tailwind-based build. Capture halftone/burst/superhero imagery as **assets** (§4.4).

### 4.3 Page structure (homepage — 10 `<section>`s)
1. **Hero** — H1 `SUPER POWERED PEST CONTROL` + intro ("hands-on, personable, relationship-based… Tyler community… Super Powered Guarantee"). Preloaded hero `dang-pest-homepage-img-1.webp`.
2. **`SUPER HERO RESPONSE TEAM!`** + `CERTIFIED EXPERT` badge.
3. **`EXPERT PEST CONTROL & MANAGEMENT SERVICES AROUND TYLER, TX`**.
4. **`OUR PEST CONTROL SERVICES`** — 12 service cards: General Pest, Termite Control & Inspections, Ant, Spider, Wasp & Hornet, Scorpion, Rodent, Mosquito, Flea & Tick, Roach, Bed Bug.
5. **`WHY CHOOSE DANG PEST CONTROL?`** — trust blocks: `PROFESSIONAL, LICENSED & HIGHLY TRAINED TECHNICIANS`, `FAMILY & PET FRIENDLY`, `HOW TO GET FREE PEST SERVICE!`, `CUSTOM PLANS FOR LASTING RESULTS`, `SUPER POWERED GUARANTEE`.
6. **`Pest Extermination & More near Tyler, TX`** — local SEO copy.
7. **`WHAT OUR CUSTOMERS SAY`** — testimonials carousel.
8. **`GET YOUR QUOTE TODAY`** — CTA → `/quote`.
9. Service/About footer-nav blocks.
10. **Footer** (§4.5).

**Page-type templates:** Home; Service (×12, hero H1 = `{SERVICE} CONTROL` uppercase); Location (×18, hero H1 = `PEST CONTROL SERVICES IN {CITY}, TX`); About (`ABOUT US`); Contact (`CONTACT US`); Reviews (`CUSTOMER REVIEWS`); FAQ (`FREQUENTLY ASKED QUESTIONS`); Blog index (`Blog`) + Blog post (sentence-case H1); 4 legal pages.

### 4.4 Header / Nav / CTAs
- **Nav:** Pests (→ `/pest-control`), Mosquitos (→ `/mosquito-control`), Termites (→ `/termite-control`), About, **Call us (903) 871-0550** (`tel:9038710550`), **Get Your Quote** (→ `/quote`).
- **CTAs:** "Get Your Quote" (→ `/quote`→`/contact`), "Contact Us", click-to-call. `branding.cta_text` = "Get Your Quote".

### 4.5 Footer
Columns: **Services** (Pest Control, Mosquitos, Termites, Get Your Quote, Contact Us) · brand blurb ("we know pest problems can seriously disrupt your life…") · **About** (About Us, FAQs, Blog, Service Area, Customer Reviews) · legal row (Privacy Policy · Terms of Service · SMS Policy · Accessibility) · `© 2026 Dang Pest Control`. **No street address in footer** (decision #5).

### 4.6 Assets (reuse as-is — decision #6: all media already in DB/storage)
- Storage: `tenant-assets/1611b16f-381b-4d4f-ba3a-fbde56ad425b/site-media/` (hero/page imagery) + `/blog/` (post images). **13 `image_library` rows.**
- Logo: `logos/1611b16f-381b-4d4f-ba3a-fbde56ad425b/logo.webp` (DB) — live LD references `logos/dang/logo.webp`; reconcile at build (cleanup chore).
- Favicons + `site.webmanifest` at root. **No re-upload needed.**

---

## 5. CONTENT INVENTORY (read from existing DANG tables — decision #2)

Shared Supabase `biezzykcgzkrwdgqpsar`, scoped by `tenant_id`:

| Content | Table | Rows (Dang) | Notes |
|---|---|---|---|
| Page copy | `page_content` | 22 | `hero_headline, subtitle, intro, page_hero_image_url, image_1/2/3_url, video_url`. |
| SEO meta | `seo_meta` | 66 | §3. |
| Locations (sitemap + location pages) | `location_data` | 18 | `city, slug, hero_title, intro, meta_*, focus_keyword, is_live`. **Sitemap source.** |
| Service areas (mirror) | `service_areas` | 18 | Same 18 slugs; adds `place_id, state`. |
| Blog posts | `blog_posts` | 23 total / **15 live** | live = `published_at NOT NULL AND archived_at IS NULL`. `title, slug, content, excerpt, featured_image_url, intro_image`. |
| FAQs | `faqs` | 55 | FAQPage schema + /faq + per-service FAQ blocks. |
| Testimonials | `testimonials` | 55 (**3 featured**) | `author_name, review_text, rating, featured, source, google_review_id`. 49 from Outscraper (sync 2026-06-12). |
| Team | `team_members` | 2 | Kirk Slack (Owner); Claire (Social Media Director). |
| Images | `image_library` | 13 | media refs. |
| Leads (proof integration works) | `leads` | 26 | live lead capture confirmed. |

**Contact facts (canonical — from `business_info`):**
- Name: Dang Pest Control · Phone: **(903) 871-0550** · Email: info@dangpestcontrol.com
- **Canonical geo + schema address (decision #5): `816 Riding Road, Tyler, TX 75703`** — ⚠️ **schema/structured-data ONLY; NEVER in customer-facing page copy, footer, or contact page.** (Home-based SAB: Google sees it for ranking; public does not.)
- `America/Chicago` · Founded 2018.
- ⚠️ Coordinate reconciliation (cleanup chore): three conflicting pairs exist — `business_info` (32.2692 / -95.2603), `google_business` (32.246042 / -95.2952175), live homepage LD (32.3513 / -95.3011). Standardize to the geocode of **816 Riding Road** at build.
- Aggregate rating (schema): **4.9 / 63** (`schema_config`), service radius 50 mi.
- Geo targets in copy: Tyler, Longview, Jacksonville, Lindale, Bullard, Whitehouse (+ all 18 location slugs).
- Trust signals: NPMA + TPCA membership, IPM approach, "Super Powered Guarantee", licensed (TX Dept of Agriculture).

**Contact form fields (reproduce for parity):** First Name*, Last Name*, Phone*, Email*, Address*, City*, State*, Zip Code*, "What can we help you with today?"* (textarea), **2 consent checkboxes** (carry verbatim — TCPA/SMS compliance):
- *Transactional:* "By checking this box, I consent to receive transactional messages related to Dang Pest Control for my account, orders, or services I have requested… Message frequency may vary. Message & Data rates may apply…"
- *Marketing:* "By checking this box, I consent to receive marketing and promotional messages from Dang Pest Control… Reply HELP for help or STOP to opt-out."
- Submit label: "SEND MESSAGE →".

> Note: the form collects the *customer's* address — unrelated to the business address in §5/decision #5.

---

## 6. INTEGRATIONS IN USE (carry all forward)

| Integration | Detail (`settings.integrations` / `voice_receptionist`) |
|---|---|
| **Lead capture** | Form → `supabase.functions.invoke('api-quote')` (endpoint built dynamically) → `leads` → `trigger_notify_new_lead` (vault service-role JWT at call time; SMS + email owner alert). **26 leads = working.** |
| **CRM / reporting** | Admin dashboard on shared DB (functional today). |
| **GA4** | `G-5NZFW0ZLMZ` (hardcoded in live `<head>`; `integrations.ga4_measurement_id`). Property `538323163`. |
| **Google Search Console** | `sc-domain:dangpestcontrol.com` (domain property; DNS-verified, no HTML meta). Confirm `settings.google_search_console_verification` carries (cleanup chore). |
| **Google Business / KG** | CID `2532764802735636690`, FID `0xade06cf8830e929b:0x2326302b3eab80d2`, KG MID `/g/11xfjmbrjj`. |
| **Reviews (Outscraper)** | 49 reviews → `testimonials`. Last sync 2026-06-12. |
| **Remi (VAPI voice)** | enabled; assistant `e409a0d9-2ed9-4240-afd7-bc2a6ff3381f`, phone-number `dc7f5871-7524-4499-aac1-81bfb2e9a600`, transfer `+19038710550`, 12s owner first-ring. (Warm transfer still VAPI-dashboard-side — not a rebuild item.) |
| **Zernio (social)** | profile `69dd26eaa42cd3ddf3fa8802`; FB `69f5e5ba…`, IG `69f5e6cf…`, YouTube `69f5e652…`, GBP `69f5e693…`. |
| **Social links** | FB, IG, YouTube, LinkedIn, Google — `social_links`; footer + `sameAs`. |
| **Dead — do NOT carry** | `ayrshare_api_key` (empty), `bundle_social_team_id`, bundle.social — removed from stack. |

---

## 7. SITEMAP (preserve structure)
- Built at deploy from `location_data` (+ static pages + published blog). **18 location slugs in `location_data` ↔ 18 sitemap ↔ 18 `service_areas`** — aligned.
- Preserve: home `1.0 / weekly`; services `0.8–0.9 / monthly`; locations `0.7 / monthly`; blog index `0.7 / weekly` + 15 posts; core `0.6–0.7`; legal `0.3 / yearly`.
- Rebuild generates sitemap **server-side** from `location_data` + published `blog_posts` + static routes, emitted in the raw response.
- `robots.txt`: keep `Disallow: /admin*`, `/api/`; keep `Sitemap:` line.

---

## 8. PROJECT PLAN — moving forward

- **Phase 0 (now, idle window):** ✅ Teardown + baseline (this doc). Read-only, live site untouched. Decisions §0.1 locked.
- **Phase 1 — baseline + 301 map:**
  - Lock the §1 per-route SEO matrix as the parity target.
  - Build the full 1:1 301 map from the 56 sitemap URLs → identical `dang-pfp` slugs (preserve `/quote → /contact`).
- **Phase 2 — build the full custom shell INSIDE `pestflow-pro` (live Vite site untouched throughout):**
  - Register a new comic shell `src/shells/dang/` alongside `bold-local`/`modern-pro`, selected by the existing `template`/theme mechanism. Served through the standard Next.js tenant subdomain path — no new repo.
  - Wire it to read the existing DANG tables (`seo_meta`, `page_content`, `location_data`, `blog_posts`, `faqs`, `testimonials`, `team_members`, `image_library`) via the same tenant-scoped read path other shells use.
  - Reuse all storage assets as-is.
  - Reproduce identically: Bangers/Open Sans, `#F26B0F` palette, `.text-comic` treatment, 4 hero templates, 12 service cards, superhero trust section, footer, contact form + both consent strings.
  - Carry integrations: api-quote lead path, GA4, GSC domain property, Remi/VAPI, Zernio, Outscraper, social. Drop dead bundle.social/ayrshare.
  - Render SEO server-side from `seo_meta` with diff-and-take-better guard; fix the 9 broken routes + generic-description defect + doubled-suffix/`arp-tx` quirks.
  - Address in schema only (816 Riding Road) — never customer-facing.
  - Generate sitemap + robots server-side.
  - ⚠️ Touches shared rendering code in a manual-merge production repo — validator gate + merge discipline apply.
- **Phase 3 — prove parity-or-better (GATED):** Per-route raw-HTML SEO diff vs §1 baseline; confirm match-or-beat on every route before any DNS discussion.
- **Phase 4 — cutover (separate go/no-go, later):** DNS/301 flip with rankings monitoring + rollback; Vite site stays deployable throughout. Map all 301s first, then expand.
- **Build-phase cleanup chores (deferred, not this phase):**
  - Set `branding.theme` to the new comic shell key once the shell is registered (current value `modern-pro` is wrong for the target).
  - Delete orphan `wasp-control` `page_content` row (decision #8).
  - Reconcile logo path (`logos/dang/` vs `logos/{tenant}/`).
  - Standardize geo coordinates to the 816 Riding Road geocode (3 conflicting sets).
  - Confirm GSC verification carries to the new deploy.
- **Governance:** all repo writes via CC Web propose-and-wait; `pestflow-pro` is **manual-merge (paying customer in production)** — you review and merge every PR. Any caching/SEO/auth/shell-rendering change goes through the validator gate (Perplexity + Gemini, conservative-wins). Because the comic shell touches shared rendering code, merge discipline matters more than it would in an isolated repo — but that's a process cost, not a reason to split it out.

---

## 9. EXPLICIT NON-GOALS (this phase) — confirmed not done
- ❌ No provisioning into Ironwood admin.
- ❌ No shell built.
- ❌ No DNS / no 301s implemented.
- ❌ No cutover.
- ❌ No writes to any DB table (read-only; no test leads submitted; orphan row NOT deleted).
- ❌ Live Vite site untouched and serving traffic.

---

### Appendix A — defects in current live SEO (all become free upgrades in SSR rebuild)
1. Generic meta description on 100% of routes (DB has unique ones).
2. Zero SEO in raw HTML → invisible to AI crawlers (GPTBot/Perplexity/ClaudeBot) entirely.
3. 9 routes' title/canonical/schema fail to swap even post-hydration: about, contact, service-area, reviews, bullard-tx, jacksonville-tx, lindale-tx, whitehouse-tx, longview-tx.
4. Doubled title suffix on legal pages + flint-tx.
5. `/arp-tx` title missing "in".
6. DB `branding.theme`, `branding.primary_color` ignored by live build (shadowed).
