#!/bin/bash
# IRONWOOD FRAMEWORK — PreToolUse hook: write the manifest entry INTO the commit.
#
# WHY THIS EXISTS
# session-end.sh (Stop hook) appends a PROJECT_MANIFEST.d/ entry describing HEAD, and
# leaves it UNCOMMITTED. Something then has to commit it, which means every real commit
# is followed by a "record manifest entry" chore commit — a push, a Vercel rebuild and
# three Actions jobs each time. Measured cost: SEVEN such commits in two days.
#
# The structural cause is not a bug in that script: an entry that NAMES commit N cannot
# live INSIDE commit N, because the SHA does not exist until the commit is made. The only
# way out is to stop naming it. This hook runs BEFORE `git commit`, writes an entry keyed
# to the PARENT sha (which IS knowable), and stages it so it rides along in the very
# commit it describes. Zero extra commits, zero extra CI.
#
# WHAT WAS DELIBERATELY GIVEN UP
# The entry no longer carries its own SHA or the commit SUBJECT.
#   * SHA: unknowable before the commit exists. `Parent` anchors it instead —
#     `git log <parent>..` finds the commit this entry describes.
#   * SUBJECT: it could be scraped out of `-m "..."`, and that would be SILENTLY WRONG
#     whenever the commit uses `-F <file>` or an editor, which is the common case here.
#     A missing field is recoverable; a confidently wrong one is not.
# DO NOT "FIX" EITHER OF THESE BY GUESSING. That is the whole point of the change.
#
# FAILURE BIAS: every guard below fails toward SKIPPING. A skipped entry is written late
# by session-end.sh (kept as the fallback). A WRONG entry is not self-correcting —
# PROJECT_MANIFEST.d/ is read first by the next session precisely because it is recent,
# so a wrong record there is effectively immortal. Missing beats wrong, every time.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null)
[ -z "$COMMAND" ] && exit 0

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

# ── Is this a `git commit` at all? Match at the start or after a shell operator, so
# `git add -A && git commit ...` is caught but `echo git commit` is not.
echo "$COMMAND" | grep -qE '(^|[;&|(][[:space:]]*)git[[:space:]]+commit([[:space:]]|$)' || exit 0

# ── Isolate the `git commit` segment: everything from `git commit` to the next shell
# operator. Guards below parse only this, so a later `&& git push origin foo` cannot be
# mistaken for a pathspec.
SEGMENT=$(printf '%s' "$COMMAND" \
  | sed -n 's/.*\(git[[:space:]]\+commit\)/\1/p' \
  | sed 's/[;&|].*//')

# ── GUARD 1: --amend.
# Amending does not change HEAD's parent, so the dedup below (which keys on parent)
# would not catch it and a SECOND entry would be appended for the same parent. Skip.
if echo "$SEGMENT" | grep -qE '(^|[[:space:]])--amend([[:space:]=]|$)'; then
  exit 0
fi

# ── GUARD 2: explicit pathspecs, and -a/--all.
# A scoped commit (`git commit -- <path>`, `git commit <path>`) does NOT pick up the
# staged manifest entry. The entry is then orphaned and swept into some LATER commit,
# where its `Parent` names the wrong commit. That is the only failure mode here that
# produces a WRONG record rather than a missing one, so it is guarded hard.
# `-a/--all` is skipped for the same reason: it stages tracked modifications at commit
# time and will not include a newly-created (untracked) log file.
if echo "$SEGMENT" | grep -qE '(^|[[:space:]])(-a|--all)([[:space:]]|$)'; then
  exit 0
fi
if echo "$SEGMENT" | grep -qE '[[:space:]]--([[:space:]]|$)'; then
  exit 0   # bare `--` introduces pathspecs
fi
# Any bare (non-flag) token left after dropping flags and their values is a pathspec.
# Over-eager by design: an unrecognised flag-with-value reads as a pathspec and we skip.
REST=$(printf '%s' "$SEGMENT" | sed 's/^git[[:space:]]\+commit//')
if printf '%s\n' "$REST" | awk '
  BEGIN { skip = 0 }
  {
    n = split($0, t, /[[:space:]]+/)
    for (i = 1; i <= n; i++) {
      tok = t[i]
      if (tok == "") continue
      if (skip) { skip = 0; continue }
      # long flags carrying a value as a separate token
      if (tok ~ /^(--message|--file|--reuse-message|--reedit-message|--author|--date|--template|--cleanup|--fixup|--squash|--trailer|--pathspec-from-file|--gpg-sign)$/) { skip = 1; continue }
      # short flags carrying a value as a separate token
      if (tok ~ /^-[mFCctS]$/) { skip = 1; continue }
      if (tok ~ /^-/) continue          # any other flag, incl. --flag=value and -abc
      exit 1                            # a bare token → pathspec
    }
  }
'; then :; else exit 0; fi

# ── Nothing staged? Nothing to describe. (`git commit` would fail anyway.)
STAGED=$(git diff --cached --name-only 2>/dev/null | sed '/^$/d')
[ -z "$STAGED" ] && exit 0

LOG_DIR="PROJECT_MANIFEST.d"

# ── Loop-breaker, same rule as session-end.sh: if the staged set is ENTIRELY inside the
# log dir, this commit is itself a log commit and must not describe itself.
if ! printf '%s\n' "$STAGED" | grep -qv "^$LOG_DIR/"; then
  exit 0
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
SLUG=$(printf '%s' "$BRANCH" | tr -c 'A-Za-z0-9._-' '-')
[ -z "$SLUG" ] && SLUG="unknown-branch"
LOG_FILE="$LOG_DIR/${SLUG}.md"
mkdir -p "$LOG_DIR" 2>/dev/null || exit 0

PARENT=$(git rev-parse --short HEAD 2>/dev/null)
[ -z "$PARENT" ] && PARENT="(root commit)"

# ── Dedup: one entry per parent. A retried commit after a failure must not double up.
if [ -f "$LOG_FILE" ] && grep -q "Parent: \`$PARENT\`" "$LOG_FILE" 2>/dev/null; then
  exit 0
fi

DATE=$(date +"%Y-%m-%d %H:%M %Z")
AUTHOR=$(git config user.name 2>/dev/null)
[ -z "$AUTHOR" ] && AUTHOR="unknown"
CHANGED=$(printf '%s\n' "$STAGED" | sed 's/^/  - /')

if [ ! -f "$LOG_FILE" ]; then
  cat > "$LOG_FILE" <<EOF
# Session log — branch \`$BRANCH\`

_Per-session entries written by the Ironwood hooks. One file per branch so independent
branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

_Entries are written BEFORE the commit and ride inside it, so they record \`Parent\`
rather than their own SHA — the SHA does not exist yet. \`git log <parent>..\` finds the
commit an entry describes. Entries written late by the Stop-hook fallback carry
\`Commit\` instead._
EOF
fi

cat >> "$LOG_FILE" <<EOF

---
## Session — $DATE
- Branch: \`$BRANCH\`
- Parent: \`$PARENT\` — this entry rides IN the commit made on top of it
- Author: $AUTHOR
- Files changed:
$CHANGED
- Next recommended action: [Fill in next session: read this line, write what comes next]
EOF

# Stage it so it lands in the commit about to be made. If that commit then FAILS, the
# entry is left staged — visible in `git status`, and cleared with:
#     git restore --staged PROJECT_MANIFEST.d/ && git checkout -- PROJECT_MANIFEST.d/
git add "$LOG_FILE" 2>/dev/null

exit 0
