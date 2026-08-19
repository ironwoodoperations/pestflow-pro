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
