# Session log — branch `fix/s320-storage-rls-tenant-users`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-09-02 17:36 UTC
- Branch: `fix/s320-storage-rls-tenant-users`
- Commit: `5d9a543` — S320: storage RLS — remove a published credential, gate on tenant_users
- Author: Claude
- Files changed:
  - REVIEW_S320_STORAGE_RLS.md
  - supabase/migrations/20260902180000_s320_storage_rls_tenant_users.sql
  - supabase/migrations/s320_storage_rls_tenant_users_rollback.sql
  - supabase/tests/s320_storage_policy_verification.sql
- Next recommended action: Self-review the migration adversarially before gating it — done in the 17:59 entry below, which found two blocking defects in this commit.

---
## Session — 2026-09-02 17:59 UTC
- Branch: `fix/s320-storage-rls-tenant-users`
- Commit: `b3bc5eb` — S320: correct stale admin-only wording in the gate document
- Also in this session (the hook logged only the last commit): `a2df672` — S320 review
  fixes: widen storage writes to manager, restate the operator grant
- Author: Claude
- Files changed:
  - REVIEW_S320_STORAGE_RLS.md
  - supabase/migrations/20260902180000_s320_storage_rls_tenant_users.sql
  - supabase/tests/s320_storage_policy_verification.sql
- What changed: self-review of `5d9a543` produced two BLOCKING findings and four
  non-blocking ones, all addressed. Write policies went from `tu.role = 'admin'` to
  `tu.role IN ('admin', 'manager')` — the pre-S320 policies carried no role test at
  all, so admin-only was an unrequested narrowing that would have shipped invisibly
  (zero `manager` rows exist today). The operator comment was rewritten as a NARROWING
  with the principals named rather than a substitution "in kind". Also: corrected the
  claim that SELECT policies gate public-bucket reads (they do not — Supabase serves
  `/object/public/…` without evaluating RLS); retracted "the helper is strictly more
  robust" (`is_tenant_member()` needs a `::uuid` cast on an untrusted object key, which
  raises rather than denies); documented why `authenticated_read_logos` is kept. Checks
  2g and 2h added to the verification script. `upsert` audited — no UPDATE policies
  needed. PR #324's body was rewritten to match.
- Next recommended action: The migration is still NOT APPLIED and PR #324 is gate-blocked
  awaiting both validator verdicts. Scott supplies the verdict texts; paste them
  byte-exact into Appendices A and B of `REVIEW_S320_STORAGE_RLS.md` with attribution
  asserted BEFORE filling (A = Gemini, no citations; B = Perplexity, inline citations).
  After merge, Claude.ai applies the migration, then runs
  `supabase/tests/s320_storage_policy_verification.sql` against `pg_policy` and performs
  the real upload test — check 3, which is the only one that proves uploads work.
