# S245 PR2 — QA Report

**Branch:** `s245-pr2-offboard-consumers` · CC Web stages; orchestrator deploys + live-tests. Gated on PR1 being applied + validated.

## A. Verified in this session (static)
| Check | Result |
|---|---|
| No token / secret / Authorization logged | ✅ only a denied non-operator email is logged; cron logs a count summary |
| Operator gate uses anon `getUser` + `id && email` match; service-role only for privileged ops | ✅ |
| `offboard-tenant` never throws after RPC commit (drain wrapped in try/catch, always returns report) | ✅ |
| Drain order auth_user → zernio; 404 idempotent (done / skipped_404) | ✅ |
| Cron: `attempts<5`, ≤50/run, backoff via `updated_at` | ✅ |
| `supabase/` excluded from app tsconfig → CI `tsc` unaffected | ✅ |

Not run: `deno check` (deno unavailable in CC Web); live invocation (orchestrator's).

## B. Live matrix — RUN BY ORCHESTRATOR (after PR1 applied + 2 fns deployed + cron)

Use the same throwaway `zz-` tenant flow (re-provision a fresh one per run).

### offboard-tenant — auth
- [ ] No/invalid bearer → 401. Valid JWT of a **non-operator** user → 403 (and no mutation).
- [ ] Operator JWT (`refreshSession()` token) + `apikey` → accepted.

### offboard-tenant — dry-run / confirm
- [ ] `{tenant_id, confirm:false}` → preview (`would_delete`, `admin_users`, `zernio_profiles`); nothing mutated.
- [ ] `{tenant_id, confirm:true, slug_confirmation:'<correct>'}` → `{deleted:true, request_id, deleted_counts, auth_results, zernio_results, manual_cleanup, final_state}`. Tenant gone; orphan auth users hard-deleted (verify in GoTrue); audit `final_state` = `cleanup_complete` (or `cleanup_partial` if a zernio path failed → listed in `manual_cleanup`).
- [ ] Wrong slug → returns RPC `{ok:false, error:'slug_mismatch'}`, **no drain**.
- [ ] Protected tenant → `{ok:false, error:'tenant_is_protected'}`.
- [ ] Re-run confirm with the SAME `request_id` after a partial → idempotent (404=done/skipped_404; no double work; `unique` holds).

### process-offboard-queue (backstop)
- [ ] Bad/missing apikey → 401.
- [ ] Seed a `pending` row whose target auth user still exists → cron deletes it → `done`; audit advances when all rows terminal.
- [ ] Force a failing target (e.g. bad zernio id) → row stays `pending`, `attempts` increments, backoff defers it next run; after `attempts>=5` it's no longer scanned.

### Smoke
- [ ] Kill `offboard-tenant` mid-drain (or point Zernio at a 500) → confirm the outbox rows remain `pending` and the next cron run finishes them; audit ends `cleanup_complete`.

## C. Verdict
Static PASS. Live matrix is the orchestrator's; **confirm the Zernio profile-delete endpoint** (REVIEW flag) before relying on automated zernio cleanup.
