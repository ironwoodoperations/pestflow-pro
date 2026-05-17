---
name: investigate
description: Root-cause investigation for bugs, production issues, unexpected behavior, 500 errors, regressions. Forces structured diagnosis before any fix. Use whenever you would otherwise be tempted to patch the symptom.
---

# /investigate — Root cause investigation protocol

## Purpose

Symptom-fixing creates whack-a-mole debugging. Find the cause, then fix it. This command enforces "diagnose, then commit a finding, then fix."

## When to invoke

- Anything labeled bug / error / regression / 500 / blank screen / data corruption
- A test passes locally but fails in production
- A feature "stopped working" with no obvious recent change
- You're about to add a try/catch to silence an error
- You're about to add a special case to handle a single bad input

## Hard gate

**NO FIXES until root cause is identified, the investigation report is on a PR, and the user approves the proposed fix.** Investigation and fix are SEPARATE branches/PRs.

## Workflow

### Step 1 — Read context

Read:
1. `CLAUDE.md`
2. `PROJECT_MANIFEST.md` — especially recent "Session —" entries to see what changed
3. Most recent 10 commits on main: `git log main --oneline -10`
4. Recent merged PRs: `gh pr list --state merged --limit 10`
5. `git status` to see uncommitted state

### Step 2 — Collect symptoms

Document in a working note:
- Exact error message / stack trace (no paraphrasing)
- Reproduction steps (specific sequence)
- Expected vs actual behavior
- First time observed (was it ever working? when did it stop?)
- Affected tenants / users / data scope
- Environment (local / preview / production)

### Step 3 — Check if it's a recent change

```
git log main --oneline -20
gh pr list --state merged --limit 20
```

If a recent merge looks suspicious: name it as a hypothesis (not the answer).

### Step 4 — Form hypotheses, ranked

List 3-5 hypotheses for the root cause, ranked by probability. For each:
- What it would explain
- What it would NOT explain
- How to test it

Do not pick a single hypothesis until all are listed. Resist "obvious" causes.

### Step 5 — Test hypotheses, top-down

For the top-ranked hypothesis, run the cheapest test that confirms or denies it:
- Read the offending code path end-to-end
- Run the failing query with sample data
- Check the relevant RLS policy
- Check Edge Function logs
- Reproduce locally

If denied, move to the next hypothesis. **Do not skip ahead. Do not patch.**

### Step 6 — Confirm the root cause

A confirmed root cause is:
- A specific line / policy / config / data condition
- A reproducible chain from cause to symptom
- Falsifiable

If you cannot get to a confirmed root cause: **stop and surface to the human**.

### Step 7 — Write the investigation report (on its own branch)

```bash
git checkout -b investigate/<short-name>
```

Create `INVESTIGATION_<short-name>.md` in the repo root with:
- Symptoms
- Hypotheses considered (including rejected)
- Confirmed root cause
- Proposed fix (specific, scoped)
- Risk assessment
- Test plan to verify fix
- Rollback plan if fix causes regression

Commit and open the PR:

```bash
git add INVESTIGATION_<short-name>.md
git commit -m "investigate: <one-line cause summary>"
git push -u origin investigate/<short-name>
gh pr create --title "investigate: <cause>" --body "Investigation report. Doc-only PR; auto-merge."
gh pr merge --auto --squash
```

### Step 8 — Wait for fix approval

State: "Investigation PR opened (#N). Root cause: <one sentence>. Proposed fix on the report. Ready to apply fix when you confirm."

Do NOT apply the fix yet.

### Step 9 — Apply the fix (separate branch)

When the user confirms:

```bash
git checkout main && git pull origin main
git checkout -b fix/<short-name>
```

Apply the smallest possible fix. Run tests. Commit, push, open PR with auto-merge:

```bash
git add -A
git commit -m "fix: <short-name> — see INVESTIGATION_<short-name>.md"
git push -u origin fix/<short-name>
gh pr create --title "fix: <description>" --body "Fixes the issue described in INVESTIGATION_<short-name>.md. Root cause: <one sentence>."
gh pr merge --auto --squash
```

## Forbidden actions during /investigate

- Patching symptoms before root cause is confirmed
- Adding catch-all try/catch blocks "to be safe"
- Reverting commits without understanding why they broke things
- Marking a bug "fixed" because the symptom went away — verify the cause is gone
- Combining investigation report and fix on one branch (keep them separate so the report stands as a permanent record)
