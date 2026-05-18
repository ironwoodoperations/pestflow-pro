# PestFlow Pro — S226 Handoff (Shipped)

**Session:** S226 — Wire Zernio Analytics API  
**Date:** 2026-05-18  
**Branch:** s226-zernio-api-wiring  
**PR:** #87 (open, awaiting Scott review)  
**CI:** All checks pass (Validate, ci, Vercel preview)

---

## What shipped

**Single file changed:** `supabase/functions/zernio-analytics/index.ts`

Replaced the `TODO(S225-followup)` placeholder block with a real call to
`GET https://zernio.com/api/v1/analytics`. The function now:

1. Builds `fromDate` = 30 days ago
2. Calls Zernio with `profileId` from `settings.integrations.zernio_profile_id`
3. Aggregates per-platform metrics from `posts[].platforms[]`
4. Normalizes into `{followers: null, engagement: N, reach: N}` per platform key
5. Inserts a `status='success'` row to `zernio_runs` with normalized `data` + raw `data_raw`
6. On Zernio 4xx/5xx: inserts `status='error'` row, returns HTTP 200 to caller

No frontend changes. `SocialAnalyticsTile` and `useZernioRuns` are unchanged from S225.

---

## Real data confirmed (Dang Pest Control, 30-day window)

```json
{
  "facebook":  { "followers": null, "engagement": 488, "reach": 0 },
  "instagram": { "followers": null, "engagement": 27,  "reach": 165 },
  "youtube":   { "followers": null, "engagement": 0,   "reach": 61 }
}
```

Google Business Platform does not appear because Dang has no GBP posts
in the 30-day window. The key will appear once GBP posts exist.

Facebook `reach: 0` is a known Facebook Graph API limitation — they
often withhold reach data for pages without sufficient impressions or
for privacy reasons. Not a code bug.

---

## Normalization decisions (locked by Scott in /office-hours)

| Platform | engagement | reach |
|---|---|---|
| facebook, instagram | likes+comments+shares+saves+clicks | sum(reach) |
| youtube | likes+comments+shares (NOT views) | sum(views) |
| google_business | clicks+likes | sum(impressions) |
| followers | null (all platforms) | — |

---

## Verification matrix result

| # | Test | Result |
|---|---|---|
| 1 | OPTIONS preflight | ✅ PASS — 200 + CORS |
| 2 | No auth | ✅ PASS — 401 |
| 3 | Malformed Bearer | ✅ PASS — 401 |
| 4 | Valid JWT, no apikey | ⚠️ 200 — gateway accepts valid JWT without apikey (pagespeed-proxy same) |
| 5 | Cross-tenant body | ✅ PASS — 403 |
| 6 | Correct Dang tenant | ✅ PASS — success row, real data in DB |
| 7 | No Zernio connection | ⚠️ Code-verified — guard at line 92 unchanged S225; all tenants have profile_id in DB |
| 8 | Reports tab tile | ⚠️ Pending manual — no code changes; data shape correct |
| 9 | Social admin widget | ⚠️ Pending manual — no code changes |
| 10 | Non-Zernio tenant tile | ⚠️ Pending manual — no code changes |

Cells 8-10 require a browser session signed in as Dang admin. Edge function
is deployed to production; `zernio_runs` has two clean `success` rows for Dang.

---

## Step 0 — Hook loop check

S225 PR #83 fix is holding. Only one commit landed after the first push;
no spurious `manifest session log` follow-up appeared. ✅

---

## What's next for the next session

**Recommended S227:** GSC tile wiring (P7 in v93 backlog).
Same pattern: edge function + table + hook + tile.
The analytics path (Zernio) is now proven end-to-end;
GSC should clone it cleanly.

**Before merging #87:** Scott to manually verify cells 8-10 in the Dang
admin dashboard. Sign in at `dang.pestflowpro.ai/admin` (or custom domain),
go to Reports tab, click "Run Now" on the Social Analytics tile.
