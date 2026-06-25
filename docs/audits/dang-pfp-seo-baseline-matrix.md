# Dang Pest Control → PestFlow Pro (`dang-pfp`) — FROZEN SEO Baseline / Parity Matrix

**Phase:** 1 (S276) — lock the per-route parity target before any build.
**Status:** 🧊 **FROZEN.** This file is the immutable per-route parity target. The Phase 3 parity diff is run **against this file**. Do not edit rows after this lands except by an explicit, owner-approved re-baseline.
**Source of truth:** `docs/audits/dang-pfp-teardown-baseline.md` (PR #224) §1 + §3, plus read-only `SELECT`s against shared Supabase `biezzykcgzkrwdgqpsar`, tenant `1611b16f-381b-4d4f-ba3a-fbde56ad425b` (`seo_meta`, `blog_posts`) run this session to verify DB titles + meta-description coverage.
**Old host (pre-cutover):** `https://dangpestcontrol.com` · **Target render:** `pestflow-pro` Next.js SSR on the `dang-pfp` tenant path. Routes/slugs are identical 1:1 (see `dang-pfp-301-map.md`).

---

## How to read this matrix

The **left half** (Live post-hydration title / Canonical / Schema / Live status) is the **parity floor** — what Google's WRS currently indexes after JS hydration. The **right half** (SSR target title / canonical / schema / meta-description source) is what the SSR rebuild MUST emit **in the raw server response** (not post-hydration).

### Parity rule (encodes teardown decision #3)

> **Match-or-beat the BEST of (DB `seo_meta` value vs live post-hydration value), per route, with a diff-and-take-better guard so nothing currently ranking regresses.**

Concretely, per route the SSR title is chosen by:
1. Diff DB `seo_meta.meta_title` against the live post-hydration title.
2. Take the **better / longer-tail** of the two (richer keyword coverage wins) — never shorter than what currently ranks.
3. **Strip focus-keyword cruft** from the DB value before use (some DB `meta_title`s carry a trailing `| pest control`, `| mosquito…`, `| red ant contro…`, `| pest control Bullard TX` artifact — see §3 of the teardown).
4. **De-duplicate** the doubled `| Dang Pest Control` suffix (live bug on legal pages + `/flint-tx`).
5. Normalize `City TX` → `City, TX` and ensure the `in` connector is present (fixes `/arp-tx`).

The chosen value is recorded in the **SSR target title** column below. That column is the frozen decision; the rule above is how it was derived and how a future re-baseline must be derived.

### Universal SSR rules (apply to ALL 56 routes)

- **Raw-HTML target (hard requirement):** every SSR field — title, canonical, JSON-LD, meta description — MUST be present in the **RAW server response**, because AI crawlers (GPTBot / PerplexityBot / ClaudeBot) execute no JS and see **zero** structured data / per-page meta on the live site today (teardown §1.1, Appendix A#2). This is the single biggest upgrade and applies even to routes marked "OK" below.
- **Per-page meta description (universal win):** the live site serves the **generic homepage description on 100% of routes** (teardown §1.1). Every SSR route gets a unique description from `seo_meta.meta_description` for the route's DB `page_slug`. Verified this session: all 41 non-blog DB slugs have a non-empty `meta_description` (`has_desc = true`).
- **Self-referencing canonical:** every route emits `<link rel="canonical" href="https://dangpestcontrol.com/<path>">` for its own path. (`SSR canonical` column = `self` to mean exactly this.)
- **Broken-route upgrade:** the 9 routes with live status **BROKEN** (`react-helmet-async` fails to swap → they keep the generic fallback) get a **proper** per-page title + canonical + schema server-side. This is a strict upgrade, not a parity risk.
- **Free-win fixes encoded in the SSR target column:** de-dup doubled suffix (legal + `/flint-tx`); fix `/arp-tx` `in`; strip DB focus-keyword cruft.

### DB read-key note (route ≠ DB slug for 4 routes)

The `seo_meta` table uses slash-less / short keys for some routes. The meta-description (and DB title) source slug differs from the URL path for: `/` → `home`, `/privacy-policy` → `privacy`, `/terms-of-service` → `terms`, `/sms-policy` → `sms-terms`. All other routes read from the matching slug. (Teardown §2.3.)

---

## §A. Core pages (7)

| # | Route | Live post-hydration title | Canonical (live) | Schema type(s) (live) | Live status | SSR target title | SSR canonical | SSR schema | Meta-description source |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `/` | Dang Pest Control - Professional Pest Services \| Dang Pest Control | ✅ `/` | LocalBusiness | OK (doubled suffix) | Dang Pest Control \| Mosquitos, Termites, Fleas, Ants & More | self | LocalBusiness | `seo_meta.meta_description` (slug `home`) |
| 2 | `/about` | *(generic fallback)* | ❌ none | none | **BROKEN** | About Dang Pest Control \| Our Mission & Local Expertise | self | LocalBusiness + AboutPage | `seo_meta.meta_description` (slug `about`) |
| 3 | `/contact` | *(generic fallback)* | ❌ none | none | **BROKEN** | Contact Dang Pest Control \| Tyler & East TX | self | LocalBusiness + ContactPage | `seo_meta.meta_description` (slug `contact`) |
| 4 | `/service-area` | *(generic fallback)* | ❌ none | none | **BROKEN** | Our Service Area \| Dang Pest Control | self | LocalBusiness (areaServed) | `seo_meta.meta_description` (slug `service-area`) |
| 5 | `/reviews` | *(generic fallback)* | ❌ none | none | **BROKEN** | Dang Pest Control Reviews \| Trusted Local Experts | self | LocalBusiness + AggregateRating | `seo_meta.meta_description` (slug `reviews`) |
| 6 | `/blog` | Blog \| Dang Pest Control | ✅ self | Blog (lists 15 posts) | OK | Blog \| Dang Pest Control | self | Blog (enumerate 15 BlogPosting) | `seo_meta.meta_description` ⚠️ no DB `blog` row — fall back to static blog-index description |
| 7 | `/faq` | Frequently Asked Questions \| Dang Pest Control | ✅ self | FAQPage (10 Qs) | OK | Frequently Asked Questions \| Dang Pest Control | self | FAQPage | `seo_meta.meta_description` (slug `faq`) |

**Notes:** Row 1 — DB title chosen (richer than live), trailing `| mosquito…` cruft stripped. Rows 2–5 — broken live, DB wins by default; `about` cruft `| pest control` and `service-area` cruft `| pest control Bullard TX` stripped. Row 6 — no `seo_meta` row keyed `blog`; live title is the parity floor and is retained; description falls back to a static blog-index string (⚠️ flagged). Row 7 — live title kept over DB alt ("Pest Control FAQ | Dang Pest Control") to avoid regressing the currently-ranking title; either satisfies parity.

## §B. Service pages (12 — all OK live)

| # | Route | Live post-hydration title | Canonical (live) | Schema type(s) (live) | Live status | SSR target title | SSR canonical | SSR schema | Meta-description source |
|---|---|---|---|---|---|---|---|---|---|
| 8 | `/pest-control` | Pest Control Services in Tyler, TX \| Dang Pest Control | ✅ self | Service | OK | Local Pest Control Services in Tyler TX & Nearby \| Dang Pest Control | self | Service | `seo_meta.meta_description` (slug `pest-control`) |
| 9 | `/ant-control` | Ant Control in Tyler, TX \| Dang Pest Control | ✅ self | Service + FAQPage | OK | Ant Control Services in Tyler, TX \| Dang Pest Control | self | Service + FAQPage | `seo_meta.meta_description` (slug `ant-control`) |
| 10 | `/termite-control` | Termite Control in Tyler, TX \| Dang Pest Control | ✅ self | Service + FAQPage | OK | Local Termite Control Experts in Tyler TX & Nearby \| Dang Pest Control | self | Service + FAQPage | `seo_meta.meta_description` (slug `termite-control`) |
| 11 | `/termite-inspections` | Termite Inspections in Tyler, TX \| Dang Pest Control | ✅ self | Service (no FAQ) | OK | Local Termite Inspections in Tyler TX \| Dang Pest Control | self | Service | `seo_meta.meta_description` (slug `termite-inspections`) ⚠️ DB desc references "Longview" — verify/fix copy at build |
| 12 | `/spider-control` | Spider Control in Tyler, TX \| Dang Pest Control | ✅ self | Service + FAQPage | OK | Spider Control Services in Tyler TX & Nearby \| Dang Pest Control | self | Service + FAQPage | `seo_meta.meta_description` (slug `spider-control`) |
| 13 | `/wasp-hornet-control` | Wasp & Hornet Control in Tyler, TX \| Dang Pest Control | ✅ self | Service + FAQPage | OK | Expert Wasp & Hornet Control Services in Tyler TX \| Dang Pest Control | self | Service + FAQPage | `seo_meta.meta_description` (slug `wasp-hornet-control`) |
| 14 | `/scorpion-control` | Scorpion Control in Tyler, TX \| Dang Pest Control | ✅ self | Service + FAQPage | OK | Scorpion Control Services in Tyler TX & Nearby \| Dang Pest Control | self | Service + FAQPage | `seo_meta.meta_description` (slug `scorpion-control`) |
| 15 | `/rodent-control` | Rodent Control in Tyler, TX \| Dang Pest Control | ✅ self | Service + FAQPage | OK | Professional Rodent Control Services in Tyler TX & Nearby \| Dang Pest Control | self | Service + FAQPage | `seo_meta.meta_description` (slug `rodent-control`) |
| 16 | `/mosquito-control` | Mosquito Control in Tyler, TX \| Dang Pest Control | ✅ self | Service + FAQPage | OK | Professional Mosquito Treatment & Control in Tyler TX \| Dang Pest Control | self | Service + FAQPage | `seo_meta.meta_description` (slug `mosquito-control`) |
| 17 | `/flea-tick-control` | Flea & Tick Control in Tyler, TX \| Dang Pest Control | ✅ self | Service + FAQPage | OK | Flea & Tick Control Services in Tyler TX & Nearby \| Dang Pest Control | self | Service + FAQPage | `seo_meta.meta_description` (slug `flea-tick-control`) |
| 18 | `/roach-control` | Roach Control in Tyler, TX \| Dang Pest Control | ✅ self | Service + FAQPage | OK | Expert Cockroach Control Services in Tyler TX \| Dang Pest Control | self | Service + FAQPage | `seo_meta.meta_description` (slug `roach-control`) |
| 19 | `/bed-bug-control` | Bed Bug Control in Tyler, TX \| Dang Pest Control | ✅ self | Service + FAQPage | OK | Bed Bug Control Experts in Tyler TX & Nearby \| Dang Pest Control | self | Service + FAQPage | `seo_meta.meta_description` (slug `bed-bug-control`) |

**Notes:** All 12 take the richer DB `meta_title` (longer-tail "… in Tyler TX & Nearby" / "Experts" / "Professional" framing) over the shorter live title — take-better per the parity rule. `ant-control` DB cruft `| red ant contro…` stripped. SSR JSON-LD mirrors the live `Service` / `Service + FAQPage` split exactly (only `pest-control` and `termite-inspections` lack the FAQPage node).

## §C. Location pages (18 — 13 OK, 5 BROKEN)

Working live pattern: `Pest Control in {City}, TX | Dang Pest Control`; schema `PestControlService`; canonical self. The 5 BROKEN routes fall back to generic post-hydration; SSR gives them the proper per-city title + canonical + `PestControlService` (strict upgrade). Every location SSR title is normalized to `City, TX` with the `in` connector.

| # | Route | Live post-hydration title | Canonical (live) | Schema type(s) (live) | Live status | SSR target title | SSR canonical | SSR schema | Meta-description source |
|---|---|---|---|---|---|---|---|---|---|
| 20 | `/kilgore-tx` | Pest Control in Kilgore, TX \| Dang Pest Control | ✅ self | PestControlService | OK | Pest Control in Kilgore, TX \| Dang Pest Control | self | PestControlService | `seo_meta.meta_description` (slug `kilgore-tx`) |
| 21 | `/canton-tx` | Pest Control in Canton, TX \| Dang Pest Control | ✅ self | PestControlService | OK | Pest & Termite Control in Canton, TX \| Dang Pest Control | self | PestControlService | `seo_meta.meta_description` (slug `canton-tx`) |
| 22 | `/henderson-tx` | Pest Control in Henderson, TX \| Dang Pest Control | ✅ self | PestControlService | OK | Pest & Termite Control in Henderson, TX \| Dang Pest Control | self | PestControlService | `seo_meta.meta_description` (slug `henderson-tx`) |
| 23 | `/flint-tx` | Pest Control in Flint, TX \| Dang Pest Control \| Dang Pest Control | ✅ self | PestControlService | OK (doubled suffix) | Pest Control in Flint, TX \| Dang Pest Control | self | PestControlService | `seo_meta.meta_description` (slug `flint-tx`) |
| 24 | `/athens-tx` | Pest Control in Athens, TX \| Dang Pest Control | ✅ self | PestControlService | OK | Pest Control in Athens, TX \| Dang Pest Control | self | PestControlService | `seo_meta.meta_description` (slug `athens-tx`) |
| 25 | `/chapel-hill-tx` | Pest Control in Chapel Hill, TX \| Dang Pest Control | ✅ self | PestControlService | OK | Pest Control in Chapel Hill, TX \| Dang Pest Control | self | PestControlService | `seo_meta.meta_description` (slug `chapel-hill-tx`) |
| 26 | `/gladewater-tx` | Pest Control in Gladewater, TX \| Dang Pest Control | ✅ self | PestControlService | OK | Pest Control in Gladewater, TX \| Dang Pest Control | self | PestControlService | `seo_meta.meta_description` (slug `gladewater-tx`) |
| 27 | `/hideaway-tx` | Pest Control in Hideaway, TX \| Dang Pest Control | ✅ self | PestControlService | OK | Pest Control in Hideaway, TX \| Dang Pest Control | self | PestControlService | `seo_meta.meta_description` (slug `hideaway-tx`) |
| 28 | `/chandler-tx` | Pest Control in Chandler, TX \| Dang Pest Control | ✅ self | PestControlService | OK | Pest Control in Chandler, TX \| Dang Pest Control | self | PestControlService | `seo_meta.meta_description` (slug `chandler-tx`) |
| 29 | `/gilmer-tx` | Pest Control in Gilmer, TX \| Dang Pest Control | ✅ self | PestControlService | OK | Pest Control in Gilmer, TX \| Dang Pest Control | self | PestControlService | `seo_meta.meta_description` (slug `gilmer-tx`) |
| 30 | `/noonday-tx` | Pest Control in Noonday, TX \| Dang Pest Control | ✅ self | PestControlService | OK | Pest Control in Noonday, TX \| Dang Pest Control | self | PestControlService | `seo_meta.meta_description` (slug `noonday-tx`) |
| 31 | `/arp-tx` | Pest Control Arp, TX \| Dang Pest Control | ✅ self | PestControlService | OK (missing "in") | Pest Control in Arp, TX \| Dang Pest Control | self | PestControlService | `seo_meta.meta_description` (slug `arp-tx`) |
| 32 | `/tyler-tx` | Pest Control in Tyler, TX \| Dang Pest Control | ✅ self | PestControlService | OK | Pest & Termite Control in Tyler, TX \| Dang Pest Control | self | PestControlService | `seo_meta.meta_description` (slug `tyler-tx`) |
| 33 | `/bullard-tx` | *(generic fallback)* | ❌ none | none | **BROKEN** | Pest & Termite Control in Bullard, TX \| Dang Pest Control | self | PestControlService | `seo_meta.meta_description` (slug `bullard-tx`) |
| 34 | `/jacksonville-tx` | *(generic fallback)* | ❌ none | none | **BROKEN** | Pest & Termite Control in Jacksonville, TX \| Dang Pest Control | self | PestControlService | `seo_meta.meta_description` (slug `jacksonville-tx`) |
| 35 | `/lindale-tx` | *(generic fallback)* | ❌ none | none | **BROKEN** | Pest & Termite Control in Lindale, TX \| Dang Pest Control | self | PestControlService | `seo_meta.meta_description` (slug `lindale-tx`) |
| 36 | `/whitehouse-tx` | *(generic fallback)* | ❌ none | none | **BROKEN** | Pest & Termite Control in Whitehouse, TX \| Dang Pest Control | self | PestControlService | `seo_meta.meta_description` (slug `whitehouse-tx`) |
| 37 | `/longview-tx` | *(generic fallback)* | ❌ none | none | **BROKEN** | Pest & Termite Control in Longview, TX \| Dang Pest Control | self | PestControlService | `seo_meta.meta_description` (slug `longview-tx`) |

**Notes:** `canton/henderson/tyler` and the 5 broken cities take the richer DB `Pest & Termite Control…` title. `flint-tx` de-dupes the doubled suffix. `arp-tx` gains the `in` connector (DB value). DB titles missing the city comma (`Kilgore TX`, `Flint TX`, `Gladewater TX`, `Noonday TX`) and the reversed `Chapel Hill TX Pest Control` were rejected in favor of the correctly-formatted live form where live was OK.

## §D. Legal pages (4 — all OK live, all have doubled-suffix bug)

Live: title/canonical OK, **no schema**, all four render the doubled `| Dang Pest Control` suffix. SSR de-dupes the suffix and takes the richer DB title (single suffix, adds locality). Schema target: optional `WebPage` node — not required for parity (live emits none), so SSR schema = `WebPage (optional; none required for parity)`.

| # | Route | Live post-hydration title | Canonical (live) | Schema type(s) (live) | Live status | SSR target title | SSR canonical | SSR schema | Meta-description source |
|---|---|---|---|---|---|---|---|---|---|
| 38 | `/privacy-policy` | Privacy Policy \| Dang Pest Control \| Dang Pest Control | ✅ self | none | OK (doubled suffix) | Privacy Policy \| Dang Pest Control Tyler TX | self | WebPage (optional) | `seo_meta.meta_description` (slug `privacy`) |
| 39 | `/terms-of-service` | Terms of Service \| Dang Pest Control \| Dang Pest Control | ✅ self | none | OK (doubled suffix) | Terms of Service \| Dang Pest Control Tyler TX | self | WebPage (optional) | `seo_meta.meta_description` (slug `terms`) |
| 40 | `/sms-policy` | SMS Policy \| Dang Pest Control \| Dang Pest Control | ✅ self | none | OK (doubled suffix) | SMS Text Messaging Policy \| Dang Pest Control Tyler | self | WebPage (optional) | `seo_meta.meta_description` (slug `sms-terms`) |
| 41 | `/accessibility` | Accessibility \| Dang Pest Control \| Dang Pest Control | ✅ self | none | OK (doubled suffix) | Accessibility Statement \| Dang Pest Control | self | WebPage (optional) | `seo_meta.meta_description` (slug `accessibility`) |

## §E. Blog posts (15 live)

Live pattern: `{Post Title} | Dang Pest Control`; canonical self; `Article` schema — all OK (verified on `/blog/why-mosquitoes-are-exploding-in-tyler-tx`, teardown §1.3). Live set = `published_at IS NOT NULL AND archived_at IS NULL` (15 of 23; the 9 draft/orphan rows are out of scope per decision #7 and are NOT in this matrix). Slugs enumerated from a read-only `SELECT` this session. SSR target = same `{Title} | Dang Pest Control` pattern, raw-HTML `Article` schema, self canonical.

| # | Route (`/blog/<slug>`) | Live post-hydration title | Canonical (live) | Schema (live) | Live status | SSR target title | SSR canonical | SSR schema | Meta-description source |
|---|---|---|---|---|---|---|---|---|---|
| 42 | `/blog/wed-rather-pay-you-than-google-dang-pest-control-referral-program` | We'd Rather Pay You Than Google: Dang Pest Control Referral Program \| Dang Pest Control | ✅ self | Article | OK | *(title)* \| Dang Pest Control | self | Article | `seo_meta.meta_description` (per-post slug) ⚠️ fall back to `blog_posts.excerpt` if no row |
| 43 | `/blog/rodents-are-still-a-problem-in-tyler-tx-during-summer` | Rodents Are Still a Problem in Tyler, TX During Summer \| Dang Pest Control | ✅ self | Article | OK | *(title)* \| Dang Pest Control | self | Article | `seo_meta.meta_description` ⚠️ excerpt fallback |
| 44 | `/blog/brown-recluse-black-widow-spiders-east-texas-tyler` | Brown Recluse and Black Widow Spiders in East Texas \| Dang Pest Control | ✅ self | Article | OK | *(title)* \| Dang Pest Control | self | Article | `seo_meta.meta_description` ⚠️ excerpt fallback |
| 45 | `/blog/ant-invasions-east-texas-tyler-homeowners-pest-control` | Ant Invasions in East Texas: Why Tyler Homeowners need pest control \| Dang Pest Control | ✅ self | Article | OK | *(title)* \| Dang Pest Control | self | Article | `seo_meta.meta_description` ⚠️ excerpt fallback |
| 46 | `/blog/why-mosquitoes-are-exploding-in-tyler-tx` | Why Mosquitoes Are Exploding in Tyler, TX Right Now (And What Homeowners Need To Know!) \| Dang Pest Control | ✅ self | Article | OK | *(title)* \| Dang Pest Control | self | Article | `seo_meta.meta_description` ⚠️ excerpt fallback |
| 47 | `/blog/memorial-weekend-bbq-mosquito-control-tyler-tx` | Don't Let Mosquitoes Crash Your Memorial Weekend BBQ in Tyler, TX \| Dang Pest Control | ✅ self | Article | OK | *(title)* \| Dang Pest Control | self | Article | `seo_meta.meta_description` ⚠️ excerpt fallback |
| 48 | `/blog/top-10-pest-problems-homeowners-face-in-tyler-texas` | Top 10 Pest Problems Homeowners Face in Tyler, Texas \| Dang Pest Control | ✅ self | Article | OK | *(title)* \| Dang Pest Control | self | Article | `seo_meta.meta_description` ⚠️ excerpt fallback |
| 49 | `/blog/stop-mosquitoes-at-the-source-eliminate-standing-water` | Stop Mosquitoes at the Source: Eliminate Standing Water \| Dang Pest Control | ✅ self | Article | OK | *(title)* \| Dang Pest Control | self | Article | `seo_meta.meta_description` ⚠️ excerpt fallback |
| 50 | `/blog/stop-rats-and-mice-before-they-take-over-your-home-or-business` | Stop Rats and Mice Before They Take Over Your Home or Business \| Dang Pest Control | ✅ self | Article | OK | *(title)* \| Dang Pest Control | self | Article | `seo_meta.meta_description` ⚠️ excerpt fallback |
| 51 | `/blog/a-fresh-start-begins-with-professional-rodent-control-in-tyler` | A Fresh Start Begins With Professional Rodent Control in Tyler \| Dang Pest Control | ✅ self | Article | OK | *(title)* \| Dang Pest Control | self | Article | `seo_meta.meta_description` ⚠️ excerpt fallback |
| 52 | `/blog/a-seasonal-guide-for-winter-bed-bug-treatments` | A Seasonal Guide For Winter Bed Bug Treatments \| Dang Pest Control | ✅ self | Article | OK | *(title)* \| Dang Pest Control | self | Article | `seo_meta.meta_description` ⚠️ excerpt fallback |
| 53 | `/blog/5-effective-rodent-control-tips-for-a-pest-free-home` | 5 Effective Rodent Control Tips for a Pest-Free Home \| Dang Pest Control | ✅ self | Article | OK | *(title)* \| Dang Pest Control | self | Article | `seo_meta.meta_description` ⚠️ excerpt fallback |
| 54 | `/blog/say-goodbye-to-crickets-with-expert-cricket-control` | Say Goodbye to Crickets with Expert Cricket Control \| Dang Pest Control | ✅ self | Article | OK | *(title)* \| Dang Pest Control | self | Article | `seo_meta.meta_description` ⚠️ excerpt fallback |
| 55 | `/blog/tyler-pest-control-services-that-work` | Tyler Pest Control Services That Work \| Dang Pest Control | ✅ self | Article | OK | *(title)* \| Dang Pest Control | self | Article | `seo_meta.meta_description` ⚠️ excerpt fallback |
| 56 | `/blog/why-are-there-so-many-pests-in-tyler-texas` | Why Are There So Many Pests in Tyler, Texas? \| Dang Pest Control | ✅ self | Article | OK | *(title)* \| Dang Pest Control | self | Article | `seo_meta.meta_description` ⚠️ excerpt fallback |

> **Blog meta-description flag:** per-post `seo_meta` rows were **not** individually verified this session (only the 41 static/service/location/legal slugs were). The SSR build must read `seo_meta.meta_description` keyed by post slug and fall back to `blog_posts.excerpt` where no row exists. These cells are flagged `⚠️` accordingly.

---

## Row count check

| Section | Rows |
|---|---|
| §A Core | 7 |
| §B Service | 12 |
| §C Location | 18 |
| §D Legal | 4 |
| §E Blog | 15 |
| **Total** | **56** ✅ |

---

## Cells flagged (could not fully verify this session)

1. **`/blog` description** (row 6): no `seo_meta` row keyed `blog`; SSR falls back to a static blog-index description. Title/schema verified.
2. **All 15 blog post descriptions** (rows 42–56): per-post `seo_meta` rows not individually queried; read `seo_meta.meta_description` by post slug at build, fall back to `blog_posts.excerpt`.
3. **`/termite-inspections` DB description** (row 11): DB `meta_description` references "Longview" (likely a copy-paste artifact from `longview-tx`); verify/fix at build. Title unaffected.

All other cells verified against teardown §1/§3 + this session's read-only `seo_meta` / `blog_posts` SELECTs. **No DB writes were performed.**

---

🧊 **FROZEN — Phase 3 parity diff runs against this file. Do not edit rows post-merge without an owner-approved re-baseline.**
