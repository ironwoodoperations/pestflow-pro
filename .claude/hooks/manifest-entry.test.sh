#!/bin/bash
# Guard tests for .claude/hooks/manifest-entry.sh.
#
# Run:  bash .claude/hooks/manifest-entry.test.sh      (exits non-zero on failure)
#
# Builds a throwaway git repo in mktemp, feeds the hook the same JSON shape Claude Code
# sends on PreToolUse, and asserts WRITE vs SKIP for each command shape. The guards are
# the point of this file: every one of them fails toward SKIPPING, because a missing
# entry is written late by the session-end.sh fallback while a WRONG entry in
# PROJECT_MANIFEST.d/ is read first by the next session and is effectively immortal.
#
# The end-to-end case is the one that proves the fix: the entry must land INSIDE the
# commit, leaving no PROJECT_MANIFEST.d path dirty and so requiring no chore commit.
T=$(mktemp -d); cd "$T" || exit 1
git init -q .; git config user.name "Test User"; git config user.email t@e.st
echo one > a.txt; git add a.txt; git commit -q -m base
cp "$(git -C "$OLDPWD" rev-parse --show-toplevel 2>/dev/null || echo /home/user/pestflow-pro)/.claude/hooks/manifest-entry.sh" ./hook.sh; chmod +x hook.sh
export CLAUDE_PROJECT_DIR="$T"
PASS=0; FAIL=0

reset_log() { [ -d PROJECT_MANIFEST.d ] && mv PROJECT_MANIFEST.d ".old.$RANDOM$RANDOM"; git reset -q; }

run() {
  reset_log
  echo "change $RANDOM" > b.txt; git add b.txt
  printf '{"tool_input":{"command":%s}}' "$(python3 -c 'import json,sys;print(json.dumps(sys.argv[1]))' "$2")" | ./hook.sh
  if [ -d PROJECT_MANIFEST.d ] && [ -n "$(ls PROJECT_MANIFEST.d 2>/dev/null)" ]; then got=WRITE; else got=SKIP; fi
  if [ "$got" = "$3" ]; then printf '  ok    %-44s %s\n' "$1" "$got"; PASS=$((PASS+1))
  else printf '  FAIL  %-44s got=%s want=%s\n' "$1" "$got" "$3"; FAIL=$((FAIL+1)); fi
}

echo "=== guards ==="
run "plain commit -m"              'git commit -m "msg"'                       WRITE
run "commit -F file (used here)"   'git commit -q -F /tmp/msg.txt'             WRITE
run "chained add && commit"        'git add -A && git commit -q -F /tmp/m.txt' WRITE
run "commit && push"               'git commit -q -m "x" && git push origin b' WRITE
run "GUARD1 --amend"               'git commit --amend --no-edit'              SKIP
run "GUARD1 --amend -m"            'git commit --amend -m "x"'                 SKIP
run "GUARD2 bare -- pathspec"      'git commit -m "x" -- src/foo.ts'           SKIP
run "GUARD2 implicit pathspec"     'git commit -m "x" src/foo.ts'              SKIP
run "GUARD2 -a"                    'git commit -a -m "x"'                      SKIP
run "GUARD2 --all"                 'git commit --all -m "x"'                   SKIP
run "not a commit: git push"       'git push -u origin main'                   SKIP
run "not a commit: echo"           'echo git commit -m hi'                     SKIP

echo "=== loop-breaker ==="
reset_log; mkdir -p PROJECT_MANIFEST.d; echo log > PROJECT_MANIFEST.d/x.md
git add PROJECT_MANIFEST.d/x.md; before=$(cat PROJECT_MANIFEST.d/x.md)
printf '{"tool_input":{"command":"git commit -m log"}}' | ./hook.sh
if [ "$(cat PROJECT_MANIFEST.d/x.md)" = "$before" ]; then echo "  ok    log-only staged set -> no entry"; PASS=$((PASS+1))
else echo "  FAIL  loop-breaker"; FAIL=$((FAIL+1)); fi

echo "=== dedup on parent ==="
reset_log; echo z > c.txt; git add c.txt
printf '{"tool_input":{"command":"git commit -m x"}}' | ./hook.sh
n1=$(grep -ch "^## Session" PROJECT_MANIFEST.d/*.md)
printf '{"tool_input":{"command":"git commit -m x"}}' | ./hook.sh
n2=$(grep -ch "^## Session" PROJECT_MANIFEST.d/*.md)
if [ "$n1" = 1 ] && [ "$n2" = 1 ]; then echo "  ok    re-run on same parent -> still 1 entry"; PASS=$((PASS+1))
else echo "  FAIL  dedup n1=$n1 n2=$n2"; FAIL=$((FAIL+1)); fi

echo "=== end-to-end ==="
reset_log; echo e2e > d.txt; git add d.txt
printf '{"tool_input":{"command":"git commit -m e2e"}}' | ./hook.sh
git commit -q -m e2e
echo "  commit contents:"; git show --name-only --format="" HEAD | sed 's/^/      /'
if git show --name-only --format="" HEAD | grep -q "^PROJECT_MANIFEST.d/"; then
  echo "  ok    entry rides INSIDE the commit"; PASS=$((PASS+1))
else echo "  FAIL  entry not in commit"; FAIL=$((FAIL+1)); fi
# The assertion that matters: the HOOK leaves nothing behind. Scratch files from
# earlier cases in this harness (b.txt, c.txt, hook.sh) are untracked by design and
# are not what is under test.
DIRTY=$(git status --porcelain -- PROJECT_MANIFEST.d)
if [ -z "$DIRTY" ]; then echo "  ok    no PROJECT_MANIFEST.d path left dirty -> no chore commit needed"; PASS=$((PASS+1))
else echo "  FAIL  manifest dirty: $DIRTY"; FAIL=$((FAIL+1)); fi
echo "  entry written:"; sed -n '/^## Session/,$p' PROJECT_MANIFEST.d/*.md | sed 's/^/      /'

echo; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" = 0 ]
