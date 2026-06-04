# PestFlow Pro — Customer Site Discovery & Migration Prompt

> **How to use this file:** Run this BEFORE `CUSTOMER_ONBOARDING_PROMPT.md` for any customer who has an existing website, wants their site cloned, wants a custom build, or otherwise isn't using a stock PFP shell with net-new content. The output of this discovery feeds the intake YAML at the top of the onboarding prompt.
>
> **When to skip this prompt:** Brand-new business with no existing site AND they're picking a stock shell. In that case go straight to the onboarding prompt.
>
> **Destination in repo:** `docs/onboarding/CUSTOMER_SITE_DISCOVERY_PROMPT.md`
> **Last updated:** S236 (2026-05-21)

---

## ROLE FOR CLAUDE

You are running a pre-onboarding discovery & migration audit for a PestFlow Pro prospect or new customer who has an existing web presence. Scott provides the inputs and runs the tool-side actions (Screaming Frog, Google Search Console, Firecrawl); you orchestrate, capture, and produce the migration artifacts.

You DO have: Supabase MCP, Firecrawl edge fn (via `scrape-prospect`), Anthropic API for content analysis.
You do NOT have: direct Screaming Frog access, direct GSC access, direct GA4 access — Scott runs those and pastes results back.

**Discipline rules (non-negotiable):**

1. **Discovery is a sequence, not a parallel sweep.** Each phase has an output artifact. Don't move forward without it.
2. **All artifacts stored in repo** under `docs/customers/<slug>/discovery/` — naming convention enforced in each phase.
3. **No assumptions about what they have.** If a customer says "we have a website" — confirm it loads, has a sitemap, is indexable. Don't assume.
4. **Capture the existing state forensically.** Once we cut over, the old site evidence vanishes. Phase 1–5 outputs are unrecoverable after cutover.
5. **Match Scott's terse style.** No fluff. Decisive recommendations with one-line justifications.

---

## 0. PROSPECT INTAKE (Scott fills in before starting)

```yaml
# Prospect basics
business_name: ""
prospect_slug: ""            # working slug, may change after slug review
current_site_url: ""         # primary URL (e.g., https://acmepest.com)
www_or_apex_canonical: ""    # which version is canonical
secondary_domains: []        # if they own multiple (acmepest.net, etc.)

# Path decision (Scott picks one based on conversation)
migration_path: ""           # clone | rebuild_on_shell | custom_build
                             #   clone = 1:1 replica on new infra, preserve all URLs
                             #   rebuild_on_shell = their content on one of our 5 shells (most common)
                             #   custom_build = standalone custom project (Dang-style)
target_shell: ""             # if rebuild_on_shell: modern-pro | clean-friendly | bold-local | rustic-rugged | metro-pro
                             # if clone or custom_build: leave blank

# Access we need (Scott confirms each is granted before phase starts)
domain_control: ""           # yes_owns_godaddy | yes_can_grant | no_must_coordinate
gsc_access: ""               # granted | pending | none
ga_access: ""                # granted | pending | none
host_credentials: ""         # granted | pending | none (for asset extraction if scraping fails)
gbp_manager: ""              # granted | pending | none

# Site characteristics (rough — verified in Phase 1)
estimated_page_count: 0      # crude guess from manual click-around
current_cms: ""              # wordpress | wix | squarespace | godaddy_builder | custom | unknown
js_heavy: false              # true if site is React/Vue SPA needing JS render
behind_paywall_or_login: false
```

---

## PHASE 1 — Site crawl (Screaming Frog SEO Spider)

**Scott runs:** Screaming Frog SEO Spider on `<current_site_url>`. Free tier covers up to 500 URLs. For larger sites or JS-heavy sites, paid license required (£259/yr).

**Crawl config:**
- Mode: Spider
- JavaScript rendering: ON if `js_heavy: true`
- User-Agent: Default
- Respect robots.txt: OFF (we want to see everything, including blocked pages)
- Limit: none (or 500 on free tier)
- Include subdomains: only if `secondary_domains` populated

**Exports to capture (CSV each):**
1. **Internal URLs** — Export → Internal → HTML. Every page on the site with status code.
2. **Page titles** — Export → Page Titles → All
3. **Meta descriptions** — Export → Meta Description → All
4. **H1 + H2** — Export → H1 → All, Export → H2 → All
5. **Images** — Export → Images → All (with alt text column)
6. **Response codes** — Export → Response Codes → All (catches 4xx/5xx)
7. **Redirect chains** — Export → Redirect Chains
8. **Canonicals** — Export → Canonicals
9. **Sitemap URLs** — if they have a sitemap.xml: Crawl → XML Sitemap. Compare against crawl. Flag any URL in sitemap NOT in crawl (orphan) or in crawl NOT in sitemap (missing from sitemap).

