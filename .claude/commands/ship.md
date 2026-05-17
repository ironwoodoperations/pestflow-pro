---
name: ship
description: Open the PR (if not already), enable auto-merge, wait for CI to pass, confirm merge. The final command in the wave loop.
---

# /ship — Open PR and auto-merge

## Purpose

Take a feature branch from "code is written, /review and /qa are clean" to "merged into main." Handles PR creation, auto-merge setup, CI wait, and verification.

## When to invoke

- After /review verdict is "Ready for /ship"
- After /qa has signed off
- When work is complete on a feature branch and ready to land

## Hard gate

- Must be on a feature branch, not main
- /review must have produced a "ready" verdict (REVIEW_*.md file exists with that recommendation)
- No CRITICAL or HIGH open findings
- All commits pushed to the remote

## Workflow

### Step 1 — Confirm branch state

```bash
git rev-parse --abbrev-ref HEAD
git status
```

Confirm:
- Not on `main`
- Working tree is clean (no uncommitted changes)

If on main: error. /ship runs on feature branches.
If uncommitted: ask user — commit them or stash? Don't auto-commit.

### Step 2 — Push any unpushed commits

```bash
git push origin $(git rev-parse --abbrev-ref HEAD)
```

### Step 3 — Check for existing PR

```bash
gh pr view --json number,state,url 2>/dev/null
```

If a PR exists: skip to Step 5.
If no PR: continue to Step 4.

### Step 4 — Open the PR

```bash
gh pr create --fill
```

`--fill` uses the branch name and recent commits to populate title and body. Adjust if needed:

```bash
gh pr create \
  --title "<type>: <description>" \
  --body "$(cat <<EOF
## Summary
<one-sentence description>

## Type
- [x] <feature/fix/refactor/spec/chore>

## Wave
- [x] Execute (Wave 3) + Verify (Wave 4)

## Related
<IMPLEMENTATION_BRIEF.md / INVESTIGATION_*.md / issue refs>

## Checklist
- [x] /review run — REVIEW_*.md committed
- [x] /qa run — QA_REPORT_*.md committed
- [x] Tenant isolation verified
- [x] No protected files touched
- [x] Tests passing locally
EOF
)"
```

### Step 5 — Verify the PR

```bash
gh pr view --json number,title,state,url,statusCheckRollup
```

Confirm:
- PR is open (or draft — promote to ready if needed)
- baseRefName is `main`
- statusCheckRollup is pending or success (not failure)

### Step 6 — Enable auto-merge (squash)

```bash
gh pr merge --auto --squash
```

This tells GitHub: "merge this PR automatically when all required checks pass."

If auto-merge isn't enabled on the repo: surface to user. Instructions:
> "Auto-merge isn't enabled on this repo. Enable once at: GitHub → repo → Settings → General → Pull Requests → Allow auto-merge. Then re-run /ship."

### Step 7 — Wait for CI

```bash
gh pr checks --watch
```

This blocks until CI completes. Typically 90-120 seconds.

Outcomes:
- ✅ All checks pass → PR auto-merges. Proceed to Step 8.
- ❌ Any check fails → auto-merge does NOT fire. Read the failure: `gh run view <run-id> --log-failed`. Fix, push, CI re-runs.

### Step 8 — Verify the merge

```bash
gh pr view --json state,mergedAt,mergeCommit
```

Confirm `state` is `MERGED`.

```bash
git checkout main
git pull origin main
git log -1 --oneline
```

Confirm your change is now on main.

### Step 9 — Clean up the local branch

```bash
git branch -d <feature-branch>     # delete local branch (safe — already merged)
```

The remote branch is auto-deleted by GitHub if "Automatically delete head branches" is enabled in repo settings. If not: `git push origin --delete <feature-branch>`.

### Step 10 — Update PROJECT_MANIFEST.md status

The Stop hook will auto-append the session entry when this Claude Code session ends, including the PR number and merge status. You don't need to manually update.

But DO update the Status section at the top of PROJECT_MANIFEST.md if the wave is complete:

```
git checkout -b chore/manifest-update-<short>
# edit PROJECT_MANIFEST.md — update Current Phase, Wave, Sprint Status, etc.
git add PROJECT_MANIFEST.md
git commit -m "chore: update manifest after <feature> ship"
git push -u origin chore/manifest-update-<short>
gh pr create --fill
gh pr merge --auto --squash
```

(Or include the manifest update in the original feature branch before merge — even cleaner.)

### Step 11 — State completion

State:
- PR #<N> merged at <SHA>
- Feature <name> is live on main
- Next recommended action: <next wave or next task>

## Forbidden actions during /ship

- Force-pushing or rewriting history on the branch
- Bypassing auto-merge with manual `--admin` merge (unless explicitly approved by user)
- Merging before CI is green
- Merging with open CRITICAL or HIGH /review findings
- Merging without a /review verdict
