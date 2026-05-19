# PestFlow Pro — Session kickoff: S230

**Session theme:** OAuth-based Google Search Console integration (testing mode — replaces dead service-account path)
**Pattern to mirror:** S227 DataForSEO edge fn pattern — cron-driven weekly + on-demand button, JWT-protected, dedicated `gsc_runs` table, JSONB data column
**Test/pilot tenant:** Dang (`dangpestcontrol.com`) — must be added as a test user to the OAuth app before Phase 2 (concierge onboarding step, Scott action)
**Tier impact:** Reports tab tile gated `minTier={3}`; SEO Connect tab widget visible to all tiers (consistent with S227 SEO tile placement)
**Surfaces affected:** `supabase/functions/` (new `gsc-analytics` edge fn + cron), new Supabase migration (`gsc_runs` table + RLS), `src/components/admin/` (new tile + hook), `src/components/admin/seo/SeoConnectTab.tsx`
**Execution venue:** Claude Code Web in Scott's Codespace
**Predecessor:** S229 (Zernio followers fix, PR #93) — assumed merged
**Validator gate:** REQUIRED — three triggers: new edge fn, new external API, new auth pattern (OAuth refresh token lifecycle)
**Estimated:** 1 full CC Web session

---

## TL;DR

The service-account add-user path for GSC is dead (Google bug, acknowledged May 1 2026, no ETA). S230 pivots to OAuth 2.0 testing mode: new OAuth client in the pestflow-pro-prod GCP project (webmasters.readonly scope), customers added by hand as test users during concierge onboarding (max 100, no Google verification required at current scale). Per-tenant flow: Dang admin clicks "Connect Google Search Console" → Google consent screen (unverified app warning, expect click-through) → we receive a refresh token → store encrypted in `settings.integrations.gsc_oauth_refresh_token`. Edge fn mints a short-lived access token per request from the stored refresh token, calls GSC Search Analytics API, parses clicks/impressions/CTR/avg-position, stores in `gsc_runs`. Weekly cron + on-demand button. New tile on Reports + SEO Connect surfaces.

No dependency on S231 (GA4). S230 and S231 share the same OAuth 2.0 client app (single GCP OAuth registration, multiple scopes) but are fully independent sessions — S230 can ship without S231.

---

## Phase 1 — OAuth app setup + DB migration + token storage design

**Scott action (before Phase 2 code):**
1. In pestflow-pro-prod GCP project → APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web application type). Redirect URI: `https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/gsc-oauth-callback` (or equivalent). Scopes: `https://www.googleapis.com/auth/webmasters.readonly`. Set app to **Testing** mode.
2. Add Dang's Google account (Kirk's email, or whichever account owns the GSC property) as a test user.
3. Download client credentials JSON → add `GSC_OAUTH_CLIENT_ID` and `GSC_OAUTH_CLIENT_SECRET` to Doppler under the `prd` config.

**CC Web actions:**
- Author new Supabase migration: `gsc_runs` table
  ```sql
  CREATE TABLE gsc_runs (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    status      text NOT NULL CHECK (status IN ('success','error','unconfigured')),
    data        jsonb,
    data_raw    jsonb,
    api_error_code text,
    api_error_msg  text,
    ran_at      timestamptz NOT NULL DEFAULT now()
  );
  ALTER TABLE gsc_runs ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "tenant_isolation" ON gsc_runs
    FOR ALL TO authenticated USING (tenant_id = (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));
  CREATE INDEX gsc_runs_tenant_ran_at ON gsc_runs (tenant_id, ran_at DESC);
  ```
- Apply migration via Supabase MCP (`apply_migration`)
- Confirm `settings.integrations` shape extended: `gsc_oauth_refresh_token: string | null` (existing column, no migration needed — JSONB)
- Confirm `gsc_oauth_client_id` and `gsc_oauth_client_secret` keys available in Doppler (not per-tenant — platform-wide)
- Decide encryption at rest: store refresh token as plaintext in Supabase (service-role-only column accessible, RLS prevents direct client reads) OR encrypt with a Doppler-stored symmetric key before insert. **Decision point:** Supabase service-role isolation is the same pattern used for `zernio_api_key` and Stripe keys — plaintext in DB, service-role-only access via edge fns. Apply the same pattern for consistency unless Scott wants AES-256 layer.

---

## Phase 2 — `gsc-analytics` edge function

Build `supabase/functions/gsc-analytics/index.ts` following the S227 DataForSEO edge fn pattern:

**Auth:** `verify_jwt: true`. Use `requireTenantUser` (same as `zernio-analytics`) — any authenticated tenant user may trigger.