**Store all 9 CSVs at:** `docs/customers/<slug>/discovery/screaming-frog/`

**Verification gate:**
- Confirm `internal-urls.csv` has > 0 rows.
- Confirm no obvious error (e.g., the entire site returns 403 because robots blocked us).
- Total URL count — match against `estimated_page_count`. If wildly different, investigate.

**Output artifact:** `docs/customers/<slug>/discovery/phase1-crawl-summary.md` with: total URLs, 200 count, 3xx count, 4xx count, 5xx count, top 20 pages by inbound internal links (gives indication of site architecture).

---

## PHASE 2 — Content extraction (Firecrawl + manual fallback)

For every URL with status 200 from Phase 1, extract the actual page content so we can rebuild faithfully or feed into rewrite workflow.

**Tooling:**
- Primary: Firecrawl via `scrape-prospect` edge fn (we already pay for it). Markdown output, JS rendering supported.
- Manual fallback: paste URL into Firecrawl playground or use the admin tool.

**Per page, capture:**
- Page title
- Meta description
- H1
- Body content (as markdown)
- Image URLs + alt text
- Internal links (for graph analysis)
- Schema markup (JSON-LD blocks)
- Embedded videos (YouTube, Vimeo, MP4)
- Forms (count and target action URL)
- Phone numbers (validates NAP consistency)

**Bucket pages by template type:**
- Home (1)
- About / Team (1-2)
- Services index (1)
- Individual service pages (5-15 typically: general pest, termite, mosquito, rodent, bed bug, ant, roach, etc.)
- Service area / locations (1 index + N city pages)
- Testimonials / reviews
- Contact
- Blog index + posts (if blog exists)
- Misc (privacy, terms, sitemap-html, etc.)

**Store at:** `docs/customers/<slug>/discovery/content/` — one `.md` file per URL, filename = slugified URL path.

**Verification gate:**
- File count matches Phase 1 200-status URL count (allow some loss for paywall/login pages).
- Spot-check 3 randomly selected pages — content is intact and clean.

**Output artifact:** `docs/customers/<slug>/discovery/phase2-content-inventory.md` — table of every page with its template-bucket assignment and a one-line content summary.

---

## PHASE 3 — SEO baseline (GSC + analytics)

**Scott runs:** pulls exports from Google Search Console (last 16 months) and Google Analytics (GA4 or UA, last 12 months).

**GSC exports needed (CSV each):**
1. **Queries** — Performance → Queries → Export. Captures: query, impressions, clicks, CTR, position. Filter to last 16 months.
2. **Pages** — Performance → Pages → Export. Captures: page URL, impressions, clicks, CTR, position.
3. **Countries** (if relevant)
4. **Devices** — desktop/mobile/tablet split
5. **Coverage** — Index Coverage report → Export. Flags any "valid with warnings" or "errors."
6. **Sitemaps** — Sitemaps report → list of submitted sitemaps.

**GA4 exports needed:**
1. **Top landing pages** — Reports → Engagement → Landing page → last 12 months. Sort by sessions desc.
2. **Top conversions / events** — what their existing conversion goals are (form submits, calls, etc.)
3. **Traffic sources** — Acquisition → Traffic acquisition → last 12 months.

**Store at:** `docs/customers/<slug>/discovery/seo-baseline/`

**Output artifact:** `docs/customers/<slug>/discovery/phase3-seo-baseline.md`:
- Top 50 queries driving impressions (sorted by impressions)
- Top 20 queries driving clicks (sorted by clicks)
- Top 20 pages by clicks
- Average position trend (if visible — directional only)
- Index coverage issues to fix before migration
- Top 5 conversion events from GA4
- Top 10 landing pages

**Why this matters:** these are the keywords and pages we MUST protect through the migration. A page driving 200 clicks/month must redirect cleanly to a page that can hold the same intent — or the ranking dies in 4–8 weeks.

**Verification gate:** Scott reviews the top-50 queries list before Phase 6. If any look mis-aligned with the business (e.g., the existing site ranks for the wrong city), flag and discuss.

---

## PHASE 4 — Local presence audit (GBP + citations + social)

### 4a. Google Business Profile

