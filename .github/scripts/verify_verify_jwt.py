#!/usr/bin/env python3
"""Post-deploy assertion: deployed verify_jwt == supabase/config.toml (the SSOT).

Reads the consumer list (.github/edge-shared-consumers.txt) and the per-function
verify_jwt pins from supabase/config.toml, then queries the Supabase Management API
for the *deployed* verify_jwt of each consumer and fails (exit 1) on any mismatch or
missing function. This is what eliminates split-state: config.toml is authoritative
and CI proves the platform actually matches it after a deploy.

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


def fetch_deployed(token: str, project_ref: str) -> dict[str, bool]:
    url = f"https://api.supabase.com/v1/projects/{project_ref}/functions"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:  # pragma: no cover - network path
        print(f"::error::Management API {exc.code}: {exc.read().decode('utf-8', 'replace')}", file=sys.stderr)
        sys.exit(1)
    return {f["slug"]: bool(f.get("verify_jwt")) for f in data if "slug" in f}


def main() -> int:
    token = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
    project_ref = os.environ.get("PROJECT_REF", "")
    if not token or not project_ref:
        print("::error::SUPABASE_ACCESS_TOKEN and PROJECT_REF are required.", file=sys.stderr)
        return 1

    consumers = load_consumers()
    expected = load_expected(consumers)
    deployed = fetch_deployed(token, project_ref)

    mismatches: list[str] = []
    for fn in consumers:
        want = expected[fn]
        got = deployed.get(fn)
        if got is None:
            mismatches.append(f"{fn}: NOT DEPLOYED (expected verify_jwt={want})")
        elif got != want:
            mismatches.append(f"{fn}: deployed verify_jwt={got} != config.toml {want}")
        else:
            print(f"ok  {fn}: verify_jwt={got}")

    if mismatches:
        for m in mismatches:
            print(f"::error::{m}", file=sys.stderr)
        print(f"\n{len(mismatches)} verify_jwt mismatch(es) — deploy state disagrees with config.toml.", file=sys.stderr)
        return 1

    print(f"\nAll {len(consumers)} consumers match config.toml verify_jwt.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
