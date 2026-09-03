#!/usr/bin/env bash
# S327 — THE PRE-DEPLOY FRESHNESS GUARD.
#
# WHY THIS EXISTS. Three deploys on 2026-09-02 shipped stale code because the Codespace
# working tree lagged the merged remote. The CLI reported success every time and the
# wrong bytes went live:
#
#   1. api-quote        — deployed an origin allowlist MISSING `.ai`. Every .ai tenant
#                         403'd on lead capture, platform-wide, silently, with the
#                         function reading ACTIVE. Found only by reading the deployed
#                         bundle against the repo.
#   2. provision-tenant — deployed pre-S326 code; the password-reset footgun stayed live.
#   3. provision-tenant — again, from a tree FOUR merged PRs behind.
#
# The pattern is identical each time: merge on GitHub, deploy from Codespace, no pull in
# between. `supabase functions deploy` has no idea what the remote contains, so it cannot
# tell you. This wrapper can.
#
# A WRAPPER, NOT AN OPTIONAL PREFLIGHT. A check you have to remember is skipped exactly
# when someone is in a hurry, which is the state all three failures happened in. The only
# documented deploy path is this script: every edge function's `Deploy:` header now names
# it, and those headers are what actually gets copy-pasted.
#
# FAILS CLOSED. Anything it cannot prove is a refusal, not a warning — including a failed
# `git fetch`, where the honest state is "freshness unknown". A guard that shrugs when the
# network is down is a guard that is off exactly when a deploy is riskiest.
#
# WHAT IS DELIBERATELY NOT WRAPPED: .github/workflows/redeploy-edge-on-shared-change.yml.
# It deploys from a GitHub Actions checkout of the pushed `main` SHA, which BY
# CONSTRUCTION cannot lag the merged remote — the failure mode this guard exists for is
# unreachable there. Wrapping it would also break it outright: Actions checks out a
# detached HEAD, so `git rev-parse --abbrev-ref HEAD` yields `HEAD` and CHECK 1 would
# refuse every run. That workflow additionally passes NO verify_jwt flag on purpose
# (supabase/config.toml is the single source of truth for it), a stricter contract than
# the manual path. Leave it alone.
#
# AND IT SAYS WHY. Every refusal prints what differs and the exact command that fixes it.
# A guard that says "no" without saying why gets bypassed inside a week, and then the
# outage above happens again with an extra step in front of it.

set -euo pipefail

# The CLI is invoked through this seam so the test suite can substitute a stub that
# records its argv. Without it the tests could prove the refusals but not that a PERMIT
# actually reaches the CLI with the caller's flags intact — and passing `--no-verify-jwt`
# through unmangled is load-bearing for api-quote and provision-tenant.
SUPABASE_BIN="${PESTFLOW_SUPABASE_BIN:-supabase}"

# The escape hatch is an ENV VAR, deliberately, not a `--force` flag. A flag would have to
# be stripped from the args before they reach the CLI, and the day that stripping breaks
# it forwards `--force` to `supabase functions deploy`, which has its own meaning for it.
# An env var cannot collide with the CLI's argument grammar, and it does not survive being
# copy-pasted out of a header the way a flag does.
FORCE="${PESTFLOW_DEPLOY_FORCE:-0}"

RED=''; YEL=''; BLD=''; RST=''
if [ -t 2 ]; then RED=$'\033[31m'; YEL=$'\033[33m'; BLD=$'\033[1m'; RST=$'\033[0m'; fi

FN="${1:-}"

usage() {
  cat >&2 <<USAGE
usage: scripts/deploy-function.sh <function-name> [supabase args...]

  Runs the freshness checks, then execs:
      ${SUPABASE_BIN} functions deploy <function-name> [supabase args...]

  Every argument after the function name is passed through untouched, so the
  --project-ref and --no-verify-jwt in each function's Deploy: header still apply.

  Emergency override (prints a loud warning, never the default):
      PESTFLOW_DEPLOY_FORCE=1 scripts/deploy-function.sh <function-name> ...
USAGE
}

refuse() {
  # $1 = which check, $2 = what differs, $3 = the exact fix
  printf '%s\n' "${RED}${BLD}REFUSED — $1${RST}" >&2
  printf '%s\n' "" >&2
  printf '%s\n' "  $2" >&2
  printf '%s\n' "" >&2
  printf '%s\n' "  ${BLD}Fix:${RST}" >&2
  printf '%s\n' "$3" | sed 's/^/    /' >&2
  printf '%s\n' "" >&2
  printf '%s\n' "  Deploying anyway (emergency only — you are shipping unreviewed bytes):" >&2
  printf '%s\n' "    PESTFLOW_DEPLOY_FORCE=1 $0 $*" >&2
  exit 1
}

[ -z "$FN" ] && { usage; exit 2; }
case "$FN" in -h|--help) usage; exit 0 ;; esac

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
  printf '%s\n' "${RED}${BLD}REFUSED — not a git repository${RST}" >&2
  printf '%s\n' "  Run this from inside the pestflow-pro checkout." >&2
  exit 1
}
cd "$ROOT"

