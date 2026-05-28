# S242 Session 1 — QA Report

**Branch:** `s242-session1-backend`
**Scope:** backend staging (migrations + 3 edge fns + envelope helper + ai-proxy `/internal`)
**Constraint:** per Scott, this session **stages**; it does not apply migrations, deploy edge fns, or create cron from CC Web. Therefore the live test cases in design §14 that require deployed functions + applied schema are **planned here and executed by Scott post-deploy / in Session 2**, not run from CC Web.

---

## A. What was verified IN this session (static / read-only)

| Check | Result |
|---|---|
| Death-audit vs design §17 (read-only MCP) | No drift — see `s242-auto-attach-audit.md` |
| Vault secrets present, len 64 ×3 | ✅ |
| Target tables/cols absent as expected; `campaign_jobs`/`delegation_jti` absent | ✅ |
| `current_tenant_id()`, `pg_cron`, `pg_net` present | ✅ |
| No Authorization header / secret value / signature logged (rule 4) | ✅ grep clean — only env-var **names** appear in misconfig logs |
| `supabase/` excluded from app tsconfig → CI `tsc` unaffected | ✅ |
| Public ai-proxy route unchanged vs S243 (behavior-preserving refactor only) | ✅ visual diff |
| Tenant_id predicate on every service-role query (rule 5) | ✅ see §C |

**Not run locally:** `deno check` — `deno` is not installed in this environment. Edge-fn code mirrors the exact import/auth/client patterns of shipped functions (`process-sms-queue`, `ai-proxy`). Scott's `deploy_edge_function` will surface any Deno type error; if one appears, it will be a small fix, not a design issue.

---

## B. Live test matrix — RUN AFTER DEPLOY (design §14)

Apply migrations M1–M6, deploy the 3 fns + ai-proxy v2, set the env secrets (§D), then apply M7 (cron). Use a **non-production tenant where possible**; the master tenant (Elite) is the safest live target.

### B1. Signed envelopes (curl ai-proxy `/internal`)
- [ ] Valid envelope (sign with `internal_delegation_secret`) → 200
- [ ] Tampered signature → 401 `Bad signature`
- [ ] Expired (`exp` in past) → 401 `Envelope expired`
- [ ] Replay (same `jti` twice) → first 200, second 409 `Replay detected`
- [ ] Wrong purpose for caller (`process-campaign-job` + `image_tagging`) → 401 `Purpose not allowed`
- [ ] Forged tenant (envelope `acting_tenant`=X, `resource.image_id` belongs to Y) → 401 `image_id not in acting_tenant`
- [ ] Non-Elite `acting_tenant` → 403 `Elite tier required`
- [ ] Confirm `delegation_jti` row inserted per accepted call; `ai_proxy_log` row has `caller/acting_user/purpose/jti/batch_cardinality` populated

### B2. `tag-image-vision`
- [ ] `{mode:'reap'}` with apikey → 200, flips any stuck `processing` rows
- [ ] Enqueue 1 master-tenant row (`SELECT enqueue_image_tagging_backfill(1)`), then `{mode:'batch',limit:5}` → row transitions `pending`→`processing`→`tagged`, `tags[]` populated, `tagged_at` set
- [ ] Bad apikey → 401; non-`targeted` mode without apikey → 401
- [ ] `{mode:'targeted',image_ids:[…],tenant_id}` with a tenant-admin JWT → only that tenant's rows tagged
- [ ] Force a failure (e.g. bad storage path) → `tag_status` flips to `pending` (retry < 3) then `failed` (≥3), `tag_retry_count`/`tag_last_error` set
- [ ] **Vision URL returns transformed bytes** (P0 / F4): `curl -sI` the constructed `/render/image/public/<bucket>/<path>?width=800&resize=contain` → expect `x-transformations` response header present and `content-length` << the `/object/public/` original (verified pattern: ~75KB vs ~165KB on the Dang sample). Guards against the v3 §6 `/object/public` spec bug.

