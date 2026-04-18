# S150 Diagnostic Report

## Summary

The code IS already wired to read from `page_content`. The hardcoded strings showing on
the public site are SERVICE_DATA fallbacks triggered because `getPageContent` is returning
null at render time — not because the shell ignores the DB. The root cause is NOT missing
wiring; it is either stale `unstable_cache` or a silent revalidation failure.

---

## 1a — `app/tenant/[slug]/[service]/page.tsx`

**Fetchers called:**
- `getPageContent(tenant.id, params.service)` — line 130
- `getHeroMedia(tenant.id)` — line 131
- (For city pages only: `getLocation`, `getAllLocations`)

**Does it call getPageContent for service slug?** Yes.

**Props passed to content variables (lines 135–137):**
```js
const heroTitle    = (content as { title?: string }    | null)?.title    || svc.heroTitle;
const heroSubtitle = (content as { subtitle?: string } | null)?.subtitle || svc.heroSubtitle;
const introP1      = (content as { intro?: string }    | null)?.intro    || svc.introP1;
```

**What is HARDCODED (no DB override possible):**
- `svc.introHeading` — line 175 — always SERVICE_DATA, no content.introHeading branch
- `svc.introP2` — line 177 — always SERVICE_DATA, no content.introP2 branch
- `svc.steps` (process section) — always SERVICE_DATA
- `svc.faqs` (service tabs) — always SERVICE_DATA

**Conclusion:** subtitle and intro are wired with `||` fallback to SERVICE_DATA. The
hardcoded strings ARE showing because `content` is null, making the fallback trigger.
There is no separate metro-pro shell for service pages — all shells share this one template.

---

## 1b — `app/tenant/[slug]/_lib/queries.ts`

**Fetcher name:** `getPageContent` — line 6.

**Cache setup:**
```js
unstable_cache(
  async () => { ... supabase.from('page_content').select('*').eq('tenant_id', ...).eq('page_slug', ...).maybeSingle() },
  ['page_content', tenantId, pageSlug],
  {
    tags: [cacheTags.page(tenantId, pageSlug), cacheTags.allPages(tenantId)],
    revalidate: 3600,
  }
)
```
- Uses service role key via `getServerSupabase()` — RLS irrelevant.
- Selects `*` — includes subtitle, intro, and all other columns.
- TTL: 3600s (1 hour) per entry.

---

## 1c — Metro-pro service page template

**There is NO `_shells/metro-pro/` directory.** All 5 templates share the single
`[service]/page.tsx` for service pages. There is no per-shell service page component.

**Where does "Eliminate fire ants, carpenter ants, and more." come from?**
File: `app/tenant/[slug]/_lib/serviceData.ts` — line 51
```js
'ant-control': {
  heroSubtitle: 'Eliminate fire ants, carpenter ants, and more.',
  ...
  introHeading: 'Effective Ant Control Solutions',
  introP1: "Ants are the #1 nuisance pest...",
```
This is `SERVICE_DATA['ant-control'].heroSubtitle`. It renders when `content.subtitle` is
null/empty (the `|| svc.heroSubtitle` fallback at `[service]/page.tsx:136`).

---

## 1d — Metro-pro home page

**Where does "Professional Pest Control You Can Trust" come from?**
File: `app/tenant/[slug]/_components/MetroHero.tsx` — line 17
```js
const headline = c?.hero_headline?.trim()
  || c?.title?.trim()
  || (tenant.business_name ? `${tenant.business_name} — Professional Pest Control` : 'Professional Pest Control You Can Trust');
```
Renders only when `content.hero_headline`, `content.title`, AND `tenant.business_name`
are all null/empty. Since Lone Star has a business name, the "You Can Trust" literal
should NOT show — it would show `"Lone Star Pest Solutions — Professional Pest Control"`.
Same string also in `ModernProHero.tsx:16` and `CleanFriendlyHero.tsx:24`.

---

## 1e — Home page (`app/tenant/[slug]/page.tsx`)

- Calls `getPageContent(tenant.id, 'home')` at line 67.
- Passes `content` to `MetroHero` (default/metro-pro), `ModernProHero`, `BoldLocalHero`,
  `CleanFriendlyHero`, `RusticRuggedHero` — all shell hero components receive the `content`
  prop and read from it.
