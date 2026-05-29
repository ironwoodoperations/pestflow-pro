# Review — cleanup: surface /api/revalidate body shape (item 1)

**Branch:** `cleanup/revalidate-grep-and-provision-url` · **Scope this PR:** item 1 only. No source code changes — docs + PR-description deliverable. Item 2 deferred (see below).

## Item 1 — /api/revalidate body shape (deliverable)

This repo contains **one** revalidate route: `app/api/revalidate/route.ts` (the Next.js tenant-shell handler). No apex/Vite-SPA `/api/revalidate` route exists in this repo — if one exists it is in a separate project. Both are described as tenant-admin Bearer gated; only the tenant-shell one is present here.

### Destructure / body reads — `app/api/revalidate/route.ts`
```ts
// line 27-29
let body: RevalidatePayload;
body = await req.json();              // (try/catch → 400 invalid_json)

// line 33-35 — required fields on every request
if (!body.type || !body.tenantId || !body.tenantSlug) {
  return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
}

// line 55-56 — page type additionally requires slug
if (!('slug' in body) || !body.slug) {
  return NextResponse.json({ error: 'slug_required_for_page' }, { status: 400 });
}

// subsequent body.* reads:
//   body.tenantId  → membership check (tenant_users) + every cacheTags.*(body.tenantId)
//   body.type      → branch selector (page|settings|testimonials|blog|locations|team|faq)
//   body.slug      → cacheTags.page(body.tenantId, body.slug)   [page only]
//   body.tenantSlug→ required (400 if absent); not used in a tag/path in the handler
```

### Validator / schema — `app/_lib/cacheTags.ts:27` (`RevalidatePayload` discriminated union)
```ts
export type RevalidatePayload =
  | { type: 'page';         tenantId: string; tenantSlug: string; slug: string }
  | { type: 'settings';     tenantId: string; tenantSlug: string }
  | { type: 'testimonials'; tenantId: string; tenantSlug: string }
  | { type: 'blog';         tenantId: string; tenantSlug: string }
  | { type: 'locations';    tenantId: string; tenantSlug: string }
  | { type: 'team';         tenantId: string; tenantSlug: string }
  | { type: 'faq';          tenantId: string; tenantSlug: string };
```
(No zod — the union type + the explicit `if (!body.type || !body.tenantId || !body.tenantSlug)` and `slug_required_for_page` checks are the validation.)

### Legend — field → purpose
| field | required | used for |
|---|---|---|
| `type` | yes | selects the revalidate branch; `page` also requires `slug` |
| `tenantId` | yes | (a) `tenant_users` admin/owner membership check; (b) every cache tag `tenant:{tenantId}:{kind}` for `revalidateTag` |
| `tenantSlug` | yes (400 if missing) | carried for context; **not** used in a tag or path by the handler today |
| `slug` | page only | `revalidateTag(cacheTags.page(tenantId, slug))` |

### Tag vs path per branch
- All branches call `revalidatePath('/tenant/[slug]', 'layout')` (busts the Full Route Cache for the tenant layout).
- `page`: `revalidateTag(cacheTags.page(tenantId, slug))` + `revalidateTag(cacheTags.allPages(tenantId))` + layout path.
- `settings | testimonials | blog | locations | team | faq`: `revalidateTag(cacheTags.{kind}(tenantId))` + layout path.

### Client caller (for reference) — `src/lib/revalidate.ts:27`
```ts
const body = { ...payload, tenantSlug: getTenantSlug() };  // getTenantSlug = hostname.split('.')[0]
// POST /api/revalidate, Authorization: Bearer <accessToken>, Content-Type: application/json
```

## Item 2 — DEFERRED (not in this PR)
`provision-tenant/index.ts` response URL `.com → .ai`. The file is in the **protect-files.sh DO NOT TOUCH list**; CC Web edits are blocked. Per Scott: defer and bundle with **item 4 (scrape-prospect → ai-proxy migration)** in a future "edge-function source cleanup" PR where CC Web is explicitly authorized to touch protected edge-fn source — one auditable unprotect event instead of two.

Exact intended change (for that future PR):
- `supabase/functions/provision-tenant/index.ts:903` — `https://${resolvedSlug}.pestflowpro.com` → `.ai` (response `liveUrl`).
- `supabase/functions/provision-tenant/index.ts:859` — `${resolvedSlug}.pestflowpro.com` → `.ai` (`newDomain`; feeds `info@${newDomain}` fallback email).
- Lines 877–880 are `replaceAll` **search patterns** against the master tenant's legal content. MCP-verified the master legal pages (`terms/privacy/sms-terms/accessibility`) now contain `pestflowpro.ai`, **not** `.com` — so these `.com` patterns match nothing today (dead no-ops). Flipping them is a behavioral change (would activate dormant URL rewriting) → handle as a deliberate fix in that PR, not a cosmetic flip.
- Do not touch the 301 redirect config.

## Risk
Zero — this PR changes no source code. Item-1 is documentation of existing behavior.
