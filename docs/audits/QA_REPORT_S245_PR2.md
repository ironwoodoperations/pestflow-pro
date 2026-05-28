# S245 PR2 — QA Report

**Branch:** `s245-pr2-offboard-consumers` · CC Web stages; orchestrator deploys + live-tests. Gated on PR1 being applied + validated.

## A. Verified in this session (static)
| Check | Result |
|---|---|
| No token / secret / Authorization / vault-key value logged | ✅ only a denied non-operator email is logged; cron logs a count summary |
| Operator gate uses anon `getUser` + `id && email` match; service-role only for privileged ops | ✅ |
| `offboard-tenant` never throws after RPC commit (drain wrapped in try/catch, always returns report) | ✅ |
| Drain order auth_user → zernio; 404 idempotent ⇒ done | ✅ |
| Zernio 4xx (connected accounts) ⇒ TERMINAL failed → manual_cleanup; 5xx/429/network ⇒ retry | ✅ |
| Cron auth: key read from vault via `offboard_queue_internal_secret()`, header `x-pfp-internal-key`, `timingSafeEqual` | ✅ |
| Cron: `attempts<5`, ≤50/run, backoff via `updated_at`; terminal `failed` not re-scanned | ✅ |
| `supabase/` excluded from app tsconfig → CI `tsc` unaffected | ✅ |

Not run: `deno check` (deno unavailable in CC Web); live invocation (orchestrator's).

## B. Live matrix — RUN BY ORCHESTRATOR (after PR1 applied + 2 fns deployed + cron)

Use the same throwaway `zz-` tenant flow (re-provision a fresh one per run).

### offboard-tenant — auth
- [ ] No/invalid bearer → 401. Valid JWT of a **non-operator** user → 403 (and no mutation).
- [ ] Operator JWT (`refreshSession()` token) + `apikey` → accepted.

### offboard-tenant — dry-run / confirm
- [ ] `{tenant_id, confirm:false}` → preview (`would_delete`, `admin_users`, `zernio_profiles`); nothing mutated.
- [ ] `{tenant_id, confirm:true, slug_confirmation:'<correct>'}` → `{deleted:true, request_id, deleted_counts, auth_results, zernio_results, manual_cleanup, final_state}`. Tenant gone; orphan auth users hard-deleted (verify in GoTrue); audit `final_state` = `cleanup_complete` (or `cleanup_partial` if a zernio profile had connected accounts → that target in `manual_cleanup`).
- [ ] **Zernio profile WITH connected accounts** → that row → `failed` (terminal), appears in `manual_cleanup`, audit `cleanup_partial`; cron does **not** retry it.
- [ ] Wrong slug → returns RPC `{ok:false, error:'slug_mismatch'}`, **no drain**.
- [ ] Protected tenant → `{ok:false, error:'tenant_is_protected'}`.
- [ ] Re-run confirm with the SAME `request_id` after a partial → idempotent (404 ⇒ done; no double work; `unique` holds).

### process-offboard-queue (backstop)
- [ ] Apply `s245-offboard-queue-auth.sql` first. Missing/wrong `x-pfp-internal-key` → 401; correct vault value → accepted.
- [ ] Seed a `pending` row whose target auth user still exists → cron deletes it → `done`; audit advances when all rows terminal.
- [ ] Force a **transient** failure (Zernio 5xx) → row stays `pending`, `attempts` increments, backoff defers it next run; after `attempts>=5` it's no longer scanned.
- [ ] Force a **terminal** failure (Zernio 4xx connected-accounts) → row → `failed` immediately, not retried.

### Smoke
- [ ] Kill `offboard-tenant` mid-drain (or point Zernio at a 500) → outbox rows remain `pending`; next cron run finishes them; audit ends `cleanup_complete`.

## C. Verdict
Static PASS. Live matrix is the orchestrator's. Zernio endpoint confirmed; classification corrected (connected-accounts 4xx ⇒ manual_cleanup). Cron auth reads vault at call time — apply `s245-offboard-queue-auth.sql` before deploying the cron fn.
