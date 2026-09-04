#!/usr/bin/env python3
"""Post-deploy assertion: deployed verify_jwt == supabase/config.toml (the SSOT).

Reads the consumer list (.github/edge-shared-consumers.txt) and the per-function
verify_jwt pins from supabase/config.toml, then queries the Supabase Management API
for the *deployed* verify_jwt of each consumer and fails (exit 1) on any mismatch or
missing function. This is what eliminates split-state: config.toml is authoritative
and CI proves the platform actually matches it after a deploy.

═══ WHAT THIS ASSERTS, AND WHAT IT DELIBERATELY DOES NOT (S337) ═══

IT ASSERTS: for every consumer, the verify_jwt the PLATFORM reports equals the
value pinned in config.toml, and every consumer has an explicit pin.

IT DOES **NOT** ASSERT that a consumer was deployed in this run, or that its
version number incremented. That distinction is load-bearing, not pedantry.
When a function's bundle already matches the tree, the CLI prints
"No change found" and skips it without creating a new version — which is
CORRECT behaviour, not a failure. On 2026-09-04 exactly that happened to
zernio-analytics and post-to-social (both deployed from a Codespace during
S329, both already current). A "version incremented" or "deployed in this run"
assertion would have failed on those two while nothing whatsoever was wrong.
A skipped function is still deployed, still listed by the API, and still
carries a verify_jwt — so the comparison below covers it exactly like any
other. verify_verify_jwt_test.py pins this property so it cannot regress.

Env:
  SUPABASE_ACCESS_TOKEN  Management API token (required)
  PROJECT_REF            Project ref (required)
"""
import json
import os
import sys
import tomllib
import urllib.error
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CONSUMERS_FILE = os.path.join(REPO, ".github", "edge-shared-consumers.txt")
CONFIG_FILE = os.path.join(REPO, "supabase", "config.toml")

# ═══ WHY THIS HEADER EXISTS — S337, and do not remove it ═══════════════════
#
# The Management API sits behind Cloudflare. urllib's DEFAULT User-Agent is
# "Python-urllib/3.x", and Cloudflare refuses it at the edge with
#
#     HTTP 403, body: "error code: 1010"
#
# 1010 is Cloudflare's browser-signature block. It is applied at the edge,
# BEFORE the request reaches Supabase, which is why the response body is that
# bare string instead of the JSON Supabase itself returns for auth errors.
#
# The evidence this is a client-fingerprint block and not an auth problem:
# in the SAME workflow run, forty seconds earlier, the Supabase CLI performed
# fourteen successful deploys against this same host with this same token. The
# token and the endpoint were fine; only this script's request was refused, and
# the only thing distinguishing it was the client fingerprint.
#
# So the script names itself. Any explicit, non-default UA satisfies the edge.
USER_AGENT = "pestflow-pro-ci-verify-jwt/1.0 (+github-actions)"
API_HEADERS = {"User-Agent": USER_AGENT, "Accept": "application/json"}


def load_consumers() -> list[str]:
    fns: list[str] = []
    with open(CONSUMERS_FILE, encoding="utf-8") as fh:
        for line in fh:
            line = line.split("#", 1)[0].strip()
            if line:
                fns.append(line)
    return fns


def load_expected(consumers: list[str]) -> dict[str, bool]:
    with open(CONFIG_FILE, "rb") as fh:
        cfg = tomllib.load(fh)
    functions = cfg.get("functions", {})
    expected: dict[str, bool] = {}
    missing: list[str] = []
    for fn in consumers:
        entry = functions.get(fn)
        # Absent or unspecified verify_jwt → CLI default is TRUE; a consumer that
        # relies on the default is exactly the drift this guard exists to catch.
        if not entry or "verify_jwt" not in entry:
            missing.append(fn)
        else:
            expected[fn] = bool(entry["verify_jwt"])
    if missing:
        print(
            "::error::config.toml is missing an explicit [functions.<name>].verify_jwt "
            "for: " + ", ".join(missing) + ". Add each so config.toml stays the SSOT "
            "(no reliance on the CLI default).",
            file=sys.stderr,
        )
        sys.exit(1)
    return expected


