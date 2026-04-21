# S164 — b10/b11 Service-Area Pipeline: Source Hunt
**Session:** S164 | **Date:** 2026-04-21 | **Status:** READ-ONLY — no code changed

---

## 1. service_areas TABLE — current schema

Columns confirmed via live DB query:

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NOT NULL | uuid_generate_v4() |
| tenant_id | uuid | NOT NULL | FK tenants |
| city | text | NOT NULL | bare city name (no state) |
| slug | text | NOT NULL | e.g. `tyler-tx` |
| hero_title | text | YES | |
| is_live | bool | YES | default false |
| intro_video_url | text | YES | |
| created_at | timestamptz | YES | now() |
| meta_title | text | YES | |
| meta_description | text | YES | |
| focus_keyword | text | YES | |
| intro | text | YES | |

**Missing (Part 0 will add):** `place_id text`, `state text`

Unique constraint used in upsert calls: `(tenant_id, city)` in provision-tenant, `(tenant_id, slug)` in Onboarding.tsx.

---

## 2. settings.seo.service_areas JSONB — current state

| Tenant | Slug | JSONB service_areas | Table live count | Drift? |
|--------|------|---------------------|------------------|--------|
| Demo | pestflow-pro | `[]` | 7 live | YES — needs backfill |
| CityShield | cityshield-pest-defense | `["Dallas","Frisco","McKinney","Fort Worth"]` | 4 live | NO — aligned ✅ |
| Dang | dang | `["Tyler TX","Longview TX","Kilgore TX","Henderson TX","Lindale TX"]` | 9 live | YES — frozen until DNS |

**Dang JSONB issue:** entries have "TX" suffix (e.g. "Tyler TX") — not city-only. Result of old provision-tenant behavior that wrote `city + ', ' + state` as a single string. Frozen under DNS-cutover freeze rule.

**Demo JSONB is empty despite 7 live service_areas rows.** Needs backfill in §7 of design doc.

---

## 3. service_areas TABLE writers

### 3a. provision-tenant/index.ts — Step 9c (lines 533–575)
- Upsert path: `ON CONFLICT (tenant_id, city)` (hardcoded in upsert call)
- Writes: city (bare name from ZIP_CITIES map), slug (`city-lowercase-state`), hero_title, is_live=false, meta_title, meta_description, focus_keyword
- **No normalization applied** — uses raw city names from static ZIP_CITIES lookup
- **NO JSONB sync** — the `seo` key (Step 9b, lines 504-511) is written first with only `[city + ', ' + state]` as a single-item array. Not a projection of all seeded cities.

### 3b. src/components/admin/LocationsTab.tsx (lines 67, 74)
- Edit path: `UPDATE service_areas SET city, slug, hero_title, intro, is_live, meta_* WHERE id = editingId`
- Add path: `INSERT INTO service_areas (tenant_id, city, slug, hero_title, intro, is_live, meta_*)`
- **NO JSONB sync** — settings.seo is never touched after save
- `toSlug()` (lines 21-25): strips non-alnum, appends `-tx` if not already present — no state-stripping, no normalization of input city name

### 3c. src/pages/admin/Onboarding.tsx (line 73)
- Upsert path: `ON CONFLICT (tenant_id, slug)` 
- Writes: city (raw user input), slug (raw user input), is_live=false
- **NO JSONB sync**

---

## 4. service_areas TABLE readers

| File | Line | Columns | Filter | Purpose |
|------|------|---------|--------|---------|
| src/components/admin/LocationsTab.tsx | 39, 46 | * | tenant_id | Admin list view |
| src/components/admin/seo/useSeoTab.ts | 45 | slug,city,is_live | tenant_id | SEO coverage stats |
| src/pages/ServiceArea.tsx | 35 | slug,city | tenant_id, is_live=true | Public service area list |
| src/pages/LocationPage.tsx | 41, 42 | city,meta,… / slug,city | tenant_id, slug, is_live | City page render + "We Also Serve" |
| src/pages/Sitemap.tsx | 84 | slug,updated_at | (implicit) | XML sitemap generation |
| src/pages/SlugRouter.tsx | 105 | (select) | tenant_id | SPA route resolution |
| src/hooks/useRevealReportData.ts | 29 | (select) | tenant_id | Reveal report generation |
| src/shells/metro-pro/MetroProCityPage.tsx | 38 | city,hero_title,meta_title | tenant_id, slug, is_live | Metro-pro city page |

