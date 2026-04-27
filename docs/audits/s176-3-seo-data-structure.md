# S176.3 — SEO Data Structure (Dang)

## Critical finding up front
The Dang Vite shell **does not read `seo_meta`** at runtime. Each Dang page
component (`src/shells/dang/pages/*.tsx`) passes hardcoded title/description
strings directly to `<SEO>` (`src/shells/dang/SEO.tsx:14`). The `seo_meta` table
IS fully populated (admin writes to it via `SeoAioTab`), but the current public
shell ignores it. The Phase 3A edge fn should read `seo_meta` — it will produce
**better** titles than the current SPA on first render.

---

## settings.seo JSONB shape

Table: `settings`, key = `'seo'`. One row per tenant.

| Key | Type | Dang value (truncated) | Notes |
|---|---|---|---|
| `meta_description` | string | "Dang Pest Control provides expert pest control…" | Site-wide fallback description |
| `owner_name` | string | `"Kirk"` | Used in structured data |
| `founded_year` | string | `"2018"` | Used in structured data |
| `service_areas` | string[] | `["Bullard","Canton","Henderson",…9 total]` | Used in LocalBusiness schema |
| `certifications` | string[] | `["Licensed by Texas Dept of Agriculture","TPCL Certified"]` | Used in structured data |

**No `meta_title` key exists in `settings.seo` for either Dang or Demo.**
The `settings` table also has a top-level column `google_search_console_verification`
(text, nullable) — distinct from the JSONB blob. Dang's value: `null`.

Demo shape: identical keys, all values empty string or empty array (default state).
No schema divergence — Demo is the zero-state version of the same shape.

---

## seo_meta table — per-page SEO (primary source for edge fn)

Table: `seo_meta`. Separate row per `(tenant_id, page_slug)`.

### Schema columns
| Column | Type | Nullable |
|---|---|---|
| `id` | uuid | NO |
| `tenant_id` | uuid | NO |
| `page_slug` | text | NO |
| `meta_title` | text | YES |
| `meta_description` | text | YES |
| `og_title` | text | YES |
| `og_description` | text | YES |
| `focus_keyword` | text | YES |
| `user_edited` | boolean | YES |

**No `og_image_url` column.** No `schema_override` column.

### Dang rows — all 18 core pages

All 18 have `meta_title` and `meta_description` populated. OG fields are empty
for `user_edited = false` pages; the edge fn should fall back `og_title → meta_title`.

| page_slug | meta_title | meta_description | og_title | og_description | focus_keyword | user_edited |
|---|---|---|---|---|---|---|
| home | ✓ | ✓ | — | — | — | false |
| about | ✓ | ✓ | — | — | — | false |
| ant-control | ✓ | ✓ | — | — | — | true¹ |
| bed-bug-control | ✓ | ✓ | — | — | — | false |
| contact | ✓ | ✓ | — | — | — | false |
| faq | ✓ | ✓ | — | — | — | false |
| flea-tick-control | ✓ | ✓ | — | — | — | false |
| mosquito-control | ✓ | ✓ | — | — | — | false |
| pest-control | ✓ | ✓ | — | — | — | false |
| quote | ✓ | ✓ | — | — | — | false |
| roach-control | ✓ | ✓ | — | — | — | false |
| rodent-control | ✓ | ✓ | — | — | — | false |
| scorpion-control | ✓ | ✓ | — | — | — | false |
| spider-control | ✓ | ✓ | — | — | — | false |
| termite-control | ✓ | ✓ | — | — | — | false |
| termite-inspections | ✓ | ✓ | — | — | — | false |
| wasp-control | ✓ | ✓ | — | — | — | false |
| wasp-hornet-control | ✓ | ✓ | ✓ | ✓ | ✓ | true |

¹ `user_edited = true` but OG fields are empty — title/description were AI-edited;
OG was not manually filled. `og_title` will be empty string `""`, not null.

Dang also has `seo_meta` rows for location pages (bullard-tx, tyler-tx, etc.) and
blog posts — all with OG fields populated and `user_edited = true`. These are
outside the 18 core page_content rows but reachable from the edge fn.

---

## page_content table — display content (NOT primary SEO source)

Table: `page_content`. Separate row per `(tenant_id, page_slug)`.

