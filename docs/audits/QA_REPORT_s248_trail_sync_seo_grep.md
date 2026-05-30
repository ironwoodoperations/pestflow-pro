# s248 — QA Report (repo trail-sync + SEO-helper usage grep)

Pure chore + audit. No runtime/DB behavior change. Verification = static file-state + read-only DB queries against the already-applied state.

## Item A — 3 trail-sync migration files

| Check | Result |
|---|---|
| `supabase/migrations/20260530135952_s248_rls_lint_a_b_lockdown_and_searchpath.sql` exists | ✅ created |
| `supabase/migrations/20260530141451_s248_rls_lint_c_revoke_internal_dispatchers.sql` exists | ✅ created |
| `supabase/migrations/20260530141524_s248_rls_lint_c_revoke_public_on_two_dispatchers.sql` exists | ✅ created |
| Filename version == `schema_migrations.version` (CLI skips on subsequent applies) | ✅ all 3 exact matches |
| Pre-existing `20260529181502_logos_bucket_tenant_folder_write_scoping.sql` left intact | ✅ unchanged (synced previously in PR #136) |
| Each new file's SQL pulled byte-accurate from `supabase_migrations.schema_migrations.statements` | ✅ via single `execute_sql` call |
| `protect-files.sh` (relax → write → restore) | ✅ final state has `"supabase/migrations/"` line restored exactly |
| Any DB change applied from this PR | ✅ **NO** — repo sync only |

### Live state verifications (via `execute_sql`)

**Policies present on the 4 locked-down tables** (`no_client_access`, FOR ALL TO {anon,authenticated}, USING(false) WITH CHECK(false)):

```
public.ai_proxy_log           no_client_access  ALL  {anon,authenticated}  qual=false  with_check=false  ✅
public.delegation_jti         no_client_access  ALL  {anon,authenticated}  qual=false  with_check=false  ✅
public.tenant_offboard_audit  no_client_access  ALL  {anon,authenticated}  qual=false  with_check=false  ✅
public.tenant_offboard_queue  no_client_access  ALL  {anon,authenticated}  qual=false  with_check=false  ✅
```

**Grants on the 4 tables** (anon/authenticated/public have ZERO rows; only service_role retains the full ALL grant):

```
ai_proxy_log,delegation_jti,tenant_offboard_audit,tenant_offboard_queue
  → service_role: SELECT, INSERT, UPDATE, DELETE, TRIGGER, REFERENCES, TRUNCATE  ✅
  → anon, authenticated, public: (no rows)                                       ✅
```

**EXECUTE on the 5 dispatcher fns** — anon=false, auth=false, public=false, svc=true on every row (= revokes effective):

```
ga4_cron_dispatch              anon=f  auth=f  svc=t  public=f  ✅
gsc_cron_dispatch              anon=f  auth=f  svc=t  public=f  ✅
outscraper_cron_dispatch       anon=f  auth=f  svc=t  public=f  ✅  ← was granting via PUBLIC; file 4 closed it
seo_cron_dispatch              anon=f  auth=f  svc=t  public=f  ✅
trigger_process_campaign_job   anon=f  auth=f  svc=t  public=f  ✅  ← was granting via PUBLIC; file 4 closed it
```

**Audit-guard search_path pinned**:

```
tenant_offboard_audit_guard  proconfig=["search_path=\"\""]  ✅
```

## Item B — notify-upgrade v27 source parity

| Check | Result |
|---|---|
| `get_edge_function` returned `version: 27`, status `ACTIVE` | ✅ |
| `diff <deployed-v27> supabase/functions/notify-upgrade/index.ts` | ✅ **0 lines (byte-identical)** |
| Header comment "v14" in both | ✅ |
| Every interpolated value (tenantName/newName/oldName/price/tenantSlug) wrapped in `escapeHtml(...)` in subject + body | ✅ 6 sites confirmed |
| `featureLine` is the pre-escaped fragment, NOT re-wrapped | ✅ |
| Auth gate + required-field check + `feature` contract | ✅ unchanged |
| Reconciliation required | ✅ **NO** |

## Item C — SEO-helper frontend usage grep

| Function | Frontend RPC caller (`src/`) | Other caller | Live grants today |
|---|---|---|---|
| `seo_run_now_allowed`     | **0 matches** | `supabase/functions/seo-analytics/index.ts:124` via `supabaseAdmin.rpc(...)` | anon=f, auth=**t**, svc=t, public=f |
| `seo_run_next_allowed_at` | **0 matches** | `supabase/functions/seo-analytics/index.ts:127` via `supabaseAdmin.rpc(...)` | anon=f, auth=**t**, svc=t, public=f |

Greps executed:
- `grep -rn -E "seo_run_now_allowed|seo_run_next_allowed_at" src/`        → 0
- `grep -rn -E "rpc\(['\"]seo_run_(now_allowed|next_allowed_at)" src/`   → 0
- `grep -rn "seo_run_" src/`                                              → 0
- Whole-repo `*.ts/tsx/js/jsx` excluding `node_modules/.git` → only the two `seo-analytics/index.ts` lines above

Frontend data path (no direct RPC):
- `src/components/admin/seo/Ga4AnalyticsTile.tsx:151` "Run Now" button → calls
- `src/hooks/useSeoRuns.ts:105` `fetch(`${supabaseUrl}/functions/v1/seo-analytics`, ...)` (authenticated HTTP) → `seo-analytics` edge fn invokes the two helpers via `supabaseAdmin` (service-role) → returns `{ rate_limited: true, retry_after }` / HTTP 429 to the frontend
- Same path for `GscAnalyticsTile.tsx:129`

`service_role` bypasses GRANTs entirely. **Decision per kickoff rule: REVOKE EXECUTE FROM authenticated** on both helpers — frontend continues to work because no frontend code calls these via RPC. Scott applies the revoke via MCP + authors the 5th sync file.

Suggested SQL (for Scott to apply via MCP, NOT applied here):
```sql
REVOKE EXECUTE ON FUNCTION public.seo_run_now_allowed(uuid, text)     FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seo_run_next_allowed_at(uuid, text) FROM anon, authenticated;
```

## Other

| Check | Result |
|---|---|
| Files in working tree = 3 migrations + REVIEW + QA only | ✅ |
| Any code / runtime / edge-fn-behavior change | ✅ none |
| Any DB change applied | ✅ none |
| Vercel preview QA | N/A (chore; hostname-routed SPA + zero runtime change) |

## Verdict
Repo trail matches reality across the 4 S248 migrations and notify-upgrade v27. SEO-helper Item C resolves with a clear revoke recommendation. Safe to merge as-is.
