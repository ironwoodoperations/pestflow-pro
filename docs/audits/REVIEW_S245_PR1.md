# S245 PR1 — Review (durable offboard foundation)

**Branch:** `s245-pr1-offboard-foundation` · **Apply model:** staged; orchestrator applies via MCP + live-validates a throwaway `zz-` teardown before PR2 merges.

## What shipped (one migration + rollback, in `docs/migrations/`)
`s245-offboard-foundation.sql` (ordered: tables → append-only trigger → setters → RPC replace → `NOTIFY pgrst`) + `s245-offboard-foundation-rollback.sql` (same commit).

1. **`tenant_offboard_audit`** — append-only (DELETE blocked; UPDATE blocked unless the txn-local `app.offboard_audit_writer` flag is set, which only `offboard_set_audit_state` does). RLS-on/no-policy → service_role only.
2. **`tenant_offboard_queue`** — outbox; `unique(request_id,target_type,target_id)` = idempotency; partial index on `pending`. service_role only.
3. **`offboard_mark_queue_item`** + **`offboard_set_audit_state`** — SECURITY DEFINER, service_role-only EXECUTE; the only sanctioned way to advance rows (no raw UPDATE grant; audit trigger blocks direct UPDATE).
4. **`admin_delete_tenant`** — replaced with the 6-arg signature. Dry-run path **unchanged**. Confirm path adds, in order: (b) `pg_try_advisory_xact_lock(hashtext(tenant_id))` → `offboard_in_progress`; (c) `slug_confirmation` gate → `slug_mismatch`; then the **unchanged** delete order (service_areas→page_content→tenants→orphan resolve); then (f) audit INSERT + (g) queue INSERTs **inside the same txn**; (h) convenience return.

## The ship-blocker fix
Cleanup intent (orphan auth ids + zernio ids) is now persisted **inside the delete transaction** via the audit + queue tables. If the caller never returns / crashes post-commit, the outbox still drives cleanup (PR2 sync drain + cron backstop). The old "return ids only" unrecoverable path is gone.

## Security review
- **Append-only audit** enforced at the DB (trigger), not by convention. The GUC-gated setter is the single write path; even service_role can't silently rewrite history.
- **Protection guards unchanged + first** — `tenant_not_found` / `tenant_is_protected` return before any mutation (the 2 protected tenants `dang`, `pestflow-pro` still refused).
- **Single-flight** advisory lock prevents concurrent/double offboard of the same tenant.
- **Typed confirmation** — slug must match the freshly-read slug, else no mutation.
- **Least privilege** — all 3 functions `service_role`-only EXECUTE; tables RLS-on/no-policy. No anon/authenticated DML.
- **No dynamic SQL**; SECURITY DEFINER + `search_path=public` retained.

## Critical implementation note (for the applier)
`admin_delete_tenant`'s arg signature changes (2 → 6 args), so the migration **DROPs the old `admin_delete_tenant(uuid,boolean)` then CREATEs the new one** — otherwise Postgres keeps both overloads and a 2-arg call becomes ambiguous. EXECUTE grants are re-applied on the new function (drop loses ACL). Atomic within the migration txn; no callable window where it's missing.

## Blast radius
All net-new tables/fns + an in-place RPC replace. The only behavior change to existing callers: `admin_delete_tenant(uuid,boolean)` dry-run is byte-identical; a 2-arg **confirm** call now requires `p_slug_confirmation` (will return `slug_mismatch` if omitted) — intended hardening. No content tables touched (no ISR concern in PR1).

## Rollback
`s245-offboard-foundation-rollback.sql` restores the exact pre-S245 2-arg RPC and drops the new objects. (Dropping the tables discards audit/outbox history — export first if any offboard has run.)

## Validation (orchestrator, before PR2 merge)
Provision a throwaway `zz-…` tenant; dry-run; confirm with correct slug; assert: tenant gone, audit row `committed` with correct `committed_*` arrays, queue rows `pending`. Then negative cases (wrong slug, protected, re-entrancy). Matrix in `QA_REPORT_S245_PR1.md`.
