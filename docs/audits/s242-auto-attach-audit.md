# S242 Session 1 — Wave 1 Death Audit

**Session:** S242 Session 1 (backend)
**Date:** 2026-05-27
**Branch:** `s242-session1-backend`
**Design doc:** `S242_AUTO_ATTACH_DESIGN.md` v3 (post-validator-gate, embedded in kickoff)
**Auditor:** Claude Code (CC Web), read-only MCP probing of production project `biezzykcgzkrwdgqpsar`

> **Execution-model note (READ FIRST).** Per Scott's explicit instruction this session, all production mutations (migrations, edge-fn deploys, pg_cron) are **STAGED, not applied** from CC Web — same convention as S243. This session writes: the 3 edge-fn sources, `_shared/delegationEnvelope.ts`, the ai-proxy `/internal` route, `docs/audits/s242-migration.sql` (reference SQL), CLAUDE.md update, and the 3 audit docs. Scott applies migrations / deploys / cron from the Claude.ai orchestration session. The kickoff's "apply via MCP" / "deploy" steps are therefore Scott-side, not CC-Web-side. This is the one intentional process deviation from the kickoff; it is authorized.

---

## 1. Method

Read-only SQL via Supabase MCP `execute_sql` + `list_edge_functions`. No DDL, no writes. Every claim below is backed by a live query against production on 2026-05-27.

---

## 2. Vault prerequisites — VERIFIED ✅

```sql
SELECT s.name, LENGTH(ds.decrypted_secret) AS len
FROM vault.secrets s JOIN vault.decrypted_secrets ds ON ds.id = s.id
WHERE s.name IN ('internal_delegation_secret','process_campaign_job_internal_secret','tag_image_vision_internal_secret');
```

| secret | decrypted length |
|---|---|
| `internal_delegation_secret` | 64 |
| `process_campaign_job_internal_secret` | 64 |
| `tag_image_vision_internal_secret` | 64 |

3 rows, all `len = 64` (32 random bytes hex). Matches kickoff. **No regeneration — consumers depend on these.**

---

## 3. Table shapes vs design §5 — NO DRIFT ✅

### `social_campaigns` (Migration 1 target)
Current: 10 columns — `id, tenant_id, title, goal, tone, duration_days, platforms (text[]), start_date, status (default 'active'), created_at`. Matches §17's "10-column shape."
- **Absent (to be added by Migration 1):** `image_strategy`, `image_strategy_folder`, `image_strategy_image_id`. ✅
- Note: `status` is free-text with **no CHECK constraint**, so `generate-social-batch` writing `status='pending_generation'` and the worker writing `status='active'` needs no enum migration. Flagged so reviewer doesn't expect a status-enum change.

### `image_library` (Migration 2 target)
Current: `id, tenant_id, bucket_id (default 'social-uploads'), storage_path, original_filename, mime_type, size_bytes, width, height, folder (nullable), uploaded_by, created_at, deleted_at` — 13 cols (S237a shape).
- **Absent (to be added by Migration 2):** `tags`, `tag_status`, `tagged_at`, `tag_retry_count`, `tag_last_attempted_at`, `tag_last_error`. ✅
- `bucket_id` default is `social-uploads` → vision-URL construction in `tag-image-vision` must use this bucket, not a hardcoded `tenant-assets`.

### `ai_proxy_log` (Migration 5 target)
Current S243 shape: `id (bigint), tenant_id, user_id, feature, model, input_tokens, output_tokens, status (NOT NULL), created_at`.
- **Absent (to be added):** `caller`, `acting_user`, `purpose`, `jti`, `batch_cardinality`. ✅

### `social_posts` (worker INSERT target) — shape captured for the worker
`id, tenant_id (NOT NULL), platform (NOT NULL), caption (NOT NULL), image_url (nullable), status (default 'draft'), fb_post_id, scheduled_for, created_at, published_at, error_msg, campaign_id, ai_generated (bool default false), campaign_title, archived_at, zernio_post_id`.
- Worker inserts: `tenant_id, platform, caption, image_url, campaign_id, ai_generated=true, campaign_title, scheduled_for, status='draft'`.
- **A single `.insert([...rows])` (one PostgREST INSERT statement) is atomic** → satisfies the design's "single transaction for all posts" without a raw PG client (see §8 finding).

### `campaign_jobs` (Migration 3) & `delegation_jti` (Migration 4)
**Neither table exists.** Both are net-new. ✅

---

## 4. Functions / extensions — VERIFIED ✅

| object | state |
|---|---|
| `pg_cron` extension | enabled ✅ |
| `pg_net` extension | enabled ✅ (INSERT-trigger HTTP + cron HTTP both viable) |
| `current_tenant_id()` | exists (no args) — usable in `campaign_jobs` RLS ✅ |
| `trigger_notify_new_lead()` | exists — the S199 pg_net INSERT-trigger pattern to mirror ✅ |
| `enqueue_image_tagging_backfill(int)` | **does not exist** — created by Migration set ✅ |

---

## 5. RLS convention — confirmed

