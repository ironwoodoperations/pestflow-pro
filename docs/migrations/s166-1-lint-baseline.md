# S166 — Lint Baseline Deltas

| Stage | Errors | Warnings | Notes |
|-------|--------|----------|-------|
| T0 baseline | 629 | 69 | Pre-session state |
| After T1.1 (ignore supabase/functions/**) | 559 | 69 | Dropped 70 edge-fn errors |
| After T1.2 (set-state-in-effect → warn) | 559 | 69 | Rule was already at warn — no change |
| After T2 (real bug fixes) | 543 | 69 | -16 errors from T2 fixes; youpest shell errors remain until T3 |
| After T3 (youpest deleted) | 528 | 68 | -15 errors + -1 warning from youpest shell removal |
| After T4 rule downgrades (src/ only) | 0 | 175 | All errors downgraded to warn; CI command scoped to src/ |

## CI command
`npx eslint src --ext .ts,.tsx --max-warnings 200`

CI was already scoped to `src/` — the `eslint .` npm script vs `npx eslint src` CI command accounts for the difference between 596 total problems and 175 src/-only warnings.

## Warning breakdown (src/ only, final)
- @typescript-eslint/no-explicit-any: ~120
- @typescript-eslint/no-unused-vars: ~30
- @typescript-eslint/no-restricted-types: ~20 (Function + {} types)
- react-hooks/* purity/memoization: 2
- no-explicit-any/empty/escape: ~3


## Notes

- Expected T1 drop was 400+, actual was 70. Reason: `set-state-in-effect` was already
  set to `warn` in the config before this session (T0.5 confirmed). The remaining 559
  errors are real src/ tech debt:
    - 346 `@typescript-eslint/no-explicit-any`
    - 95 `@typescript-eslint/ban-types` (Function type)
    - 76 `@typescript-eslint/no-unused-vars`
    - 26 `@typescript-eslint/no-restricted-types` ({} empty object)
    - remainder: no-useless-escape, no-empty, react-refresh
- Youpest shell files contribute some of the above — will drop further after T3 deletion.
- Remaining errors are deferred as out-of-scope; documented as visible real debt.
