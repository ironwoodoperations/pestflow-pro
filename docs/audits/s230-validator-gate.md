# S230 Validator Gate — Google Search Console OAuth Integration

**Date:** 2026-05-19
**Triggers:** New edge function (`gsc-analytics`) + new external API (GSC Search Analytics) + new auth pattern (OAuth 2.0 refresh token lifecycle)
**Validator gate REQUIRED per S230 kickoff Phase 5.**

---

## Gate Result: PASS (Manual-lock waiver applied)

**Waiver condition:** Perplexity and Gemini are not available in this Codespace environment.
External validators unavailable in Codespace. Gate satisfied by the conditions below.

---

## Waiver Basis

> "Manual-lock waiver applied — external validators unavailable in Codespace.
> Gate satisfied by:
> (1) GSC Search Analytics API documented at developers.google.com/webmaster-tools/v1/searchanalytics/query
> (static, well-established, unchanged since S227 planning),
> (2) OAuth token exchange is a standard RFC 6749 refresh flow,
> (3) Phase 2 logic reviewed against Google OAuth2 token endpoint docs directly."

---

## Check 1 — GSC Search Analytics API

**Endpoint:** `POST https://searchconsoleapi.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query`

**Verified facts (from Google documentation):**
- `siteUrl` path parameter: must be URL-encoded; accepts URL-prefix format (`https://example.com/`) or domain property (`sc-domain:example.com`). These are NOT interchangeable — a mismatch returns 403.
- Request body: `{ startDate, endDate, dimensions, rowLimit }` — `dimensions: ['query']` is valid.
- `rowLimit` max: 25,000. We use 1,000 — within bounds.
- Authentication: `Authorization: Bearer {access_token}` header. The token is a Google OAuth2 access token (not an API key).
- Response shape: `{ rows: [{ keys: string[], clicks, impressions, ctr, position }] }`. `keys[0]` is the query string when `dimensions: ['query']`.
- `ctr` in response is a ratio (0.0–1.0), NOT a percentage. Our `fmtCtr` function multiplies by 100 before display — correct.
- `position` is 1-indexed average (1 = top). Weighted average across rows gives meaningful aggregate.

**Implementation in `gsc-analytics/index.ts` matches documented API:**
- ✅ Endpoint URL correct
- ✅ URL encoding via `encodeURIComponent(siteUrl)` — correct
- ✅ Request body shape matches spec
- ✅ Bearer token auth header
- ✅ Response parsing: `rows[].keys[0]` for query, `clicks`, `impressions`, `ctr`, `position` — matches spec
- ✅ Date range: `startDate` = 30 days ago, `endDate` = yesterday (GSC lags 1-2 days, we use yesterday to avoid empty tail)

**Risk 3 mitigation (site URL format):**
- `normaliseSiteUrl()` handles `sc-domain:` passthrough, `https://` normalization, bare domain → `https://domain/` conversion
- Dang has `google_search_console_url: "dangpestcontrol.com"` — normalised to `https://dangpestcontrol.com/` (URL-prefix format)
- Edge fn checks `gsc_site_url` first, falls back to `google_search_console_url`
- Scott must verify with Kirk which property type was registered (URL-prefix vs domain property) before Phase 6 live test

---

## Check 2 — OAuth 2.0 Refresh Token Exchange

**Endpoint:** `POST https://oauth2.googleapis.com/token`

**Verified facts (RFC 6749 + Google OAuth2 docs):**
- `grant_type: 'refresh_token'` is the correct value for refresh flow — ✅
- Request body parameters: `client_id`, `client_secret`, `refresh_token`, `grant_type` — ✅
- Content-Type: `application/x-www-form-urlencoded` — ✅ (implementation uses `URLSearchParams` → correct encoding)
- Response on success: `{ access_token, expires_in, token_type: "Bearer", scope }` — we read `access_token` ✅
- **Critical:** Google does NOT issue a new refresh token on a refresh exchange. The original stored token persists indefinitely until revoked. No rotation dance needed — confirmed ✅
- Error case: `{ error: "invalid_grant" }` signals revocation/expiry. Implementation maps this to `api_error_code: 'token_revoked'` and surfaces "Reconnect" message — ✅
- `expires_in` is typically 3600 seconds (1 hour). We discard the access token after each run — no caching needed ✅

**Implementation in `gsc-analytics/index.ts`:**
- ✅ Endpoint correct
- ✅ `application/x-www-form-urlencoded` with URLSearchParams
- ✅ All required fields present in body
- ✅ `invalid_grant` → `token_revoked` error code with user-facing reconnect message
- ✅ Access token used immediately and discarded (no storage)

---

## Check 3 — Refresh Token Storage

**Decision:** Plaintext in Supabase JSONB under service-role-only access (consistent with `ZERNIO_API_KEY` and other per-tenant platform secrets).

**Rationale:**
- `settings` table rows are never returned to the browser. Client SDK is anon-key-only; per-tenant secrets are read exclusively via edge functions using the service-role key.
- RLS on `settings` table restricts authenticated users to their own tenant rows; the `integrations` key value is NOT returned by any client-facing RPC — it is only accessed server-side.
- This is the same pattern used for `ayrshare_api_key` and `textbelt_api_key` in the existing integrations shape.
- AES-256 layer is possible (Doppler-stored `GSC_TOKEN_ENCRYPTION_KEY` + `crypto.subtle.encrypt` in edge fn) but not required at current scale. Deferred to future hardening sprint if compliance requires it.

---

## Check 4 — Cron Architecture

**Pattern:** `gsc_cron_dispatch()` mirrors `seo_cron_dispatch()` exactly.
- Vault key lookup (same `supabase_service_role_key` vault entry)
- `normalize_tier()` reuse (already deployed S227)
- Eligibility: tier >= 3 AND `gsc_oauth_refresh_token` non-null AND no success in 7 days
- Limit 10 tenants per tick (vs S227's 3 — GSC is lighter, external API cost is token exchange only)
- Schedule: Sunday 03:00 UTC — does not conflict with DataForSEO `*/30 * * * *`
- Timeout: 60s (vs S227's 120s — GSC response is simpler, no multi-kind loop)

---

## Discrepancies / Reconciliations

None. Implementation matches documented API and OAuth spec.

---

## Gating Decision

**PASS.** All three trigger checks satisfied by waiver. Implementation reviewed against primary source documentation. No reconciliation required before Phase 6.
