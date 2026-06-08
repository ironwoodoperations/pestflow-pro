# QA REPORT — chore: verify_jwt pin + 403 SQLSTATE + onboarding domain gate

No runtime/browser QA applies (config + doc + non-deployed edge-fn source). Verification is static.

## Part A — config.toml
- [x] Dashboard `verify_jwt` read via `mcp__Supabase__list_edge_functions` BEFORE writing.
- [x] All 7 target functions now have a `[functions.*]` block whose value EQUALS the deployed value:
      false → process-sms-queue, publish-scheduled-posts, notify-new-lead, provision-tenant;
      true → ga4-analytics, gsc-analytics, set-tenant-secret.
- [x] 2 mismatches (ga4/gsc deployed=true vs task-intended=false) caught and escalated; resolved to
      true per Scott. No silent behavior change introduced.
- [x] No other `[functions.*]` block modified (verified via diff).
- [x] TOML still parses (block syntax identical to surrounding entries).

## Part B — set-tenant-secret/index.ts
- [x] 403 now keyed off `rpcErr.code === '42501'`; generic fallthrough → 500.
- [x] Pre-check 403 path retained (defense-in-depth, primary path).
- [x] 401 / null-token / null-uid handling unchanged.
- [x] Secret value still never logged / never in any error body.
- [ ] **NOT DEPLOYED** — blocked on the `set_tenant_secret` RPC RAISE carrying ERRCODE '42501'
      (orchestrator/MCP owns it). Deploy only after Scott confirms the RPC change is live.

## Part C — CUSTOMER_ONBOARDING_PROMPT.md
- [x] Single item added to Phase 1 (pre-provision verification), numbered-list style matching doc.
- [x] Verification gate count updated 4 → 5.
- [x] Content carries the shared-host examples + canonical_apex fallback + customer #2 (Tops) note.

## Result
PASS (static). One follow-up gated on RPC change before deploying set-tenant-secret.
