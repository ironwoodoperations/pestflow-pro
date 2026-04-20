# S159.3a — DB Schema Inventory

_Generated: 2026-04-19. Read-only session. Seeds the Phase 1.3 per-migration validation gates._

---

## Access method used

- Tool: **Supabase MCP** (service role — bypasses RLS)
- Project ID confirmed: `biezzykcgzkrwdgqpsar`

---

## Summary table

| # | Target | Current DB state | Partial migration? | Code refs | RLS policies | Preliminary risk |
|---|---|---|---|---|---|---|
| 1 | `social_posts.scheduled_at` vs `scheduled_for` | Only `scheduled_for` exists in DB | **No** — code bug only | `scheduled_at`: 4 refs (bug), `scheduled_for`: 20 refs | 2 policies | **Low** — no DDL needed |
| 2 | `faqs` vs `faq_items` | Both tables exist; `faqs` = 55 rows, `faq_items` = 3 rows | **No** — separate tables | `faqs`: 48 refs, `faq_items`: 1 ref | 3 on faqs, 3 on faq_items | **Low-Med** — drop orphan table |
| 3 | `location_data.intro_video_url` | Column exists, **0/16 rows non-null** | No | 3 code refs (LocationPage.tsx) | Inherits from location_data (4 policies) | **Low** — pure DROP |
| 4 | `profiles.role` rename to `display_role` | Only `role` exists; `display_role` does not | **No** | `role` generic: 15 files; `display_role`: 0 | 1 policy (uid-only) | **Med** — auth ambiguity risk |
| 5 | `page_content` image column unification | 9 image columns; image_4/5/6_url all-null; image_url=19 non-null; image_urls=84/84 | No | image_url: 44, image_urls: 12, page_hero_image_url: 10 | 4 policies | **High** — many live code refs |
| 6 | `settings.hero_media` JSONB sprawl | 5 rows; 8 distinct keys; 3 undocumented (`url`, `mode`, `type`) | No | hero_media: 17, thumbnail_url: 30, youtube_id: 25, video_url: 13 | Inherits from settings (4 policies) | **Med** — JSONB key rename |
| 7 | `business_info.founded_year` vs `year_founded` | `founded_year` in 5/5 rows; `year_founded` in 1/5 rows (drift) | **Yes** — 1 tenant has wrong key | `founded_year`: 49 refs; `year_founded`: 0 refs | Inherits from settings (4 policies) | **Very Low** — 1-row JSONB fix |
| 8 | `location_data` table rename to `service_areas` | Table still named `location_data`; code already uses `service_area` symbols | **Yes** — code renamed, DB not | 15 code refs (9 files), 10 migration refs | 4 policies | **Low-Med** — rename + migrations |
| 9 | `settings.branding->template` key rename to `theme` | Key `template` in all 5 branding rows | **Yes** — code uses `theme` symbols | "template" string literal: 4 files | Inherits from settings (4 policies) | **Low** — JSONB UPDATE + 4 files |

---

## Target 1: `social_posts` — `scheduled_at` vs `scheduled_for`

### Schema

| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() |
| tenant_id | uuid | NO | — |
| platform | text | NO | — |
| caption | text | NO | — |
| image_url | text | YES | — |
| status | text | YES | 'draft' |
| fb_post_id | text | YES | — |
| **scheduled_for** | **timestamptz** | **YES** | **—** |
| created_at | timestamptz | YES | now() |
| published_at | timestamptz | YES | — |
| error_msg | text | YES | — |
| campaign_id | uuid | YES | — |
| ai_generated | boolean | YES | false |
| campaign_title | text | YES | — |
| archived_at | timestamptz | YES | — |
| zernio_post_id | text | YES | — |

### Indexes

| name | definition |
|---|---|
| social_posts_pkey | UNIQUE btree (id) |
| social_posts_archived_idx | btree (archived_at) WHERE archived_at IS NULL |

### RLS policies

| policy | cmd | roles | qual |
|---|---|---|---|
| tenant_isolation_social_posts | ALL | authenticated | tenant_id = current_tenant_id() |
| social_posts_anon_read | SELECT | anon | true |