### Schema columns (SEO-adjacent only)
| Column | Type | Nullable | SEO use |
|---|---|---|---|
| `title` | text | YES | Display heading — fallback title source |
| `subtitle` | text | YES | Display subhead — not used for meta |
| `hero_headline` | text | YES | Display only — not used for meta |
| `image_url` | text | YES | Potential og:image source |
| `page_hero_image_url` | text | YES | Potential og:image source |

No `meta_title`, `meta_description`, or JSONB column exists on `page_content`.

### Populated state for Dang's 18 pages
- `title`: **18/18** populated (display title, e.g. "Bed Bug Control")
- `subtitle`: **18/18** populated
- `hero_headline`: **1/18** populated (home page only: "Dang — Professional Pest Control")
- `image_url`: **1/18** non-empty (home: `/dang/dang-pest-homepage-img-1.webp`)
- `page_hero_image_url`: **1/18** non-null (home: same path)

---

## Title resolution chain for Phase 3A edge fn

Recommended priority order, based on what's actually populated:

```
1. seo_meta.meta_title        WHERE tenant_id = X AND page_slug = Y  → populated 18/18
2. page_content.title + ' | ' + settings.business_info.name          → fallback
3. settings.business_info.name                                        → final fallback
```

OG title: `seo_meta.og_title` if non-empty string, else `seo_meta.meta_title`
Description: `seo_meta.meta_description` if present, else `settings.seo.meta_description`
OG image: `page_content.image_url` or `page_content.page_hero_image_url` — only home has data; others will have no og:image

---

## Demo vs Dang schema diff

- Keys in Demo but missing in Dang: **none**
- Keys in Dang but missing in Demo: **none**
- Schema is identical; Demo has empty/default values

---

## Writers (admin UI)

| File | Writes to | Fields written |
|---|---|---|
| `src/components/admin/seo/useSeoTab.ts:128` | `seo_meta` | `meta_title`, `meta_description`, `og_title`, `og_description`, `focus_keyword`, `user_edited` |
| `src/components/admin/seo/SeoAioTab.tsx:73` | `seo_meta` | `meta_title` (≤70 chars), `meta_description` (≤300 chars) |
| `src/components/admin/seo/SeoInlineEditor.tsx` | `seo_meta` | same fields as useSeoTab |

No admin component writes to `settings.seo.meta_title` (it doesn't exist).
`settings.seo.meta_description` is written via a separate settings save path.

---

## Readers (current Vite SPA)

| File | Mechanism | Source |
|---|---|---|
| `src/shells/dang/SEO.tsx:14` | `react-helmet-async` | Props passed by page component — **hardcoded strings**, not DB |
| `src/shells/dang/pages/*.tsx` | Static JSX | Title/description hardcoded per page, NOT from `seo_meta` |
| `src/components/seo/SEOHead.tsx:91` | `document.title` direct | Used by non-Dang shells; reads from `seo_meta` via `useSeoTab` |
| `src/components/StructuredData.tsx:32` | Injects JSON-LD | Reads `seo_meta.meta_title`, `seo_meta.meta_description` |

---

## Open questions

1. **og:image gap.** No `og_image_url` column in `seo_meta`. Only `home` has an
   image in `page_content`. For 17/18 pages the edge fn would emit no `og:image`.
   Is that acceptable for Phase 3A or should the edge fn fall back to a brand logo URL?

2. **`wasp-control` vs `wasp-hornet-control` duplication.** Two separate `seo_meta`
   rows and two `page_content` rows exist for these slugs. Both appear to be live.
   The edge fn needs to handle both; confirm which slug the router serves.

3. **Title format.** The `seo_meta` titles already include `| Dang Pest Control`
   (e.g. "Bed Bug Control Services in Tyler, TX | Dang Pest Control"). The
   `src/shells/dang/SEO.tsx:16` appends `| Dang Pest Control` again if not already
   the SITE_NAME. Edge fn must NOT double-append the site name suffix.

4. **Canonical URL.** `src/shells/dang/SEO.tsx:12`: `BASE_URL = "https://dangpestcontrol.com"`.
   Post-Phase-5 cutover, canonicals should point to the custom domain. The edge fn
   should emit canonicals using the request hostname, not a hardcoded value.
