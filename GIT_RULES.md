# GIT WORKFLOW RULES — BRANCH + PR + MANUAL MERGE (v3.1, pestflow-pro)

**This file is read by Claude Code at session start. Read it before any git operation.**

---

## The Rule

**All code changes go through a feature branch + Pull Request. PRs merge to `main` only after CI passes AND Scott reviews and merges manually.**

This is enforced by:
1. `.claude/hooks/require-pr.sh` — physically blocks `git push origin main`
2. GitHub branch protection on `main` — rejects direct pushes server-side
3. CI workflow `.github/workflows/ci.yml` — must pass before merge
4. Operational discipline — Scott reviews and merges every PR personally (paying customer in production)

---

## Required Workflow

```bash
# 1. Create a feature branch
git checkout -b <type>/<short-name>
# Types: feat/ fix/ refactor/ spec/ chore/ investigate/

# 2. Commit changes
git add -A
git commit -m "<descriptive message>"

# 3. Push the branch
git push -u origin <type>/<short-name>

# 4. Open the PR
gh pr create --fill

# 5. STOP. Tell Scott the PR is open. He reviews and merges manually.
# Do NOT enable auto-merge by default.
# Auto-merge only with explicit instruction: gh pr merge --auto --squash
```

---

## Why Manual Merge

pestflow-pro has a paying customer in production (Dang Pest Control). Auto-merge is enabled at the repo level for emergency use, but the default for every PR is manual review.

CI is a floor, not a ceiling. Scott reads diffs.

---

## Forbidden Commands (blocked by hook)

- `git push origin main`
- `git push -u origin main`
- `git push --force origin main`
- `git push origin HEAD:main`
- Any push whose target ref is `main`

Allowed:
- `git checkout -b <branch>` ✅
- `git push -u origin <branch>` ✅
- `gh pr create` ✅
- Any read operation ✅

---

## Branch Naming Convention

| Type | When | Example |
|---|---|---|
| `feat/` | new feature | `feat/reports-ga4-wiring` |
| `fix/` | bug fix | `fix/zernio-image-presign` |
| `refactor/` | code restructure, no behavior change | `refactor/edge-fn-auth-shared` |
| `spec/` | docs, briefs, planning | `spec/google-apis-service-account` |
| `chore/` | tooling, deps, CI, configs | `chore/upgrade-supabase` |
| `investigate/` | investigation report (no fix yet) | `investigate/dang-domain-flap` |

Lowercase, kebab-case, short and descriptive.

---

## Direct-to-Main Escape Hatch (rare)

1. Ask Scott first.
2. Scott renames: `mv .claude/hooks/require-pr.sh .claude/hooks/require-pr.sh.disabled`
3. Direct push.
4. Re-enable: `mv .claude/hooks/require-pr.sh.disabled .claude/hooks/require-pr.sh`
5. Log the exception in PROJECT_MANIFEST.md.

---

## Verification — End of Every Task

- [ ] Code is on a feature branch, not `main`
- [ ] Branch was pushed
- [ ] PR was opened (`gh pr view --json number,state`)
- [ ] PR awaiting Scott's review (or merged if he authorized auto-merge)
- [ ] PROJECT_MANIFEST.md updated by Stop hook on session end

---

## Quick Reference

```bash
git checkout -b feat/my-thing
git add -A && git commit -m "feat: do the thing"
git push -u origin feat/my-thing
gh pr create --fill
# Stop. Tell Scott. Wait for him to merge.
```