### Foreign keys

- `social_posts.campaign_id → social_campaigns.id`

### Data state

- Total rows: **17**
- `scheduled_for` non-null: **6**, null: **11**
- `scheduled_at`: **column does not exist in DB**

### Partial-migration state

Only `scheduled_for` found in schema. `scheduled_at` is absent. This is NOT a partial DB migration — it is a **code bug only**: `DashboardSocialWidget.tsx` queries `.select('id, scheduled_at, status, created_at')`, which causes a 400 error because the column does not exist. All other social code (20 refs) already correctly uses `scheduled_for`.

### Code references

- `scheduled_at` total: **4** — all in `src/components/admin/dashboard/DashboardSocialWidget.tsx`
  - Lines 5, 24, 41, 85 — TypeScript interface, select query, date format fallback, display render
- `scheduled_for` total: **20**
  - src/components/admin/social/ContentQueueTab.tsx (5)
  - src/components/admin/social/EditPostModal.tsx (4)
  - src/components/admin/social/usePublishPost.ts (3)
  - src/components/admin/social/useComposer.ts (3)
  - src/components/admin/social/ComposerScheduler.tsx (2)
  - src/components/admin/social/useSocialData.ts (1)
  - src/components/admin/social/PostCard.tsx (1)
  - src/components/admin/social/NewCampaignModal.tsx (1)

### Edge function / migration references

- `supabase/functions/publish-scheduled-posts/index.ts`: uses `scheduled_for` throughout (lines 42, 87, 94)
- `supabase/functions/post-to-social/index.ts`: uses `scheduled_for` (lines 95, 96, 176)
- `supabase/migrations/20260329_initial_schema.sql` line 170: `scheduled_for timestamptz`

### Preliminary migration sketch

No DDL required. `scheduled_for` is the canonical name and is the only column in DB. Fix: update `DashboardSocialWidget.tsx` to use `scheduled_for` instead of `scheduled_at` in the TypeScript interface, the `.select()` call, and the two display references.

### Risk flags

- **Active 400 error** in production dashboard widget — this is the known bug referenced in the prompt. Pure code fix.
- No DDL, no RLS update, no data backfill needed.

---

## Target 2: `faqs` vs `faq_items`

### Schema — `faqs`

| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| tenant_id | uuid | NO | — |
| question | text | NO | — |
| answer | text | NO | — |
| **category** | **text** | **NO** | **'General'** |
| sort_order | integer | NO | 0 |
| created_at | timestamptz | YES | now() |

### Schema — `faq_items`

| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| tenant_id | uuid | NO | — |
| question | text | NO | — |
| answer | text | NO | — |
| sort_order | integer | YES | 0 |
| created_at | timestamptz | YES | now() |
| _(no category)_ | | | |

### Indexes

- `faqs`: pkey + `faqs_tenant_id_idx` (btree tenant_id) + `faqs_category_idx` (btree tenant_id, category)
- `faq_items`: pkey only

### RLS policies

**faqs:**

| policy | cmd | roles | qual |
|---|---|---|---|
| faqs_anon_read | SELECT | anon | true |
| faqs_auth_all | ALL | authenticated | tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()) |

**faq_items:**

| policy | cmd | roles | qual |
|---|---|---|---|
| anon_read | SELECT | anon | true |
| ironwood_admin_faq_items_write | ALL | authenticated | current_tenant_id() = '9215b06b-...' (hardcoded Demo Tenant ID) |
| tenant_isolation | ALL | public | tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1) |

### Foreign keys

- `faqs.tenant_id → tenants.id`
- `faq_items`: **no FK constraint** to tenants

### Data state

- `faqs`: **55 rows**
- `faq_items`: **3 rows**

### Code references

- `faqs` total: **48** across 15+ files (FaqTab, FAQPage, SEOHead, seoSchema, PestPageTemplate, shell components, multiple pest-page components)
- `faq_items` total: **1** — only in `src/pages/FAQPage.tsx`

### Edge function / migration references

- `supabase/seeds/dang_faqs.sql`: inserts into `faqs`
- `supabase/migrations/20260406_s61_faq_items.sql`: creates `faq_items` table (S61 — added late)

