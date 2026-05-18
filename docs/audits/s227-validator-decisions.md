# S227 — Validator Gate Decisions

**Session:** claude/dataforseo-seo-analytics-Jja9a
**Date:** 2026-05-18
**Harness waiver:** Perplexity/Gemini are not available inside the CC Web sandbox.
Per the S225 PR #84 precedent (harness-aware validator pattern), Q1 was run
externally on Claude.ai (Perplexity + Gemini synthesized) and returned to this
session; **Q2 and Q3 were locked manually by Scott** under the same S225 #84
waiver. This document is the committed record of those decisions. No code landed
before this gate completed.

---

## Q1 — Schema design for `seo_runs` (Perplexity + Gemini, synthesized)

**Perplexity + Gemini agreed:**
- Single `seo_runs` table with a `kind` discriminator + CHECK
  `kind IN ('rankings','competitors','opportunities')`.
- Index `(tenant_id, kind, ran_at DESC)`.
- RLS tenant-isolation SELECT TO `authenticated`; `anon` REVOKE ALL.

**Freshness — Decision:** derived `MAX(ran_at) GROUP BY tenant_id` from
`seo_runs`. **No** `seo_last_runs` cache table and **no** `tenants.last_seo_run_at`
column. Gemini proposed a cache table but its volume math overestimated by ~50x;
real growth (~100 tenants × ~weekly ≈ ~15K rows/year) makes derived MAX trivially
fast. (Supersedes the earlier C2 "new settings key" working note.)
→ v94 backlog item: "migrate to `seo_last_runs` helper if EXPLAIN ANALYZE shows
a hotspot."

**Two risks both validators flagged — folded into Phase 1 migration:**
1. Status/error consistency CHECK:
   ```
   CONSTRAINT seo_runs_status_error_consistency CHECK (
     (status = 'success' AND api_error_code IS NULL AND api_error_msg IS NULL)
     OR (status = 'error' AND api_error_code IS NOT NULL)
   )
   ```
2. JSONB payload contract per kind documented in a comment block atop the
   migration file. Shape validation lives in the edge fn (it owns the shape).
   No JSON Schema constraint in DB.

**Implementation impact:** `seo_runs` = the 8 real `zernio_runs` columns
(id, tenant_id, status, data, data_raw, api_error_code, api_error_msg, ran_at)
+ `kind text NOT NULL` + the two CHECKs + index + RLS. (Corrects the task's
"17 cols" premise — C1.)

---

## Q2 — Error handling, freshness, rate limiting (manual; S225 #84 waiver)

- DFS `status_code != 20000`: INSERT row `status='error'`, populate
  `api_error_code` + `api_error_msg` from the DFS body. Tile reads `status`.
- Per-kind independence: each of the 3–7 calls writes its own row; DO NOT
  short-circuit on the first error.
- Per-call HTTP timeout: `AbortController` 10s per DFS call. Slow kind fails
  fast, loop continues. Mitigates "sync API holds DB connections open."
- Edge fn wall clock: 10s × 7 ≈ 70s worst case. **Verify Supabase plan timeout
  in Phase 2** (Pro=150s, free=50s). If it does not fit: shard to
  one-kind-per-invocation, cron dispatches each kind separately. Surface to
  /office-hours if it surfaces in Phase 2.
- "Run Now" rate limit: Postgres RPC
  `seo_run_now_allowed(tenant_id uuid, kind text) RETURNS boolean` checking
  `MAX(ran_at) < now() - interval '7 days'`. Grep the repo for the existing
  S224/S225/S226 PageSpeed/Zernio "Run Now" pattern first and mirror it.

---

## Q3 — HTTP Basic Auth + Deno fetch (manual; S225 #84 waiver)

- `Authorization: Basic ${btoa(login + ':' + password)}` — Deno `btoa` native,
  no gotchas.
- Extract a shared client `supabase/functions/_shared/dataforseo.ts`:
  - `createDFSClient({ login, password })`
  - `client.rankedKeywords({ target, location_name, limit })`
  - `client.competitorsDomain({ target, location_name, limit })`
  - `client.domainIntersection({ target1, target2, location_name, limit })`
  - `client.keywordSuggestions({ keyword, location_name, limit })`
- Each helper: `AbortController` 10s, returns Result-shaped `{ data, error }`
  (no throws into the caller).
- HARD RULE (memory): `_shared/` deps MUST be in the same `files[]` array on
  `deploy_edge_function`. Verify before declaring deploy success.
- Fresh `fetch` per call — no pooling for short-lived edge fn invocations.

---

## C1–C6 schema-divergence resolutions (from prior /office-hours turn)

- **C1** seo_runs mirrors the 8 real zernio_runs cols + `kind` (not 17).
- **C2** No `tenants.last_seo_run_at`. Freshness = derived MAX(ran_at) from
  `seo_runs` (per Q1). Tier resolves from `settings` key='subscription'
  `value->>'tier'`, normalized (Starter1/Grow2/Pro3/Elite4; numeric strings
  pass through).
- **C3** Onboarding writes to a NEW settings key **`seo_analytics`**
  (`{ seed_keywords:[], competitors:[], updated_at }`). The existing
  `settings.seo` (owner_name/service_areas/meta_description, read by public
  shells) is left untouched — zero-risk.
- **C4** Tier normalization helper handles the dirty `"pro"` string.
- **C5** DFS target domain derived from `tenants.custom_domain` with a leading
  `admin.` stripped; fallback `<subdomain>.pestflowpro.ai`. (Onboarding may
  later override via an explicit field — out of MVP scope.)
- **C6** Commit the migration file to `supabase/migrations/` AND apply via MCP;
  rollback file in the same commit.
