# S245 PR1 — QA Report

**Branch:** `s245-pr1-offboard-foundation` · **Constraint:** CC Web stages only. Live validation is the orchestrator's (Claude.ai) on a throwaway `zz-` tenant, BEFORE PR2 merges.

## A. Verified in this session (read-only MCP + static)
| Check | Result |
|---|---|
| Current `admin_delete_tenant(uuid,boolean)` body captured via `pg_get_functiondef` | ✅ — new RPC preserves dry-run + delete order verbatim |
| `tenant_offboard_audit` / `tenant_offboard_queue` / setter fns absent | ✅ net-new |
| Protected tenants = `dang`, `pestflow-pro` (RPC refuses both) | ✅ |
| admin source-of-truth = `tenant_users`; zernio = `settings.integrations->>zernio_profile_id` | ✅ matches new RPC |
| Signature-change handled by DROP-then-CREATE (+ re-grant) | ✅ |
| Functions service_role-only EXECUTE; tables RLS-on/no-policy | ✅ |

Not run: live DDL apply (orchestrator's, by design).

## B. Live validation matrix — RUN BY ORCHESTRATOR before PR2 merge

Apply `s245-offboard-foundation.sql`, then on a **throwaway `zz-…` tenant** (never a real/protected one):

### Happy path
- [ ] **Dry-run** `admin_delete_tenant('<zz id>')` → `ok:true, dry_run:true`, `would_delete` counts, `admin_users`/`zernio_profiles` arrays. **No rows mutated.**
- [ ] **Confirm** `admin_delete_tenant('<zz id>', true, '<correct slug>', gen_random_uuid(), '<op id>', '<op email>')` → `ok:true, deleted:true`, `request_id`, `queued.auth`/`queued.zernio`.
- [ ] Tenant + children gone (re-run dry-run → `tenant_not_found`).
- [ ] `tenant_offboard_audit`: one row, `mode='confirm'`, `final_state='committed'`, `preview_counts` populated, `committed_orphan_auth_ids`/`committed_zernio_ids` match the return.
- [ ] `tenant_offboard_queue`: one `pending` row per orphan auth id + per zernio id; `unique(request_id,target_type,target_id)` holds (re-insert no-ops).

### Guards (each returns BEFORE mutation)
- [ ] Confirm with **wrong slug** → `{ok:false, error:'slug_mismatch', expected:<slug>}`; tenant still present.
- [ ] Confirm a **protected** tenant (`dang`) → `{ok:false, error:'tenant_is_protected'}`.
- [ ] Non-existent tenant → `{ok:false, error:'tenant_not_found'}`.
- [ ] Re-entrancy: hold the advisory lock in session A (`SELECT pg_advisory_xact_lock(hashtext('<id>'))` in an open txn), call confirm in session B → `{ok:false, error:'offboard_in_progress'}`.

### Append-only enforcement
- [ ] Direct `UPDATE tenant_offboard_audit SET final_state='failed'` (service_role) → **raises** `append-only`.
- [ ] `DELETE FROM tenant_offboard_audit` → **raises**.
- [ ] `SELECT offboard_set_audit_state('<request_id>','cleanup_complete')` → succeeds (flag-gated); row advances.
- [ ] `SELECT offboard_mark_queue_item('<queue id>','done')` → row advances; `updated_at` bumped.

### Least privilege
- [ ] `EXECUTE` on all 3 fns denied to `anon`/`authenticated`; allowed to `service_role`.
- [ ] `anon`/`authenticated` cannot `SELECT` the two tables (RLS).

## C. Verdict
Static PASS. Live matrix gates PR2.
