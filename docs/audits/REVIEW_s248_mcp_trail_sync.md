# s248 — Review: MCP audit-trail sync (chore)

Pure chore. **No runtime/behavior change.** Brings the repo into parity with two artifacts that landed via Supabase MCP during S247.

Precedent for the migration-sync pattern: PR #133.

## Item A — logos bucket write-scoping migration → `supabase/migrations/`

The migration `logos_bucket_tenant_folder_write_scoping` was applied to production via `apply_migration` at **2026-05-29 18:15:02 UTC** — `schema_migrations.version = 20260529181502`. `apply_migration` does not write a file to `supabase/migrations/`, so the repo had no trail.

**Authored file:** `supabase/migrations/20260529181502_logos_bucket_tenant_folder_write_scoping.sql`. Filename version matches the recorded version exactly, so the CLI **skips** on `db reset` / `migration up`. No re-apply.

**Verified against live `pg_policies` (project `biezzykcgzkrwdgqpsar`):** the three live policies are
- `logos_insert_tenant_or_operator` — `INSERT TO authenticated` with `WITH CHECK (bucket_id='logos' AND ((storage.foldername(name))[1] = current_tenant_id()::text OR auth.uid() = '5181b30a-265f-4a70-a323-bf6e3c53641b'::uuid))`.
- `logos_update_tenant_or_operator` — `UPDATE TO authenticated`, USING + WITH CHECK both = the same condition.
- `logos_delete_tenant_or_operator` — `DELETE TO authenticated`, USING = the same condition.

The migration file authors these exactly. The legacy duplicate sets (`allow_authenticated_{insert,update,delete}_logos` + `authenticated_logos_{insert,update,delete}`) are dropped with `IF EXISTS`. The SELECT policy `authenticated_read_logos` (added by `20260529151005`) is **intentionally untouched** — read RLS isn't the enforcement point on a public-read bucket with legacy mixed paths.

**Idempotency:** the file also drops the three new policy names with `IF EXISTS` before recreating them, so re-running the file is safe even on a fresh environment that already has them.

## Item B — `notify-upgrade` repo source == deployed v26

`get_edge_function('notify-upgrade')` returned `version: 26` (i.e. v26 deployed; the file's internal `v13` header is a separate marker). PR #134 carried the s247 changes; this PR reconciles two **comment-only** drifts the orchestrator introduced at deploy:

- Header bumped `v12 → v13` + added a sentence noting the s247 UpgradePrompt as a second call site.
- One body comment normalized `→` → `->`.

Both changes are textual; **no code logic / no behavior change**. After reconciliation, `diff <deployed-v26> <repo>` is **0 lines** — byte-identical (evidence below).

**Code self-verification on the merged source** (orchestrator's at-merge checks from PR #134 remain satisfied):
- `escapeHtml` covers the OWASP-canonical set `& < > " '` and is **applied at interpolation** — `${escapeHtml(feature.trim().slice(0, 120))}` inside `featureLine`, which is then interpolated into `html`.
- `feature` is destructured (`undefined` when absent); `featureLine` defaults to `''` unless `typeof feature === 'string' && feature.trim()`.
- Required-field check on `tenant_id` + `new_tier` is unchanged. Auth gate (`requireTenantAdmin`) is unchanged. Subject line is unchanged (no header-injection vector).

## Protected-path note
`supabase/migrations/` matches `protect-files.sh`. Used the authorized relax→write→restore (same pattern as PR #133); the hook is **restored byte-for-byte, not in this PR's diff**.

## Risk
None at apply-time (Item A already in prod; CLI skips on version match). Item B is comment-only.
