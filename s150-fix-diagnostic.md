# S150 Fix Diagnostic — Pre-Edit Findings

## 1a — `/app/api/revalidate/route.ts`

### Bug 1: page branch missing 'layout' qualifier

`page` type (lines 54–60) — EXACT quote:
```js
if (body.type === 'page') {
    if (!('slug' in body) || !body.slug) {
      return NextResponse.json({ error: 'slug_required_for_page' }, { status: 400 });
    }
    revalidateTag(cacheTags.page(body.tenantId, body.slug));
    revalidateTag(cacheTags.allPages(body.tenantId));
    revalidatePath(`/tenant/${body.tenantSlug}/${body.slug}`);
  }
```
- Path form: **interpolated**, includes the service slug
- 'layout' qualifier: **MISSING**

`testimonials` branch (lines 64–67) — known-working, EXACT quote:
```js
} else if (body.type === 'testimonials') {
    revalidateTag(cacheTags.testimonials(body.tenantId));
    revalidatePath(`/tenant/${body.tenantSlug}`, 'layout');
  }
```
- Path form: interpolated tenant slug only
- 'layout' qualifier: **PRESENT**

**Confirmed Bug 1:** page branch appends the service slug AND omits 'layout'.
Both are wrong. testimonials/blog/locations/team/faq all use tenant-level
path + 'layout'. page uses a deeper path + no 'layout'.

### Auth check — failure behavior (lines 49–51):
```js
if (!membership || !['admin', 'owner'].includes(membership.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
```
Returns hard 403 — NOT a silent 200. The client (`triggerRevalidate`) swallows
it without throwing, so admin sees "Saved!" when auth fails. Auth itself is
not silent server-side; the silence is client-side.

Note: Other types (testimonials, blog, etc.) pass this check → `tenant_users`
table and rows exist. The auth check is NOT causing failures for this tenant.

---

## 1b — `src/lib/revalidate.ts`

### Bug 2: silent swallow of non-2xx responses

EXACT quote (lines 32–38):
```js
  try {
    const res = await fetch('/api/revalidate', { ... });
    if (!res.ok) {
      console.warn(`[revalidate] non-ok ${res.status} — falling back to TTL`);
    }
  } catch (err) {
    console.warn('[revalidate] call failed, falling back to TTL:', err);
  }
```
- Returns `void`. Does NOT throw. Does NOT return the response status.
- Caller in `ContentTab.handleSave` (line 187): `await triggerRevalidate(...)` —
  return value discarded. No error path in save handler.
- Admin always sees "Content saved!" toast regardless of revalidate outcome.

**Confirmed Bug 2:** Non-2xx is swallowed. Admin has no visibility into
cache-bust failures.

---

## 1c — `app/tenant/[slug]/_lib/queries.ts` — `getPageContent`

EXACT unstable_cache call (lines 7–25):
```js
export const getPageContent = cache(
  (tenantId: string, pageSlug: string) =>
    unstable_cache(
      async () => { ... },
      ['page_content', tenantId, pageSlug],
      {
        tags: [cacheTags.page(tenantId, pageSlug), cacheTags.allPages(tenantId)],
        revalidate: 3600,
      }
    )()
);
```
- Cache key: `['page_content', tenantId, pageSlug]` — unique per tenant+slug ✓
- Tags: `tenant:{id}:page:{slug}` and `tenant:{id}:pages`
- TTL: 3600s (1 hour)
- **NOT versioned** — stale null entries from initial provisioning persist
  until either 3600s expires or `revalidateTag` busts them

**Confirmed Bug 3:** Cache key has no version prefix. Entries populated with
null (when page_content rows were empty at provisioning time) have survived
because revalidation chain was broken (Bug 1). Bumping key prefix orphans them.

---

## Bug match verdict

All 4 expected bugs confirmed as described:
1. ✓ page branch missing 'layout' qualifier (and appends extra slug)
2. ✓ triggerRevalidate silently swallows non-2xx (client-side silence)
3. ✓ Auth returns 403 that client never surfaces (same root as #2)
4. ✓ Cache key unversioned — stale nulls persist

Proceeding to Step 2 fixes.
