# T8 location_data -> service_areas hunt (s162.1)

## Summary

Total hits: 63 across 22 files.

| Category | Label | Count |
|----------|-------|-------|
| A (dead/doc) | Non-executing references in markdown, docs, prompt files, comments | 30 |
| B (active read) | `.from('location_data').select(...)` queries | 12 |
| C (active write) | `.insert` / `.update` / `.upsert` / `.delete` mutations | 5 |
| D (type def) | Type-file-only references | 0 |
| E (SQL migration) | Historical supabase/migrations/*.sql | 11 |
| F (edge function) | supabase/functions/** (different deploy pipeline) | 3 |
| G (other) | Standalone scripts (not deployed app code) | 2 |

Dang shell (`src/shells/dang/`) reads:  **0**
Dang shell (`src/shells/dang/`) writes: **0** ← must be 0 for Part B to proceed as planned

**Part B readiness: READY.** Dang shell has zero references to `location_data`. The view-alias shim is safe to create.

---

## Dang read/write classification

`src/shells/dang/` has **zero hits** for `location_data`. No reads, no writes.

The Dang shell was audited via `rg -n 'location_data' src/shells/dang/` — returned no output.

---

## Hits by file (non-Dang)

### `src/pages/LocationPage.tsx`

| Line | Category | Context |
|------|----------|---------|
| 41 | B — active read | `SELECT city, hero_title, intro_video_url, meta_title, meta_description, focus_keyword WHERE tenant_id + slug + is_live` — fetches the current location page's data |
| 42 | B — active read | `SELECT slug, city WHERE tenant_id + is_live + NOT slug` — fetches other live locations for "We Also Serve" section |

---

### `src/pages/Sitemap.tsx`

| Line | Category | Context |
|------|----------|---------|
| 84 | B — active read | `SELECT slug, updated_at WHERE tenant_id + is_live` — builds sitemap XML entries for location pages |

---

### `src/pages/SlugRouter.tsx`

| Line | Category | Context |
|------|----------|---------|
| 105 | B — active read | `SELECT id WHERE tenant_id + slug + is_live` — determines if a slug resolves to a service area page for route dispatch |

---

### `src/pages/ServiceArea.tsx`

| Line | Category | Context |
|------|----------|---------|
| 35 | B — active read | `SELECT slug, city WHERE tenant_id + is_live` — fetches all live service areas to render the service area index page |

---

### `src/hooks/useRevealReportData.ts`

| Line | Category | Context |
|------|----------|---------|
| 29 | B — active read | `SELECT slug, city WHERE tenant_id + is_live` — populates reveal report data for Ironwood's client reveal call |

---

### `src/shells/metro-pro/MetroProCityPage.tsx`

| Line | Category | Context |
|------|----------|---------|
| 38 | B — active read | `SELECT city, hero_title, meta_title WHERE tenant_id + slug + is_live` — fetches location data for Metro Pro shell city page |

---

### `src/components/admin/LocationsTab.tsx`

| Line | Category | Context |
|------|----------|---------|
| 39 | B — active read | `SELECT * WHERE tenant_id ORDER BY city` — `fetchServiceAreas()` function, reloads list after mutations |
| 46 | B — active read | `SELECT * WHERE tenant_id ORDER BY city` — `useEffect` initial load on mount |
| 67 | C — active write | `.update({ city, slug, hero_title, intro, is_live, ...seoFields }).eq('id', editingId)` — saves edits to existing service area |
| 74 | C — active write | `.insert({ tenant_id, city, slug, hero_title, intro, is_live, ...seoFields })` — creates new service area row |
| 86 | C — active write | `.delete().eq('id', deleteTarget.id)` — deletes a service area |
| 95 | C — active write | `.update({ is_live: !loc.is_live }).eq('id', loc.id)` — toggles live status |

---

### `src/components/admin/seo/useSeoTab.ts`

| Line | Category | Context |
|------|----------|---------|
| 45 | B — active read | `SELECT slug, city, is_live WHERE tenant_id` — loads location list for SEO tab URL grid |

---

### `src/pages/admin/Onboarding.tsx`

| Line | Category | Context |
|------|----------|---------|
| 73 | C — active write | `.upsert(locationRows, { onConflict: 'tenant_id,slug' })` — bulk-seeds locations from client onboarding form |

---

### `app/tenant/[slug]/_lib/queries.ts`

| Line | Category | Context |
|------|----------|---------|
| 60 | B — active read | `getAllLocations()` — `SELECT * WHERE tenant_id + is_live ORDER BY city` — Next.js ISR cached read for all live locations |
| 77 | B — active read | `getLocation()` — `SELECT * WHERE tenant_id + slug` — Next.js ISR cached read for a single location page |

---

### `SKILL.md`

| Line | Category | Context |
|------|----------|---------|
| 28 | A — dead doc | Architecture table list: `location_data, testimonials, leads, settings, ...` |
| 163 | A — dead doc | Setup step: `seeds tenants + settings + location_data` — reference to create-demo-tenant.mjs |

---

### `TASKS.md`

| Line | Category | Context |
|------|----------|---------|
| 35 | A — dead doc | Completed task: `Service Area page (reads from location_data table)` |
| 124 | A — dead doc | Completed task: `"We Also Serve" section (nearby cities from location_data)` |
| 131 | A — dead doc | Completed task: `Admin: bulk location import (CSV upload → creates location_data rows)` |
| 140 | A — dead doc | Open task: `Location-specific SEO — unique meta tags per location page from location_data` |

---

### `s134-modern-pro-crash-fix.txt`

| Line | Category | Context |
|------|----------|---------|
| 3 | A — dead doc | Prompt/context file describing crash scenario: `team_members, location_data, faq_items` |
| 9 | A — dead doc | Task description in prompt file: `Find where modern-pro fetches team_members and location_data` |

---

### `docs/s159-3a-inventory.md`

All 19 hits are Category A — dead doc. Prior inventory document from session s159.3. No executing code.

| Lines | Category | Context |
|-------|----------|---------|
| 20, 25 | A — dead doc | Inventory table rows describing T3 and T8 migration targets |
| 191, 203, 204, 210–213 | A — dead doc | T3 analysis section: column details, index names, RLS policy names |
| 465, 469, 471, 473 | A — dead doc | T8 analysis section: table stats, rename rationale |
| 495, 500 | A — dead doc | T8 migration plan notes; notes provision-tenant has log string only |
| 553, 573, 615, 617 | A — dead doc | Summary table rows and RLS policy name discussion |

---

### `docs/VOCABULARY.md`

| Line | Category | Context |
|------|----------|---------|
| 38 | A — dead doc | Vocab entry: `DB schema renames (S159.3): ..., location_data.intro_video_url, ...` |

---

### `docs/VOCAB_BRIDGE.md`

| Line | Category | Context |
|------|----------|---------|
| 15 | A — dead doc | Bridge table: `service_area` ↔ `location_data` with note rename deferred |
| 67 | A — dead doc | Bridge table: `location_data DB table` → `rename to service_areas` |

---

## Edge functions using location_data

### `supabase/functions/provision-tenant/index.ts`

| Line | Category | Context |
|------|----------|---------|
| 532 | A within F | Comment: `// 9c: Seed location_data rows — primary city + nearby cities from zip-prefix lookup` — non-executing |
| 564 | C within F — **WRITE** | `.upsert({ tenant_id, city, slug, hero_title, is_live: false, meta_title, meta_description, focus_keyword }, { onConflict: 'tenant_id,city' })` — seeds location rows for all cities derived from zip prefix during tenant provisioning |
| 575 | A within F | `console.log(...)` log string: `[provision-tenant] location_data seeded for...` — non-executing reference |

**Deploy note:** This edge function is deployed separately via `supabase functions deploy provision-tenant`. After Part B creates the `location_data` view alias, this function will continue to work without code changes. The log string at line 575 may optionally be updated in Part C for consistency but is not functionally required.

---

## SQL migrations / seed files referencing location_data

Historical record — do not modify.

| File | Lines | Content |
|------|-------|---------|
| `supabase/migrations/20260329_initial_schema.sql` | 80, 91, 180 | `CREATE TABLE public.location_data (...)`, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, `CREATE POLICY "tenant_access_location_data"` |
| `supabase/migrations/20260405_fix_rls_policies.sql` | 36–38 | `DROP POLICY "tenant_access_location_data"`, `CREATE POLICY "tenant_isolation_location_data"` |
| `supabase/migrations/20260406_s68_fix_public_read_policies.sql` | 40–44 | `CREATE POLICY "anon_read_location_data"`, `CREATE POLICY "auth_read_all_location_data"` |

None of these contain INSERT/UPDATE/seed data — all are DDL only. No seed migration risk.

---

## Types file exposure

Category D — **zero hits.** No `location_data` references found in any type definition file, `supabase.ts` Database generic, or `Tables<>` usage. The table is accessed via runtime Supabase client calls only, not through typed Database generics.

---

## Other (scripts — not deployed app code)

### `scripts/create-demo-tenant.mjs`

| Line | Category | Context |
|------|----------|---------|
| 79 | G — script write | `.insert({ tenant_id: TENANT_ID, city: 'Longview', slug: 'longview-tx', hero_title: 'Longview Pest Control', is_live: true })` — dev script that seeds a demo tenant; run manually, not deployed |

### `scripts/migrate-dang.ts`

| Line | Category | Context |
|------|----------|---------|
| 67 | G — script read | `if (locCount === 0) await migrate('location_data')` — one-time Dang migration script; tries `locations` table first, falls back to `location_data` if empty. Read-only path. Not deployed. |

**Note on `migrate-dang.ts`:** After Part B, both `location_data` and `service_areas` resolve (view alias), so this script continues to work as-is. No action needed.

---

## Part B readiness assessment

- [x] **Dang shell has zero write paths → view shim is safe.** `src/shells/dang/` has zero `location_data` references of any kind. PostgREST write-over-view concern is moot.
- [x] **All non-Dang callers are enumerated and scoped for Part C rewrite.** 9 src/app files with 17 total query hits: 5 writes (LocationsTab ×4, Onboarding ×1), 12 reads. All are standard Supabase client calls — straightforward string swap in Part C.
- [x] **Edge functions enumerated.** One edge function: `provision-tenant` (line 564 is a write). Needs a `supabase functions deploy provision-tenant` after Part C updates the string, but the view alias means it is NOT broken between Part B and Part C deployment.
- [x] **No surprising references in scripts/CI that could fire post-rename and hit the base table by name.** Both scripts (`create-demo-tenant.mjs`, `migrate-dang.ts`) are manually-invoked dev utilities. No CI pipeline references found.

**READY for Part B (DDL + view alias via Supabase MCP in planning chat).**