- Home page IS wired. Same fallback pattern applies.

---

## Revalidation pipeline audit

Tracing what happens when admin saves content in ContentTab:

1. `ContentTab.handleSave` upserts `page_content` row → DB updated ✓
2. Calls `triggerRevalidate({ type: 'page', tenantId, slug: 'ant-control' }, accessToken)`
3. `src/lib/revalidate.ts:getTenantSlug()` derives tenant slug from `window.location.hostname`
   (correct in prod: `lone-star-pest-solutions.pestflowpro.com` → `lone-star-pest-solutions`)
4. POSTs to `/api/revalidate` with `{ type, tenantId, tenantSlug, slug }`
5. **Auth gate:** route checks `tenant_users` table for admin/owner role — if this row is
   missing, returns 403 SILENTLY (toast still shows "Content saved!", no error to admin)
6. On success: calls `revalidateTag(cacheTags.page(...))` → busts `unstable_cache`
7. Calls `revalidatePath('/tenant/lone-star-pest-solutions/ant-control')` — **NO 'layout'
   qualifier** (compare: other types use `'layout'` which busts CDN edge cache subtree)

**Critical finding:** If step 5 returns 403 or any non-ok status, `triggerRevalidate`
logs a warning and silently falls back to TTL. The admin sees "Content saved!" regardless.
The `unstable_cache` entry would then remain stale for up to 3600s.

**Second finding:** `revalidatePath` is called without the `'layout'` qualifier for page
type. All other entity types (settings, testimonials, blog, etc.) use `'layout'`. This may
be insufficient to bust Vercel's CDN edge cache for the service page.

---

## Root cause assessment

**The code IS Form A — it IS receiving page_content data (when available) and using it
with SERVICE_DATA as fallback. The hardcoded strings are showing because `content` is
null at ISR render time.**

Most likely cause chain:
1. `unstable_cache` was first populated with `null` (no row at initial render, or
   early render before content was added via SQL)
2. Admin saved content → DB updated → `triggerRevalidate` called
3. `triggerRevalidate` either (a) silently 403'd due to `tenant_users` check, or (b)
   succeeded but `revalidatePath` without `'layout'` did not properly bust Vercel CDN edge
4. ISR re-renders every 300s but `unstable_cache` TTL is 3600s — each re-render reads
   stale null from `unstable_cache` without hitting DB
5. `unstable_cache` would auto-expire after 3600s and fetch fresh from DB — but if
   `triggerRevalidate` is silently failing on every save, it never gets a clean bust

**If the content was added directly via SQL** (bypassing admin UI), `triggerRevalidate`
was never called at all, and the 3600s TTL controls everything.

---

## What is NOT a code bug

The `||` fallback pattern in `[service]/page.tsx` is correct. MetroHero is correct.
No component is "ignoring" the page_content prop. When `content` is non-null with
non-empty fields, the DB values render correctly.

---

## What would fix it

**Option 1 — Code fix only (if Scott confirms it IS a cache/revalidation issue):**
- Change `revalidatePath` for page type to use `'layout'` qualifier (or both):
  ```js
  revalidatePath(`/tenant/${body.tenantSlug}/${body.slug}`, 'layout');
  ```
- Add error logging to `triggerRevalidate` so failures surface to the admin

**Option 2 — If the intent is for the service page to NEVER depend on cache busting:**
- Move `getPageContent` call outside `unstable_cache` using `getServerSupabaseForISR()`
  so each ISR re-render always fetches fresh from DB (within the 300s ISR TTL)
- This removes the 3600s `unstable_cache` layer and relies solely on ISR

**Option 3 — Targeted one-time bust:**
- Call the revalidate API directly for each service page slug for Lone Star
- Confirms whether the pipeline works at all

---

## Files read

1. `app/tenant/[slug]/[service]/page.tsx`
2. `app/tenant/[slug]/_lib/queries.ts`
3. `app/tenant/[slug]/_lib/serviceData.ts`
4. `app/tenant/[slug]/page.tsx`
5. `app/tenant/[slug]/_components/MetroHero.tsx`
6. `shared/lib/supabase/server.ts`
7. `app/api/revalidate/route.ts`
8. `src/components/admin/ContentTab.tsx`
9. `src/lib/revalidate.ts`
10. `app/_lib/cacheTags.ts`
