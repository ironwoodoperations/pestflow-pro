# S234 Wave 2 — Places API Refactor Spec

**Date:** 2026-05-21  
**Branch:** `docs/s234-kickoff`  
**Author:** Claude Code (Sonnet 4.6)  
**Status:** FINAL — validator gate PASS (both validators confirm Places API (New) Text Search)  
**Depends on:** `docs/audits/s234-places-api-refactor-audit.md` (Wave 1)

---

## Scope (confirmed by Scott 2026-05-21)

- **TestimonialsTab.tsx** — replace client-side `importGoogleReviews()` with edge function call
- **ReviewsTab.tsx** — EXCLUDED. Stays orphaned/untouched in S234. Noted as dead code; disposition (delete vs wire into Dashboard) deferred to a separate session. See backlog note below.
- **No schema changes** — no migrations required
- **No tier gate changes** — Import Google Reviews remains tier-1+ (no gate)

### Backlog note — ReviewsTab.tsx

`src/components/admin/ReviewsTab.tsx` is dead code: exported but never imported or mounted
in `Dashboard.tsx` (confirmed in Wave 1 audit). Disposition options:
1. Wire into Dashboard as a "Live Reviews" tab/sub-panel (adds Elite-gated review sync UI)
2. Delete entirely

This decision is out of scope for S234. Add to v94 backlog as a separate item.

---

## Edge Function Spec

### Identity

| Property | Value |
|----------|-------|
| Function name | `places-reviews` |
| File path | `supabase/functions/places-reviews/index.ts` |
| Auth pattern | C2 — `requireTenantUser` (mirrors 27 existing edge fns) |
| JWT enforcement | `verify_jwt: true` (in `config.toml`) |
| HTTP method | POST |
| CORS | `getCorsHeaders(req)` from `_shared/cors.ts` |

### Request shape

```typescript
// POST body (JSON)
{
  tenant_id: string   // UUID — used for tenant ownership check
}

// Required headers
Authorization: Bearer <supabase_session_access_token>
apikey: <VITE_SUPABASE_ANON_KEY>
Content-Type: application/json
```

### Response shape — success (200)

```typescript
{
  place_id: string            // ChIJ... format, resolved and cached
  rating: number              // e.g. 4.7
  user_ratings_total: number  // e.g. 312
  reviews: Array<{
    author_name: string
    rating: number            // 1–5
    text: string
    relative_time_description: string
  }>
}
```

### Response shape — errors

| Status | Body | Trigger |
|--------|------|---------|
| 401 | `{ error: "Unauthorized" }` | Missing or invalid JWT |
| 403 | `{ error: "Forbidden" }` | JWT valid but tenant_id mismatch |
| 400 | `{ error: "tenant_id required" }` | Missing body param |
| 422 | `{ error: "No place_id and no google_fid/google_cid to resolve from" }` | Both place_id empty AND fid/cid absent |
| 502 | `{ error: "Google Places API error: {status}" }` | Non-OK Google API response |
| 500 | `{ error: "Internal error" }` | Unexpected exception |

### Environment variable

| Key | Source | Notes |
|-----|--------|-------|
| `GOOGLE_PLACES_API_KEY` | Supabase Edge Function Secret | New server-only key (see Scott pre-merge actions). NOT a Doppler key. NOT the VITE_GOOGLE_PLACES_API_KEY value. |

---

## Place ID Resolution Logic

### Decision tree (executes on every invocation)

```
1. Read settings.integrations AND settings.business_info from DB (service-role client)
2. placeId = settings.integrations.google_place_id
3. IF placeId is non-empty string → skip to step 6 (cache hit)
4. ELSE → resolve via Places API (New) Text Search:
     textQuery = `${business_info.name}, ${business_info.address}`
     POST https://places.googleapis.com/v1/places:searchText
       X-Goog-Api-Key: GOOGLE_PLACES_API_KEY
       X-Goog-FieldMask: places.id
       Body: { "textQuery": textQuery }
     placeId = response.places[0]?.id
5. IF placeId still empty → return 422 (no resolution possible)
6. ELSE write placeId back to settings.integrations.google_place_id (cache-back)
7. Call Places API (New) Place Details with placeId → normalize → return reviews payload
```

### Validator-confirmed resolution path

