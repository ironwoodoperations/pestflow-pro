# S245 PR2 — Review (offboard consumer + backstop)

**Branch:** `s245-pr2-offboard-consumers` · **Depends on:** PR1 applied + live-validated. **Apply model:** staged; orchestrator deploys the 2 fns + applies the cron SQL.

## What shipped
- **`_shared/offboardDrain.ts`** — shared external-cleanup with 3-way outcome: **done** (2xx / 404 idempotent), **failed** (TERMINAL, no retry → `manual_cleanup`), **retry** (5xx/429/network → `pending` + attempts++). `processQueueRow` advances via `offboard_mark_queue_item`; `finalizeAudit` sets `cleanup_complete`/`cleanup_partial`.
- **`offboard-tenant`** (verify_jwt:true) — operator gate in code; dry-run → RPC preview; confirm → RPC(6-arg) then post-commit **sequential** drain (auth_user **first**, then zernio); **never throws after commit** — always returns `{request_id, deleted_counts, auth_results, zernio_results, manual_cleanup, final_state}`. `manual_cleanup` lists only TERMINAL failures.
- **`process-offboard-queue`** (verify_jwt:false, cron) — auth key read from **vault at call time** via `offboard_queue_internal_secret()` (no Deno.env / no Edge Function Secret); cron sends `x-pfp-internal-key`. Drains `pending` rows `attempts<5` with exponential backoff (attempts × `updated_at`); advances audit per request.
- **`s245-offboard-queue-auth.sql`** (getter RPC, apply before deploy) + **`s245-offboard-queue-cron.sql`** (apply LAST) + **config.toml** verify_jwt entries.

## Security review
- **Operator verified in code, not the toggle.** `anon.auth.getUser(token)` then reject unless `user.id === OPERATOR_ID && user.email === OPERATOR_EMAIL`. Service-role client used only for the RPC + GoTrue admin + setter RPCs. verify_jwt:true is belt; the code check is suspenders.
- **No token/secret logging.** Only a non-operator's email is logged on denial. Cron auth: expected key read from vault via the getter RPC, compared `timingSafeEqual` (length pre-check); the key value is never logged.
- **Durability:** the RPC already committed delete + audit + outbox before any external call. If the sync drain partially fails or the function dies, the outbox rows stay `pending` and the cron backstop finishes them — the report's `manual_cleanup` lists TERMINAL failures (human action needed).
- **Idempotency:** GoTrue 404 ⇒ done, Zernio 404 ⇒ done; queue `unique(request_id,target_type,target_id)` means re-drains never double-process. Safe to re-run.
- **Bounded:** cron processes ≤50/run, `attempts<5`, backoff so a hard-failing target doesn't hot-loop; terminal `failed` rows are never re-scanned.

## Corrections applied (S245 PR2 review round)
- **Zernio result classification.** Endpoint confirmed correct (`DELETE /api/v1/profiles/{id}`, Bearer). Zernio requires a profile to have **no connected accounts** before deletion, so a live profile returns a permanent 4xx → classified **TERMINAL `failed` → `manual_cleanup`** (operator disconnects accounts in the Zernio dashboard — one action). Only `5xx/429/network` retry. No account-disconnect logic added to the destructive path (by design).
- **Cron auth via vault.** `process-offboard-queue` reads `process_offboard_queue_internal_secret` from `vault.decrypted_secrets` at call time (getter RPC, `service_role`-only) and compares the `x-pfp-internal-key` header — matching the `trigger_notify_new_lead` precedent. No env secret.

## Flags for the orchestrator
- **Secrets to provision:** vault `process_offboard_queue_internal_secret` (already staged); `SUPABASE_ANON_KEY` + `ZERNIO_API_KEY` envs on `offboard-tenant`; `ZERNIO_API_KEY` env on `process-offboard-queue`. **No** `PROCESS_OFFBOARD_QUEUE_INTERNAL_SECRET` env (vault-read instead). Apply `s245-offboard-queue-auth.sql` before deploy; `s245-offboard-queue-cron.sql` last.
- **Caller contract (future UI / curl):** `refreshSession()` (not `getSession()`) then send `Authorization: Bearer <jwt>` + `apikey`.

## Out of scope (backlog, untouched)
Admin UI offboard button; MFA/step-up; FK on `profiles.tenant_id`/`page_content`; schema_config seeding; sweeping the 4 pre-existing stranded test auth.users.
