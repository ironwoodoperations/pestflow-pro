# S235 — Outscraper Google Reviews Integration: Handoff

**Session:** S235  
**Completed:** 2026-05-21  
**Branch merged:** feat/s235-outscraper-reviews → main via PR #114  
**Status:** Feature verified working. Repo source diverged from deployed function — corrected in S236 (PR #115).

---

## What was built

Automated Google review sync for SAB (service-area-business) tenants via the Outscraper API.

### Edge function: `outscraper-reviews`

- **File:** `supabase/functions/outscraper-reviews/index.ts`
- **Auth:** dual-path — internal vault secret (cron/provision) OR Bearer JWT + tier check (admin manual)
- **Modes:**
  - `initial` — full sync up to 200 reviews (first-time / provision-tenant trigger)
  - `incremental` — newest 50 reviews (daily cron, saves credits)
  - `manual` — full sync up to 200, Elite-only, rate-limited once per 6 hours
- **Endpoint:** `POST /functions/v1/outscraper-reviews`
- **JWT:** `verify_jwt = false` — auth handled internally

### Database objects (migration: s235_outscraper_reviews_setup)

All applied via Supabase MCP. File preserved at `docs/migrations/s235-outscraper-reviews-setup.sql` (apply-as-doc only — do NOT re-run).

| Object | Purpose |
|--------|---------|
| `testimonials_tenant_google_review_id_unique` | Partial unique index for dedup (only where `google_review_id IS NOT NULL`) |
| `rate-limit-cleanup` cron | Extended row retention from 1h → 12h to cover 6h outscraper rate window |
| `public.outscraper_cron_dispatch()` | SECURITY DEFINER SQL dispatcher; fans out HTTP POST per eligible tenant |
| `outscraper-daily-dispatch` cron | `0 2 * * *` — calls dispatch function nightly |

### Secrets / infrastructure (already configured, do not re-run)

| Item | Location | Status |
|------|----------|--------|
| `OUTSCRAPER_API_KEY` | Supabase → Settings → Edge Function Secrets | ✅ set |
| `outscraper_cron_internal_secret` | Supabase Vault | ✅ populated (64-char base64) |
| `outscraper-daily-dispatch` cron | pg_cron | ✅ scheduled (`0 2 * * *`) |

### Admin UI

- **File:** `src/components/admin/TestimonialsTab.tsx`
- Added "Google Reviews Auto-Sync" panel above the testimonials list
- Shows: imported count, last synced time, cadence label, Refresh Now button
- Refresh Now: Elite (tier 4) only, rate-limited, calls edge fn with `mode: 'manual'`

---

## Divergence issue (resolved in S236)

### Root cause

CC Web's S235 deployment pipeline reported success but the Supabase platform received only v1 (broken) source. Hotfixes were applied manually via Supabase MCP (Claude.ai), producing v2 and then v3.

### v1 bugs (original S235 source — BROKEN, never actually deployed live)

- Used `/maps/reviews-v3` endpoint (does not exist — 404)
- Used `limit` query param (Outscraper v2 API requires `reviewsLimit`)
- CID-first identifier priority (FID works better for SABs)
- Used TypeScript `_shared/` imports that break under MCP bundler

### v3 fixes (canonical deployed source — WORKS)

- `/maps/reviews-v2` endpoint ✓
- `reviewsLimit` param ✓
- FID-first priority (fid → place_id → cid) ✓
- Handles all three Outscraper response shapes (A/B/C) ✓
- 60s timeout (was 30s) ✓
- Raw response logging for debug ✓
- Self-contained JS (no `_shared/` imports — MCP bundler compatible) ✓

S236 syncs v3 source back to the repo and removes it as a discrepancy.

---

## Verified state at S235 close

| Check | Status |
|-------|--------|
| Dang (1611b16f) — 46 reviews imported, source='google_outscraper' | ✅ |
| 6 legacy source='Google' rows untouched | ✅ |
| Admin Refresh Now button works end-to-end | ✅ |
| Cron fires nightly at 2am UTC | ✅ |
| Vault secret populated (len 64) | ✅ |
| OUTSCRAPER_API_KEY in Edge Function Secrets | ✅ |
| Partial unique index created | ✅ |
| config.toml verify_jwt = false | ✅ |

---

## What S236 corrects

1. **Edge function source** — repo `index.ts` overwritten with canonical v3
2. **TestimonialsTab.tsx** — removed "Powered by Outscraper ·" attribution text (keep cadence label only)
3. **PR #114** — was already merged before S236 ran; S236 opens PR #115 with the cleanup

---

## Do NOT touch

- Testimonials schema (no additional migrations needed)
- Rate-limit logic or vault secret
- Cron schedule or dispatch function
- Any tenant data (46 Dang reviews are live)
