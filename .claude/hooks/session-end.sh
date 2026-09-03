#!/bin/bash
# IRONWOOD FRAMEWORK v3.1 — Stop hook — NOW THE FALLBACK WRITER.
# Appends a session summary block to a PER-BRANCH log file under PROJECT_MANIFEST.d/ —
# NOT to the single shared PROJECT_MANIFEST.md.
#
# NOTE ON "session end": the Stop event fires at the end of every TURN, not once per
# session. The dedup below is what kept that from producing an entry per turn.
#
# S327: it writes NOTHING while a protected branch is checked out — see the guard below.
# On `main` its output was unpushable by construction and duplicated a record the feature
# branch already carried.
#
# The primary writer is now .claude/hooks/manifest-entry.sh. This script only fires for
# the paths that one skips. See the parent-sha check below.
#
# WHY (S261-3): the old hook appended every session block to the end of the one
# shared PROJECT_MANIFEST.md. Two branches created independently therefore both
# appended at the same EOF region and collided — every PR hit a self-conflict on
# PROJECT_MANIFEST.md that cost a rebase (see #168/#169/#170/#171). Writing each
# branch's entries to its own file (keyed by branch name) means independent
# branches touch different files and never conflict; merging two branches just
# adds two distinct files. PROJECT_MANIFEST.md is now a static index (the hook no
# longer writes it); the live per-session record lives in PROJECT_MANIFEST.d/.

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

# Need at least one commit to describe
LAST_COMMIT_HASH=$(git log -1 --format="%H" 2>/dev/null)
[ -z "$LAST_COMMIT_HASH" ] && exit 0

DATE=$(date +"%Y-%m-%d %H:%M %Z")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

# ── S327: NEVER WRITE ON A BRANCH THAT CANNOT BE PUSHED. ─────────────────────────────
#
# THE DEADLOCK THIS REMOVES. The Stop event fires at the end of every TURN, not once per
# session. So after a merge, the moment the next turn ends with `main` checked out, this
# hook appended an entry describing the merge commit into PROJECT_MANIFEST.d/main.md and
# left it uncommitted — while require-pr.sh blocks pushing `main` by design. The result
# is a dirty tree in a branch nobody can push from: the stop-hook git check flags it every
# turn, and clearing it costs a round-trip. It happened after two of the last three merges.
#
# NO RECORD IS LOST, and that is the reason this is a skip rather than a redirect.
# manifest-entry.sh (PreToolUse) already wrote an entry for every commit on the FEATURE
# branch, into that branch's own file, and staged it so it rode inside the commit. That
# file merges into main with the PR. main.md was therefore always a SECOND, duplicate view
# of commits already recorded — 15 `Commit:` entries in it today, and 0 `Parent:` entries,
# i.e. every line of it was written here and none of it is unique.
#
# WHY NOT REDIRECT TO A GITIGNORED PATH: an entry nothing reads is not a record, it is
# litter with a longer half-life. The branch file is the record, and it is in git.
#
# NOT LIMITED TO main: any branch require-pr.sh protects belongs here, so the two stay in
# step if that list ever grows. Today that is exactly `main`.
case "$BRANCH" in
  main)
    exit 0
    ;;
esac
SHORT_SHA=$(git log -1 --format="%h" 2>/dev/null)

# Per-branch log file. Sanitize the branch name (slashes etc.) into a safe slug.
LOG_DIR="PROJECT_MANIFEST.d"
SLUG=$(printf '%s' "$BRANCH" | tr -c 'A-Za-z0-9._-' '-')
[ -z "$SLUG" ] && SLUG="unknown-branch"
LOG_FILE="$LOG_DIR/${SLUG}.md"
mkdir -p "$LOG_DIR" 2>/dev/null || exit 0

# Loop-breaker: if the last commit touched ONLY files under the log dir, it is a
# log commit — do NOT append again. Without this, every log commit produces a new
# SHA the hook would append a fresh block for, dirtying the tree, forcing another
# commit — an infinite churn loop. Keying off the changed file set is robust
# regardless of the log commit's message.
HEAD_CHANGED=$(git show --name-only --format="" "$LAST_COMMIT_HASH" 2>/dev/null | sed '/^$/d')
if [ -n "$HEAD_CHANGED" ] && ! printf '%s\n' "$HEAD_CHANGED" | grep -qv "^$LOG_DIR/"; then
  exit 0
fi

# Dedup: don't append the same commit SHA twice to this branch's file (hook re-runs)
if [ -f "$LOG_FILE" ] && grep -q "Commit: \`$SHORT_SHA\`" "$LOG_FILE" 2>/dev/null; then
  exit 0
fi

# THIS HOOK IS NOW THE FALLBACK, not the primary writer.
# .claude/hooks/manifest-entry.sh (PreToolUse on `git commit`) normally writes the entry
# BEFORE the commit and stages it, so it rides inside the commit it describes and costs
# no extra commit or CI run. Such an entry records `Parent: <sha>` — the parent is
# knowable in advance, the commit's own SHA is not.
#
# So: if an entry already exists for HEAD's parent, the PreToolUse hook handled this
# commit. Appending here as well would produce a DUPLICATE and reinstate exactly the
# uncommitted-file churn the other hook removes.
#
# This script still runs for every path manifest-entry.sh deliberately skips — --amend,
# scoped commits with pathspecs, `git commit -a`, commits made outside a Bash tool call.
# Those get logged LATE, which is the intended degradation: late beats absent, and both
# beat a wrong record.
PARENT_SHA=$(git rev-parse --short HEAD^ 2>/dev/null)
if [ -n "$PARENT_SHA" ] && [ -f "$LOG_FILE" ] \
   && grep -q "Parent: \`$PARENT_SHA\`" "$LOG_FILE" 2>/dev/null; then
  exit 0
fi

SUBJECT=$(git log -1 --format="%s" 2>/dev/null)
AUTHOR=$(git log -1 --format="%an" 2>/dev/null)
CHANGED=$(git show --name-only --format="" "$LAST_COMMIT_HASH" 2>/dev/null | sed '/^$/d' | sed 's/^/  - /')

# Try to find an associated PR if we're on a feature branch
PR_LINE=""
if [ "$BRANCH" != "main" ] && command -v gh >/dev/null 2>&1; then
  PR_DATA=$(gh pr view "$BRANCH" --json number,state,url 2>/dev/null)
  if [ -n "$PR_DATA" ]; then
    PR_NUM=$(echo "$PR_DATA" | jq -r '.number // empty' 2>/dev/null)
    PR_STATE=$(echo "$PR_DATA" | jq -r '.state // empty' 2>/dev/null)
    PR_URL=$(echo "$PR_DATA" | jq -r '.url // empty' 2>/dev/null)
    if [ -n "$PR_NUM" ]; then
      PR_LINE=$(printf "\n- PR: #%s (%s) — %s" "$PR_NUM" "$PR_STATE" "$PR_URL")
    fi
  fi
fi

# First write to this branch's file gets a header
if [ ! -f "$LOG_FILE" ]; then
  cat > "$LOG_FILE" <<EOF
# Session log — branch \`$BRANCH\`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._
EOF
fi

# Append the session entry
cat >> "$LOG_FILE" <<EOF

---
## Session — $DATE
- Branch: \`$BRANCH\`
- Commit: \`$SHORT_SHA\` — $SUBJECT
- Author: $AUTHOR$PR_LINE
- Files changed:
$CHANGED
- Next recommended action: [Fill in next session: read this line, write what comes next]
EOF

exit 0
