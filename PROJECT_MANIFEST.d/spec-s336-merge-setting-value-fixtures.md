# Session log — branch `spec/s336-merge-setting-value-fixtures`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-09-04 17:41 UTC
- Branch: `spec/s336-merge-setting-value-fixtures`
- Commit: `e02fc81` — S336: migration file + shared fixture corpus for merge_setting_value
- Author: Claude
- Files changed:
  - .github/workflows/ci.yml
  - shared/fixtures/settingsMergeCorpus.json
  - shared/lib/settingsMerge.corpus.test.ts
  - supabase/migrations/s336_merge_setting_value.sql
  - supabase/migrations/s336_merge_setting_value_rollback.sql
  - supabase/tests/s336_merge_mutations.pgtap.sql
  - supabase/tests/s336_merge_setting_value.pgtap.sql
- Next recommended action: **Build-order step 3 — `provision_tenant_atomic`.** All 10 tables,
  unconditional seed, prospect as OVERLAY only, structural invariants, grants + a CI grant
  assertion. Auth FIRST and OUTSIDE the transaction (profiles.id IS the auth user id).
  Rides with step 3, deliberately deferred from S336:
    * 23514 propagation — the helper is PURE and cannot catch anything; that a constraint
      violation aborts the whole transaction is a property of the RPC, not the helper.
    * The `servicePagesFor` return-type fix (S335 left it declaring SeedPage[] while returning
      a frozen readonly array; tsconfig excludes supabase/ so tsc cannot see it). It lives in
      _shared/, so touching it fires the 16-function redeploy — do it when provision-tenant is
      deployed on purpose.
- Carried from S336, do not re-derive:
  - `merge_setting_value` + the two helpers are LIVE, IMMUTABLE, service_role EXECUTE only,
    and NOT wired. provision-tenant still merges in TypeScript.
  - ONE corpus: `shared/fixtures/settingsMergeCorpus.json`, 34 cases, consumed by BOTH
    vitest and pgTAP. All 34 verified to agree with the live SQL function. Never fork it.
  - Blanking ONE address-quad member preserves the WHOLE OLD ADDRESS (dropEmpty removes the
    blank, the group check then drops the remaining three). Two cases pin it.
  - THIRD apply_migration-without-file object found: `public.strip_settings_secrets` has no
    migration file, like tenant_services and these functions did. Writing one is its own task.
  - Still open from S335: SUPABASE_ACCESS_TOKEN is unset, so redeploy-edge-on-shared-change.yml
    has NEVER succeeded — the S273 stale-bundle protection is inert.
  - Still LAST: S323 PR C. The vertical CHECK still rejects 'lawn'.

---
## Session — 2026-09-04 17:45 UTC
- Branch: `spec/s336-merge-setting-value-fixtures`
- Commit: `0d1be74` — fix(ci): rescue the S336 migration before the staging step wipes migrations
- Author: Claude
- Files changed:
  - .github/workflows/ci.yml
- Next recommended action: **See the previous entry** — it carries the real next action
  (build-order step 3, `provision_tenant_atomic`) and the S336 facts not to re-derive.
  This commit is only the CI fix: the "Stage focused test schema" step does
  `rm -rf supabase/migrations`, which deleted the S336 migration before the step that
  applies it. It is now rescued to /tmp before the wipe. If you add another file under
  supabase/migrations that a later CI step needs, it will hit the SAME trap — rescue it
  in that staging step or the file will not exist when your step runs.
