#!/bin/bash
# IRONWOOD FRAMEWORK v3.1 — Stop hook
# Runs at session end. Appends a session summary block to a PER-BRANCH log file
# under PROJECT_MANIFEST.d/ — NOT to the single shared PROJECT_MANIFEST.md.
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
