# S234 Wave 1 — Places API Refactor Death Audit

**Date:** 2026-05-21  
**Branch:** `docs/s234-kickoff`  
**Auditor:** Claude Code (Sonnet 4.6)  
**Probe source:** `docs/audits/pestflow-pro-kickoff-S234.md`

---

## TL;DR

Two layered failures block "Import Google Reviews" on Dang admin. The production root
cause is that `VITE_GOOGLE_PLACES_API_KEY` is **not set in Vercel** — it is Doppler-only —
so the key bakes as `undefined` into the client bundle. Even if the key were present, the
second failure would fire: `settings.integrations.google_place_id` on Dang is an **empty
string** (not populated), so the guard at TestimonialsTab:115 would block the fetch anyway.
Both failures are resolved by the planned server-side edge function + server-side place_id
resolution approach.

---

## Probe 1 — Current broken state

### What the user sees

On `dang.pestflowpro.ai/admin` → Testimonials tab → click **"Import Google Reviews"**:

- **Production (Vercel):** Toast error fires immediately: *"Set VITE_GOOGLE_PLACES_API_KEY to import Google reviews."*  
  This is TestimonialsTab line 112. The Vite bundle has `undefined` for the env var because
  Vercel does not have `VITE_GOOGLE_PLACES_API_KEY` in its project env vars — confirmed by
  scanning the latest production build logs (`dpl_8tumBvu4HZkWjQVVNEVuAusd7f5b`) — no
  occurrence of the string "GOOGLE_PLACES" anywhere in the build output.

- **Local dev (Doppler):** Key IS injected (Doppler `prd` config has `VITE_GOOGLE_PLACES_API_KEY`).
  Guard at line 112 would pass. But then the second failure fires: `google_place_id = ""`
  (empty string, falsy) → toast error: *"Set Google Place ID in Settings → Integrations first."*

### Error chain (production)

```
User clicks "Import Google Reviews"
  → TestimonialsTab.importGoogleReviews()
  → const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY  // undefined (not in Vercel)
  → if (!apiKey) { toast.error('Set VITE_GOOGLE_PLACES_API_KEY to import Google reviews.'); return }
  → *** EXITS HERE — toast error shown — no network call made ***
```

### Error chain (local dev, Doppler injects key)

```
User clicks "Import Google Reviews"
  → TestimonialsTab.importGoogleReviews()
  → apiKey = 'AIzaSy...'  // passes (Doppler injects it)
  → placeId = settings?.value?.google_place_id  // ""  (empty string on Dang)
  → if (!placeId) { toast.error('Set Google Place ID in Settings → Integrations first.'); return }
  → *** EXITS HERE — toast error shown — no network call made ***
```

### Note on "red error banner" (kickoff language)

`TestimonialsTab` shows errors as Sonner toasts, not a persistent red banner.
`ReviewsTab.tsx` renders a persistent `bg-red-50` error div — **but ReviewsTab is not mounted
anywhere** (see Probe 3). The kickoff's "red error banner" description refers colloquially
to the error toast from TestimonialsTab.

---

## Probe 2 — Current code path

### TestimonialsTab.tsx — `importGoogleReviews()` (lines 109–132)

```
Env var source:   import.meta.env.VITE_GOOGLE_PLACES_API_KEY
Guard:            if (!apiKey) → toast.error + return
Place ID source:  settings table → tenant_id + key='integrations' → value.google_place_id
URL:              https://maps.googleapis.com/maps/api/place/details/json
                  ?place_id=${placeId}&fields=reviews&key=${apiKey}
Method:           GET (via browser fetch)
Response shape consumed:
  json.result.reviews → array of { author_name, text, rating }
  Inserted into `testimonials` table row by row (no dedup)
```

