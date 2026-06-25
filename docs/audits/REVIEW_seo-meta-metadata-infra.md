# REVIEW — Shared `seo_meta` SSR metadata infrastructure (Phase 2, PR 1)

**Branch:** `feat/seo-meta-metadata-infra`
**Scope:** tenant-agnostic per-page SSR metadata (title/description/canonical/OG) sourced from the existing `seo_meta` table, applied to every tenant page. Comic shell is a later consumer; this PR improves metadata for **all** tenants.

---

## Investigation (read-only) — all 4 assumptions confirmed

1. **`_lib/queries.ts` fetcher pattern** — ✅ Every fetcher is `cache(async (tenantId,…) => getServerSupabaseForISR().from(<table>).select()…)`. No RPC. No pre-existing `seo_meta` loader.
2. **`resolve.ts`** — ✅ `resolveTenantBySlug` reads `settings.seo.meta_title/meta_description` (tenant-LEVEL) via `resolveSettings`, and has the `/^[a-z0-9-]+$/` slug-whitelist guard (`resolve.ts:60`) before the PostgREST `.or()` query.
3. **siteUrl hardcode `pestflowpro.com`** — ✅ **Exactly 6 sites**, all the identical pattern `https://${tenant.subdomain ?? tenant.slug}.pestflowpro.com`:
   | File | Line (pre-change) |
   |------|------|
   | `shared/lib/tenantSeoMetadata.ts` | 14 |
   | `app/tenant/[slug]/layout.tsx` | 61 |
   | `app/tenant/[slug]/page.tsx` | 75 |
   | `app/tenant/[slug]/about/page.tsx` | 49 |
   | `app/tenant/[slug]/blog/[post]/page.tsx` | 24 |
   | `app/tenant/[slug]/_components/DefaultPestPage.tsx` | 43 |
   (The 5 remaining `pestflowpro.com` hits in `app/tenant` are the "Powered by PestFlow Pro" footer badge → the platform **marketing** site, not a tenant siteUrl. Correctly left untouched.)
4. **No `unstable_cache`, no `export const dynamic`** — ✅ confirmed absent under `app/tenant/`. Every route + layout has `export const revalidate = 300`.

`seo_meta` columns (live DB): `id, tenant_id, page_slug, meta_title, meta_description, user_edited, created_at, updated_at, og_title, og_description, focus_keyword`. **og_* is frequently empty-string `''` (not null)** — handled (see below).

---

## What changed

### PART A — `getSeoMeta` loader (`_lib/queries.ts`)
- New `cache()`-wrapped fetcher following the existing pattern exactly: `getServerSupabaseForISR()` (service-role) → `.from('seo_meta').select('page_slug, meta_title, meta_description, og_title, og_description').eq('tenant_id', …).eq('page_slug', …).maybeSingle()`.
- Replicates the `resolve.ts` `/^[a-z0-9-]+$/` guard on `pageSlug` before querying.
- Returns the row or `null`. Keys on the clean `seo_meta.page_slug` values per the Phase 1 baseline matrix.

### PART B — `resolveSiteUrl` helper (`shared/lib/resolveSiteUrl.ts`, NEW)
- Custom-domain map first (`dang`, `dang-pfp` → `https://dangpestcontrol.com`) with the `// TODO: read from tenant_domains WHERE verified=true …` comment.
- Else `https://${tenant.subdomain ?? tenant.slug}.pestflowpro.ai` — **`.ai`, not `.com`**.
- **All 6 hardcoded sites refactored to call it.** This is the highest-risk change: the canonical host moves `.com` → `.ai` platform-wide. Intended and correct — PR #228 already 308s `*.pestflowpro.com` → `*.pestflowpro.ai` in prod.
- Param type is `{ slug: string; subdomain?: string | null }` (not `Pick<Tenant,…>`) so the narrower local `Tenant` interface in `DefaultPestPage.tsx` (which has optional `subdomain?`) type-checks.

### PART C — `buildPageMetadata` helper (`shared/lib/buildPageMetadata.ts`, NEW)
- **Precedence per field:** `seo_meta` row → tenant `settings.seo` (carried on the resolved `Tenant` as `meta_title`/`meta_description`) → generic `fallback`.
- **OG → meta fallback:** `og_title`/`og_description` used only if non-empty, else fall back to the resolved meta title/description. Empty-string `''` is treated as absent (`pick()` trims + length-checks) — required because the dashboard write path stores unset og_* as `''`, and og_* is only ~39% populated.
- **Canonical:** absolute `resolveSiteUrl(tenant) + pathname` (root `/` collapses to bare origin, matching the prior root-canonical form).
- **`metadataBase: new URL(resolveSiteUrl(tenant))`** so relative OG image paths resolve.
- **Output shape mirrors `tenantSeoMetadata`** exactly (`alternates` / `openGraph` / `twitter`) plus top-level `title`/`description` and `metadataBase`.
- **Receives the already-fetched `seo_meta` row** rather than calling `getSeoMeta` itself. Rationale: `getSeoMeta` lives in `app/tenant/[slug]/_lib/`; a `shared/lib` module importing from the app route tree is a backwards dependency. Keeping `buildPageMetadata` pure (sync, row-in) also makes it unit-testable. PART D pages call `getSeoMeta` then pass the row in.

### PART D — `generateMetadata` wiring
Added `generateMetadata` to the 4 routes named in the spec:
- `[service]/page.tsx` (had ZERO) — `pageSlug = params.service`, covers **both** service slugs *and* location/service-area slugs (both key on `seo_meta.page_slug = params.service`). The `[location]` page is not a separate file — locations are served by `[service]/page.tsx`.
- `blog/page.tsx` — `pageSlug = 'blog'`.
- `blog/[post]/page.tsx` — `pageSlug = params.post`.
- `page.tsx` (home) — `pageSlug = 'home'`.
- **Legal pages** (`privacy`/`terms`/`sms-terms`/`accessibility`): already call `tenantSeoMetadata`, which now routes through `resolveSiteUrl` — so they pick up the `.ai` host transitively (PART D consistency requirement) **without touching their files**.

Each new `generateMetadata` uses the same generic fallback the page inherited from the layout before this PR (`title = businessName`, `description = "${businessName} — professional pest control services"`), so the no-row path is byte-identical (see QA report).

---

## Hard constraints — honored
- ❌ No `unstable_cache`. ❌ No new `export const dynamic`. ✅ `revalidate = 300` untouched on every route.
- ✅ Regression gate proven (see QA report §Regression).
- ✅ Out-of-scope untouched: no dashboard `seo_meta` WRITE path / revalidation-on-write (PR 1.5), no diff-and-take-better (PR 4), no comic shell. No write path touched.

## Risk notes
- **Canonical host `.com` → `.ai`** is the one intended behavioral delta for every page. Backed by PR #228's prod redirect. This is the riskiest change and is covered by an explicit unit assertion.
- **Home page now has its own `generateMetadata`.** Next.js merges page metadata over the layout's shallowly (per top-level field). The home page sets a complete `openGraph`/`twitter`/`alternates`, so it fully and correctly replaces the layout's — no partial-merge gap. `icons` is not set by the page, so the layout's favicon is inherited unchanged.
