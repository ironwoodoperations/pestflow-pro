# REVIEW — S260-2b: generate-monthly-report persists findings via RPC

**Branch:** `feat/s260-2b-report-findings-rpc` (separate from #168, per task)
**Scope:** Replace the `tenant_reports` upsert in the STORE step with one atomic RPC that writes the parent summary row **and** every finding row. This is the ONLY behavior change — detection, narration, and rendering are untouched.

---

## Pre-build check (required by task)

Confirmed the change did not already exist before building:
- `supabase/functions/generate-monthly-report/index.ts` STORE step still called `svc.from('tenant_reports').upsert(..., { onConflict: 'tenant_id,period' })` — old path present.
- No `svc.rpc('insert_report_and_findings', ...)` anywhere in the codebase (only the S260-2a migration file + manifest referenced the name).
- Open PRs: only #168 (S260-2a migration + manifest) — does not touch the edge function.
- Recently merged/closed PRs (167, 166, 165 …) and all remote branches: no in-flight version of this edit.

→ Old upsert present, no duplicate in flight → proceeded to BUILD.

## Files changed

| File | Change |
|------|--------|
| `supabase/functions/generate-monthly-report/index.ts` | STORE step: `tenant_reports` upsert → `svc.rpc('insert_report_and_findings', {...})`. Same position (after storage upload), same `failJob` error handling pattern. |
| `supabase/config.toml` | Added `[functions.generate-monthly-report] verify_jwt = false` (was **missing** entirely — Supabase defaults to `true`, so a CLI redeploy would have silently enabled JWT verification and 401'd the apikey-authed cron caller). |

## The replacement (exactly as specified)

```ts
const { error: persistErr } = await svc.rpc('insert_report_and_findings', {
  p_tenant_id: tenantId,
  p_period: period,
  p_storage_path: storagePath,
  p_findings_count: findings.length,
  p_high_count: highCount,
  p_findings: findings.map((f) => ({
    id: f.id, category: f.category, severity: f.severity,
    page_slug: f.page_slug, page_name: f.page_name,
    problem: f.problem, metric: f.metric ?? null,
  })),
})
if (persistErr) return await failJob(`persist report+findings: ${persistErr.message}`)
```

## Constraint compliance

- ✅ **Atomic + idempotent:** the RPC delete-and-reinserts per `(tenant_id, period)` in one transaction, fully replacing the old upsert. Re-runs leave no stale partial finding set.
- ✅ **page_slug passed straight through** (`f.page_slug`) — `Finding.page_slug` is first-class (`index.ts:42`, `null = site-wide`). Slug is **not** derived from `page_name`.
- ✅ **suggested_fix NOT in the payload** — stays NULL (later tier-gated feature). The RPC's INSERT column list also omits it.
- ✅ **Order unchanged:** storage upload first (`reports/{tenant_id}/{period}.html`), then the DB write. If upload fails (`up.error`) the function `failJob`s before touching the DB.
- ✅ **Only behavior change:** DETECT / NARRATE / RENDER and the claim/finish job lifecycle are byte-identical.
- ✅ **verify_jwt:false confirmed/pinned** in `config.toml` so a redeploy can't flip it on.
- ✅ Server-side AI rule intact: narration still routes via `ai-proxy/internal` (no `api.anthropic.com`); not touched.

## Payload ↔ RPC shape match

The RPC (`insert_report_and_findings`, S260-2a migration) reads each finding element as:
`e->>'id'` (→ `finding_key`), `e->>'category'`, `e->>'severity'`, `NULLIF(e->>'page_slug','')`, `e->>'page_name'`, `e->>'problem'`, `e->>'metric'`. The payload provides exactly these keys. `metric ?? null` serializes to JSON `null`, which `e->>'metric'` reads as SQL NULL — correct.

## Notes

- File is 430 lines (pre-existing, from S259/#165). The repo "<200 lines" guideline can't be met without refactoring the worker, which is explicitly out of scope ("only behavior change"). Net delta here is +13 lines confined to the STORE step.
- **Deploy is operator-owned (MCP):** merging does not deploy. After merge, deploy `generate-monthly-report` (`verify_jwt=false`; bundle `index.ts` + `_shared/delegationEnvelope.ts`) and verify deployed source before regenerating.
