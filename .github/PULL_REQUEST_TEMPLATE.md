<!--
IRONWOOD FRAMEWORK v3.1 — Pull Request Template
Fill in the sections below. Delete anything that doesn't apply.
-->

## Summary
<!-- One sentence describing what this PR does. -->

## Type
- [ ] Feature (new capability)
- [ ] Fix (bug fix)
- [ ] Refactor (no behavior change)
- [ ] Spec (docs / IMPLEMENTATION_BRIEF / planning — auto-merge expected)
- [ ] Chore (tooling, deps, CI, configs)
- [ ] Investigate (investigation report, no fix yet)

## Wave
- [ ] 1 — Research output
- [ ] 2 — Plan
- [ ] 3 — Execute (code)
- [ ] 4 — Verify (QA + Review reports)
- [ ] 5 — Ship (this PR is the ship)
- [ ] Combined (e.g. 3+4)

## Related artifacts
<!-- Link to IMPLEMENTATION_BRIEF.md, INVESTIGATION_*.md, QA_REPORT_*.md, REVIEW_*.md, or issues -->

## Checklist
- [ ] `/review` run — REVIEW report committed in this PR (or N/A for doc-only)
- [ ] `/qa` run — QA report committed in this PR (or N/A for backend-only / doc-only)
- [ ] Tenant isolation verified (all new queries tenant-scoped or RLS-gated)
- [ ] No `service_role` key in client code
- [ ] No protected files touched (or human approved if so)
- [ ] CI passes (typecheck, lint, test, build)
- [ ] PROJECT_MANIFEST.md status updated if this completes a wave

## Risk / Rollback
<!-- One line: what's the rollback if this PR causes a problem? -->

## Auto-merge
<!-- Auto-merge is enabled by default via `gh pr merge --auto --squash`. -->
<!-- If this PR needs a human eyeball before merge, mark as DRAFT instead. -->
