# S245 PR2 — Review (offboard consumer + backstop)

**Branch:** `s245-pr2-offboard-consumers` · **Depends on:** PR1 applied + live-validated. **Apply model:** staged; orchestrator deploys the 2 fns + applies the cron SQL.

## What shipped
- **`_shared/offboardDrain.ts`** — shared external-cleanup: `deleteAuthUser` (404=done, idempotent), `deleteZernioProfile` (404=skipped_404), `processQueueRow` (delete → advance via `offboard_mark_queue_item`; failure ⇒ pending + attempts++), `finalizeAudit` (sets `cleanup_complete`/`cleanup_partial`).
- **`offboard-tenant`** (verify_jwt:true) — operator gate in code; dry-run → RPC preview; confirm → RPC(6-arg) then post-commit **sequential** drain (auth_user **first**, then zernio); **never throws after commit** — always returns `{request_id, deleted_counts, auth_results, zernio_results, manual_cleanup, final_state}`.
- **`process-offboard-queue`** (verify_jwt:false, cron) — internal-secret authed; drains `pending` rows `attempts<5` with exponential backoff (attempts × `updated_at`); advances audit per request.
- **`s245-offboard-queue-cron.sql`** (staged, apply LAST) + **config.toml** verify_jwt entries.

## Security review
- **Operator verified in code, not the toggle.** `anon.auth.getUser(token)` then reject unless `user.id === OPERATOR_ID && user.email === OPERATOR_EMAIL`. Service-role client used only for the RPC + GoTrue admin + setter RPCs. verify_jwt:true is belt; the code check is suspenders.
- **No token/secret logging.** Only a non-operator's email is logged on denial. Cron auth via `timingSafeEqual` (length pre-check), secret from env.
- **Durability:** the RPC already committed delete + audit + outbox before any external call. If the sync drain partially fails or the function dies, the outbox rows stay `pending` and the cron backstop finishes them — the report's `manual_cleanup` lists anything still pending.
- **Idempotency:** GoTrue 404 ⇒ done, Zernio 404 ⇒ skipped_404; queue `unique(request_id,target_type,target_id)` means re-drains never double-process. Safe to re-run.
- **Bounded:** cron processes ≤50/run, `attempts<5`, backoff so a hard-failing target doesn't hot-loop.

## Flags for the orchestrator
- **Zernio profile-delete endpoint unconfirmed.** `zernio-connect` only exercises `/api/v1/accounts`; I used `DELETE /api/v1/profiles/{id}` (best guess). If wrong, those targets simply stay `pending` → surface in `manual_cleanup` (no data-integrity risk). **Confirm the real path** against Zernio docs and correct `_shared/offboardDrain.ts:deleteZernioProfile` if needed.
- **Secrets to provision (orchestrator):** vault `process_offboard_queue_internal_secret` + the matching `PROCESS_OFFBOARD_QUEUE_INTERNAL_SECRET` env on the fn; `SUPABASE_ANON_KEY` + `ZERNIO_API_KEY` envs on `offboard-tenant`; `ZERNIO_API_KEY` + secret on `process-offboard-queue`.
- **Caller contract (future UI / curl):** `refreshSession()` (not `getSession()`) then send `Authorization: Bearer <jwt>` + `apikey`.

## Out of scope (backlog, untouched)
Admin UI offboard button; MFA/step-up; FK on `profiles.tenant_id`/`page_content`; schema_config seeding; sweeping the 4 pre-existing stranded test auth.users.
