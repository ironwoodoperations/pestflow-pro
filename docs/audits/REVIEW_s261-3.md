# REVIEW — S261-3: per-session logging to end the manifest merge tax

**Branch:** `chore/s261-3-per-session-logging`
**Files:** `.claude/hooks/session-end.sh`, `PROJECT_MANIFEST.d/README.md` (new), `PROJECT_MANIFEST.md` (pointer note).

---

## Problem

The Stop hook (`.claude/hooks/session-end.sh`) appended every session block to the **end of the single shared `PROJECT_MANIFEST.md`**. Two branches created independently both appended at the same EOF region, so the moment one merged, every other open branch conflicted there — a self-conflict on **every** PR (#168/#169/#170/#171), each costing a rebase. Harmless content-wise, but a tax on the whole workflow.

## Proposed change (read the hook first, per task)

The old hook (verbatim behavior): cd to project → require `PROJECT_MANIFEST.md` exists → SHA dedup against `PROJECT_MANIFEST.md` → loop-breaker (skip if HEAD changed only `PROJECT_MANIFEST.md`) → **append block to `PROJECT_MANIFEST.md`**.

**Fix (lowest-risk, matches existing structure):** keep the exact same metadata-gathering and block format, but redirect the write to a **per-branch file** under a new `PROJECT_MANIFEST.d/` directory, keyed by a sanitized branch name. The shared `PROJECT_MANIFEST.md` is dropped from the append path (becomes a static index). Independent branches now write different files → no shared merge point → no conflict; merging two branches just adds two distinct files.

## What changed in the hook

- **Target:** `LOG_FILE="PROJECT_MANIFEST.d/<slug>.md"`, where `<slug>` = branch name with any non-`[A-Za-z0-9._-]` char mapped to `-` (so `feat/x` → `feat-x.md`). `mkdir -p` the dir.
- **First write per branch** seeds a small header; subsequent sessions on that branch append.
- **Loop-breaker updated:** skip when the last commit's changed-file set is **entirely under `PROJECT_MANIFEST.d/`** (was: exactly `PROJECT_MANIFEST.md`). Prevents the commit→dirty-tree→commit churn loop for log-only commits. Verified by logic: mixed file sets still append; pure-log-dir commits skip.
- **Dedup** now greps the per-branch file for the commit SHA (was: the shared file). Re-runs against the same commit don't duplicate — verified (re-run kept 1 block).
- Removed the hard requirement that `PROJECT_MANIFEST.md` exist; the hook only needs a commit + the (auto-created) log dir.
- Metadata gathering (date/branch/sha/subject/author/changed-files) and the optional `gh pr view` PR line are unchanged.

## PROJECT_MANIFEST.md

No longer written by the hook. Added a one-time pointer note in the **top header region** (stable — never a conflict target since nothing appends at the bottom anymore) explaining logs now live in `PROJECT_MANIFEST.d/`. Existing historical entries left intact.

## Risk / scope

- Touches only the Stop hook + docs/index. No app code, no caching/auth/RLS/payments/lead-path/edge behavior (validator gate N/A).
- Transition note: branches created **before** this merges still carry the old hook on their base and will still append to `PROJECT_MANIFEST.md` until rebased past this commit — so the fix takes full effect for branches cut after merge. No action needed; the tax simply stops going forward.

## Verification performed

- `bash -n` clean.
- Controlled run on this branch: created `PROJECT_MANIFEST.d/chore-s261-3-per-session-logging.md` with header + one correctly-formatted session block; slug sanitization (`/`→`-`) confirmed. Re-run → still 1 block (SHA dedup works). Test artifact removed; only `README.md` ships in the dir.