### Preliminary migration sketch

`faqs` is the canonical table: 55 rows, FK to tenants, category support, 48 code refs, category-optimized indexes. `faq_items` is orphaned drift from S61 with 3 rows, no FK, 1 code ref. Migration: inspect the 3 `faq_items` rows to determine if any need migrating to `faqs`; drop `faq_items`; update the 1 code ref in FAQPage.tsx.

### Risk flags

- `faq_items.ironwood_admin_faq_items_write` policy hardcodes the Demo Tenant UUID — this is a code smell but not a blocker.
- Verify the 3 `faq_items` rows are test data before dropping.

---

## Target 3: `location_data.intro_video_url`

### Schema (relevant column only)

| column | type | nullable |
|---|---|---|
| intro_video_url | text | YES |

Full table columns: id, tenant_id, city, slug, hero_title, is_live, intro_video_url, created_at, meta_title, meta_description, focus_keyword, intro

### Indexes

- `location_data_pkey` (id)
- `location_data_tenant_id_slug_key` UNIQUE (tenant_id, slug)

### RLS policies

| policy | cmd | roles | qual |
|---|---|---|---|
| tenant_isolation_location_data | ALL | authenticated | tenant_id = current_tenant_id() |
| anon_read_location_data | SELECT | anon | true |
| auth_read_all_location_data | SELECT | authenticated | true |
| ironwood_admin_location_data_write | ALL | authenticated | current_tenant_id() = Demo Tenant ID |

### Foreign keys

None.

### Data state

- Total rows: **16**
- `intro_video_url` non-null: **0** — completely unused in production data

### Code references

- Total: **3** — all in `src/pages/LocationPage.tsx`

### Edge function / migration references

- `supabase/migrations/20260329_initial_schema.sql` line 87: `intro_video_url text,`
- No edge function references.

### Preliminary migration sketch

Pure DROP COLUMN: zero production data, added in S158 but never populated. Requires removing 3 code references in `LocationPage.tsx` before or concurrent with DDL.

### Risk flags

- None beyond the 3 code refs. Lowest-risk DDL change in this session.

---

## Target 4: `profiles.role` — rename to `display_role`?

### Schema

| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | — |
| tenant_id | uuid | NO | — |
| full_name | text | YES | — |
| **role** | **text** | **YES** | **—** |
| created_at | timestamptz | YES | now() |

### Indexes

- `profiles_pkey` (id) — no index on role

### RLS policies

| policy | cmd | roles | qual |
|---|---|---|---|
| tenant_access_profiles | ALL | public | auth.uid() = id |

### Foreign keys

None (id is FK target for user_roles.user_id but not a declared FK constraint).

### Data state

- Total rows: **6**
- `role` non-null: **5** (all values: `"admin"`)
- `role` null: **1** (orphaned profile row)
- `display_role` column: **does not exist**

### Partial-migration state

Only `role` exists. `display_role` not present. 0 code refs to `display_role`.

### Role ambiguity context

Two other tables also have a `role` column:
- `user_roles` table: `role` column, 7 rows, all values `"admin"` — this is the **authoritative** auth/access-control role
- `tenant_users` table: `role` column — queried by `ProtectedRoute.tsx` for admin gate (`.eq('role', 'admin')`)

`profiles.role` appears to be a denormalized display field. The 15 code files that reference `role` are largely referencing other tables (tenant_users, user_roles) or the Claude API `role: 'user'` message format — not `profiles.role` directly.

### Code references

- `role` (generic, across all tables): 15 files
  - Notable: `ProtectedRoute.tsx` queries `tenant_users.role`, not `profiles.role`
  - `useComposer.ts` refs are Claude API message roles, not DB
- `display_role`: **0** refs

### Preliminary migration sketch

Rename `profiles.role → profiles.display_role` to eliminate the ambiguity with `user_roles.role` and `tenant_users.role`. Requires: audit which of the 15 `role` refs actually query `profiles` (likely very few), update those refs, apply `ALTER TABLE profiles RENAME COLUMN role TO display_role`.

### Risk flags