def diagnose_http_error(code: int, body: str) -> str:
    """Turn an opaque HTTP failure into something the next reader can act on.

    The 1010 case cost a full session to identify precisely because the message
    was four words with no context. Never again: say what it means and what to
    check, and do NOT let it be mistaken for an auth failure.
    """
    if "error code: 1010" in body:
        return (
            "Cloudflare refused the request at the EDGE (1010 = browser-signature "
            "block) — this is NOT an auth failure and NOT a bad token. Something "
            f"stripped or changed the User-Agent (expected {USER_AGENT!r}). "
            "See the header note in this script."
        )
    if code in (401, 403) and body.strip().startswith("{"):
        return (
            "The API itself rejected the credentials (JSON error body). Check that "
            "SUPABASE_ACCESS_TOKEN is set, unexpired, and scoped to this project."
        )
    if code in (401, 403):
        return (
            "Refused with a non-JSON body, so this most likely came from an edge "
            "proxy rather than Supabase. Compare against whether the CLI steps in "
            "the same run succeeded: if they did, the token is fine and the "
            "difference is in THIS request."
        )
    return "Unexpected Management API failure."


def fetch_deployed(token: str, project_ref: str) -> dict[str, bool]:
    url = f"https://api.supabase.com/v1/projects/{project_ref}/functions"
    headers = dict(API_HEADERS)
    headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:  # pragma: no cover - network path
        body = exc.read().decode("utf-8", "replace")
        print(f"::error::Management API {exc.code}: {body.strip() or '(empty body)'}", file=sys.stderr)
        print(f"::error::{diagnose_http_error(exc.code, body)}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as exc:  # pragma: no cover - network path
        print(f"::error::Could not reach the Management API: {exc.reason}", file=sys.stderr)
        sys.exit(1)
    return {f["slug"]: bool(f.get("verify_jwt")) for f in data if "slug" in f}


def compare(
    consumers: list[str],
    expected: dict[str, bool],
    deployed: dict[str, bool],
) -> tuple[list[str], list[str]]:
    """Pure comparison. Returns (mismatches, ok_lines).

    Extracted from main() so the assertion can be exercised in ordinary CI
    against fixture data — a guard whose logic only ever runs against the live
    platform is a guard nobody can test.

    NOTE the shape: this reads only `deployed[fn]`, the CURRENT platform value.
    It never looks at a version number or at whether this run deployed the
    function, which is what makes a "No change found" skip pass correctly.
    """
    mismatches: list[str] = []
    ok_lines: list[str] = []
    for fn in consumers:
        want = expected[fn]
        got = deployed.get(fn)
        if got is None:
            mismatches.append(f"{fn}: NOT DEPLOYED (expected verify_jwt={want})")
        elif got != want:
            mismatches.append(f"{fn}: deployed verify_jwt={got} != config.toml {want}")
        else:
            ok_lines.append(f"ok  {fn}: verify_jwt={got}")
    return mismatches, ok_lines


def main() -> int:
    token = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
    project_ref = os.environ.get("PROJECT_REF", "")
    if not token or not project_ref:
        print("::error::SUPABASE_ACCESS_TOKEN and PROJECT_REF are required.", file=sys.stderr)
        return 1

    consumers = load_consumers()
    expected = load_expected(consumers)
    deployed = fetch_deployed(token, project_ref)

    mismatches, ok_lines = compare(consumers, expected, deployed)
    for line in ok_lines:
        print(line)

    if mismatches:
        for m in mismatches:
            print(f"::error::{m}", file=sys.stderr)
        print(f"\n{len(mismatches)} verify_jwt mismatch(es) — deploy state disagrees with config.toml.", file=sys.stderr)
        return 1

    print(f"\nAll {len(consumers)} consumers match config.toml verify_jwt.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