**Core logic:**
1. Parse `{ tenant_id }` from body; auth via `requireTenantUser`
2. Load `settings.integrations` for tenant; check `gsc_oauth_refresh_token`
3. If no refresh token → write `{ status: 'unconfigured' }` run, return 200 with `{ status: 'unconfigured', message: 'Google Search Console not connected.' }`
4. Mint short-lived access token: POST to `https://oauth2.googleapis.com/token` with `{ client_id, client_secret, refresh_token, grant_type: 'refresh_token' }` using Doppler-injected `GSC_OAUTH_CLIENT_ID` / `GSC_OAUTH_CLIENT_SECRET`
5. If token mint fails (refresh token revoked, expired, or invalid) → write error run, return graceful error (user needs to reconnect)
6. Call GSC Search Analytics API: `POST https://searchconsoleapi.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query` with `{ startDate: 30daysago, endDate: today, dimensions: ['query'], rowLimit: 1000 }`
   - `siteUrl` comes from `settings.integrations.gsc_site_url` (existing field — Dang has `https://dangpestcontrol.com/` or `sc-domain:dangpestcontrol.com`; **see Phase 1 risk note on URL vs domain property format**)
7. Parse response: aggregate `clicks`, `impressions`, `ctr`, `position` across all rows (total clicks/impressions/sum); find `position` weighted average; find top 10 queries by clicks
8. Store `data` shape:
   ```json
   {
     "total_clicks": number,
     "total_impressions": number,
     "avg_ctr": number,
     "avg_position": number,
     "top_queries": [{ "query": string, "clicks": number, "impressions": number, "position": number }]
   }
   ```
9. Write `{ status: 'success', data, data_raw: responseBody }` to `gsc_runs`
10. Return `{ status: 'success', run }`

**Deploy:**
```
supabase functions deploy gsc-analytics --project-ref biezzykcgzkrwdgqpsar
```

---

## Phase 3 — Cron schedule + on-demand button

**Cron:** Weekly refresh, same pattern as `dataforseo-seo-analytics`. Add to `supabase/functions/gsc-analytics/index.ts` or create a separate `gsc-analytics-cron` wrapper (separate fn for cleaner JWT separation — cron uses service role, on-demand uses tenant JWT).

Cron schedule: Sunday 03:00 UTC (offset from DataForSEO cron to avoid concurrent edge fn cold starts). Register via Supabase MCP Dashboard or `pg_cron` migration:
```sql
SELECT cron.schedule('gsc-weekly-refresh', '0 3 * * 0',
  $$SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/gsc-analytics',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key'))
  )$$
);
```

**On-demand button:** Wire in the new `GscAnalyticsTile` component (Phase 4). Same `runCheck` pattern as `useZernioRuns`.

---

## Phase 4 — `GscAnalyticsTile` component + `useGscRuns` hook

**Hook:** `src/hooks/useGscRuns.ts` — mirror `useZernioRuns.ts` exactly, substituting `gsc_runs` table and `gsc-analytics` function slug.

```typescript
export type GscData = {
  total_clicks: number | null
  total_impressions: number | null
  avg_ctr: number | null
  avg_position: number | null
  top_queries: Array<{ query: string; clicks: number; impressions: number; position: number }>
}
export type GscRun = {
  id: string; tenant_id: string
  status: 'success' | 'error' | 'unconfigured'
  data: GscData | null
  data_raw: unknown
  api_error_code: string | null; api_error_msg: string | null
  ran_at: string
}
```

**Tile component:** `src/components/admin/seo/GscAnalyticsTile.tsx`

Display shape (success state):
- 4 stat pills: Total Clicks / Total Impressions / Avg CTR (%) / Avg Position
- Top queries table (up to 10 rows): query, clicks, impressions, position
- "Run Now" button
- Last checked timestamp

States: loading / unconfigured ("Connect Google Search Console to see your search performance data" + link to SEO Connect tab) / error (error message + retry button) / success

**Mount points:**
- `src/components/admin/ReportsTab.tsx` — after `SeoAnalyticsTile`, gated `minTier={3}` (consistent with S227 tile)
- `src/components/admin/seo/SeoConnectTab.tsx` — after the S227 SEO Analytics widget, all tiers (consistent with S227 placement pattern)

---

## Phase 5 — Validator gate

**REQUIRED.** Three triggers fire: new edge fn, new external API (GSC Search Analytics), new auth pattern (OAuth refresh token lifecycle).

Validator gate process:
1. Author the full gate document at `docs/audits/s230-validator-gate.md`
2. Run Perplexity check: verify GSC Search Analytics API endpoint URL, query parameter shape, response format, and authentication header format (Bearer access token, not API key)
3. Run Gemini check: independent review of the refresh-token-to-access-token exchange (`https://oauth2.googleapis.com/token`), confirm `grant_type: 'refresh_token'` is the correct flow, confirm response shape (`access_token`, `expires_in`, no new refresh token issued on exchange)
4. If either validator flags a discrepancy with the implementation in Phase 2, pause and reconcile before Phase 6

**Manual-lock waiver condition:** Perplexity and Gemini are not available in Codespace. If both are unavailable, document the waiver explicitly in the gate document: "Manual-lock waiver applied — external validators unavailable in Codespace. Gate satisfied by: (1) GSC Search Analytics API documented at developers.google.com/webmaster-tools/v1/searchanalytics/query (static, well-established, unchanged since S227 planning), (2) OAuth token exchange is a standard RFC 6749 refresh flow, (3) Phase 2 logic reviewed against Google OAuth2 token endpoint docs directly."

