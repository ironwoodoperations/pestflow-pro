# S242 Session 1 — Review

**Branch:** `s242-session1-backend` · **Design:** v3 · **Reviewer:** Scott

## 1. What shipped (staged)
| Artifact | Kind | Notes |
|---|---|---|
| `docs/audits/s242-migration.sql` | staged SQL (M1–M7) | Scott applies via MCP `apply_migration`; M7 (cron) last, after deploy |
| `supabase/functions/_shared/delegationEnvelope.ts` | new | HMAC sign/verify, purpose allowlist (§9) |
| `supabase/functions/ai-proxy/index.ts` | modified (additive) | new `/internal` route; public S243 route unchanged |
| `supabase/functions/generate-social-batch/index.ts` | new | verify_jwt:true; 202 + job_id |
| `supabase/functions/process-campaign-job/index.ts` | new | verify_jwt:false; worker |
| `supabase/functions/tag-image-vision/index.ts` | new | verify_jwt:false; batch/targeted/reap |
| `supabase/config.toml` | modified | explicit verify_jwt for the 4 fns |
| `CLAUDE.md` | modified | rule #3 server-side clause |
| 3 audit docs | new | audit / QA / this review |

## 2. Security review
- **No raw JWT forwarding (§9).** Internal hops use short-lived HMAC envelopes; ai-proxy `/internal` never accepts a user JWT. jti replay-protected (`delegation_jti` unique PK → 409 on reuse). Purpose↔caller allowlist enforced (`CALLER_PURPOSES`). Signature compared constant-time (`timingSafeEqual`, length pre-check).
- **Defense-in-depth tenant_id (§7/rule 5).** Every service-role query carries an explicit `tenant_id` predicate (catalogued in QA §C). Reverse-selection image_ids validated against the tenant-scoped candidate set, so a model (or tamper) returning a foreign image_id can't leak it into another tenant's posts.
- **Tier re-checked from the claimed tenant** at three layers (submit, worker, ai-proxy) — never trusts a caller's claim.
- **Secrets never logged (rule 4).** Only env-var *names* appear in misconfig logs. Internal secrets read from per-fn env; cron/trigger send the vault value.
- **Fail-soft trigger** (mirrors `trigger_notify_new_lead`): a dispatch error never rolls back the job insert; reaper recovers stuck jobs.
- **RLS:** `campaign_jobs` SELECT = `current_tenant_id()` (no client writes); `delegation_jti` RLS-on/no-policy (service-role only).

## 3. Deviations from design v3 (flagged, all in audit §8)
- **F1 Supavisor dropped** (Scott-confirmed). `supabase-js` uses PostgREST (HTTP) — no PG pool to exhaust; `createClient()` can't take a `postgres://` URL anyway. Atomicity via single batched `.insert([...])`. `SUPAVISOR_TRANSACTION_URL` referenced nowhere. v3 §8 superseded (v3.1 patch to follow).
- **F3 model pin.** Reverse-selection + tagging run on the ai-proxy-pinned Sonnet, not Haiku — the design's Haiku cost math (§6/OQ9) isn't realizable until ai-proxy supports a per-purpose model override. Sonnet-pinned for now.
- **F4 vision URL** uses the Storage **render** transform endpoint (`/render/image/public/...`), not plain `object/public`, to honor the §6 transform requirement.
- **Concurrency:** guarded atomic `UPDATE … WHERE tag_status='pending'` (supabase-js) instead of raw `FOR UPDATE SKIP LOCKED` — same exclusivity, matches `process-sms-queue`.
- **Process:** staged, not applied, per Scott's S243 convention (the one intentional kickoff deviation).

## 4. Risk / blast radius
- All net-new objects + an **additive** ai-proxy route. The S243 public path is byte-identical (only the Anthropic call extracted to a shared helper). Worst case if a new fn misbehaves: the new AI-campaign path fails; nothing existing regresses.
- M5 adds nullable columns to `ai_proxy_log` (live table) — additive, safe; if ai-proxy v2 is deployed before M5, logging fails open (no functional impact).

## 5. Handoff to Session 2
- `<ImageStrategyChooser>` + `NewCampaignDialog` refactor to call `generate-social-batch`; realtime on `campaign_jobs`; State-C inline "Untagged" grid; image_library **upload trigger** + `tag_status='pending'` on upload (NOT in Session 1 — not in the kickoff migration list); fire `enqueue_image_tagging_backfill` after monitoring; E2E QA on Dang.

## 6. Open questions — ALL RESOLVED (Scott, 2026-05-27)
1. **F1 — Supavisor dropped.** supabase-js/PostgREST has no pool to exhaust; Gemini finding superseded; v3 §8 to be patched in v3.1 (Claude.ai). No code change.
2. **F3 — Sonnet-pinned, ship it.** Haiku per-purpose override deferred to S242.1. No code change.
3. **Bucket verified via MCP probe.** `social-uploads` public + transforms enabled. **P0 found in design v3 §6** (`/object/public` ignores transform params) — staged code already uses the correct `/render/image/public` for the vision URL, so not present here; guarding comments added at both URL call sites; QA B2 adds a post-deploy header assertion.