Capture from the existing GBP listing (open in Google Maps or GBP manager):
- Place ID (use https://developers.google.com/maps/documentation/places/web-service/place-id)
- FID (extract from GBP URL: `g.co/kgs/...` or the `?ftid=` parameter)
- CID (decimal — extract from share URL `?cid=`)
- Business name (NAP)
- Address (NAP)
- Phone (NAP)
- Primary category + additional categories
- Hours per day
- Service areas list
- Review count + average rating (we'll import via Outscraper later — S235)
- Photo count
- Q&A entries (yes/no/count)
- GBP post cadence (when's the last post?)
- Description
- Attributes (woman-owned, identifies as LGBTQ+ friendly, online estimates, etc.)
- Booking link / website link / appointment link

**Store at:** `docs/customers/<slug>/discovery/gbp-snapshot.md`

### 4b. Local citations (NAP consistency)

Manual check (or BrightLocal if Scott has access — paid, ~$30/mo). Check these top citation sources for NAP consistency:
- Yelp
- Yellow Pages
- Angi
- Thumbtack
- HomeAdvisor
- Bing Places
- Apple Maps Connect
- Facebook Page (address/phone there)
- BBB
- Local chamber of commerce
- Pest control trade directories (PestWorld, NPMA member listing)

For each: does the NAP match GBP exactly? Flag mismatches — these hurt local SEO.

**Store at:** `docs/customers/<slug>/discovery/citations-audit.md`

### 4c. Social presence

- Facebook Page URL, follower count, last post date, post cadence
- Instagram handle, follower count, last post date
- Nextdoor presence (yes/no)
- YouTube channel (if any)
- LinkedIn company page (if any)
- TikTok (rare, but check)

**Store at:** `docs/customers/<slug>/discovery/social-snapshot.md`

**Output artifact:** `docs/customers/<slug>/discovery/phase4-local-presence.md` — synthesized report. Highlights NAP inconsistencies (which ones to fix post-migration), review count baseline, social cadence baseline.

---

## PHASE 5 — Tracking & tag inventory

We need to know every tracking pixel, analytics tag, and conversion mechanism currently firing on the existing site, so we can either preserve or replace it.

**Method:** Scott opens the site in Chrome → installs the **Tag Assistant Companion** extension OR uses the built-in Network tab to inspect.

**Capture each:**
- GA4 property ID (`G-XXXXXXXXXX`)
- Universal Analytics ID (`UA-XXXXXX-X`) — if still firing despite UA sunset
- Google Tag Manager container (`GTM-XXXXXXX`)
- Meta Pixel ID (`fbq('init', '...')` ID)
- Google Ads conversion tag (any `gtag('event', 'conversion', ...)` IDs)
- Call tracking (CallRail, CallTrackingMetrics, etc. — usually a dynamic phone-swap script)
- Hotjar / Microsoft Clarity / FullStory session recording
- Live chat (Intercom, Drift, tawk.to, etc.)
- TikTok pixel
- Pinterest pixel (rare)
- Yelp Ads tracking
- Any custom scripts (look for `<script src="...">` calls to non-Google/Facebook domains)

**Phone number(s) on site:**
- Tracked vs untracked? If CallRail is active, phones rotate by source. Capture the "real" terminating number.

**Forms:**
- Where do they submit to? (Custom backend, Formspree, Hubspot, MailChimp, Constant Contact, etc.)
- Email destination?
- Any CRM integration?

**Store at:** `docs/customers/<slug>/discovery/tracking-inventory.md`

**Output artifact:** Phase 5 output is the tracking inventory itself. No separate summary doc.

**Decision point for Scott:** which of these do we preserve on the new site, which do we replace with PFP equivalents (lead notification, Resend confirmation email), and which do we drop?

---

## PHASE 6 — 301 redirect map (CRITICAL for SEO preservation)

This is the single highest-stakes deliverable of the discovery phase. Get it wrong and ranking traffic dies.

**Inputs:**
- Phase 1 `internal-urls.csv` (every old URL)
- Phase 3 top 20 pages by clicks (priority list — these MUST redirect cleanly)
- Target shell URL structure (if `rebuild_on_shell`) OR new site sitemap (if `clone` or `custom_build`)

### Standard PFP shell URL structure

Use this mapping when `migration_path: rebuild_on_shell`:

| Old URL pattern | New URL on PFP shell |
|---|---|
| `/` | `/` |
| `/about*`, `/about-us*`, `/who-we-are*` | `/about` |
| `/contact*`, `/contact-us*`, `/get-quote*` | `/contact` |
| `/services*` (index) | `/services` |
| `/termite-control*`, `/termites*` | `/services/termite-control` |
| `/mosquito-control*`, `/mosquitoes*` | `/services/mosquito-control` |
| `/rodent-control*`, `/rats*`, `/mice*` | `/services/rodent-control` |
| `/bed-bug*`, `/bedbugs*` | `/services/bed-bugs` |
| `/cockroach*`, `/roach*` | `/services/cockroaches` |
| `/ant-control*`, `/ants*` | `/services/ants` |
| `/general-pest*`, `/pest-control*` (when not a city page) | `/services/general-pest` |
| `/locations*`, `/service-areas*`, `/areas-we-serve*` | `/service-areas` |
| `/locations/[city]`, `/[city]-pest-control` | `/service-areas/[city-slug]` |
| `/testimonials*`, `/reviews*` | `/testimonials` |
| `/blog*` (index) | `/blog` (Pro+ tier only) |
| `/blog/[slug]` | `/blog/[slug]` (preserve slug if possible) |
| `/privacy*` | `/privacy` |
| `/terms*` | `/terms` |
| `/sitemap.html` (if exists as content) | drop, replaced by `/sitemap.xml` |

For service-area + city combos (e.g., `/austin-termite-control`), map to the most specific service AND area combination available. If PFP doesn't have a per-service-per-city page template (it doesn't currently — known gap), redirect to the broader service page and capture the loss in `phase6-redirect-loss-report.md`.

### Output format

`docs/customers/<slug>/discovery/redirect-map.csv` with columns:
```
old_url, new_url, http_status, priority, notes
```
- `priority`: HIGH (top-20 by clicks) | MEDIUM (top-100 by impressions) | LOW (long tail)
- `http_status`: always 301 unless intentional 410 (kill a page)
- `notes`: free-form ("merged with X", "lost — no equivalent", "preserved canonical")

### Pages with no clean equivalent

Some pages have no destination. Examples:
- Defunct service that PFP doesn't support
- Hyper-local landing pages (`/pest-control-12345-zip-code-style` — too many to recreate)
- Outdated promo pages
- Author archive pages (WordPress)
- Tag archive pages (WordPress)

For these, decide: 301 to the next-best-fit page, OR 410 Gone if the page should be deindexed.

**Verification gate:**
- 100% of Phase 1 200-status URLs are accounted for in the redirect map (HIGH priority for top-20-clicks must be 1:1, not collapsed).
- No 200-status URL is missing.
- Scott reviews and signs off on HIGH-priority redirects before deploy.

### Deployment mechanism

| Customer path | Where redirects live |
|---|---|
| Custom build (standalone Vercel project) | `vercel.json` `redirects` array in the customer's repo |
| Clone (standalone Vercel project) | Same as above |
| Rebuild on shell | **`public.tenant_redirects` table → build-time `redirects-map.json` → Edge middleware** (shipped S253/D1). Insert one row per redirect (`from_path`, `to_path`, `status_code` default 308) keyed by `tenant_id`; the cutover deploy regenerates the bundled map and middleware serves the redirects. See `docs/onboarding/faithful-rebuild-runbook.md`. |

The per-tenant redirect mechanism for shared shells now EXISTS (S253/D1), so `rebuild_on_shell` is no longer a blocker for SEO-preserving migrations. **Redirects are NOT live until a deploy runs** — the cutover deploy is what regenerates the map. See the faithful-rebuild runbook for the concrete insert-and-deploy flow. **At cutover, a green deploy does NOT prove redirects shipped** — the build is fail-soft and ships `{}` on a missing service-role key. The [Redirect Cutover Verification Gate](faithful-rebuild-runbook.md#redirect-cutover-verification-gate) (env-var → row-count → deployed-map → live spot-check) is mandatory before marking the migration complete.

**Output artifact:** `docs/customers/<slug>/discovery/phase6-redirect-map.md` + the CSV.

---

## PHASE 7 — Content rewrite strategy

For every page surfaced in Phase 2, decide: **KEEP / REWRITE / KILL / MERGE**.

Criteria:
- **KEEP** — page content is good, accurate, on-brand, on-tone. Use verbatim (with minor edits for new branding).
- **REWRITE** — page covers the right topic but content is thin, outdated, or poorly optimized. Use Anthropic API to draft a rewrite from the existing content as a base, optimized for top queries from Phase 3.
- **KILL** — page is irrelevant, duplicate, or harmful. Map to 301 destination in Phase 6.
- **MERGE** — page should be combined with another (e.g., two slightly-different termite pages merge into one).

**Net-new pages to add:**
- Identify SEO coverage gaps. Phase 3 queries that the site doesn't currently target but should.
- Identify service-page completeness. PFP shells expect ~6-10 service pages; if the customer site has 3, we may need 3-7 net-new.
- Identify service-area completeness. PFP shells assume per-zip or per-city area pages.

**Tone analysis:**
- Use Anthropic API to extract tone descriptors from 5-10 KEEP pages.
- Capture: formality, voice (first-person/third-person), use of CTAs, emoji use, list-vs-prose preference.
- Apply tone to REWRITE and new pages.

**Output artifact:** `docs/customers/<slug>/discovery/phase7-content-plan.md` — page-by-page disposition table + net-new page list + tone profile.

---

## PHASE 8 — Asset extraction

Pull every asset that's worth preserving:
- Logo (vector if available — check the source CSS for SVG or PDF references; if not, request from customer or upscale from PNG)
- Brand colors — extract hex codes from the existing site CSS. Use `<curl current_site_url | grep -oP '#[0-9a-fA-F]{3,6}'>` or browser DevTools.
- Photography — real photos of their team, trucks, equipment, and pest examples. Pull at highest available resolution. SKIP stock photography (we don't license-launder it).
- Videos — if hosted on YouTube, capture URL; if self-hosted, download.
- PDFs — service brochures, treatment plans, terms documents.
- Team photos with names — for the About page.

**Asset storage:** Upload to Supabase Storage under `tenant-assets/<uuid>/migration/` once tenant UUID exists (post-Phase 1 of onboarding prompt). Pre-staging location: `docs/customers/<slug>/discovery/assets/`.

**License check:** any stock photo from existing site → check the customer paid for it OR replace with a new licensed image post-migration. Don't carry forward unlicensed imagery.

**Output artifact:** `docs/customers/<slug>/discovery/phase8-assets-manifest.md` — inventory of every captured asset with source URL, target location, and license status.

---

## PHASE 9 — Pre-cutover build & staging

This phase begins after the technical onboarding prompt (Phases 1–5) provisions the tenant.

1. **Build the new site** in staging:
   - If `rebuild_on_shell`: populate the tenant content via admin or DB writes. Use Phase 7 KEEP/REWRITE content. Reference Phase 8 assets.
   - If `clone` or `custom_build`: build the project in a separate Vercel project, deploy to a preview URL.
2. **Test every redirect** from Phase 6:
   - Script: `for url in redirect-map.csv: curl -I https://<new_site>$old_url` → expect 301 → assert Location header matches new_url
   - 100% must pass before cutover.
3. **Test every tracking tag** from Phase 5:
   - GA4 firing? Real-time view shows your test pageview?
   - Meta Pixel firing? Pixel Helper shows the event?
   - Call tracking number swapping correctly?
   - Form submissions landing in CRM / email destination?
4. **Mobile responsiveness check** on real devices (or BrowserStack).
5. **Lighthouse audit** of staging — target ≥90 perf, ≥95 a11y, ≥95 SEO, 100 best-practices.
6. **Schema validation** — paste new site URLs into Google Rich Results Test. Expect LocalBusiness, Service, FAQPage, BreadcrumbList where applicable.

**Verification gate:** All 6 pass before Phase 10. Any failure → stop, fix, retest. Do NOT cut DNS until staging is green.

---

## PHASE 10 — DNS cutover

This is the live migration window. Plan for it during low-traffic hours (typically nights or weekends for pest control — low call volume).

**Pre-cutover (24 hours before):**
1. Lower DNS TTL at GoDaddy (or wherever DNS lives) to 300 seconds (5 minutes). Wait 24h for propagation.
2. Confirm staging is still green.
3. Notify customer of the cutover window.
4. Snapshot current GBP listing, GA4, and GSC state (screenshot record).

**Cutover window:**
1. Update A record (and `www` CNAME) at DNS provider to point to Vercel.
2. Vercel issues SSL within ~2 min via Let's Encrypt.
3. Confirm `curl -I https://<customer_domain>` returns 200 from new server (check the `server` header).
4. Test 5 high-priority pages from Phase 3.
5. Test 5 high-priority redirects from Phase 6.
6. Submit new sitemap to GSC.
7. Use GSC URL Inspection tool to request indexing on top 10 pages.
8. Restore TTL to 3600+ once stable.

**Post-cutover (first 24h):**
- Monitor GSC for crawl errors every 4 hours.
- Monitor GA4 in real-time view — sessions should match pre-cutover baseline ±20% within 4 hours.
- Monitor server logs (via Vercel) for 4xx/5xx spikes.
- Spot-check social media share previews (FB sharing debugger, Twitter card validator) — refresh caches.

**Output artifact:** `docs/customers/<slug>/discovery/phase10-cutover-log.md` — timestamped log of every step taken during cutover, with curl outputs and screenshots.

---

## PHASE 11 — Post-cutover monitoring (first 30 days)

Daily for week 1, weekly for weeks 2-4:

1. **GSC Coverage report** — any new "errors" or "valid with warnings"? Fix.
2. **GSC Performance** — compare current 7-day rolling clicks against pre-migration baseline (Phase 3). A drop >20% sustained 7 days = problem, investigate.
3. **Rankings for top-20 queries** (Phase 3) — manual SERP check or rank tracker. Expect 1-2 weeks of volatility, then return to baseline.
4. **GA4 sessions** — track conversion rate; should match pre-migration ±10%.
5. **Backlinks** — Ahrefs free check: any 404'd inbound links? If a high-DR link points to a URL that didn't redirect cleanly, add a manual 301.
6. **Form submissions** — confirm leads still landing in admin Leads tab.
7. **GBP** — confirm the new website URL on GBP points to the new domain. If still old domain, update.
8. **Speed** — Lighthouse drift over time.

**Output artifact:** `docs/customers/<slug>/discovery/phase11-monitoring.md` — running log of metrics and any anomalies.

---

## HANDOFF TO ONBOARDING PROMPT

Once Phases 1–8 are complete, the discovery output feeds the onboarding prompt's §0 intake YAML. Populate:

- `business_name`, `owner_email`, `owner_phone`, `business_address`, `city`, `state`, `zip` — from Phase 4 GBP snapshot
- `hours_summary` — from Phase 4 GBP
- `services_offered` — from Phase 2 content + Phase 7 plan
- `service_zips` — from Phase 4 GBP service areas
- `existing_gbp_url`, `existing_facebook`, `existing_instagram`, `existing_website` — from Phase 4
- Assets ready to upload — from Phase 8

Then run `CUSTOMER_ONBOARDING_PROMPT.md` with the populated intake, picking up at Phase 1.

Phases 9–11 of this prompt run AFTER the onboarding prompt's Phases 1–5 (tenant provisioning + branding + integrations).

---

## ABORT / ESCALATION CRITERIA

Stop and report to Scott if:

- Phase 1 crawl returns 0 URLs (site blocks crawler or is JS-only without our JS render licensed).
- Phase 3 GSC shows the existing site has manual penalties or is deindexed — do NOT migrate a penalized property.
- Phase 6 reveals >50 high-priority URLs with no clean PFP shell equivalent and `rebuild_on_shell` was chosen — recommend `custom_build` instead, or build out service-area-per-service templates in PFP first.
- Phase 9 staging Lighthouse SEO score < 85 — there's something structurally wrong.
- Phase 10 DNS cutover: 5xx rate >2% after 30 min — roll back DNS to old A record, troubleshoot before retrying.

---

## STACK NOTES FOR THIS PROMPT

| Tool | Used in phase | Free / paid | Notes |
|---|---|---|---|
| Screaming Frog SEO Spider | 1 | Free <500 URLs, £259/yr unlimited | Desktop app, Scott runs it locally |
| Firecrawl | 2 | Paid (existing PFP stack) | Already in `scrape-prospect` edge fn |
| Google Search Console | 3 | Free | Customer must grant access |
| Google Analytics 4 | 3 | Free | Customer must grant access |
| BrightLocal | 4b (optional) | Paid ~$30/mo | Only needed if doing many migrations |
| Anthropic API | 7 | Paid (existing PFP stack) | Tone analysis, content rewrite drafts |
| Supabase Storage | 8 | Paid (existing PFP stack) | Final asset storage |
| Vercel | 9, 10 | Paid (existing PFP stack) | Preview deployments + production |
| GoDaddy DNS | 10 | Paid (existing) | TTL changes + cutover |
| Lighthouse | 9, 11 | Free | Built into Chrome |
| Google Rich Results Test | 9 | Free | Schema validation |
| Ahrefs (free tier) | 11 | Free (limited) | Backlink monitoring |

**New stack addition flagged:** Screaming Frog at £259/yr (~$330) — recommended for any active customer-migration pipeline. Optional if all customers are net-new or shell-only.
