# PestFlow Pro — Session kickoff: S231

**Session theme:** OAuth-based Google Analytics 4 integration (testing mode — reuses S230 OAuth client)
**Pattern to mirror:** S230 GSC pipeline — same table shape, same edge fn auth pattern, same cron architecture, same tile component structure
**Test/pilot tenant:** Dang (`dangpestcontrol.com`) — same test user added in S230 GCP setup (add `analytics.readonly` scope to existing client)
**Tier impact:** Reports tab tile gated `minTier={3}`; SEO Connect tab widget visible to all tiers (consistent with S227/S230 placement)
**Surfaces affected:** `supabase/functions/` (new `ga4-analytics` edge fn + cron extension or separate cron), new Supabase migration (`ga4_runs` table + RLS), `src/components/admin/` (new tile + hook), `src/components/admin/seo/SeoConnectTab.tsx`
**Hard dependency:** GA4 tracking script must be installed on all 5 Next.js shells FIRST (Phase 1 of this session) — no GA4 data to ingest until the property is receiving hits
**Execution venue:** Claude Code Web in Scott's Codespace
**Predecessor:** S230 (GSC pipeline, this PR) — must be merged
**Validator gate:** REQUIRED — three triggers: new edge fn, new external API (GA4 Data API), new scope on existing OAuth client
**Estimated:** 1.5 CC Web sessions (Phase 1 tracking script may be quick; Phases 2-8 mirror S230 closely)

---

## TL;DR

S231 extends the S230 OAuth app with a second scope (`analytics.readonly`) and builds the GA4 ingest pipeline. Per-tenant flow: same refresh token exchange pattern as S230 → GA4 Data API → store in `ga4_runs` → render in `Ga4AnalyticsTile`. The OAuth consent flow UI (full "Connect" button) is also out of scope for S231 — tokens are inserted manually for Dang during Phase 6 testing, same as S230.

**Key difference from S230:** GA4 requires data to exist in the property before the API returns anything useful. That means the tracking script (Phase 1) must be installed and live for at least 24-48 hours before Phase 6 testing is meaningful. Plan accordingly — Scott may want to install the tracking script in a separate Codespace session before running the full S231 build, then run S231 Phases 2-8 once data is flowing.

---

## Prerequisites (Scott actions before session starts)

1. **Extend the S230 OAuth 2.0 client** in pestflow-pro-prod GCP project:
   - APIs & Services → Credentials → edit the existing OAuth 2.0 client from S230
   - Add scope: `https://www.googleapis.com/auth/analytics.readonly`
   - Dang's Kirk account is already a test user from S230 — no change needed
   - No new credentials download needed — same `GSC_OAUTH_CLIENT_ID` and `GSC_OAUTH_CLIENT_SECRET`

2. **Get a GA4 property ID for Dang:**
   - Kirk needs to set up a GA4 property for `dangpestcontrol.com` (or confirm one exists)
   - GA4 property ID format: `properties/XXXXXXXXX` (9+ digit number)
   - Store as `settings.integrations.ga4_property_id` for the Dang tenant

3. **S230 must be merged and verified** before starting S231.

---

## Phase 1 — GA4 tracking script installation on all 5 shells

**Required before any GA4 data is available.** No data = no ingest = nothing to test in Phase 6.

For each Next.js shell (tenants render via the shells at `src/shells/` and the `app/tenant/[slug]/` route):

1. Check if `@next/third-parties` is installed (or use `next/script` directly).
2. Add the Google Analytics component to the root layout or `_app`:
   ```tsx
   // Using @next/third-parties (recommended Next.js 14 approach):
   import { GoogleAnalytics } from '@next/third-parties/google'
   // In the layout:
   <GoogleAnalytics gaId="G-XXXXXXXXXX" />
   ```
   - `gaId` must come from `settings.branding` or a new `settings.analytics` key — NOT hardcoded. Each tenant has their own GA4 measurement ID.
   - Design decision for Phase 1: Add `ga4_measurement_id` to `settings.business_info` or create a new `analytics` settings key. **Stop and confirm with Scott** before choosing — this touches provisioning.
