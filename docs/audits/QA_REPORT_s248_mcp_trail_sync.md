# s248 — QA Report (MCP trail sync)

Pure chore — no runtime behavior. QA reduces to verifying live-state parity and that nothing else changed.

## Item A — migration file matches live `pg_policies` output

| Check | Result |
|---|---|
| File at `supabase/migrations/20260529181502_logos_bucket_tenant_folder_write_scoping.sql` | ✅ created |
| Filename version == `schema_migrations.version` (CLI skips on subsequent applies) | ✅ `20260529181502` exact match |
| Three CREATE POLICY statements (insert/update/delete `logos_*_tenant_or_operator`) | ✅ |
| Condition matches live: `bucket_id='logos' AND ((storage.foldername(name))[1] = current_tenant_id()::text OR auth.uid() = '5181b30a-265f-4a70-a323-bf6e3c53641b'::uuid)` | ✅ |
| Six DROP POLICY IF EXISTS for the legacy duplicate sets | ✅ |
| SELECT policy `authenticated_read_logos` untouched (out of scope) | ✅ |
| Idempotent: DROP IF EXISTS of the three new policy names before CREATE | ✅ |
| Migration applied from this PR? | ✅ **NO** — repo sync only (already applied 2026-05-29 18:15:02 UTC) |

### Live policy state (pg_policies, queried via MCP)
```
logos_insert_tenant_or_operator  INSERT {authenticated}  WITH CHECK = (bucket_id='logos' AND ((storage.foldername(name))[1]=(current_tenant_id())::text OR auth.uid()='5181b30a-265f-4a70-a323-bf6e3c53641b'::uuid))
logos_update_tenant_or_operator  UPDATE {authenticated}  USING + WITH CHECK = same condition
logos_delete_tenant_or_operator  DELETE {authenticated}  USING = same condition
authenticated_read_logos         SELECT {authenticated}  USING = (bucket_id='logos')   ← unchanged, out of scope
```

## Item B — `notify-upgrade` repo source == deployed v26

| Check | Result |
|---|---|
| `diff <deployed-v26> supabase/functions/notify-upgrade/index.ts` | ✅ **0 lines (byte-identical)** |
| `get_edge_function` returned `version: 26`, status `ACTIVE` | ✅ |
| Code parity self-check: escapeHtml set, escape-at-interpolation, `feature` optional `''` default, required-field check unchanged | ✅ |
| Only comment-only drift reconciled (`v12 → v13` header + `→` → `->`) | ✅ |
| Behavior change | ✅ none |

## Other
| Check | Result |
|---|---|
| `protect-files.sh` (relax→write→restore) | ✅ no diff |
| Working tree = only the migration file + the comment-only notify-upgrade edit + these two docs | ✅ |
| Any code/runtime/edge-fn-behavior change | ✅ none |
| Vercel preview QA | N/A (chore; hostname-routed SPA previews 404 anyway) |

## Verdict
Repo trail matches reality. Safe to merge.