- Auth guards may query `profiles.role` without it being visible in grep results (dynamic key access, RPC functions). Full audit required before rename.
- 1 null profile row needs investigation — may indicate provisioning gap.

---

## Target 5: `page_content` image columns

### Schema (image columns only)

| column | type | nullable | non-null rows (of 84) | code refs |
|---|---|---|---|---|
| image_url | text | YES | **19** | **44** |
| image_urls | jsonb | YES | **84** (all rows) | 12 |
| page_hero_image_url | text | YES | **2** | 10 |
| image_1_url | text | YES | **2** | 7 |
| image_2_url | text | YES | **0** | 5 |
| image_3_url | text | YES | **0** | 5 |
| image_4_url | text | YES | **0** | **0** |
| image_5_url | text | YES | **0** | **0** |
| image_6_url | text | YES | **0** | **0** |

Other columns: id, tenant_id, page_slug, title, subtitle, intro, video_url, video_type, created_at, updated_at, hero_headline

### Indexes

- `page_content_pkey` (id)
- `page_content_tenant_id_page_slug_key` UNIQUE (tenant_id, page_slug)

### RLS policies

| policy | cmd | roles | qual |
|---|---|---|---|
| tenant_isolation_page_content | ALL | authenticated | tenant_id = current_tenant_id() |
| anon_read_page_content | SELECT | anon | true |
| auth_read_all_page_content | SELECT | authenticated | true |
| ironwood_admin_page_content_write | ALL | authenticated | current_tenant_id() = Demo Tenant ID |

### Foreign keys

None.

### Data state

- Total rows: **84**
- `image_urls` (jsonb array, default `[]`): non-null in **all 84 rows** — this is the canonical multi-image field
- `image_url`: 19 non-null — legacy single-image field, still actively used in code (44 refs)
- `page_hero_image_url`: 2 non-null, 10 code refs — specialized hero slot, in active use
- `image_1_url`: 2 non-null, 7 code refs — numbered slot, partially used
- `image_2_url`, `image_3_url`: **0 non-null**, 5 code refs each — code scaffolded but never populated
- `image_4_url` through `image_6_url`: **0 non-null, 0 code refs** — pure orphans

### Preliminary migration sketch

Three distinct actions, best separated into micro-migrations:
1. **Safe DROP** (no risk): `image_4_url`, `image_5_url`, `image_6_url` — zero data, zero code refs.
2. **Code cleanup then DROP**: `image_2_url`, `image_3_url` — zero data, remove 10 code refs, then drop columns.
3. **Policy decision needed**: `image_url` (legacy) vs `image_urls` (jsonb canonical). `image_url` has 19 production rows and 44 code refs — cannot drop without data migration into `image_urls`. Recommend: backfill `image_url` values into `image_urls[0]` where not already present; then deprecate column.

### Risk flags

- `image_url` has 44 code refs across many components — highest risk item in this table.
- `image_urls` default is `'[]'::jsonb` — all 84 rows have it, but content may be empty arrays. Check actual array lengths before assuming populated.
- No FK constraints — no cascade risk.

---

## Target 6: `settings.hero_media` JSONB sprawl

### Settings table schema

| column | type | nullable |
|---|---|---|
| id | uuid | NO |
| tenant_id | uuid | NO |
| key | text | NO |
| value | jsonb | YES |
| updated_at | timestamptz | YES |
| google_search_console_verification | text | YES |

Unique index: (tenant_id, key)

### hero_media JSONB key inventory

5 rows with `key = 'hero_media'`, all non-null.

| JSONB key | occurrences (of 5 rows) | code refs |
|---|---|---|
| thumbnail_url | **5** | 30 |
| youtube_id | **5** | 25 |
| video_url | 2 | 13 |
| url | 2 | _(undocumented)_ |
| image_url | 2 | 44 _(shared with page_content)_ |
| master_hero_image_url | 2 | 5 |
| mode | 2 | _(undocumented)_ |
| type | 1 | _(undocumented)_ |

### RLS policies (settings table)

