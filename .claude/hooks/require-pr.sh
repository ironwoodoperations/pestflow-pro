#!/bin/bash
# IRONWOOD FRAMEWORK v3.1 — PreToolUse hook
# Enforces GIT_RULES.md: branch + PR + auto-merge workflow.
# Blocks direct pushes to main. Branch creation and PR commands are ALLOWED.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null)

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Check if this is a git push command at all — if not, ignore
if ! echo "$COMMAND" | grep -qE '^[[:space:]]*git[[:space:]]+push'; then
  exit 0
fi

# Extract the last token of the command (typically the branch / refspec)
LAST=$(echo "$COMMAND" | awk '{print $NF}')

# Patterns that target the main branch directly:
#   git push origin main        → LAST="main"
#   git push -u origin main     → LAST="main"
#   git push --force origin main → LAST="main"
#   git push origin HEAD:main   → LAST="HEAD:main" (ends with :main)
#   git push origin :main       → LAST=":main" (delete main)
#   git push origin main:main   → LAST="main:main"
if [ "$LAST" = "main" ] || echo "$LAST" | grep -qE ':main$|^main:'; then
  cat <<EOF >&2
BLOCKED by IRONWOOD GIT_RULES.md v3.1
Command attempted: $COMMAND
Reason: Direct pushes to 'main' are not allowed. All code goes through a branch + PR.

Correct workflow:
  1. git checkout -b <branch-name>     # create a feature branch
  2. <make your changes>
  3. git add -A && git commit -m "..."
  4. git push -u origin <branch-name>
  5. gh pr create --fill
  6. gh pr merge --auto --squash         # auto-merges when CI passes

If you truly need to push to main (rare — e.g., recovering from a broken commit),
ask the human first. The human can temporarily disable this hook by renaming
.claude/hooks/require-pr.sh and re-enabling it after.
EOF
  echo '{"decision": "block", "reason": "GIT_RULES.md v3.1 violation: no direct push to main"}'
  exit 2
fi

# Force-push protection: even to a non-main branch, force-push is a red flag worth surfacing.
# Let it through but log a note (don't block).
# (Add force-push detection here later if needed.)

exit 0
