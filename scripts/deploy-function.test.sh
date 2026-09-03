#!/usr/bin/env bash
# Guard tests for scripts/deploy-function.sh.
#
# Run:  bash scripts/deploy-function.test.sh      (exits non-zero on failure)
#
# EACH REFUSAL IS EXERCISED ON ITS OWN. A guard tested only on the happy path is not
# tested, and a guard tested only in aggregate can pass while refusing for the WRONG
# reason — which is indistinguishable from working right up until the day it matters.
# So every case below asserts the refusal REASON, not merely a non-zero exit.
#
# Each case builds a throwaway repo in mktemp with a real `origin` (a bare repo on disk),
# so `git fetch` and origin/main are genuine rather than mocked. The supabase CLI is
# stubbed through PESTFLOW_SUPABASE_BIN and records its argv, which is what lets the
# PERMIT cases prove the caller's flags survive the wrapper.

SCRIPT="$(cd "$(dirname "$0")" && pwd)/deploy-function.sh"
PASS=0; FAIL=0

ok()   { printf '  ok    %-52s %s\n' "$1" "$2"; PASS=$((PASS+1)); }
bad()  { printf '  FAIL  %-52s %s\n' "$1" "$2"; FAIL=$((FAIL+1)); }

# Build a repo whose state is clean-and-in-sync, with a stub CLI on hand.
mkrepo() {
  T=$(mktemp -d)
  git init -q --bare "$T/origin.git"
  git init -q "$T/work"
  cd "$T/work" || exit 1
  git config user.name  "Test User"
  git config user.email t@e.st
  git config commit.gpgsign false
  git symbolic-ref HEAD refs/heads/main
  mkdir -p supabase/functions/demo-fn
  echo 'export const x = 1' > supabase/functions/demo-fn/index.ts
  git add -A; git commit -q -m base
  git remote add origin "$T/origin.git"
  git push -q -u origin main 2>/dev/null
  # Stub CLI: records argv so a PERMIT can be proven to reach it intact.
  cat > "$T/supabase-stub" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" > "$STUB_ARGV_OUT"
# ARGC as well as the joined string: "$*" flattens argv, so it CANNOT distinguish one
# argument containing a space from two arguments. The %q-quoting case below needs that
# distinction, and without it the quoting is untested (it was — a mutation proved it).
printf '%s\n' "$#" > "$STUB_ARGV_OUT.n"
exit 0
STUB
  chmod +x "$T/supabase-stub"
  export PESTFLOW_SUPABASE_BIN="$T/supabase-stub"
  export STUB_ARGV_OUT="$T/argv.txt"
  : > "$STUB_ARGV_OUT"
}

# run <case> <want: REFUSE|PERMIT> <want-reason-substring>
run() {
  local name="$1" want="$2" reason="${3:-}"
  local out rc
  out=$(bash "$SCRIPT" demo-fn --project-ref abc --no-verify-jwt 2>&1); rc=$?
  if [ "$want" = "PERMIT" ]; then
    if [ $rc -eq 0 ]; then ok "$name" "PERMIT"; else bad "$name" "wanted PERMIT, exit=$rc"; fi
    return
  fi
  if [ $rc -eq 0 ]; then bad "$name" "wanted REFUSE, but it permitted"; return; fi
  # A refusal for the WRONG reason is a failure. This is the assertion with teeth.
  if printf '%s' "$out" | grep -qF "$reason"; then ok "$name" "REFUSE ($reason)"
  else bad "$name" "refused, but not for '$reason' — got: $(printf '%s' "$out" | grep REFUSED | head -1)"; fi
}

echo "=== the four refusal conditions, each on its own ==="

# 1. not on main
mkrepo; git checkout -q -b feature/x
run "CHECK 1  branch is not main" REFUSE "not main"

# 2. fetch fails (origin points somewhere that does not exist)
mkrepo; git remote set-url origin "$T/does-not-exist.git"
run "CHECK 2  git fetch fails" REFUSE "git fetch failed"