3. Verify the script fires on `dangpestcontrol.com` → open DevTools → Network → confirm `gtag` requests to `google-analytics.com`.

**Scope locked:** Only install tracking. Do NOT build the ingest edge fn or tile in Phase 1 — wait 24-48 hours for data to accumulate.

---

## Phase 2 — `ga4-analytics` edge function

Build `supabase/functions/ga4-analytics/index.ts` following the S230 GSC pattern exactly.

**Auth:** `verify_jwt: true`. Same `requireTenantUser` + service-role bypass (cron).

**Core logic:**
1. Parse `{ tenant_id }` from body; auth via `requireTenantUser` or service-role bypass
2. Load `settings.integrations` for tenant; check `ga4_oauth_refresh_token`
3. If no refresh token → write `{ status: 'unconfigured' }` run, return 200 with `{ status: 'unconfigured' }`
4. Mint access token: same OAuth exchange as S230 (`https://oauth2.googleapis.com/token`, `grant_type: 'refresh_token'`)
   - Same `GSC_OAUTH_CLIENT_ID` / `GSC_OAUTH_CLIENT_SECRET` env vars — shared OAuth client
5. Get `ga4_property_id` from `settings.integrations`; if missing → error run
6. Call GA4 Data API: `POST https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runReport`
   - Body:
     ```json
     {
       "dateRanges": [{ "startDate": "30daysAgo", "endDate": "yesterday" }],
       "dimensions": [{ "name": "sessionDefaultChannelGroup" }],
       "metrics": [
         { "name": "activeUsers" },
         { "name": "sessions" },
         { "name": "engagementRate" },
         { "name": "screenPageViews" }
       ]
     }
     ```
   - Second call for top pages: dimensions `[{ "name": "pagePath" }]`, metrics `[{ "name": "screenPageViews" }]`, `rowLimit: 10`
7. Parse response: aggregate totals (users, sessions, avg engagement rate, total page views), traffic source breakdown per channel group, top pages
8. Store `data` shape:
   ```json
   {
     "total_users": number,
     "total_sessions": number,
     "avg_engagement_rate": number,
     "total_page_views": number,
     "channels": [{ "channel": string, "sessions": number, "users": number }],
     "top_pages": [{ "page": string, "views": number }]
   }
   ```
9. Write `{ status: 'success', data, data_raw: responseBody }` to `ga4_runs`

**Note on `invalid_grant`:** Same handling as S230 — `token_revoked` error code, "Reconnect Google Analytics" prompt.

**Deploy:**
```
supabase functions deploy ga4-analytics --project-ref biezzykcgzkrwdgqpsar
```

---

## Phase 3 — DB migration: `ga4_runs` table

```sql
CREATE TABLE ga4_runs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status         text        NOT NULL CHECK (status IN ('success', 'error', 'unconfigured')),
  data           jsonb,
  data_raw       jsonb,
  api_error_code text,
  api_error_msg  text,
  ran_at         timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE ga4_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON ga4_runs
  FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );
CREATE INDEX ga4_runs_tenant_ran_at ON ga4_runs (tenant_id, ran_at DESC);
```

---

## Phase 4 — Cron schedule

Add a `ga4_cron_dispatch()` function (mirror `gsc_cron_dispatch()`):
- Eligibility: tier >= 3 AND `ga4_oauth_refresh_token` set AND `ga4_property_id` set AND no success in last 7 days
- Schedule: Sunday 04:00 UTC (offset from GSC at 03:00 to avoid concurrent cold starts)
- Migration: `s231_ga4_cron`

---

## Phase 5 — `useGa4Runs` hook + `Ga4AnalyticsTile` component

**Hook:** Mirror `useGscRuns.ts`. Substituting `ga4_runs` table and `ga4-analytics` function slug.

```typescript
export type Ga4Data = {
  total_users: number | null
  total_sessions: number | null
  avg_engagement_rate: number | null
  total_page_views: number | null
  channels: Array<{ channel: string; sessions: number; users: number }>
  top_pages: Array<{ page: string; views: number }>
}
```

