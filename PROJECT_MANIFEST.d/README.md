# PROJECT_MANIFEST.d — per-branch session logs

The Ironwood Stop hook (`.claude/hooks/session-end.sh`) writes each session's
summary block to a **per-branch** file in this directory (e.g.
`feat-my-thing.md`), keyed by a sanitized branch name.

**Why (S261-3):** the hook used to append every session block to the single
shared `../PROJECT_MANIFEST.md`. Two branches created independently both appended
at the same end-of-file region, so every PR collided there and cost a rebase
(#168/#169/#170/#171). One file per branch means independent branches touch
different files and never conflict; merging two branches just adds two distinct
files.

- One file per branch; the hook appends across that branch's sessions.
- `../PROJECT_MANIFEST.md` is now a static index/standing-orders doc — the hook
  no longer writes to it.
- These files are historical logs; nothing reads them at runtime.
