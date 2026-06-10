# QA REPORT — S260-2b: generate-monthly-report persists findings via RPC

**Branch:** `feat/s260-2b-report-findings-rpc`
**Date:** 2026-06-10
**Under test:** `supabase/functions/generate-monthly-report/index.ts` STORE step + `supabase/config.toml`

---

## Static checks

| Check | Result |
|-------|--------|
| Old `tenant_reports` upsert removed (no `onConflict` left) | ✅ `grep` returns none |
| New `svc.rpc('insert_report_and_findings', …)` present in STORE step | ✅ |
| `failJob('persist report+findings: …')` on RPC error | ✅ |
| Storage upload still precedes the DB write | ✅ upload → `if (up.error) failJob` → RPC |
| DETECT / NARRATE / RENDER unchanged | ✅ diff confined to STORE step + config |
| `config.toml` has `[functions.generate-monthly-report] verify_jwt = false` | ✅ added (was absent) |
| Net diff | +27 / −6 across 2 files |

## Payload field matrix (vs RPC `insert_report_and_findings`)

| Payload key | Value | RPC reads as | Column |
|-------------|-------|--------------|--------|
| `p_tenant_id` | `tenantId` | arg | `tenant_reports.tenant_id` / `report_findings.tenant_id` |
| `p_period` | `period` | arg | `tenant_reports.period` |
| `p_storage_path` | `storagePath` | arg | `tenant_reports.storage_path` |
| `p_findings_count` | `findings.length` | arg | `tenant_reports.findings_count` |
| `p_high_count` | `highCount` | arg | `tenant_reports.high_count` |
| `p_findings[].id` | `f.id` | `e->>'id'` | `report_findings.finding_key` |
| `p_findings[].category` | `f.category` | `e->>'category'` | `category` |
| `p_findings[].severity` | `f.severity` | `e->>'severity'` | `severity` |
| `p_findings[].page_slug` | `f.page_slug` (null = site-wide) | `NULLIF(e->>'page_slug','')` | `page_slug` |
| `p_findings[].page_name` | `f.page_name` | `e->>'page_name'` | `page_name` |
| `p_findings[].problem` | `f.problem` | `e->>'problem'` | `problem` |
| `p_findings[].metric` | `f.metric ?? null` | `e->>'metric'` | `metric` |
| *(not sent)* | — | — | `suggested_fix` stays NULL ✅ |

## Behavioral reasoning

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 1 | Normal run, N findings | parent `tenant_reports` row + N `report_findings` rows in one txn; job → complete | ✅ RPC writes both atomically |
| 2 | Re-run same (tenant, period) | delete-and-reinsert; no stale/duplicate findings | ✅ RPC `DELETE … WHERE tenant_id AND period` then re-insert |
| 3 | Zero findings | parent row written, no finding rows; `findings_count=0` | ✅ `jsonb_array_elements([])` inserts nothing |
| 4 | Storage upload fails | `failJob`, DB untouched | ✅ upload guard returns before RPC |
| 5 | RPC errors | `failJob('persist report+findings: …')`, job → failed (never stuck processing) | ✅ |
| 6 | site-wide finding (`page_slug=null`) | stored as SQL NULL | ✅ `null` → `NULLIF('','')` path is NULL |
| 7 | finding with no metric | `metric` NULL | ✅ `?? null` → `e->>'metric'` NULL |
| 8 | CLI redeploy | gateway stays JWT-less (apikey auth intact) | ✅ `verify_jwt=false` pinned |

## Not run

- No live invocation / deploy — operator deploys via MCP post-merge and verifies deployed source, then regenerates. (No Deno toolchain in this web session; change is a localized API-call swap with no new imports or types.)

## Known / accepted

- File length 430 lines (pre-existing since S259). Out of scope to refactor under "only behavior change"; the edit is +13 net lines inside the STORE step.

## Verdict

✅ Ready for review. Matches the specified replacement exactly; constraints satisfied; idempotent atomic persistence; `verify_jwt=false` pinned.