[ -d "supabase/functions/$FN" ] || {
  printf '%s\n' "${RED}${BLD}REFUSED — no such function: $FN${RST}" >&2
  printf '%s\n' "  supabase/functions/$FN does not exist." >&2
  printf '%s\n' "  Available: $(find supabase/functions -mindepth 1 -maxdepth 1 -type d -printf '%f ' 2>/dev/null)" >&2
  exit 1
}

FAILED=0
note() { FAILED=1; }

# ── CHECK 1: the branch. Deploying a feature branch to production is not something
# anyone should be able to do by accident, and it is the one condition visible without
# touching the network — so it is checked first and named plainly.
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
if [ "$BRANCH" != "main" ]; then
  note
  [ "$FORCE" != "1" ] && refuse \
    "on branch '$BRANCH', not main" \
    "Production functions deploy from main. This checkout is on '$BRANCH', whose code has not been reviewed or merged." \
    "git checkout main && git pull origin main"
fi

# ── CHECK 2: fetch must succeed. An unknown remote state is a REFUSAL, not a warning:
# without a successful fetch, check 3 would compare against a stale origin/main ref and
# report "in sync" for a tree that is days behind. That false green is worse than no check.
FETCH_ERR=""
if ! FETCH_ERR=$(git fetch origin "$BRANCH" 2>&1); then
  note
  [ "$FORCE" != "1" ] && refuse \
    "git fetch failed — freshness cannot be proven" \
    "$(printf '%s' "$FETCH_ERR" | head -3)" \
    "Check the network / credentials, then re-run. Do not deploy on an unverified tree."
fi

# ── CHECK 3: local HEAD vs the merged remote. THE ONE THAT WOULD HAVE CAUGHT ALL THREE.
LOCAL=$(git rev-parse HEAD 2>/dev/null || echo "")
REMOTE=$(git rev-parse "origin/$BRANCH" 2>/dev/null || echo "")
if [ -z "$REMOTE" ]; then
  note
  [ "$FORCE" != "1" ] && refuse \
    "no origin/$BRANCH to compare against" \
    "The remote branch does not exist, so 'up to date' is unprovable." \
    "git push -u origin $BRANCH   # if this branch is meant to exist remotely"
fi
if [ "$LOCAL" != "$REMOTE" ]; then
  BEHIND=$(git rev-list --count "HEAD..origin/$BRANCH" 2>/dev/null || echo "?")
  AHEAD=$(git rev-list --count "origin/$BRANCH..HEAD" 2>/dev/null || echo "?")
  note
  [ "$FORCE" != "1" ] && refuse \
    "local checkout does not match origin/$BRANCH" \
    "$(printf 'behind by %s commit(s), ahead by %s\n  local  HEAD        %s\n  remote origin/%s %s' \
        "$BEHIND" "$AHEAD" "${LOCAL:0:12}" "$BRANCH" "${REMOTE:0:12}")

  This is the exact condition that shipped stale api-quote and provision-tenant bytes." \
    "git pull origin $BRANCH"
fi

# ── CHECK 4: uncommitted edge-function changes. Scoped to supabase/functions/** on
# purpose — an unrelated dirty file in src/ has no bearing on what the CLI is about to
# bundle, and a guard that refuses for irrelevant reasons is one that gets forced past
# habitually, which costs the refusals that matter.
DIRTY=$(git status --porcelain -- supabase/functions 2>/dev/null || echo "")
if [ -n "$DIRTY" ]; then
  note
  [ "$FORCE" != "1" ] && refuse \
    "uncommitted changes under supabase/functions/" \
    "$(printf 'These are NOT on the remote, so they are not reviewed — but the CLI WOULD bundle them:\n%s' \
        "$(printf '%s' "$DIRTY" | sed 's/^/    /')")" \
    "git add supabase/functions && git commit && open a PR
    # or, to discard them:  git checkout -- supabase/functions"
fi

if [ "$FORCE" = "1" ] && [ "$FAILED" = "1" ]; then
  printf '%s\n' "${YEL}${BLD}" >&2
  printf '%s\n' "  ############################################################" >&2
  printf '%s\n' "  #  PESTFLOW_DEPLOY_FORCE=1 — FRESHNESS CHECKS OVERRIDDEN   #" >&2
  printf '%s\n' "  #                                                          #" >&2
  printf '%s\n' "  #  One or more checks FAILED and are being ignored.        #" >&2
  printf '%s\n' "  #  You may be shipping code that is not on the remote,     #" >&2
  printf '%s\n' "  #  from a branch nobody reviewed. This is how api-quote    #" >&2
  printf '%s\n' "  #  went live without '.ai' and 403'd every tenant.         #" >&2
  printf '%s\n' "  #                                                          #" >&2
  printf '%s\n' "  #  Verify the DEPLOYED bundle afterwards. Do not trust     #" >&2
  printf '%s\n' "  #  the CLI's success message — it was green all three      #" >&2
  printf '%s\n' "  #  times.                                                  #" >&2
  printf '%s\n' "  ############################################################" >&2
  printf '%s\n' "${RST}" >&2
fi

if [ "$FAILED" = "0" ]; then
  printf '%s\n' "  ok  branch=main  in sync with origin/main ($(printf '%s' "$LOCAL" | cut -c1-12))  supabase/functions clean" >&2
fi

exec "$SUPABASE_BIN" functions deploy "$@"
