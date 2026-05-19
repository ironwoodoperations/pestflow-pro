# PestFlow Pro — S230 Handoff (Shipped)

**Session:** S230 — OAuth-based Google Search Console integration (testing mode)
**Date:** 2026-05-19
**Branch:** feat/s230-gsc-analytics
**PR:** (see Phase 8 — open after this file is committed)
**CI:** tsc + build clean (0 TS errors)

One-line: Built the full GSC data pipeline — `gsc_runs` table, `gsc-analytics` edge fn (OAuth refresh token → access token → GSC Search Analytics API → store result), weekly cron (Sunday 03:00 UTC), `useGscRuns` hook, `GscAnalyticsTile` component, mounted on both Reports tab (`minTier={3}`) and SEO Connect tab (all tiers).

---

## What shipped

| File | Change |
|---|---|
| `supabase/functions/gsc-analytics/index.ts` | New edge fn: service-role JWT bypass (cron), `requireTenantUser` gate (interactive), OAuth refresh→access token exchange, GSC Search Analytics API call, aggregate metrics (clicks/impressions/CTR/position), top 10 queries, writes to `gsc_runs`. Handles: unconfigured (no refresh token), token_revoked (invalid_grant → reconnect message), missing site URL, GSC API errors. |
| `src/hooks/useGscRuns.ts` | New hook — mirrors `useZernioRuns.ts`: fetches latest `gsc_runs` row for tenant, exposes `runCheck` (calls edge fn, refreshes session), loading/running/error state. |
| `src/components/admin/seo/GscAnalyticsTile.tsx` | New admin tile — 4 states: loading / unconfigured / error (with token_revoked handling) / success (4 stat pills + top queries table). Run Now button. Last-checked timestamp. |
| `src/components/admin/ReportsTab.tsx` | Mounted `GscAnalyticsTile` after `SeoAnalyticsTile`, `minTier={3}`. |
| `src/components/admin/seo/SeoConnectTab.tsx` | Mounted `GscAnalyticsTile` after `SeoAnalyticsTile` block, all tiers (no gate). |
| `docs/migrations/s230-gsc-runs.sql` | Migration doc for `gsc_runs` table (applied). |
| `docs/migrations/s230-gsc-runs-rollback.sql` | Rollback for `gsc_runs`. |
| `docs/migrations/s230-gsc-cron.sql` | Migration doc for `gsc_cron_dispatch()` function + `gsc-weekly-refresh` cron job (applied). |
| `docs/migrations/s230-gsc-cron-rollback.sql` | Rollback for cron. |
| `docs/audits/s230-validator-gate.md` | Validator gate (manual-lock waiver — external validators unavailable in Codespace). All 3 triggers satisfied. |

---

## Applied to Supabase (via MCP, already live)

1. `s230_gsc_runs` — `gsc_runs` table with RLS (`tenant_isolation` policy), `(tenant_id, ran_at DESC)` index
2. `s230_gsc_cron` — `gsc_cron_dispatch()` SECURITY DEFINER function + `cron.schedule('gsc-weekly-refresh', '0 3 * * 0', ...)`

Deployed edge function: `gsc-analytics` — deployed via `supabase functions deploy` with `verify_jwt: true`.

---

## Scott actions required before live data works

### Before any data flows for Dang:

1. **GCP OAuth app setup (in pestflow-pro-prod project):**
   - APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web application type)
   - Redirect URI: `https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/gsc-oauth-callback` (placeholder — callback edge fn is a future session)
   - Scopes: `https://www.googleapis.com/auth/webmasters.readonly`
   - Set app to **Testing** mode
   - Add Kirk's Google account as a test user
   - Download credentials JSON → add `GSC_OAUTH_CLIENT_ID` and `GSC_OAUTH_CLIENT_SECRET` to Doppler `prd` config