# 3. local behind the remote
mkrepo
# --branch main, NOT a bare clone: `git init --bare` leaves HEAD on refs/heads/master,
# so a plain clone lands on an empty master and the commit below silently never happens —
# which made this case report PERMIT for the wrong reason on the first run.
git clone -q --branch main "$T/origin.git" "$T/other"; ( cd "$T/other"; git config user.email t@e.st; git config user.name T
  echo 'export const y = 2' > supabase/functions/demo-fn/index.ts; git add -A; git commit -q -m remote-move; git push -q origin main )
run "CHECK 3  local behind origin/main" REFUSE "does not match origin/main"

# 3b. local AHEAD of the remote (committed but unpushed — also unreviewed)
mkrepo; echo 'export const z = 3' > supabase/functions/demo-fn/index.ts
git add -A; git commit -q -m local-only
run "CHECK 3  local ahead of origin/main" REFUSE "does not match origin/main"

# 4. uncommitted edge-function changes
mkrepo; echo 'export const dirty = 1' >> supabase/functions/demo-fn/index.ts
run "CHECK 4  uncommitted supabase/functions change" REFUSE "uncommitted changes under supabase/functions/"

# 4b. untracked new function file also counts
mkrepo; echo 'export const nue = 1' > supabase/functions/demo-fn/new-file.ts
run "CHECK 4  untracked file under supabase/functions" REFUSE "uncommitted changes under supabase/functions/"

echo "=== the clean case permits, and the CLI gets the real args ==="
mkrepo
run "clean, in-sync main" PERMIT
if [ "$(cat "$STUB_ARGV_OUT")" = "functions deploy demo-fn --project-ref abc --no-verify-jwt" ]; then
  ok "args reach the CLI unmangled" "$(cat "$STUB_ARGV_OUT")"
else
  bad "args reach the CLI unmangled" "got: $(cat "$STUB_ARGV_OUT")"
fi

echo "=== scope: dirt OUTSIDE supabase/functions must NOT refuse ==="
# A guard that refuses for irrelevant reasons gets forced past habitually, which costs
# the refusals that matter. src/ churn has no bearing on the bundle.
mkrepo; mkdir -p src; echo 'irrelevant' > src/unrelated.ts
run "dirty src/ only" PERMIT

echo "=== the escape hatch ==="
mkrepo; git checkout -q -b feature/x
out=$(PESTFLOW_DEPLOY_FORCE=1 bash "$SCRIPT" demo-fn --project-ref abc 2>&1); rc=$?
if [ $rc -eq 0 ]; then ok "FORCE=1 permits a state that would refuse" "exit 0"
else bad "FORCE=1 permits" "exit=$rc"; fi
if printf '%s' "$out" | grep -q "FRESHNESS CHECKS OVERRIDDEN"; then ok "FORCE=1 warns loudly" "banner shown"
else bad "FORCE=1 warns loudly" "no banner"; fi
if printf '%s' "$out" | grep -qi "403'd every tenant"; then ok "FORCE=1 warning names the real outage" "cites api-quote"
else bad "FORCE=1 names the outage" "generic warning only"; fi
# The hatch must never be the default.
mkrepo; git checkout -q -b feature/x
if bash "$SCRIPT" demo-fn --project-ref abc >/dev/null 2>&1; then bad "FORCE is not the default" "permitted without it"
else ok "FORCE is not the default" "still refuses"; fi
# FORCE on an already-clean tree must not print the scary banner.
mkrepo
out=$(PESTFLOW_DEPLOY_FORCE=1 bash "$SCRIPT" demo-fn --project-ref abc 2>&1)
if printf '%s' "$out" | grep -q "OVERRIDDEN"; then bad "FORCE on a clean tree stays quiet" "banner shown anyway"
else ok "FORCE on a clean tree stays quiet" "no banner"; fi

