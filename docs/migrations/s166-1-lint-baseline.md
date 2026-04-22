# S166 — Lint Baseline Deltas

| Stage | Errors | Warnings | Notes |
|-------|--------|----------|-------|
| T0 baseline | 629 | 69 | Pre-session state |
| After T1.1 (ignore supabase/functions/**) | 559 | 69 | Dropped 70 edge-fn errors |
| After T1.2 (set-state-in-effect → warn) | 559 | 69 | Rule was already at warn — no change |

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