| policy | cmd | roles | qual |
|---|---|---|---|
| anon_read_settings | SELECT | anon | true |
| tenant_isolation_settings_auth | ALL | authenticated | tenant_id = current_tenant_id() |
| auth_read_all_settings | SELECT | authenticated | true |
| ironwood_admin_settings_write | ALL | authenticated | current_tenant_id() = Demo Tenant ID |

### Preliminary migration sketch

Two stable keys (`thumbnail_url`, `youtube_id`) appear in all 5 rows and have the most code refs — these are de facto canonical. Three keys are undocumented in CLAUDE.md: `url`, `mode`, `type`. Recommend: define the canonical JSONB schema (thumbnail_url, youtube_id, video_url, master_hero_image_url, image_url are all defensible); drop undocumented keys via JSONB UPDATE on affected rows; update code to use canonical keys only.

### Risk flags

- `url`, `mode`, `type` keys are not referenced in CLAUDE.md — unknown purpose. Must inspect actual row values before deciding to drop.
- `image_url` key in hero_media conflicts semantically with `page_content.image_url` — same name, different scope. Renaming one risks confusion.
- Only 5 rows total — low data risk, but each row represents a live tenant's hero configuration.

---

## Target 7: `business_info.founded_year` vs `year_founded`

### business_info JSONB key inventory (settings where key = 'business_info')

5 rows total.

| JSONB key | occurrences | code refs |
|---|---|---|
| email | 5 | |
| license | 5 | |
| industry | 5 | |
| tagline | 5 | |
| hours | 5 | |
| phone | 5 | |
| **founded_year** | **5** | **49** |
| address | 5 | |
| name | 5 | |
| num_technicians | 4 | |
| certifications | 4 | |
| owner_name | 2 | _(undocumented in CLAUDE.md)_ |
| after_hours_phone | 2 | _(undocumented in CLAUDE.md)_ |
| **year_founded** | **1** | **0** |

### Partial-migration state

Both keys exist on the **same table** (one tenant has `year_founded` instead of `founded_year`):
- `founded_year` present: 5 rows
- `year_founded` present: 1 row (one tenant has the wrong key — overlap with founded_year unknown without row-level inspection)
- Code refs to `year_founded`: **0**
- `provision-tenant/index.ts` line 217: normalizes on write via `wbi.founded_year || wbi.year_founded || ''` — the bug is contained at ingest but old data was not backfilled.

### Code references

- `founded_year`: **49** refs across `BusinessInfoSection.tsx`, `SEOHealthPanel.tsx`, multiple shell Hero components, `seoSchema.ts`, `ProspectDetail.IntakeLink.tsx`, `package-claude-context` and `package-bolt-context` edge functions
- `year_founded`: **0** code refs — dead in code

### Preliminary migration sketch

Minimal: for the 1 tenant with `year_founded`, run `UPDATE settings SET value = (value - 'year_founded') || jsonb_build_object('founded_year', value->>'year_founded') WHERE key = 'business_info' AND value ? 'year_founded'`. No code changes needed. Also note: `owner_name` and `after_hours_phone` are undocumented bonus keys present in 2 rows each — no action needed unless the spec is to enforce strict key schemas.

### Risk flags

- Lowest-risk DDL target. Single JSONB UPDATE, no column rename, no code changes.
- `owner_name` and `after_hours_phone` are likely valid but undocumented fields — flag for CLAUDE.md update.

---

## Target 8 (aux): `location_data` table rename to `service_areas`

### Current state

Table: `location_data` — 16 rows, unique index on (tenant_id, slug), 4 RLS policies.

Code already uses `service_area` symbols throughout (renamed in s159.2.4). DB still named `location_data`.

### Code references to `location_data` literal

- Total: **15** in 9 files
  - src/components/admin/LocationsTab.tsx (6)
  - src/pages/LocationPage.tsx (2)
  - src/shells/metro-pro/MetroProCityPage.tsx (1)
  - src/pages/admin/Onboarding.tsx (1)
  - src/pages/SlugRouter.tsx (1)
  - src/pages/Sitemap.tsx (1)
  - src/pages/ServiceArea.tsx (1)
  - src/hooks/useRevealReportData.ts (1)
  - src/components/admin/seo/useSeoTab.ts (1)

