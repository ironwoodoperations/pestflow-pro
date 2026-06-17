#!/bin/bash
# IRONWOOD FRAMEWORK v3.1 — PreToolUse hook
# Enforces CLAUDE.md DO NOT TOUCH list.
# Blocks Edit/Write to protected files. Read operations are not affected.
#
# CUSTOMIZE THIS LIST PER PROJECT — edit PROTECTED_PATTERNS below
# to match the "DO NOT TOUCH" section of that project's CLAUDE.md.
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""' 2>/dev/null)
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

# Branch-scoped exception: writing a migration on a feature branch is the
# entire point of the branch, and it cannot reach main without a reviewed PR.
# So supabase/migrations/ is blocked ONLY on main; on any other branch the
# PR review is the gate. Every other protected pattern stays all-or-nothing.
if echo "$FILE_PATH" | grep -qE "supabase/migrations/"; then
  if [ "$CURRENT_BRANCH" = "main" ]; then
    cat <<EOF >&2
BLOCKED by IRONWOOD CLAUDE.md DO NOT TOUCH list
File: $FILE_PATH
Reason: direct migration write on 'main'.
Migrations must be written on a feature branch and merged via reviewed PR.
EOF
    echo '{"decision": "block", "reason": "Direct migration write on main"}'
    exit 2
  fi
  # Not on main (or branch undetectable) → allow; PR review is the gate.
  exit 0
fi

# DO NOT TOUCH patterns — these match the CLAUDE.md template defaults.
# Edit this list to match each project's specific protected paths.
PROTECTED_PATTERNS=(
  "\.env"
  "doppler\.yaml"
  "supabase/functions/_shared/auth/"
  "supabase/functions/provision-tenant/"
  "supabase/functions/ironwood-provision/"
  "supabase/functions/stripe-webhook/"
  "supabase/functions/create-checkout-session/"
  "src/integrations/supabase/client"
  "rls.*\.sql$"
)
for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if echo "$FILE_PATH" | grep -qE "$pattern"; then
    cat <<EOF >&2
BLOCKED by IRONWOOD CLAUDE.md DO NOT TOUCH list
File: $FILE_PATH
Pattern matched: $pattern
This file is protected. Changes require human approval first.
Ask the human before proceeding.
EOF
    echo '{"decision": "block", "reason": "Protected file in DO NOT TOUCH list"}'
    exit 2
  fi
done
exit 0