**File:** [src/components/admin/TestimonialsTab.tsx](src/components/admin/TestimonialsTab.tsx#L109-L132)

### ReviewsTab.tsx — `fetchReviews()` (lines 43–65)

```
Env var source:   import.meta.env.VITE_GOOGLE_PLACES_API_KEY
Guard:            if (!apiKey) → throw Error (shown in red banner)
Place ID source:  settings table → same as above
URL:              https://maps.googleapis.com/maps/api/place/details/json
                  ?place_id=${placeId}&fields=rating,user_ratings_total,reviews&key=${apiKey}
Method:           GET (via browser fetch)
Response shape consumed:
  json.result → { rating, user_ratings_total, reviews[] }
  Displayed in card grid; individual reviews sync'd to testimonials table via syncToTestimonials()
Tier gate:        canAccess(4) — Elite only (inside component; *** component is orphaned ***)
```

**File:** [src/components/admin/ReviewsTab.tsx](src/components/admin/ReviewsTab.tsx#L43-L65)

### Key structural detail: single fetch URL pattern

Both files call the same endpoint:  
`https://maps.googleapis.com/maps/api/place/details/json`  
Both consume `json.result` (not `json.results`) — singular, matching Places Details v1 shape.

---

## Probe 3 — Edge function inventory

### `places-*` and `reviews-*` scan result

```
supabase/functions/places-reviews/    → DOES NOT EXIST (no stub)
supabase/functions/places-*/          → no matches at all
supabase/functions/reviews-*/         → no matches at all
supabase/functions/send-review-request/ → EXISTS (sends email to customer, unrelated to Places API)
```

Full function list as of this audit:
```
_shared/
api-quote
create-checkout-session
ga4-analytics
gsc-analytics
ironwood-provision
ironwood-stripe-report
list-checkout-sessions
notify-new-lead
notify-support-ticket
notify-upgrade
pagespeed-proxy
post-to-social
process-sms-queue
provision-tenant
publish-scheduled-posts
run-migration
scrape-prospect
send-credentials-email
send-intake-email
send-onboarding-email
send-reveal-ready
send-review-request   ← email sender, NOT a Places API caller
send-sms
seo-analytics
stripe-webhook
zernio-analytics
zernio-connect
```

**`supabase/functions/places-reviews/` must be created from scratch.** No stub exists.

### ReviewsTab.tsx orphan status

`ReviewsTab.tsx` is exported but **never imported** by any other file in `src/`.
It is not mounted in `Dashboard.tsx` (TABS array has no `reviews` key; no lazy import).
The component exists as dead code. It IS a caller of the broken Places API, and it should
be wired up OR its logic folded into TestimonialsTab as part of Wave 3 implementation.

---

## Probe 4 — Tenant data state (Dang)

**Query run:**
```sql
SELECT t.slug, t.id,
  s.value->>'google_place_id' AS place_id,
  s.value->>'google_fid' AS fid,
  s.value->>'google_cid' AS cid
FROM tenants t
JOIN settings s ON s.tenant_id = t.id AND s.key = 'integrations'
WHERE t.slug = 'dang';
```

**Result:**

| slug | id | place_id | fid | cid |
|------|----|----------|-----|-----|
| dang | `1611b16f-381b-4d4f-ba3a-fbde56ad425b` | `""` (empty string) | `0xade06cf8830e929b:0x2326302b3eab80d2` | `2532764802735636690` |

**Confirmed:**
- `google_place_id` = `""` (empty string — the string `""`, not SQL NULL; still falsy in JS) ✓
- `google_fid` = populated ✓  
- `google_cid` = populated ✓

**Implication for Wave 3:** The edge function's place_id resolution path will be needed for Dang.
`google_fid` (format: `0x{hex}:{hex}`) is the CID in hex form used by Google My Business links.
The Places API `findPlaceFromText` or a CID-based lookup must be used to resolve this to a
`ChIJ...` format place_id and then write it back to `settings.integrations.google_place_id`.

---

## Probe 5 — Doppler state

**`VITE_GOOGLE_PLACES_API_KEY`** in Doppler `pestflow-pro/prd`:
- Present: ✅ YES
- Key prefix (first 6 chars): `AIzaSy`
- Same value as `VITE_GOOGLE_MAPS_API_KEY` (identical prefix shown)

**Vercel build confirmation:**
- `VITE_GOOGLE_PLACES_API_KEY` does NOT appear in latest production build log
  (`dpl_8tumBvu4HZkWjQVVNEVuAusd7f5b`) — the string "GOOGLE_PLACES" is entirely absent
- `.env.local` (codespace dev) does NOT have `VITE_GOOGLE_PLACES_API_KEY`; has only `VITE_GOOGLE_MAPS_API_KEY`
- `.env.example` does NOT include `VITE_GOOGLE_PLACES_API_KEY`

**Conclusion:** Doppler is NOT synced to Vercel for this key. It was added to Doppler but
never set in Vercel project environment variables. The Vite bundle on production bakes
`undefined` into `import.meta.env.VITE_GOOGLE_PLACES_API_KEY`.

**Related Doppler entries (all Google-keyed):**

| Key | Prefix | Notes |
|-----|--------|-------|
| `VITE_GOOGLE_PLACES_API_KEY` | `AIzaSy` | Same value as MAPS key; IN Doppler, NOT in Vercel |
| `VITE_GOOGLE_MAPS_API_KEY` | `AIzaSy` | Same value; in Doppler AND `.env.local` |
| `GOOGLE_API_KEY_DANG` | `AIzaSy` | v94 todo rank 5 — legacy entry, possibly duplicate |
| `GOOGLE_API_PEST_FLOW_PRO` | `AIzaSy` | Separate key for PestFlow Pro platform |

**Post-merge Scott action confirmed:** Delete `VITE_GOOGLE_PLACES_API_KEY` from Doppler
`prd` + `dev` after the edge function is deployed and the Vercel build no longer references it.

---

## Probe 6 — Tier gate

### TestimonialsTab (primary — mounted in Dashboard)

- **No tier gate** on the tab itself at mount point in `Dashboard.tsx`
- **No tier gate** on the `importGoogleReviews()` function inside the component
- "Import Google Reviews" button is visible and clickable for **all tiers (1–4)** ✅
- The kickoff's claim that "Testimonials is a tier-1 feature" is **confirmed correct**

### ReviewsTab (secondary — orphaned, not mounted)

- Has `canAccess(4)` (Elite only) guard at line 90
- This gate is irrelevant since the component is not mounted
- If ReviewsTab is wired up as part of Wave 3, the tier gate decision must be revisited
  (kickoff scope: do NOT change tier-gate surface → leave it gated at Elite if mounted,
  or keep it orphaned and only fix TestimonialsTab)

**Refactor must not add a tier gate to TestimonialsTab's import flow.** ✅

---

## Hypotheses considered

| # | Hypothesis | Verdict |
|---|-----------|---------|
| H1 | `VITE_GOOGLE_PLACES_API_KEY` not in Vercel env → `undefined` in bundle → first guard fires | ✅ **CONFIRMED — primary production root cause** |
| H2 | `google_place_id` empty on Dang → second guard fires (even if key present) | ✅ **CONFIRMED — secondary / local dev root cause** |
| H3 | CORS block on `maps.googleapis.com` from browser | ❌ Not the cause — both guards exit before any network call |
| H4 | API key domain restrictions blocking from pestflowpro.ai | ❌ Not the cause — same as H3, never reaches fetch |
| H5 | RLS block on settings table prevents place_id read | ❌ Not the cause — guard fires before settings read in production |

---

## Proposed fix (Wave 3 — not yet approved)

1. **Create `supabase/functions/places-reviews/index.ts`**
   - `requireTenantUser` C2 auth pattern (mirrors existing 27 edge functions)
   - `verify_jwt: true` in `config.toml`
   - Read `GOOGLE_PLACES_API_KEY` via `Deno.env.get()` (Edge Function Secret, set by Scott pre-merge)
   - Place ID resolution: read `settings.integrations.google_place_id`; if empty, use `google_fid`/`google_cid` to resolve via Places API FindPlaceFromText → write back to `settings.integrations.google_place_id` via service-role client
   - Return normalized payload: `{ place_id, rating, user_ratings_total, reviews[] }`

2. **Update TestimonialsTab.tsx** — replace client-side fetch with `supabase.functions.invoke('places-reviews', { body: { tenant_id: tenantId } })` pattern

3. **Update ReviewsTab.tsx** — same replacement (note: component is currently orphaned; Wave 3 must decide whether to wire it up or leave it unmounted)

4. **Do NOT add tier gate to TestimonialsTab import flow**

5. **Do NOT delete `VITE_GOOGLE_PLACES_API_KEY` from Doppler** — Scott's post-merge action

---

## Risk assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| `GOOGLE_PLACES_API_KEY` Edge Function Secret not set before deploy | HIGH | Scott must set it pre-merge per kickoff checklist |
| `google_fid` format may not work directly with FindPlaceFromText | MEDIUM | CID-based lookup URL (`maps.google.com/?cid=`) may be needed; validate in Wave 3 |
| Other tenants' `google_place_id` not populated | LOW | Dang is pilot; others not in scope |
| ReviewsTab orphan wiring changes tier gate surface | LOW | Kickoff scope: do not change tier gate; keep ReviewsTab unmounted or accept existing Elite gate |
| `VITE_GOOGLE_PLACES_API_KEY` referenced in local `.env.local` | NONE | It's not; only `VITE_GOOGLE_MAPS_API_KEY` is present |

---

## Test plan (Wave 4 QA)

1. On Dang admin: click "Import Google Reviews" → reviews populate, no error toast
2. `settings.integrations.google_place_id` on Dang is now populated (server-side cache-back)
3. `grep -r "VITE_GOOGLE_PLACES_API_KEY" dist/` → zero hits (key removed from bundle)
4. Fake another tenant's JWT in Authorization header → 403 from edge function
5. Demo tenant (tier 1) → "Import Google Reviews" works (no tier gate added)
6. Edge Function logs in Supabase dashboard show successful invocations

---

## Open questions for Wave 2 spec

1. **ReviewsTab disposition:** Wire it into Dashboard as a sub-panel of Testimonials tab, or
   keep it orphaned and only fix TestimonialsTab? Kickoff scope says "do not change tier gate
   surface" — safest is to leave it unmounted and only fix TestimonialsTab.

2. **Place ID resolution path for `google_fid`:** The `fid` value is `0xade06cf8830e929b:0x2326302b3eab80d2`.
   This is a hex CID. Resolution options:
   a. `Place.searchByText()` in new Places API (server-side) — requires Places API (New)
   b. `findPlaceFromText` (legacy) using business name + location
   c. CID-to-place-id lookup via `https://maps.googleapis.com/maps/api/place/details/json?cid=${cid_decimal}`
   Option (c) using `cid=2532764802735636690` is simplest and most reliable — the decimal CID
   (`google_cid`) maps directly to the API param. **Recommend: use `cid` param on Place Details.**

3. **Validator gate tooling:** Kickoff requires Perplexity AND Gemini. Confirm tooling
   availability with Scott before Wave 2.

---

## Files to modify in Wave 3

| File | Action |
|------|--------|
| `supabase/functions/places-reviews/index.ts` | CREATE |
| `src/components/admin/TestimonialsTab.tsx` | MODIFY (replace importGoogleReviews) |
| `src/components/admin/ReviewsTab.tsx` | MODIFY (replace fetchReviews) — or leave as dead code |
| `supabase/config.toml` | ADD places-reviews entry with `verify_jwt = true` |

**No migrations required** — no schema changes. ✅  
**No protected path edits** — `_shared/auth/` is import-only. ✅

---

*Wave 1 complete. Awaiting Scott review before Wave 2 (spec + validator gate).*
