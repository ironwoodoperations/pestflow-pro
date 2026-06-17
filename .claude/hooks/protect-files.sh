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

# DO NOT TOUCH patterns — these match the CLAUDE.md template defaults.
# Edit this list to match each project's specific protected paths.
PROTECTED_PATTERNS=(
  "\.env"
  "doppler\.yaml"
  "supabase/migrations/"
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