### Edge function / migration references

- `supabase/functions/provision-tenant/index.ts` line 575: log string (safe — not a query)
- `supabase/migrations/20260329_initial_schema.sql` lines 80, 91, 180: table creation
- `supabase/migrations/20260405_fix_rls_policies.sql` lines 36–38: policy rewrite
- `supabase/migrations/20260406_s68_fix_public_read_policies.sql` lines 40–44: anon read policy

### Preliminary migration sketch

`ALTER TABLE location_data RENAME TO service_areas;` + update all 4 RLS policy names (policies survive rename but their names still say `location_data`) + update 15 code refs + update 1 edge function log string. No FK cascade risk (no other table references `location_data`). Migration comment in new file should note this is completing the s159.2.4 code rename.

### Risk flags

- Migration file names reference old name — new migration must document the rename chain.
- `provision-tenant` function has `location_data` in a log string only (line 575) — not a query; safe to update any time.

---

## Target 9 (aux): `settings.branding->template` key rename to `theme` — ✓ CLOSED 2026-04-20 (s160.1/s160.2/s160.3)

### branding JSONB key inventory

5 rows with `key = 'branding'`, all non-null.

| JSONB key | occurrences | notes |
|---|---|---|
| primary_color | 5 | |
| **template** | **5** | → rename to `theme` |
| cta_text | 5 | |
| accent_color | 5 | |
| favicon_url | 5 | |
| logo_url | 5 | |
| apply_hero_to_all_pages | 2 | undocumented in CLAUDE.md |

### Partial-migration state

Code uses `theme` symbols (renamed in s159.2); JSONB key in DB is still `template`. This is the mirror of Target 8: code ahead of DB.

### Code references to `"template"` string literal

- Total files with `"template"` or `'template'` literal: **4**
  - src/pages/admin/OnboardingLive.tsx (7 refs)
  - src/components/ironwood/ProspectDetail.Branding.tsx (1)
  - src/components/admin/settings/BrandingSection.tsx (1)
  - src/components/admin/onboarding/StepBranding.tsx (1)

No migration or edge function references to this JSONB key.

### Preliminary migration sketch

`UPDATE settings SET value = (value - 'template') || jsonb_build_object('theme', value->>'template') WHERE key = 'branding' AND value ? 'template';` — updates all 5 rows atomically. Then update the 4 code files to use `theme` key string. `apply_hero_to_all_pages` key in 2 rows: undocumented but harmless; add to CLAUDE.md.

### Risk flags

- `applyShellTheme()` and localStorage key `pfp_template` also use the old "template" vocabulary (not in scope of this rename, but related — flag for s159.3b).
- Flash-prevention code in app init reads `localStorage.getItem('pfp_template')` — this is a client-side key, independent of the DB JSONB key, but both need to be consistent.

---

## Cross-cutting findings

### Partial migrations already in progress

These targets have the **code renamed but DB not yet updated** — the reverse direction from Target 1:

| Target | Code state | DB state |
|---|---|---|
| 8 — location_data → service_areas | Code uses `service_area` symbols | Table still `location_data` |
| 9 — branding.template → theme | `applyTheme()`, `THEME_CONFIGS` in code | JSONB key still `template` |
| 7 — year_founded (partial data drift) | Code uses `founded_year` only | 1 tenant row has `year_founded` key |

### Orphaned columns (exist in DB but zero code refs)

| Table | Column | Non-null rows | Action |
|---|---|---|---|
| page_content | image_4_url | 0 | DROP |
| page_content | image_5_url | 0 | DROP |
| page_content | image_6_url | 0 | DROP |

### Orphaned table

| Table | Rows | Verdict |
|---|---|---|
| faq_items | 3 | Orphaned drift from S61. `faqs` is canonical. Inspect 3 rows, then DROP. |

### RLS policies that reference target columns in USING/WITH CHECK

None of the 9 targets involve columns referenced directly inside USING/WITH CHECK clauses. All RLS policies use `tenant_id = current_tenant_id()` or `auth.uid() = id`. Column renames do not require RLS policy updates — **except** that the policy *names* on `location_data` will become misleading after the table rename (policy names survive `ALTER TABLE RENAME` but still say `location_data`). Those should be dropped and recreated with `service_areas` names in the migration.