---

## Phase 6 — Per-shell verification + browser pass

**BL canary:** `git diff --name-only origin/main..HEAD -- src/shells app` — expected empty (no shell-rendered files touched).

**Browser pass (Dang admin):**
1. Navigate to SEO Connect tab → verify GscAnalyticsTile renders in unconfigured state (before OAuth connect flow is built)
2. Navigate to Reports tab → verify GscAnalyticsTile renders in unconfigured state at minTier=3 gate
3. After manually inserting a test refresh token into `settings.integrations.gsc_oauth_refresh_token` for Dang (Supabase MCP insert) → click "Run Now" → verify `gsc_runs` row written with status=success and correct data shape
4. Verify tile renders 4 stat pills + top queries table with real numbers
5. Verify no regressions on S227 SeoAnalyticsTile, PageSpeed tile, Social Analytics tile

---

## Phase 7 — Doc updates

- `docs/handoffs/pestflow-pro-handoff-S230-shipped.md` — mirror S229 shipped-handoff structure
- `docs/handoffs/pestflow-pro-todo-v97.html` → `pestflow-pro-todo-v98.html` — bump version, mark S230 shipped, update S231 status (now unblocked from OAuth client standpoint — only shell tracking script remains as hard dependency), author S231 kickoff
- `docs/audits/pestflow-pro-kickoff-S231.md` — OAuth-pivot GA4 session, Phase 1-7 structure

---

## Phase 8 — Ship

Single PR, manual Scott merge. No auto-merge.

```
gh pr create --title "S230 — OAuth-based Google Search Console integration (testing mode)"
```

---

## Risks

### Risk 1: Unverified app consent warning screen

OAuth testing-mode apps show a Google "This app hasn't been verified" interstitial to any user who hasn't previously consented. The interstitial requires clicking "Advanced" → "Go to [app name] (unsafe)" to proceed. This is expected behavior — document it explicitly in the concierge onboarding script so Scott prepares Kirk for the click-through. Do not attempt to suppress or work around it; it disappears once the app is verified (future work, not required at current scale).

### Risk 2: Refresh token lifecycle

Refresh tokens issued in testing mode are valid until revoked by the user or Google. Rotation: Google does NOT issue a new refresh token on each token exchange (unlike some providers) — the original token persists. Revocation scenarios: (1) user revokes access in their Google account settings, (2) Google revokes for inactivity after 6 months (if the access token is never used), (3) Google revokes all testing-mode tokens if the app is moved out of testing mode without verification. Handle revocation: if the token exchange returns `invalid_grant`, write an error run with `api_error_code: 'token_revoked'` and surface a "Reconnect Google Search Console" prompt in the tile. No automatic token refresh dance needed — the stored token IS the refresh token.

Encryption at rest decision (Phase 1): Storing the refresh token as plaintext in Supabase JSONB under service-role-only access is consistent with how `ZERNIO_API_KEY` and other platform credentials are handled (Doppler for platform keys; per-tenant secrets in `settings` JSONB read only by edge fns). This is acceptable for current scale. If Scott wants AES-256 encryption before the refresh token touches the DB, add a Doppler-stored `GSC_TOKEN_ENCRYPTION_KEY` and wrap with a simple `crypto.subtle.encrypt` in the edge fn — raise this as a decision point in Phase 1 before writing Phase 2 code.

### Risk 3: GSC property URL format

GSC Search Analytics API requires an exact property identifier that matches what the tenant registered in Google Search Console. Two formats exist:
- **URL prefix property:** `https://dangpestcontrol.com/` (includes trailing slash)
- **Domain property:** `sc-domain:dangpestcontrol.com`

These are NOT interchangeable — using the wrong format returns a 403 or empty result with no helpful error. Check `settings.integrations.gsc_site_url` for Dang before Phase 2. If it's missing, add it during Phase 1 (Supabase MCP update). Verify which property type Kirk registered by checking the GSC UI or asking Scott. Domain properties are broader (cover all subdomains + protocols) and preferred — but require DNS TXT record verification which Kirk may not have done. URL prefix properties are more common for simple setups.

---

## Locked scoping decisions

- OAuth flow is **one-way in this session:** we store the refresh token but do NOT build the "Connect GSC" redirect/callback UI flow. The token is inserted manually via Supabase MCP for Dang during Phase 6 testing. The full OAuth consent screen + callback edge fn (`gsc-oauth-callback`) is a future-session UI task once the data pipeline is verified working.
- S230 does NOT modify existing shell files or public-facing routes.
- S230 does NOT share a cron table row with DataForSEO — separate `gsc_runs` table, separate cron job.
- S231 (GA4) is NOT in scope for this session. The OAuth client created in Phase 1 will be extended with `analytics.readonly` scope in S231, but that scope addition is a Phase 1 task of S231, not S230.
