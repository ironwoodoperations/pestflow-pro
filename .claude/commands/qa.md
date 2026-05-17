---
name: qa
description: Manually exercise a recently built feature in a real browser session. Verifies code actually works end-to-end. Use after Wave 3 (Execute), before /ship.
---

# /qa — Manual end-to-end verification

## Purpose

Code that compiles is not code that works. This command walks the user's path, surfaces gaps automated tests miss: blank states, broken loading spinners, layout shifts, tenant data leaks, untested error paths.

## When to invoke

- After implementing a new feature (always)
- After a database migration that affects UI
- After touching auth, billing, or RLS
- Before /ship
- Before sign-off on any work that touches a paying customer's data path

## Workflow

### Step 1 — Confirm you're on the feature branch

```
git rev-parse --abbrev-ref HEAD
```

Must NOT be `main`. Should be `feat/<name>` or `fix/<name>`. If on main: switch back to the branch you were working on before running QA.

### Step 2 — Verify the build runs

```
git status                          # confirm clean working tree on the branch
npm run build 2>&1 | tail -20       # or yarn build, pnpm build
```

If the build fails: **stop**. Surface to the human. Do not proceed with broken build.

### Step 3 — Start the dev server

```
npm run dev
```

Note the port. Confirm server starts without errors.

### Step 4 — Plan the QA path

Read the IMPLEMENTATION_BRIEF.md (or PR description). List the user-facing paths to exercise:
- Happy path: the main flow as a user walks it
- Empty state: zero data
- Loading state: while data is fetching
- Error state: network failure, bad input, missing permission
- Edge case: longest name, special chars, very old/new dates
- Cross-tenant: log in as different tenant, confirm no data bleeds across

### Step 5 — Walk each path

For each path:
- State the path
- Execute (actually click through, using browser tool or directing the user)
- Record: what happened vs what was expected
- Screenshot any visual issue (save to `qa-screenshots/`)

### Step 6 — Test the multi-tenant boundary

Critical for Ironwood: every feature must be tenant-isolated. Verify:
- Tenant A cannot see Tenant B's records
- Tenant A's URLs cannot be tampered to access Tenant B's IDs
- API responses include only Tenant A's data
- RLS policies are doing their job (try a query without auth, confirm nothing returned)

### Step 7 — Document findings

Write `QA_REPORT_<feature>.md` in the repo root:
- Paths walked
- Pass/Fail per path
- Bugs found (screenshots / repro)
- Tenant-isolation check: confirmed / failed
- Console errors observed
- Performance notes
- Sign-off recommendation: ready to ship / needs fixes / blocking issue

### Step 8 — Commit on the SAME feature branch

The QA report rides with the feature PR — don't open a separate PR:

```bash
git add QA_REPORT_<feature>.md qa-screenshots/
git commit -m "qa: report for <feature>"
git push origin <current-branch>
```

The existing PR for this feature will pick up the QA report automatically. CI re-runs.

### Step 9 — Triage and route

If bugs found:
- CRITICAL (tenant leak, auth bypass, data loss) → stop, open `/investigate` now
- HIGH (feature broken for happy path) → fix on same branch before /ship
- MEDIUM (edge case broken) → log in PROJECT_MANIFEST.md, decide if blocking
- LOW (cosmetic) → log, defer

If clean: state "QA passed. Ready for /review then /ship."

## Forbidden actions during /qa

- Declaring "looks good" without actually exercising the path
- Skipping the cross-tenant check
- Logging only happy-path results
- Opening a separate PR for the QA report (it rides with the feature PR)
- Merging the PR before /ship is run