> ✅ **VALIDATOR GATE: PASS** — Both independent validators (Perplexity and Gemini research
> passes) returned **identical verdicts**: `?cid=` is **undocumented and must not be used
> in production**. Both confirmed **Places API (New) Text Search** as the only fully-supported,
> forward-compatible resolution path. Full responses in `docs/audits/s234-validator-gate.md`.

**Eliminated options:**

| Option | Verdict | Reason |
|--------|---------|--------|
| `?cid=` on Legacy Places Details | ❌ REJECTED | Undocumented parameter on a frozen/deprecated endpoint; no SLA; will break without notice when Legacy API is decommissioned |
| `FindPlaceFromText` (Legacy) | ❌ REJECTED | Legacy frozen since March 1, 2025; no CID/FID input support; text-only |

**Confirmed resolution path: Places API (New) `places:searchText`**

Inputs read from the tenant's settings:
- Primary: `settings.business_info.name` (business name, e.g., "Ironclad Pest Solutions")
- Secondary: `settings.business_info.address` (city/state, e.g., "Houston, TX")

```
Step 1 — Build text query from settings.business_info
  textQuery = `${business_info.name}, ${business_info.address}`

Step 2 — POST to Places API (New) Text Search
  POST https://places.googleapis.com/v1/places:searchText
  Headers:
    X-Goog-Api-Key: {GOOGLE_PLACES_API_KEY}
    X-Goog-FieldMask: places.id
    Content-Type: application/json
  Body:
    { "textQuery": "{textQuery}" }

Step 3 — Extract place_id from response
  resolvedPlaceId = response.places[0]?.id  // e.g., "ChIJ..."

Step 4 — Error if not resolved
  if (!resolvedPlaceId) → return 422 "No place_id and no resolvable google_fid/google_cid"
```

**Edge case — `google_fid` to decimal CID (reference only, not used in the primary path):**
If `google_cid` is absent but `google_fid` is present, the CID can be derived without an
API call:
```
fid = "0xade06cf8830e929b:0x2326302b3eab80d2"
hex_cid = fid.split(":")[1]   // "0x2326302b3eab80d2"
cid_decimal = BigInt(hex_cid).toString()   // "2532764802735636690"
```
However, since `?cid=` is rejected, this conversion is not used in the resolution call —
it is documented here for reference only. The primary resolution path is always text search.

**API key enablement note (for Scott):** The new `GOOGLE_PLACES_API_KEY` must have
**"Places API (New)"** enabled in GCP, NOT the legacy "Places API". They are distinct APIs
in the GCP console.

### Subsequent reviews fetch — Places API (New) Place Details

After `place_id` is confirmed (from cache or resolution), fetch reviews via the New endpoint:

```
GET https://places.googleapis.com/v1/places/{place_id}
Headers:
  X-Goog-Api-Key: {GOOGLE_PLACES_API_KEY}
  X-Goog-FieldMask: id,rating,userRatingCount,reviews
```

**Response shape (New API) → normalized to client shape:**

| New API field | Normalized field |
|---------------|-----------------|
| `rating` | `rating` |
| `userRatingCount` | `user_ratings_total` |
| `reviews[].authorAttribution.displayName` | `reviews[].author_name` |
| `reviews[].rating` | `reviews[].rating` |
| `reviews[].text.text` | `reviews[].text` |
| `reviews[].relativePublishTimeDescription` | `reviews[].relative_time_description` |

The edge function normalizes the New API shape to the legacy-compatible shape before
returning to the client. The client (TestimonialsTab) receives the same payload shape
regardless of which Places API version the server used.

### Cache-back write (service-role)

```typescript
await serviceClient
  .from('settings')
  .update({
    value: {
      ...existingIntegrations,
      google_place_id: resolvedPlaceId,
    }
  })
  .eq('tenant_id', tenantId)
  .eq('key', 'integrations')
```

**This write uses the service-role client, NOT the user's session.** The service-role client
is initialized via `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (both injected automatically
into all edge functions). This bypasses RLS intentionally for the server-initiated cache-back.

---

## CORS

Use `getCorsHeaders(req)` from `_shared/cors.ts` (established in S224 for pagespeed-proxy).  
This handles wildcard subdomain allowlist (`*.pestflowpro.ai`) and localhost dev origins.

```typescript
import { getCorsHeaders } from '../_shared/cors.ts'

