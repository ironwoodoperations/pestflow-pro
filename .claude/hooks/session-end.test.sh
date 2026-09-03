#!/usr/bin/env bash
# Guard tests for .claude/hooks/session-end.sh — S327's protected-branch skip.
#
# Run:  bash .claude/hooks/session-end.test.sh      (exits non-zero on failure)
#
# WHAT THIS PINS. On `main` the hook must write NOTHING: its entry there is unpushable
# (require-pr.sh blocks the branch) and duplicates a record the feature branch already
# carries. On a feature branch it must still write, because that is the fallback path for
# every commit shape manifest-entry.sh deliberately skips — losing that would trade one
# defect for a worse one.

HOOK="$(cd "$(dirname "$0")" && pwd)/session-end.sh"
PASS=0; FAIL=0
ok()  { printf '  ok    %-50s %s\n' "$1" "$2"; PASS=$((PASS+1)); }
bad() { printf '  FAIL  %-50s %s\n' "$1" "$2"; FAIL=$((FAIL+1)); }

mkrepo() {
  T=$(mktemp -d); cd "$T" || exit 1
  git init -q .; git config user.name T; git config user.email t@e.st
  git config commit.gpgsign false
  git symbolic-ref HEAD refs/heads/main
  echo one > a.txt; git add a.txt; git commit -q -m base
  # A second commit whose changed-set is NOT log-only, so the loop-breaker does not fire
  # and we are genuinely testing the branch guard rather than an unrelated skip.
  echo two > b.txt; git add b.txt; git commit -q -m work
  export CLAUDE_PROJECT_DIR="$T"
}
wrote() { [ -d "$T/PROJECT_MANIFEST.d" ] && [ -n "$(ls "$T/PROJECT_MANIFEST.d" 2>/dev/null)" ]; }

echo "=== the protected-branch skip ==="
mkrepo
bash "$HOOK" >/dev/null 2>&1
if wrote; then bad "on main -> writes nothing" "wrote $(ls "$T/PROJECT_MANIFEST.d")"; else ok "on main -> writes nothing" "SKIP"; fi

mkrepo; git checkout -q -b feature/x
bash "$HOOK" >/dev/null 2>&1
if wrote; then ok "on a feature branch -> still writes" "$(ls "$T/PROJECT_MANIFEST.d")"
else bad "on a feature branch -> still writes" "the fallback path was lost"; fi

# Not vacuous: prove the feature-branch write is a real entry, not an empty header.
if [ -n "${T:-}" ] && grep -q "^- Commit: " "$T/PROJECT_MANIFEST.d/feature-x.md" 2>/dev/null; then
  ok "the feature-branch entry has real content" "Commit: line present"
else bad "the feature-branch entry has real content" "no Commit: line"; fi

# And that the slug is derived from the CURRENT branch, not stale state — the thing the
# S327 brief asked to check. feature/x -> feature-x.
if [ -f "$T/PROJECT_MANIFEST.d/feature-x.md" ]; then ok "slug comes from the current branch" "feature/x -> feature-x.md"
else bad "slug comes from the current branch" "got: $(ls "$T/PROJECT_MANIFEST.d")"; fi

echo "=== mutation: remove the guard and main must start writing again ==="
# Proves the skip is what causes the SKIP, rather than some unrelated earlier exit.
mkrepo
sed '/^case "\$BRANCH" in$/,/^esac$/d' "$HOOK" > "$T/mutated.sh"
bash "$T/mutated.sh" >/dev/null 2>&1
if wrote; then ok "guard removed -> main writes again" "confirms the guard is load-bearing"
else bad "guard removed -> main writes again" "still skipped: the SKIP was NOT the guard"; fi

echo
echo "  pass=$PASS fail=$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