2. **Get a refresh token for Dang manually** (the full "Connect GSC" OAuth consent UI is a future session — S230 locked scoping decision):
   - Use Google OAuth Playground or a local script to authorize Kirk's Google account with `webmasters.readonly` scope using the new OAuth client
   - Capture the refresh token
   - Insert via Supabase MCP:
     ```sql
     UPDATE settings
     SET value = value || '{"gsc_oauth_refresh_token": "<refresh_token>"}'
     WHERE tenant_id = '1abd6f30-0bb0-4424-97aa-4e6d0a74c4cd'  -- Dang tenant ID
       AND key = 'integrations';
     ```
   - Then click "Run Now" on the GSC tile in Dang admin

3. **Verify GSC property URL format for Dang:**
   - Dang currently has `google_search_console_url: "dangpestcontrol.com"` in integrations
   - Edge fn normalises this to `https://dangpestcontrol.com/` (URL-prefix format)
   - Check Kirk's GSC: if the property is registered as `sc-domain:dangpestcontrol.com`, add `gsc_site_url: "sc-domain:dangpestcontrol.com"` to Dang's integrations to override
   - URL-prefix and domain property are NOT interchangeable — wrong format → 403

4. **Doppler keys:** `GSC_OAUTH_CLIENT_ID` and `GSC_OAUTH_CLIENT_SECRET` must be added to Doppler before the edge fn can exchange tokens. Until then, any "Run Now" call returns HTTP 503 (platform not configured).

---

## Risk 1 (unverified app warning) — expected, not a bug

When the full OAuth consent UI is built (future session), Kirk will see a Google "This app hasn't been verified" interstitial. He must click "Advanced" → "Go to [app name] (unsafe)" to proceed. Document this in the concierge onboarding script. Will disappear when the app is verified (future work).

---

## Design decisions baked in

- **Refresh token storage:** Plaintext in Supabase JSONB, service-role-only access. Same pattern as `ZERNIO_API_KEY`. AES-256 option available as future hardening (Doppler `GSC_TOKEN_ENCRYPTION_KEY` + `crypto.subtle.encrypt`).
- **Site URL fallback:** Edge fn checks `gsc_site_url` first, then falls back to `google_search_console_url`. Normalizes to URL-prefix format unless `sc-domain:` prefix detected.
- **Date range:** `startDate` = 31 days ago, `endDate` = yesterday (GSC lags 1-2 days; yesterday avoids the empty tail).
- **Cron limit:** 10 tenants per tick (vs S227 SEO's 3) — GSC is lighter (no multi-kind loop, just one API call per tenant).

---

## CI gate

| Check | Result |
|---|---|
| BL canary (`git diff --name-only origin/main..HEAD -- src/shells app`) | Empty — no shell files touched ✓ |
| `npm run build` (build:vite + build:next) | Exit 0 ✓ |

---

## Browser checks (Scott, post-merge + after Doppler keys set)

1. Dang admin → SEO Connect tab → GSC tile renders in **unconfigured** state (before token inserted) — verify "Connect Google Search Console not connected" message
2. Dang admin → Reports tab → GSC tile renders in **unconfigured** state at `minTier={3}` gate
3. After manually inserting refresh token → click "Run Now" → verify `gsc_runs` row written with `status=success`
4. Verify tile renders 4 stat pills (Total Clicks / Impressions / Avg CTR / Avg Position) + top queries table
5. Verify no regressions on S227 SeoAnalyticsTile, S224 PageSpeed tile, S225/S226 Social Analytics tile

---

## On the horizon

- **S231 (next):** OAuth-based GA4 integration — reuses same OAuth client (add `analytics.readonly` scope). Hard dependency: GA4 tracking script on shells not yet installed. Kickoff: `docs/audits/pestflow-pro-kickoff-S231.md`.
- **"Connect GSC" UI flow (future):** Full `gsc-oauth-callback` edge fn + OAuth redirect/consent screen UI. Currently tokens are inserted manually. Once S230 is verified working, build the self-service connection in a dedicated session.