// In handler:
if (req.method === 'OPTIONS') {
  return new Response(null, { status: 204, headers: getCorsHeaders(req) })
}
// All responses:
return new Response(JSON.stringify(body), {
  status: 200,
  headers: { 'Content-Type': 'application/json', ...getCorsHeaders(req) }
})
```

**Note:** Other edge fns use a static `corsHeaders` object. `places-reviews` should use
`getCorsHeaders` for consistency with the subdomain wildcard pattern.

---

## Auth Pattern (C2 — requireTenantUser)

Established in S213c-B across 27 edge functions. Do not deviate.

```typescript
import { requireTenantUser, AuthError } from '../_shared/auth/requireTenantUser.ts'

// In handler:
try {
  const { tenantId } = await requireTenantUser(req, body.tenant_id)
  // tenantId is now verified — use it for all DB ops
} catch (e) {
  if (e instanceof AuthError) return e.toResponse()
  throw e
}
```

`requireTenantUser` validates:
1. Bearer JWT present
2. JWT resolves to a real Supabase user
3. `profiles.tenant_id` matches `body.tenant_id` (cross-tenant 403)

---

## Client-side call (TestimonialsTab.tsx replacement)

Replace the `importGoogleReviews()` body with:

```typescript
async function importGoogleReviews() {
  if (!tenantId) return
  setImporting(true)
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) { toast.error('Session expired. Please log in again.'); return }

    const { data, error } = await supabase.functions.invoke('places-reviews', {
      body: { tenant_id: tenantId },
      headers: { Authorization: `Bearer ${token}` },
    })

    if (error) throw error

    const gReviews: GoogleReview[] = data?.reviews || []
    if (gReviews.length === 0) {
      toast.error('No reviews found for this location.')
      return
    }

    let imported = 0
    for (const r of gReviews) {
      const { error: insertErr } = await supabase.from('testimonials').insert({
        tenant_id: tenantId,
        author_name: r.author_name || 'Google User',
        review_text: r.text || '',
        rating: r.rating || 5,
        source: 'Google',
        featured: false,
      })
      if (!insertErr) imported++
    }

    toast.success(`Imported ${imported} Google review${imported !== 1 ? 's' : ''}!`)
    fetchReviews()
    const { data: s } = await supabase.auth.getSession()
    if (s.session?.access_token && tenantId) {
      await triggerRevalidate({ type: 'testimonials', tenantId }, s.session.access_token)
    }
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to fetch Google reviews.')
  } finally {
    setImporting(false)
  }
}
```

**What changes vs. current code:**
- Removes `import.meta.env.VITE_GOOGLE_PLACES_API_KEY` reference entirely
- Removes direct `fetch(maps.googleapis.com/…)` call
- Replaces with `supabase.functions.invoke('places-reviews', …)` — standard PFP pattern
- Preserves all existing UI states (loading → `importing`, empty, error toast, success toast)
- Preserves `fetchReviews()` call after import
- Preserves `triggerRevalidate` call

**No UI changes** — button label, disabled state, loading text all stay the same.

---

## Error States (client-side handling)

| Server response | Client behavior |
|-----------------|-----------------|
| 401 Unauthorized | `toast.error('Session expired. Please log in again.')` |
| 403 Forbidden | `toast.error('Access denied.')` |
| 422 No place/fid/cid | `toast.error('No Google location linked. Add a Place ID in Settings → Integrations.')` |
| 502 Google API error | `toast.error('Google returned an error. Check the Place ID or try again later.')` |
| 0 reviews returned | `toast.error('No reviews found for this location.')` |
| Network/timeout | `toast.error('Failed to fetch Google reviews.')` |

---

## Tier Gate

**No change.** The "Import Google Reviews" button in TestimonialsTab has no tier gate.
It remains available to all tiers (1–4). The edge function itself does not enforce a tier
check — it only checks tenant ownership (`requireTenantUser`).

---

## config.toml entry

Add to `supabase/config.toml`:

```toml
[functions.places-reviews]
verify_jwt = true
```

---

## Deployment

Per established PFP pattern: deploy via Supabase MCP `deploy_edge_function`.  
CLI (`supabase functions deploy`) is fallback only.

```
deploy_edge_function(
  project_id: "biezzykcgzkrwdgqpsar",
  name: "places-reviews",
  verify_jwt: false   ← MCP param (the fn itself enforces JWT via requireTenantUser)
)
```

> **Note on MCP deploy param:** Per established pattern (S213c-B), the MCP
> `deploy_edge_function` call uses `verify_jwt: False` — this is the MCP-layer parameter,
> not the Supabase config. The function enforces its own auth via `requireTenantUser`.
> The `config.toml` entry with `verify_jwt = true` is the canonical source of truth.

---

## Success Criteria (mirrors kickoff)

- [ ] Import Google Reviews button works on Dang admin, returns real reviews
- [ ] No `VITE_GOOGLE_PLACES_API_KEY` references in client bundle (`grep -r "VITE_GOOGLE_PLACES_API_KEY" dist/` → 0 hits)
- [ ] `places-reviews` edge fn deployed, `verify_jwt: true`, `requireTenantUser` enforced
- [ ] Cross-tenant access returns 403 (fake JWT from another tenant)
- [ ] Dang's `settings.integrations.google_place_id` populated server-side after first successful call
- [ ] No tier-gate behavior change on Testimonials tab
- [ ] All CI checks green; Vercel preview READY

---

## Scott Pre-Merge Actions

> These steps must be completed **before** the Wave 3 PR is merged (and before QA can run
> against production).

### 1. Generate a NEW server-only Google API key (pre-merge)

- GCP project: `pestflow-pro-prod`
- Navigate: GCP Console → APIs & Services → Credentials → Create Credentials → API Key
- **API restriction:** **"Places API (New)"** only — this is the NEW API in GCP, NOT the legacy "Places API". They are listed separately in the GCP API restrictions picker. Enable the one labeled "Places API (New)".
- **Application restriction:** None (server-side use — no HTTP referrers, no IP restrictions needed for edge function)
- **Do NOT reuse** the value of `VITE_GOOGLE_PLACES_API_KEY` from Doppler — separate key, separate threat model

### 2. Set Edge Function Secret in Supabase Dashboard (pre-merge)

- Navigate: Supabase Dashboard → Project `biezzykcgzkrwdgqpsar` → Project Settings → Edge Functions → Secrets
- Add secret: `GOOGLE_PLACES_API_KEY` = (the new API key generated in step 1)
- **This is NOT a Doppler key.** Do not add it to Doppler.

### 3. Post-merge verification on production (post-merge)

- Open `dang.pestflowpro.ai/admin` → Testimonials → "Import Google Reviews" → confirm reviews populate
- Check Supabase Dashboard → Table Editor → settings → Dang row → integrations → confirm `google_place_id` is now populated

### 4. Post-merge Doppler cleanup (post-merge)

- Delete `VITE_GOOGLE_PLACES_API_KEY` from Doppler `pestflow-pro/prd` AND `dev`
- Confirm no VITE_GOOGLE_PLACES_API_KEY references remain in source (`grep -r "VITE_GOOGLE_PLACES_API_KEY" src/` → 0 hits after Wave 3 PR merges)

### 5. Legacy Doppler key audit (post-merge)

- `GOOGLE_API_KEY_DANG` in Doppler (v94 todo rank 5) — confirm whether this is a duplicate of the old `VITE_GOOGLE_PLACES_API_KEY` value or a separate key. Delete if confirmed unused.

---

## Files to Create/Modify in Wave 3

| File | Action | Notes |
|------|--------|-------|
| `supabase/functions/places-reviews/index.ts` | CREATE | New edge function |
| `supabase/config.toml` | MODIFY | Add `[functions.places-reviews]` entry |
| `src/components/admin/TestimonialsTab.tsx` | MODIFY | Replace `importGoogleReviews()` body |
| `src/components/admin/ReviewsTab.tsx` | NO CHANGE | Stays orphaned per scope decision |

**No migrations.** No RLS changes. No schema changes.

---

## Out of Scope

- ReviewsTab.tsx wiring or deletion (separate session)
- Any other tenant's Place ID setup (Dang pilot only for server-side cache-back)
- `GOOGLE_API_DANG_PLACES` / `GOOGLE_API_KEY_DANG` key cleanup (Scott post-merge)
- Deleting `VITE_GOOGLE_PLACES_API_KEY` from Doppler (Scott post-merge)

---

*Spec FINAL. Validator gate: PASS — both validators confirmed Places API (New) Text Search as the only production-safe resolution path. Do not begin Wave 3 implementation until Scott approves this spec + validator gate doc.*