### JSONB keys referenced in code by string literal

These JSONB key renames require code updates in addition to DDL/DML:

| JSONB key | Setting key | String literal refs | Files |
|---|---|---|---|
| `template` → `theme` | branding | 10 total (52 `.template` property accesses, 10 `"template"` string literals) | OnboardingLive.tsx, ProspectDetail.Branding.tsx, BrandingSection.tsx, StepBranding.tsx |
| `youtube_id` | hero_media | 25 refs | multiple components |
| `thumbnail_url` | hero_media | 30 refs | multiple components |
| `video_url` | hero_media | 13 refs | multiple components |
| `master_hero_image_url` | hero_media | 5 refs | multiple components |

### Undocumented JSONB keys discovered

These keys exist in production data but are not in CLAUDE.md:

| Setting key | JSONB key | Occurrences | Notes |
|---|---|---|---|
| business_info | `owner_name` | 2 | Likely valid — add to CLAUDE.md |
| business_info | `after_hours_phone` | 2 | Likely valid — add to CLAUDE.md |
| hero_media | `url` | 2 | Unknown purpose — inspect before deciding |
| hero_media | `mode` | 2 | Unknown purpose — inspect before deciding |
| hero_media | `type` | 1 | Unknown purpose — inspect before deciding |
| branding | `apply_hero_to_all_pages` | 2 | Likely valid feature flag — add to CLAUDE.md |

### Unexpected findings

1. **`page_content` has `image_4_url` through `image_6_url`** — the spec named only `image_1_url` through `image_3_url`. Three extra columns exist that are completely unused.
2. **`profiles.role` and `user_roles.role` are both all-`"admin"`** — two tables tracking the same thing. `ProtectedRoute.tsx` actually reads `tenant_users.role` (a third table). The `profiles.role` field may be vestigial.
3. **`faq_items` has no FK to `tenants`** — `faqs` does. This omission in S61 means `faq_items` rows cannot be orphan-detected by the standard FK constraint check.
4. **`social_posts.scheduled_at` does not exist at all in DB** — the known 400 error is purely a stale code reference, not a partial migration. Zero DDL required to fix.
5. **`settings` table has a bare `google_search_console_verification` text column** at the root level (not inside a JSONB key) — this is inconsistent with the key/value pattern. Not a target for this session but worth noting.

### Recommended migration ordering (safest to riskiest)

| Rank | Target | Reason |
|---|---|---|
| 1 | **T1 — Fix `scheduled_at` code bug** | No DDL, no migration, just 4 lines of code. Fixes live 400 error. |
| 2 | **T7 — `year_founded` → `founded_year` JSONB fix** | 1-row JSONB UPDATE, no code changes, no column rename. |
| 3 | **T9 — `branding.template` → `theme` JSONB key** | Small JSONB UPDATE (5 rows) + 4 code files. Low blast radius. |
| 4 | **T3 — DROP `location_data.intro_video_url`** | Zero data, 3 code refs. Pure DROP + minor code cleanup. |
| 5 | **T2 — DROP `faq_items` table** | 3-row table, 1 code ref. Inspect rows first; then drop. |
| 6 | **T8 — Rename `location_data` → `service_areas`** | No data risk, but touches 15 code refs + 4 policies + 3 migration files. |
| 7 | **T4 — `profiles.role` → `display_role`** | Requires auth flow audit. Medium blast radius. |
| 8 | **T5 (phase a) — DROP `image_4/5/6_url`** | Zero data, zero code refs. Safe isolated drop from the larger image unification. |
| 9 | **T5 (phase b) — Full image column unification** | 44 code refs to `image_url`, complex deprecation path. Highest risk. Save for last. |
| — | **T6 — `hero_media` JSONB normalization** | Blocked on inspecting undocumented keys (`url`, `mode`, `type`). Do not execute until row values are reviewed. |

---

_End of inventory. 9/9 targets covered. No mutations performed this session._
