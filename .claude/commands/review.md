---
name: review
description: Code review pass on the current PR. Catches drive-by edits, unnecessary complexity, missed tenant gates, hardcoded values, missing tests. Run before /ship.
---

# /review — PR review pass

## Purpose

Catch what a busy human would catch on a PR review. Run against the current feature branch's PR. Produces a structured review note.

## When to invoke

- After every meaningful code change in Wave 3 (Execute)
- After /qa, before /ship
- After Claude Code writes more than 50 lines of new code
- After any change to auth, billing, RLS, tenant scoping, webhooks
- When you feel "that was a lot of code, was it all necessary"

## Workflow

### Step 1 — Identify the PR

```
gh pr view --json number,title,headRefName,baseRefName,state,statusCheckRollup
```

Confirm:
- There's an open PR for this branch
- baseRefName is `main`
- statusCheckRollup status (CI may still be running)

If no PR exists: open one first (`gh pr create --fill --draft`).

### Step 2 — Get the diff

```
gh pr diff
```

For a multi-commit branch:
```
git log main..HEAD --oneline
git diff main...HEAD
```

### Step 3 — Run automated checks locally

These should match what CI runs. Run them anyway to catch issues early:

```
npx tsc --noEmit 2>&1 | head -30
npm run lint 2>&1 | tail -30
npm test 2>&1 | tail -30
npm run build 2>&1 | tail -10
```

If any fail: the review is **automatically a fail**. Fix on this branch, push, CI re-runs. Then re-review.

### Step 4 — Wait for CI on the PR

```
gh pr checks
```

If CI is red: read the failure log via `gh run view <run-id> --log-failed`. Fix and push.

### Step 5 — Read the diff with these lenses

Walk every changed file. For each change, apply:

**Scope lens**
- Does this match the IMPLEMENTATION_BRIEF? Or did scope creep?
- Drive-by edits: any file changed that the brief didn't mention? Flag them.

**Tenant lens**
- New queries: tenant-scoped (WHERE tenant_id = / WHERE company_id =)?
- New Edge Functions: call requireTenantAdmin at the top?
- New RLS policies: reference the tenant column?

**Secret lens**
- Hardcoded API key, token, URL with credentials, service_role reference?
- `console.log` that prints sensitive data?

**Protected-file lens**
- Touched anything on CLAUDE.md DO NOT TOUCH? (hook should have blocked, but verify)

**Complexity lens**
- Simpler way to do this?
- Abstraction used exactly once (premature)?
- Code handling cases the brief didn't ask about (gold plating)?

**Error-path lens**
- New paths: failure modes handled?
- UI: empty / loading / error states present?
- Partial-failure cleanup?

**Test lens**
- New behavior: is there a test?
- If not: intentional (state why) or oversight (flag)?

### Step 6 — Write the review note

Create `REVIEW_<short-name>.md` in the repo root:

```markdown
# Review — <feature> — <date>

## PR
#<N> — <title> — <branch>

## CI status
- typecheck: PASS / FAIL
- lint: PASS / FAIL
- tests: PASS / FAIL (N tests, X passing)
- build: PASS / FAIL

## Findings

### CRITICAL (block ship)
- [ ] <issue> — <file:line>

### HIGH (fix before /ship)
- [ ] <issue> — <file:line>

### MEDIUM (fix this sprint)
- [ ] <issue> — <file:line>

### LOW (note for later)
- [ ] <issue> — <file:line>

## Scope check
- In brief: [yes / partial / scope creep]
- Drive-by edits: [none / list them]

## Tenant isolation check
- All new queries tenant-scoped: [yes / no — list exceptions]
- Edge functions gated: [yes / no — list exceptions]

## Recommendation
[Ready for /ship] / [Fix CRITICAL+HIGH first] / [Roll back commit]
```

### Step 7 — Commit on the SAME branch

```bash
git add REVIEW_<short-name>.md
git commit -m "review: <feature> — <recommendation>"
git push origin <current-branch>
```

The review rides with the feature PR.

### Step 8 — Optionally comment on the PR

```
gh pr comment --body "Review complete. See REVIEW_<short-name>.md. Recommendation: <ready / fix needed>."
```

### Step 9 — Route

- "Ready for /ship" → proceed to /ship
- "Fix CRITICAL+HIGH first" → fix each, push, re-run /review
- "Roll back commit" → surface to human, do not roll back without approval

## Forbidden actions during /review

- Reviewing charitably — assume an adversarial reviewer
- Skipping the tenant-isolation check
- Skipping CI status check
- Declaring "ready" with CRITICAL or HIGH findings open
- Modifying source code DURING the review — fixes happen after
- Merging the PR before /ship is run