---

## 5. settings.seo.service_areas JSONB writers

| File | Line | Behavior | Issue |
|------|------|----------|-------|
| supabase/functions/provision-tenant/index.ts | 504–511 | Writes `{ service_areas: [serviceArea] }` where `serviceArea = city + ', ' + state` (single string) | Not a projection of all seeded rows; wrong format |
| src/components/ironwood/SEOHealthPanel.tsx | 170 | Splits comma-separated form input → `string[]`, saves to settings.seo.service_areas directly | Correct format (array of strings); manual Ironwood edit path only |

---

## 6. settings.seo.service_areas JSONB readers

| File | Line | Usage |
|------|------|-------|
| src/lib/seoSchema.ts | 66 | Maps to `areaServed: [{ "@type": "City", name: area }]` in JSON-LD |
| src/components/PublicShell.tsx | 56, 90 | Reads for StructuredData JSON-LD injection |
| src/components/ironwood/QAGate.tsx | 61 | Checks `length > 0` for pre-provision QA score |
| src/components/ironwood/SEOHealthPanel.tsx | 93–94, 152, 170, 248 | Display + comma-edit + save |
| src/hooks/useRevealReportData.ts | 75 | `length > 0` for SEO score in reveal report |
| src/shells/metro-pro/MetroProLocationPage.tsx | 28 | "We Also Serve" sidebar list |
| src/components/ironwood/ClaudeContextDownload.tsx | 15 | Context export count |

---

## 7. Shell b9 — FALLBACK_CITIES hardcoded list

**File:** `src/pages/ServiceArea.tsx` lines 16–20

```typescript
const FALLBACK_CITIES: LocationItem[] = [
  { slug: 'tyler-tx', city: 'Tyler' }, { slug: 'longview-tx', city: 'Longview' },
  { slug: 'jacksonville-tx', city: 'Jacksonville' }, { slug: 'lindale-tx', city: 'Lindale' },
  { slug: 'bullard-tx', city: 'Bullard' }, { slug: 'whitehouse-tx', city: 'Whitehouse' },
]
```

Used as **initial state** (`useState<LocationItem[]>(FALLBACK_CITIES)`) on line 24.  
Replaced only when `locRes.data?.length > 0` on line 40.

**Problem:** Any tenant with zero live service_areas rows (empty state) sees East Texas cities instead of a graceful empty state. This will be replaced in Part B with a proper empty state.

---

## 8. Existing CHECK constraints on settings table

| Name | Constraint |
|------|------------|
| branding_no_legacy_template | key <> 'branding' OR value NOT HAVING 'template' key |
| business_info_no_year_founded | key <> 'business_info' OR value NOT HAVING 'year_founded' key |

`seo_service_areas_shape` does not exist yet — added by Part 0.

---

## 9. Unique constraints used in upsert calls

- `service_areas (tenant_id, city)` — used by provision-tenant Step 9c
- `service_areas (tenant_id, slug)` — used by Onboarding.tsx

**Risk for Part B:** shared helper must decide which conflict target to use. Design doc specifies `ON CONFLICT (tenant_id, slug)` since slug is the canonical dedup key.

---

## 10. Summary for Part B implementation

Three callers need updates:
1. **provision-tenant** (Step 9c + Step 9b): replace ad-hoc city seeding + single-item JSONB with `writeServiceAreas()` helper call
2. **LocationsTab.tsx** (handleSave + handleDelete + toggleLive): add JSONB projection sync after each write
3. **Onboarding.tsx** (handleLaunch): add JSONB projection sync after upsert

Shell b9 fix: replace `FALLBACK_CITIES` constant + `useState(FALLBACK_CITIES)` with `useState<LocationItem[]>([])` and render a graceful empty state when `locations.length === 0`.

Shared helper location: `supabase/functions/_shared/service-areas.ts` (new file per design doc).