### B3. `campaign_jobs` trigger + `process-campaign-job`
- [ ] `INSERT INTO campaign_jobs(...)` via SQL (service-role) with `status='queued'` → trigger fires `net.http_post`; worker claims, posts appear in `social_posts`, job → `completed`
- [ ] Two rapid inserts of the same job_id path → `FOR UPDATE`-style guard: exactly one processes (second gets `already claimed`)
- [ ] Non-Elite tenant job → job `failed`, `last_error='subscription_lapsed'`, no posts
- [ ] `>200` posts/tenant/day → `daily_quota_exceeded`

### B4. Strategies (via `generate-social-batch` once Session 2 UI exists, or curl)
- [ ] `folder` → posts pull from folder; empty folder → posts, no images, job completes
- [ ] `ai_vision` → tagged candidates matched; all-untagged → no images, `last_error='no_tagged_candidates'`; malformed selection JSON → `reverse_selection_failed`, captions still land
- [ ] `fixed` → all posts same image; image soft-deleted between submit & pickup → `posts_with_images=0`, `last_error='fixed_image_unavailable'`
- [ ] cross-tenant tamper: reverse-selection returns an image_id from another tenant → worker's `byId` (tenant-scoped candidate set) rejects it → post gets no image

### B5. `generate-social-batch`
- [ ] Elite tenant, valid body → 202 `{job_id, campaign_id}` in <500ms
- [ ] Non-Elite → 403; `posts_requested>60` → 400; `folder` strategy w/o folder → 400; `fixed` w/ another tenant's image → 400
- [ ] Orphan-rollback: simulate `campaign_jobs` insert failure → campaign row deleted

### B6. Reaper + cron (after M7)
- [ ] `s242-reaper` job present (`*/5`); stuck `processing` job >10min → `failed/timeout`; `delegation_jti` >10min GC'd
- [ ] `s242-tag-image-vision-nightly` present (`0 3 * * *`)

### B7. Final smoke (the kickoff's ai_proxy_log delta)
- [ ] Record `SELECT count(*) FROM ai_proxy_log` before/after a B1 valid-envelope call → delta ≥ 1 with full actor chain

---

## C. Tenant-isolation proof (rule 5 — service-role queries)

Every service-role DB read/write that touches tenant data carries an explicit `tenant_id` predicate, never relying on RLS alone:
- ai-proxy `/internal`: `image_library`/`social_campaigns` ownership checks `.eq('tenant_id', env.acting_tenant)`; tier read scoped to `acting_tenant`.
- `process-campaign-job`: campaign fetch, settings, `image_library` pools (fixed/folder/ai_vision candidates) all `.eq('tenant_id', job.tenant_id)`; reverse-selection results validated against the tenant-scoped candidate set (`byId`).
- `generate-social-batch`: fixed-image ownership `.eq('tenant_id', tenantId)`; campaign + job inserts carry `tenant_id`; orphan rollback scoped by tenant.
- `tag-image-vision`: targeted JWT mode scopes `.eq('tenant_id', jwtTenant)`; vision envelope carries the row's own `tenant_id`.

---

## D. Deploy prerequisites Scott must set (edge-fn secrets)

Edge fns read their secret from a **Deno env var**; the cron/trigger sends the matching **vault** value. Set on each function:

| Function | env vars (beyond auto SUPABASE_URL/SERVICE_ROLE_KEY) |
|---|---|
| `ai-proxy` | `INTERNAL_DELEGATION_SECRET` = vault `internal_delegation_secret` (plus existing `ANTHROPIC_API_KEY`) |
| `process-campaign-job` | `PROCESS_CAMPAIGN_JOB_INTERNAL_SECRET` = vault `process_campaign_job_internal_secret`; `INTERNAL_DELEGATION_SECRET` |
| `tag-image-vision` | `TAG_IMAGE_VISION_INTERNAL_SECRET` = vault `tag_image_vision_internal_secret`; `INTERNAL_DELEGATION_SECRET` |
| `generate-social-batch` | (none beyond auto) |

Deploy with `verify_jwt` exactly as in `supabase/config.toml`: ai-proxy + generate-social-batch = **true**; process-campaign-job + tag-image-vision = **false**.

---

## E. Verdict

Static verification **PASS**. Live matrix (B1–B7) **PENDING Scott's deploy**; E2E campaign generation deferred to Session 2 (needs the frontend). No blockers found.
