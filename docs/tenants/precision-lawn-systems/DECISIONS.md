# Precision Lawn Systems — Decisions & Spec Amendments

Amendment log for `BUILD-SPEC-v2.md`. The spec body is the client-facing
artifact and is not edited; where a row here conflicts with the spec text, this
log is current. One row per superseded or resolved item. Sources: the planning
session, Scott's Q1–Q3 answers (2026-08-19), and repo/DB verification performed
before any code was written.

| Spec § | Spec said | Decision (current) |
|---|---|---|
| §3 Theme | Recommended `mp-2` (Forest & Cream, `#2d6a4f`); alternate `cf-2` | **Neither.** `modern-pro` with a hand-authored `PALETTE_HERO['#0e3b44']` entry in both twin files (`shared/lib/shellCssVars.ts`, `src/lib/shellThemes.ts`). `branding.primary_color = '#0E3B44'`, `accent_color = '#2E9D8F'`. The custom-derivation path is not used: `darkenHex('#0E3B44', 0.35)` crushes an already-hero-dark primary to `#051518`. `cf-2` is inert on clean-friendly (fixed `--cf-*` tokens). Entry is in `PALETTE_HERO` only — **not** the `PALETTES` admin swatch picker. |
| §3 Theme (cta) | — (render shows a clay CTA band) | `cta: '#092A31'` (render `--deeper`), **not** clay `#B4653A`. `--color-bg-cta` backs five shared surfaces (`ModernProTestimonials`, `CtaBanner`, reviews stats strip, FAQ CTA, `ServiceAreaPage` CTA) that put muted-white and accent-teal text on it; on clay the `CtaBanner` accent eyebrow measures 1.30:1 and white/65–75 body text 2.75–3.16:1. Clay on Precision-specific surfaces remains a PR 5 proposal item. |
| §3 Theme (btn) | — | Recorded decision, not an oversight: `--color-btn-bg` resolves to accent `#2E9D8F` with white text at **3.31:1** (below AA 4.5:1 for normal text). Matches the client-approved render; not silently changed. AA alternative if ever needed: ink `#14211F` on the same teal is 5.00:1. |
| §4 Services | "Services live in `pestContent.ts`" | Incomplete — there are **two** static maps. `app/tenant/[slug]/_lib/serviceData.ts` also carries `SERVICE_DATA` + `PEST_IMAGES`, and its `SERVICE_SLUGS` set is the **router**: a slug not in the set falls through to the location-page branch and 404s. Build per D1: new `irrigationContent.ts` (reusing `PestEntry`), new `IRRIGATION_SERVICE_SLUGS`, vertical-resolved active slug set in `[service]/page.tsx` before the location fallback, new `getServiceEntry(vertical, slug)` accessor. No mutation of any existing pest entry; `pluralNoun` left present (no SSR reader) with no irrigation copy. |
| §5 Pages | Projects page: `1 + n`, rebuilt from photo library | **Cut from Phase One** (photo library not handed over — §15 Q7). Testimonials use the existing `/reviews` route; before/after pairs go inline on the four service pages. `/projects` is a Phase Two item with its own routing decision (new route segment vs vertical slug set vs `page_content` branch) — not pre-decided. |
| §5 (open question) | "Do service × location pages consume `service_areas` rows?" | Resolved and **dropped**: `location_data` is a VIEW over `service_areas` — same table, same cap (`enforce_location_cap`: ent 1→3, 2→5, 3→10, 4+→unlimited, fail-open on unknown tenant, `check_violation`). There is also no `[service]/[location]` route. Consequences: JSON-LD `areaServed` and the homepage town-chip strip read `settings.seo.service_areas` (20 towns + 5 counties, zero cap cost); the chip-strip repoint is a PR 5 proposal item. |
| §8 Q1 | Catalog placement (a)/(b)/(c) | **(a)** — parallel `irrigationContent.ts`, additive, zero Dang risk. No vertical-keyed generalization this session; no service-content DB table (`page_content` is already the DB layer). |
| §8 Q2 | Is this the first non-pest vertical? | No — Vita Glow (medical aesthetics) precedes it: dedicated shell + early `tenant.template` branch before the `SERVICE_SLUGS` logic, copy from `page_content`. `tenants.render_model` is **not** a vertical flag (prod values `standard`/`standalone`; not selected by `resolveTenantBySlug`). |
| §8 Q3 | Service × location rows? | See §5 row above — dropped. |
| §8 Q4 | Theme `mp-2` or `cf-2`? | See §3 rows above — neither; custom `#0e3b44` preset entry. |
| §9 Schema | "Wire the AggregateRating field, leave it null" | Nothing to wire — `generateLocalBusinessSchema` ignores its `_schema` param entirely and never emits `aggregateRating`. Simply never call `generateRatingSchema`. The real §0.1 exposure was the hardcoded `knowsAbout` pest list and `serviceType: 'Pest Control'` shipping on every tenant — fixed in PR #245 (`SchemaVocabulary` param, pest defaults, byte-identical for existing callers; default deep-frozen in the follow-up hardening). |
| §11 CI | Source-level checks implied | Greps for "pest" (and "lawn" outside legal name / domain / footer copyright) must run against **rendered HTML** of Precision's pages — the strings live in shared components and DB fallbacks a source grep cannot see. Scope the "lawn" check to rendered output and `src/`, or `docs/tenants/precision-lawn-systems/` flags permanently. `format-detection: telephone=no` confirmed absent repo-wide today, so that check is not a no-op. |
| §13 Redirects | `/photo-gallery/` → `/projects` | Phase One: `/photo-gallery/` → `/` (a 301 into a 404 is worse than none). Repoint to `/projects` in Phase Two when the page exists. All other §13 redirects ship as specified. |
| §14 DoD (added row) | — | **Meta-description fallback (BLOCKER-2):** `layout.tsx`, `page.tsx`, and `[service]/page.tsx` all fall back to `${businessName} — professional pest control services` when no `seo_meta` row / `settings.seo.meta_description` exists — a §0.1 violation the moment any Precision page ships without its row. DoD: **every page has a `seo_meta` row AND `settings.seo.meta_description` is set**, so the fallback can never fire. The fallback itself is not removed — other tenants may rely on it. Seeded in S-PLS-3: `seo.meta_description` + 19 `seo_meta` rows (all Phase One pages incl. legal). |
| Tenant slug | — (docs path uses `precision-lawn-systems`) | **`pls`** (slug and subdomain). A slug is public — it lands in every URL and canonical tag — and §0.1 permits "lawn" only in the legal entity name, the domain, and the footer copyright; a slug is none of those. The docs directory keeps the long name (internal, unindexed). Site: `https://pls.pestflowpro.ai`. Legal name still renders per §1 in `business_info.name` and the footer copyright. |
| §6.1 (constraint interaction) | Base "Hawkins, TX 75765" is a verified fact | The `business_info_structured_shape` CHECK requires the four structured address keys (`street_address`/`address_locality`/`address_region`/`postal_code`) as an all-or-nothing set. With the street unresolved (§6.1), locality/region/postal are also left unset — no partial address, no `PostalAddress` in JSON-LD, until §6.1 is settled. **§6.1 therefore now gates address JSON-LD as well as GBP verification.** |
| Session-prompt town count | "20 towns + 5 counties" | The spec names **19** towns (5 Phase One + 10 deferred + 4 lake communities). All 19 + the 5 §9 counties are seeded in `seo.service_areas` (24 entries). No 20th town invented — if one is missing from the spec, name it and it gets appended. |
| Render/spec town delta | §5 town lists (spec) vs `home.html` chip strip (render) | **Logged, not reconciled.** The render's 20 chips include **Alba** and **Golden**, which appear nowhere in the spec, and omit **Lake Holbrook**, which the spec lists (this is where "20" came from). Service-area entries are coverage claims and §15 Q6 is still open — the 24 seeded entries stay as-is until Dathan confirms. No towns added or removed on our own judgment. |
| §2 H1 vs render copy | Render `home.html` H1: "Sprinkler systems, drainage & pump systems" | The render's own H1 omits "irrigation"; §2's vocabulary rule ("irrigation" in title, H1, first 100 words) wins over render copy. Seeded `page_content` home row (S-PLS-3b): H1 "Irrigation, Drainage & Pump Systems for East Texas", intro carries "irrigation" in the first 100 words. This also killed the `business_name` H1 fallback that had put the legal name (with "Lawn") in a crawlable heading. |
| Pre-launch indexing | — | **Open — proposal pending with Scott.** No per-tenant noindex mechanism exists: `buildPageMetadata` never sets `robots`, the only noindex is a static export on the vita-glow `consult` route, and `public/robots.txt` is a global `Allow: /` shared by all tenant subdomains. `pls.pestflowpro.ai` is `render_model='standard'` (crawlable) and currently indexable while still carrying pest shell copy. Shared-code change → propose-and-wait. |

## DNS cutover note (account record — §13, do not solve now)

Precision is `render_model='standard'`, so unlike Dang its `pls.pestflowpro.ai`
subdomain renders publicly and is indexable. Once the real domain is live, the
subdomain becomes a duplicate of it — decide **canonical vs noindex** for the
subdomain at cutover time.

## Standing verification results (Step Zero)

- Dang is `render_model='standalone'`; the deployed middleware 404s every
  non-admin path on `dang.pestflowpro.ai` (`x-pfp-routing-decision:
  standalone-admin-only-404`, verified live). Dang's public site does **not**
  render from this repo; exposure is the admin branding preview only.
- **apex-protect** is the live modern-pro tenant served from this repo
  (verified 200 via `/tenant/[slug]/[service]`) and is the visual-diff
  reference for every shared modern-pro change.

## Upgrade carrot (account record)

Location pages 5 → 10 at Pro — not the theme. Deferred towns and
lake-community pages listed in spec §5.