**Tile component:** `src/components/admin/seo/Ga4AnalyticsTile.tsx`

Display shape (success state):
- 4 stat pills: Total Users / Total Sessions / Avg Engagement Rate (%) / Page Views
- Traffic source table (channels + sessions + users)
- Top pages table (page path + views)
- Run Now button, last-checked timestamp
- States: loading / unconfigured / error (with token_revoked handling) / success

**Mount points:**
- `src/components/admin/ReportsTab.tsx` — after `GscAnalyticsTile`, gated `minTier={3}`
- `src/components/admin/seo/SeoConnectTab.tsx` — after `GscAnalyticsTile`, all tiers

---

## Phase 6 — Validator gate

Three triggers: new edge fn, new external API (GA4 Data API), new scope on existing OAuth client.

Verify:
1. GA4 Data API endpoint URL and request body shape (dimensions/metrics format, `properties/{id}:runReport`)
2. OAuth exchange — same as S230 (no changes to token exchange flow; only scope differs)
3. `analytics.readonly` scope is correct for GA4 Data API (confirm — not `analytics.edit` or Analytics Reporting API v4 scope)

Manual-lock waiver conditions: same as S230.

---

## Phase 7 — Per-shell verification + browser pass

1. Tracking script fires on Dang site (DevTools → Network)
2. GA4 tile renders unconfigured state on SEO Connect + Reports (before token insert)
3. After manual token insert → Run Now → `ga4_runs` row with status=success and correct data shape
4. Tile renders 4 stat pills + channels table + top pages table
5. No regressions on S230 GSC tile, S227 SEO Analytics tile, S224 PageSpeed tile

---

## Phase 8 — Doc updates

- `docs/handoffs/pestflow-pro-handoff-S231-shipped.md`
- `docs/handoffs/pestflow-pro-todo-v99.html` — bump, mark S231 shipped
- Next backlog item: "Connect GSC/GA4" OAuth consent UI session

---

## Phase 9 — Ship

Single PR, manual Scott merge.

```
gh pr create --title "S231 — OAuth-based Google Analytics 4 integration (testing mode)"
```

---

## Risks

### Risk 1: GA4 property ID format
GA4 Data API requires `properties/XXXXXXXXX` (numeric). The tenant `integrations` key `ga4_property_id` should store just the numeric part (e.g., `"123456789"`) and the edge fn prepends `properties/`. Alternatively store the full `properties/123456789` and use as-is. Pick one convention and document it. **Decision point in Phase 1.**

### Risk 2: Tracking script ID per-tenant vs platform
Each tenant would ideally have their own GA4 property (and thus their own measurement ID). However, at current scale, a single PestFlow Pro GA4 property covering all tenants is simpler. **Decision: per-tenant GA4 properties.** Each tenant manages their own GA4 account; Scott captures the property ID during the Day 2 call. This is the same model as GSC — per-tenant credentials.

### Risk 3: GA4 API quota
GA4 Data API standard quota: 200 tokens per project per minute, 40,000 tokens per day. Each `runReport` call costs approximately 10 tokens. At 10 tenants, cron costs ~20 tokens/week — well within quota. No rate limiting needed at current scale.

### Risk 4: Data freshness
GA4 data is typically available with a 24-48 hour lag. The `endDate: "yesterday"` convention (same as S230 GSC) avoids incomplete-day data. If Kirk checks the tile the day after tracking goes live, data will be sparse but not empty.

---

## Locked scoping decisions

- S231 does NOT build the "Connect GA4" OAuth UI flow. Token inserted manually for testing.
- S231 does NOT modify the S230 OAuth client — only adds the `analytics.readonly` scope via GCP console (Scott action, not CC Web code).
- GA4 and GSC share the same OAuth client (single GCP app, multiple scopes) but have separate DB tables, separate edge fns, and separate tiles.
- Tracking script sourced from Next.js `@next/third-parties/google` — no custom script, no `_document.tsx` editing.
