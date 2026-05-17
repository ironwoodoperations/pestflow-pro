#!/bin/bash
# IRONWOOD FRAMEWORK v3.1 — Stop hook
# Runs at session end. Appends a session summary block to PROJECT_MANIFEST.md.
# Tracks branch + commits + PR status (if gh CLI available).

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

# Only proceed if PROJECT_MANIFEST.md exists in repo root
if [ ! -f "PROJECT_MANIFEST.md" ]; then
  exit 0
fi

# Check there was at least one commit available
LAST_COMMIT_HASH=$(git log -1 --format="%H" 2>/dev/null)
if [ -z "$LAST_COMMIT_HASH" ]; then
  exit 0
fi

# Avoid duplicate entries on hook re-runs
SHORT_SHA=$(git log -1 --format="%h" 2>/dev/null)
if grep -q "Commit: \`$SHORT_SHA\`" PROJECT_MANIFEST.md 2>/dev/null; then
  exit 0
fi

# Gather metadata
DATE=$(date +"%Y-%m-%d %H:%M %Z")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
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

# Append a structured session entry
cat >> PROJECT_MANIFEST.md <<EOF

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