- `image_library`: `(SELECT current_tenant_id()) IS NOT NULL AND tenant_id = (SELECT current_tenant_id())` for `authenticated`.
- `social_posts`: `tenant_id = current_tenant_id()` (ALL, authenticated) + an `anon_read` SELECT `true`.
- `social_campaigns`: subquery on `profiles` + `anon_read`.

**Decision:** `campaign_jobs` SELECT policy uses `tenant_id = current_tenant_id()` for `authenticated` (matches `social_posts`). No anon read (jobs are private). INSERT is service-role only (no client INSERT policy) — matches design §5.

---

## 6. pg_cron state — 03:00 slot open ✅

7 active jobs (jobids 2,3,4,5,6,7,9). Daily `0 3 * * *` is **free** (jobid 6 `gsc-weekly-refresh` is Sunday-only `0 3 * * 0`). `*/5` slot already shared by `process-sms-queue` + `publish-scheduled-posts` (distinct jobnames) — new 5-min reaper is additive, no collision.
- `process-sms-queue` cron uses `net.http_post(url, headers→apikey, body)` — exact pattern for the new tagging + reaper crons.

---

## 7. Edge-fn inventory — VERIFIED ✅

- `ai-proxy` — **ACTIVE, `verify_jwt: true`, version 1** (S243). Target for the additive `/internal` route. Public route unchanged.
- `generate-social-batch`, `process-campaign-job`, `tag-image-vision` — **none exist.** All net-new. ✅
- Internal-secret precedents present: `process-sms-queue` (verify_jwt:false), `scrape-prospect` (verify_jwt:false), `notify-new-lead`.

---

## 8. Design-doc findings surfaced during audit (per kickoff: flag inline, no re-gate)

### F1 — Supavisor + supabase-js conflation (design §8) — IMPLEMENTATION DEVIATION, flagged for review
Design §8 says workers should `createClient(SUPAVISOR_TRANSACTION_URL, SERVICE_ROLE_KEY)` to avoid connection-pool exhaustion. **Technical issue:** `@supabase/supabase-js` talks to **PostgREST over HTTP**, not a raw Postgres socket — it has no PG connection pool to exhaust, and `createClient()` takes a Supabase REST URL, *not* a `postgres://` Supavisor connection string. Supavisor transaction mode only matters for raw PG clients (e.g. `postgres.js`/`deno-postgres`).

**Resolution (to confirm with Scott on PR):** the workers use `supabase-js` with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (the established pattern in every existing worker — `process-sms-queue` etc.). Atomicity of the multi-row `social_posts` write is achieved by a **single batched `.insert([...])`** (one INSERT statement = atomic), not a raw multi-statement transaction. Net effect: the design's goal (no pool exhaustion + atomic insert) is met; the specific mechanism (Supavisor URL) is unnecessary and is intentionally **not** wired. `SUPAVISOR_TRANSACTION_URL` is **not referenced anywhere** in the existing codebase (confirmed in repo scan). Kickoff rule 3 says "if missing, stop and ask" — surfacing here rather than blocking, since the operations as designed don't require it.

### F2 — `social_campaigns.status` value `'pending_generation'`
No CHECK constraint on `status` → no migration needed; worker flips to `'active'` on completion. Documented so reviewers don't look for a missing enum migration.

### F3 — Reverse-selection model pin (design OQ9)
Design leaves Haiku-vs-Sonnet open. ai-proxy pins the model server-side (S243: `claude-sonnet-4-6`). For Session 1 the `reverse_selection` + `image_tagging` purposes route through ai-proxy `/internal`, which will use the **same pinned Sonnet model** unless/until ai-proxy gains per-feature model selection. **Flag:** the design's "fast/Haiku" cost assumption (§6, §13 OQ9) is not realizable until ai-proxy supports a model override per purpose. Session 1 ships Sonnet-pinned; Haiku optimization deferred (note for Scott — affects the §6 cost math).

### F4 — bucket is `social-uploads`
Vision-transform URL in `tag-image-vision` must target bucket `social-uploads` (the `image_library.bucket_id` default), using `…/storage/v1/render/image/public/social-uploads/<path>?width=800&resize=contain` (Storage **render** endpoint for transformations), not the plain `object/public` path the design pseudo-code shows.

---

## 9. Drift summary

| Design §17 claim | Live reality | Drift |
|---|---|---|
| social_campaigns 10-col | 10 cols, exact | none |
| image_library +6 new cols absent | absent | none |
| 18 active / 4 soft-deleted / 0 folders / 2 tenants | 22 total, 18 active, 4 deleted, 0 folders, 2 tenants | none |
| pg_cron 7 jobs, 03:00 daily open | 7 jobs, slot open | none |
| generate-social-batch absent | absent | none |
| ai-proxy ACTIVE verify_jwt:true | v1 ACTIVE verify_jwt:true | none |

**No structural drift since the design's 2026-05-27 audit.** Four design-doc findings (F1–F4) are implementation refinements/flags, not blockers.

---

## 10. Go / no-go

**GO** for Session 1 staging build. Proceed to `/ship`: migration SQL → `delegationEnvelope.ts` → ai-proxy `/internal` → `tag-image-vision` → `process-campaign-job` → `generate-social-batch` → CLAUDE.md. All applies/deploys/cron handed to Scott via the staged artifacts.
