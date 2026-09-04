# Session log — branch `chore/s337-verify-jwt-script-fix`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-09-04 18:28 UTC
- Branch: `chore/s337-verify-jwt-script-fix`
- Commit: `bc7b36d` — S337: make the redeploy verifier report the truth
- Author: Claude
- Files changed:
  - .github/scripts/verify_verify_jwt.py
  - .github/scripts/verify_verify_jwt_test.py
  - .github/workflows/ci.yml
  - .github/workflows/deploy.yml
  - .github/workflows/redeploy-edge-on-shared-change.yml
  - .gitignore
  - docs/ROADMAP.md
- Next recommended action: **Build-order step 3 — `provision_tenant_atomic`** (all 10 tables,
  unconditional seed, prospect as overlay, auth FIRST and outside the transaction, grants +
  CI grant assertion). Riding with it: 23514 propagation, and the `servicePagesFor`
  return-type fix (it lives in `_shared/`, so it fires the 16-function redeploy — do it when
  provision-tenant is deployed on purpose).
- **AWAITING SCOTT — S337 is NOT proven by its green PR.** `redeploy-edge-on-shared-change.yml`
  runs only on push-to-main or workflow_dispatch, so PR CI never executes it. A manual
  dispatch is what proves the Cloudflare 1010 fix. Until then the verifier's live API call
  is unproven; its pure logic IS covered by 11 unit tests in the validate job.
- Carried from S337, do not re-derive:
  - The 1010 was NEVER an auth failure. Body was the bare string `error code: 1010` (not
    JSON); Cloudflare edge-blocked urllib's default `Python-urllib/*` User-Agent. Proof: the
    CLI did 14 successful deploys 40s earlier with the SAME token and host.
  - The verifier asserts deployed verify_jwt == config.toml. It must NEVER assert a version
    increment or "deployed in this run" — the CLI skips unchanged bundles ("No change
    found") and that is correct. A test pins this; mutation M4 proves the pin bites.
  - `supabase/setup-cli@v1` NOT bumped: available majors could not be established, and a bad
    guess breaks ci.yml's auth-isolation job too. Verify first, then bump.
  - Main-branch workflow failures appear in NO PR check list — that is why 10 failures hid for
    10 weeks. Visibility mechanism is Scott's decision; options recorded in docs/ROADMAP.md.
