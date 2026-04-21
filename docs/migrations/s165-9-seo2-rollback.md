# S165.9 seo2 — Rollback

Rollback is pure code revert — no DB changes in v1.

```bash
# Identify commit range
git log --oneline main | grep "s165.9"

# Revert range (example — use actual SHAs)
git revert --no-edit <oldest-s165.9-sha>^..<newest-s165.9-sha>
git push origin main
```

No CHECK constraints to drop. No migrations to reverse.

## Side effects

- The move of `seoSchema.ts` from `src/lib/` to `shared/lib/` is reverted,
  so any other session's imports from `shared/lib/seoSchema` will break.
  Coordinate with any in-flight work before reverting.

- vitest was added as a devDependency in this session. The `package.json`
  change is included in the revert; run `npm install` after.

## What this does NOT revert

- No DB migrations were applied.
- No Supabase edge function changes.
- Stripe, Vercel, and DNS are unaffected.