echo "=== the emergency-override line must be RUNNABLE, not merely present ==="
# S328. The pre-existing escape-hatch cases asserted that a BANNER APPEARED. They passed
# for months while the line someone actually copies was unusable: refuse() printed `$*`,
# which inside a shell function is THAT FUNCTION's parameters — the reason and fix PROSE —
# so the command named the prose instead of demo-fn. Worse, the fix text ends in
# `git checkout main && git pull origin main`, so pasting it ran a checkout and a pull.
#
# The only assertion that can tell a runnable command from a plausible-looking one is to
# EXECUTE it, so that is what this does.
mkrepo; git checkout -q -b feature/x
out=$(bash "$SCRIPT" demo-fn --project-ref abc --no-verify-jwt 2>&1)
line=$(printf '%s\n' "$out" | grep -F 'PESTFLOW_DEPLOY_FORCE=1' | tail -1 | sed 's/^[[:space:]]*//')

# 1. It names the function and every flag the caller passed.
if printf '%s' "$line" | grep -qF 'demo-fn' \
   && printf '%s' "$line" | grep -qF -- '--project-ref abc' \
   && printf '%s' "$line" | grep -qF -- '--no-verify-jwt'; then
  ok "override line names the function and its args" "demo-fn + both flags"
else
  bad "override line names the function and its args" "got: $line"
fi

# 2. It carries NO prose. This is the assertion that fails on the old `$*` bug, and it
#    names the shell-metacharacter hazard specifically rather than just "looks wrong".
if printf '%s' "$line" | grep -qE "not main|Production functions|git checkout|git pull|&&"; then
  bad "override line carries no prose or stray shell operators" "got: $line"
else
  ok "override line carries no prose or stray shell operators" "command only"
fi

# 3. IT ACTUALLY RUNS, and the CLI receives the caller's argv intact. Nothing short of
#    executing it distinguishes a correct line from a well-shaped wrong one.
: > "$STUB_ARGV_OUT"
if eval "$line" >/dev/null 2>&1 \
   && [ "$(cat "$STUB_ARGV_OUT")" = "functions deploy demo-fn --project-ref abc --no-verify-jwt" ]; then
  ok "override line executes and reaches the CLI" "$(cat "$STUB_ARGV_OUT")"
else
  bad "override line executes and reaches the CLI" "got: $(cat "$STUB_ARGV_OUT")"
fi

# 4. An argument containing a SPACE must survive as ONE argument. This is what makes the
#    %q quoting load-bearing: without it the override line word-splits on paste and the CLI
#    silently receives an extra argument. Asserted on ARGC, because the joined "$*" string
#    is identical either way — a mutation dropping %q passed every other case here.
mkrepo; git checkout -q -b feature/x
out=$(bash "$SCRIPT" demo-fn --project-ref abc "--weird arg" 2>&1)
line=$(printf '%s\n' "$out" | grep -F 'PESTFLOW_DEPLOY_FORCE=1' | tail -1 | sed 's/^[[:space:]]*//')
: > "$STUB_ARGV_OUT"; : > "$STUB_ARGV_OUT.n"
eval "$line" >/dev/null 2>&1
if [ "$(cat "$STUB_ARGV_OUT.n" 2>/dev/null)" = "6" ]; then
  ok "override line keeps a spaced argument intact" "argc=6"
else
  bad "override line keeps a spaced argument intact" "argc=$(cat "$STUB_ARGV_OUT.n" 2>/dev/null) (want 6, split=7)"
fi

echo "=== argument handling ==="
mkrepo
if bash "$SCRIPT" >/dev/null 2>&1; then bad "no function name -> usage" "exit 0"; else ok "no function name -> usage" "non-zero"; fi
out=$(bash "$SCRIPT" not-a-real-function 2>&1) || true
if printf '%s' "$out" | grep -q "no such function"; then ok "unknown function name is caught" "REFUSE"
else bad "unknown function name" "got: $out"; fi

echo
echo "  pass=$PASS fail=$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
