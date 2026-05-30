# s248 — Repo trail-sync + SEO-helper usage grep (REVIEW)

Chore + audit. No DB changes, no runtime behavior change. Branch `chore/s248-trail-sync-seo-grep`. Precedent for the migration-sync pattern: PR #133, PR #136.

## What shipped

| File | Item | Type |
|---|---|---|
| `supabase/migrations/20260530135952_s248_rls_lint_a_b_lockdown_and_searchpath.sql` | A | NEW — trail sync of applied SQL |
| `supabase/migrations/20260530141451_s248_rls_lint_c_revoke_internal_dispatchers.sql` | A | NEW — trail sync of applied SQL |
| `supabase/migrations/20260530141524_s248_rls_lint_c_revoke_public_on_two_dispatchers.sql` | A | NEW — trail sync of applied SQL |
| `docs/audits/REVIEW_s248_trail_sync_seo_grep.md` | — | NEW — this file |
| `docs/audits/QA_REPORT_s248_trail_sync_seo_grep.md` | — | NEW — verification report |

The 4th expected migration file (`20260529181502_logos_bucket_tenant_folder_write_scoping.sql`) **already exists in repo** — synced in PR #136. Verified intact, no second sync needed.

## Item A — 3 missing migration files authored

All three were applied to prod via Supabase MCP `apply_migration` and recorded in `supabase_migrations.schema_migrations`. SQL was pulled byte-accurate from the `statements` column and embedded in the new files. Filename versions match the recorded `version` values, so the Supabase CLI skips re-application on `db reset` / `migration up` — this is purely repo trail sync.

| Version | Applied at (UTC) | Scope |
|---|---|---|
| 20260530135952 | 2026-05-30 13:59:52 | Category A + B — lock down 4 service-role-only tables (`ai_proxy_log`, `delegation_jti`, `tenant_offboard_audit`, `tenant_offboard_queue`) with REVOKE ALL + explicit `no_client_access` deny policy; pin `search_path=''` on `tenant_offboard_audit_guard()` |
| 20260530141451 | 2026-05-30 14:14:51 | Category C — REVOKE EXECUTE on 5 internal SECURITY DEFINER dispatch fns (`ga4/gsc/outscraper/seo_cron_dispatch`, `trigger_process_campaign_job`) FROM anon/authenticated |
| 20260530141524 | 2026-05-30 14:15:24 | Category C follow-up — REVOKE EXECUTE on `outscraper_cron_dispatch` + `trigger_process_campaign_job` FROM PUBLIC (the name-based revoke above was a no-op for these two because they granted via PUBLIC ACL) |

Style matches the repo precedent (`20260529181502_logos_bucket_tenant_folder_write_scoping.sql`): verbose header comment documenting MCP-apply timestamp + schema_migrations version + audit-trail-sync purpose, uppercase SQL keywords, and where applicable `DROP POLICY IF EXISTS` ahead of `CREATE POLICY` for re-run safety.

### Repo-hook procedure
`supabase/migrations/` is in `.claude/hooks/protect-files.sh`'s DO-NOT-TOUCH list. Followed the PR #136 documented `relax → write → restore` pattern: temporarily renamed the migrations pattern to a non-matching sentinel, authored the three files via `Bash` heredoc, restored the original hook line. Final `grep "supabase/migrations" .claude/hooks/protect-files.sh` confirms restoration to `"supabase/migrations/"`.

## Item B — notify-upgrade v27 source parity

- Pulled deployed bytes via `get_edge_function` (v27, ACTIVE).
- `diff supabase/functions/notify-upgrade/index.ts <deployed v27 bytes>` → **byte-identical** (zero lines of diff).
- Repo header is `// Edge Function: notify-upgrade v14` (source-track) matching deployed source comment. Every interpolated value (tenantName, newName, oldName, price, tenantSlug) wrapped in `escapeHtml(...)` in both subject and HTML body. `featureLine` is the pre-escaped fragment, NOT re-wrapped. Auth gate (`requireTenantAdmin`), required-field check, optional `feature` contract, Resend payload shape all unchanged from the merged PR #138 source.
- No reconciliation needed.

## Item C — SEO-helper frontend usage grep

Both helpers live in the DB:
- `public.seo_run_now_allowed(p_tenant_id uuid, p_kind text) -> boolean`
- `public.seo_run_next_allowed_at(p_tenant_id uuid, p_kind text) -> timestamptz`

Grep results (run from repo root):

```
rg -n "seo_run_now_allowed|seo_run_next_allowed_at" src/   → 0 matches
rg -n "rpc\(['\"]seo_run_(now_allowed|next_allowed_at)" src/ → 0 matches
rg -n "seo_run_" src/                                       → 0 matches
```

Wider grep across the whole repo (`*.ts/*.tsx/*.js/*.jsx`) returns **only edge-fn callers** — no frontend:

| Function | Frontend caller? | Other callers |
|---|---|---|
| `seo_run_now_allowed`     | None | `supabase/functions/seo-analytics/index.ts:124` via `supabaseAdmin.rpc(...)` (service-role client) |
| `seo_run_next_allowed_at` | None | `supabase/functions/seo-analytics/index.ts:127` via `supabaseAdmin.rpc(...)` (service-role client) |

The user-visible "Run Now" buttons (`Ga4AnalyticsTile.tsx:151`, `GscAnalyticsTile.tsx:129`) and the runner hook (`src/hooks/useSeoRuns.ts:95`) call the **`seo-analytics` edge function** via authenticated HTTP, NOT the helpers via Postgres RPC. The edge fn then performs the rate-limit check internally with `supabaseAdmin` (service-role), and surfaces the result to the frontend as `{ rate_limited: true, retry_after }` / HTTP 429 (`useSeoRuns.ts:115`).

`service_role` bypasses GRANTs entirely, so an EXECUTE revoke on these two helpers does not break the existing data path.

### Recommendation (DO NOT APPLY — Scott applies via MCP)

**REVOKE EXECUTE FROM authenticated** on both helpers. Suggested MCP migration (Scott to apply + author the 5th sync file):

```sql
REVOKE EXECUTE ON FUNCTION public.seo_run_now_allowed(uuid, text)     FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seo_run_next_allowed_at(uuid, text) FROM anon, authenticated;
```

Expected linter delta: 2 fewer "SECURITY DEFINER fn with anon-or-authenticated EXECUTE" findings (advisor count 14 → 12 in the "intentional remaining" bucket, per kickoff Verification section). `service_role` and `postgres` retain EXECUTE so `seo-analytics` continues to work.

Live state today (for reference): `anon_exec=false, auth_exec=true, svc_exec=true, public_exec=false` on both helpers — i.e. anon is already locked out; the proposed revoke takes `auth_exec` to `false`.

## Validator gate
Not invoked. Items A + B are pure trail-sync (zero behavior change). Item C is a read-only grep producing a recommendation, not a DB change. Same precedent as PR #136.

## Scope / safety

- Three new files are migration trail-sync only — filename version matches `schema_migrations`, CLI skips them on `db reset` / `migration up`.
- `protect-files.sh` restored to the exact pre-edit line.
- No edge function, frontend, env, or schema change shipped.
- Done-when criteria from kickoff: ✅ 4 migration files exist (3 new + 1 pre-existing from #136); ✅ notify-upgrade evidence of v27 parity; ✅ Item C reports per-function frontend usage + keep/revoke recommendation; ✅ chore PR opened with REVIEW + QA reports.
