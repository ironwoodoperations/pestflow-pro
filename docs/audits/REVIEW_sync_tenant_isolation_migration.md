# Review — sync tenant-isolation hardening migration

**Branch:** `chore/sync-tenant-isolation-migration` (off `main`). Single file added. No code/config/edge-function/runtime changes.

## What this is
Repo audit-trail sync for a migration the **orchestrator already applied to production via MCP at 2026-05-29 15:10:05 UTC** (project `biezzykcgzkrwdgqpsar`). This PR does **not** apply anything — it lands the SQL so `supabase db reset` and fresh-environment applies reproduce production state.

## File
`supabase/migrations/20260529151005_sweep_findings_tenant_isolation_hardening.sql`
- Filename version `20260529151005` matches the applied version. `supabase_migrations.schema_migrations.version = 20260529151005` already exists in prod, so the CLI **skips** re-applying on subsequent `db reset`/`migration up`. A version mismatch would have triggered a duplicate apply — verified the exact timestamp.
- Contents copied verbatim from the task spec (header comments + DDL): 6 `DROP POLICY IF EXISTS` + 5 `CREATE POLICY`.

## Findings closed (customer-#2 readiness sweep)
- **Finding A** — dropped the `USING (true)` anon SELECT policies on `social_posts` (42 rows, incl. 2 drafts / 1 scheduled-unpublished / 21 AI-generated) and `social_campaigns` (6 rows) that leaked across tenants to anyone with the anon key. Authenticated access remains via `tenant_isolation_*`; service role still bypasses RLS.
- **Finding B (partial)** — `tenant-assets` storage policies checked only `bucket_id`, allowing cross-tenant read/write/update/delete on all 97 objects. Replaced with tenant-folder-scoped policies (`(storage.foldername(name))[1] = current_tenant_id()::text`) matching the social-uploads / videos pattern. Also replaced the broad cross-bucket `authenticated_read_tenant_buckets` SELECT.
- **Finding B (deferred — logos)** — logos bucket has legacy mixed paths (`dang/logo.svg`, bare filenames, `wizard/...`); UUID-folder scoping would break Dang's logo URL. Broad SELECT preserved as `authenticated_read_logos`; write-policy tightening deferred to a separate cleanup migration after path normalization.

## Deviations
None. Contents are verbatim; filename matches house style (`YYYYMMDDHHMMSS_name.sql`).

## Protected-path note
`supabase/migrations/` is in `protect-files.sh`. Used the authorized relax→write→restore to add this single file; the hook is **restored byte-for-byte (zero diff)** and is not part of this PR.

## Risk
None at apply-time — already in production; CLI skips on version match. The PR is purely the repo's record of an applied change.
