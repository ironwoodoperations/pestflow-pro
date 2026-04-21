# S165.9 seo2 — T0 Pre-flight Verification Report

Date: 2026-04-21
Session: S165.9

---

## T0.1 — schema.org/PestControlService validity

**Verdict: NOT_RECOGNIZED**

Source: Direct HTTP probe of https://schema.org/PestControlService returned **HTTP 404**.

Resolution per decision tree: substitute `@type: ['LocalBusiness', 'HomeAndConstructionBusiness']` in all LocalBusiness generators. Applied in T1.8.

---

## T0.2 — AggregateRating source

Current source: hardcoded constant in `src/components/PublicShell.tsx`:
```ts
const EMPTY_SCHEMA: SchemaConfig = { aggregate_rating: { value: 5.0, count: 47 }, service_radius_miles: 30 }
```

Also referenced in `src/hooks/useRevealReportData.ts` (display only, not schema emission).

The value is fabricated demo data (5.0 / 47 reviews). No real review ingestion substrate exists. Consistent with D5-D: aggregateRating block removed from LocalBusiness generator in T1.7. The `SchemaConfig.aggregate_rating` interface field retained for future use.

---

## T0.3 — Services substrate

**No dedicated `service_pages` table.**

Table probe: `information_schema.tables` returns `service_areas` and `faqs` — no `service_pages`.

Canonical source for per-service content: `page_content` table, fetched via:
```ts
getPageContent(tenantId, serviceSlug)  // app/tenant/[slug]/_lib/queries.ts
```

Service title: `content.title || SERVICE_DATA[slug].heroTitle`
Service description: `content.subtitle || SERVICE_DATA[slug].heroSubtitle`

T2.4 uses `getPageContent` + `SERVICE_DATA` fallbacks to populate Service schema.

---

## T0.4 — Social links source

Source: `settings` table, key `social_links`, JSONB value.

Fetched via `getSocialLinks(tenantId)` in `app/tenant/[slug]/_lib/queries.ts` (React.cache, getServerSupabaseForISR).

Already called in `layout.tsx` — result reused for LocalBusiness `sameAs` in T2.2.

Shape: `{ facebook?, instagram?, youtube?, google? }`

Mapping to SocialLinks: `social.google` → `social.google` (key matches).

---

## T0.5 — meta_description populated

Query result (excluding Dang):

| slug | meta_description |
|------|-----------------|
| pestflow-pro | "" (empty string) |
| cityshield-pest-defense | "CityShield Pest Defense — Urban Pest Control. Done Right.. Serving Dallas, TX." |

pestflow-pro has empty meta_description. CityShield is populated.

Schema behavior: `generateLocalBusinessSchema` includes `meta_description` in description field only if non-empty (no change needed — existing code uses `||`).

---

## T0.6 — tsconfig path resolution

`tsconfig.json` `include`: `["app/**/*", "shared/**/*", "middleware.ts", "next-env.d.ts", ".next/types/**/*.ts"]`

`tsconfig.json` `exclude`: includes `"src"`.

**Verdict: NOT ACCESSIBLE** — App Router (`app/`) CANNOT import from `src/lib/*`.

T1.1 move from `src/lib/seoSchema.ts` → `shared/lib/seoSchema.ts` is **REQUIRED** to unblock Next.js schema injection, not just hygiene.

---

## T0.7 — FAQ and reviews page visibility

**FAQ page (`app/tenant/[slug]/faq/page.tsx`):**
- Does NOT fetch from `faqs` DB table
- Renders `FAQ_FALLBACK` (hardcoded 3-category × 8-question list) as visible `<h3>` / `<p>` elements
- `faqs` DB table EXISTS (confirmed via information_schema probe)
- Only Dang tenant has data (55 rows); paying tenants (pestflow-pro, cityshield) have 0 rows
- T2.6: add query to `faqs` table; emit FAQPage schema only if `faqs.length > 0` (frozen tenants will not emit until FAQs are added via admin)
- Note: faq/page.tsx must be updated to query `faqs` table to support future emission

**Reviews page (`app/tenant/[slug]/reviews/page.tsx`):**
- Renders `testimonials` table rows or `PLACEHOLDER_REVIEWS` (hardcoded) as visible review cards
- Reviews are testimonials, not Google-sourced — no verified provenance
- Per D5-D / D7 deferral: **NO review schema emitted v1**

---

## T0 — Go/No-Go

All 7 probes returned expected or handleable results. Proceeding to T1.

Key constraint: T0.1 NOT_RECOGNIZED triggers T1.8 type substitution.
