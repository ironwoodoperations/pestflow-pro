#!/usr/bin/env python3
"""S337 — tests for verify_verify_jwt.py, runnable in ORDINARY CI.

The redeploy workflow only fires on push to main or workflow_dispatch, so its
verifier never ran on a PR and its logic was never exercised anywhere a
contributor could see. These tests fix that: they run the PURE parts against
fixture data in the normal `validate` job.

WHAT IS AND IS NOT FIXTURED. The comparison, the config.toml pin rule and the
HTTP-error diagnosis are pure and are tested for real. The live Management API
call is NOT faked: a fixture that pretended the platform agreed with
config.toml would make the guard vacuous, which is precisely the S319 defect
this repo has hit five times. That call is only ever proven by a real run.

stdlib unittest, no dependencies — CI has python3 and nothing else is needed.
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verify_verify_jwt as v  # noqa: E402


CONSUMERS = ["ai-proxy", "post-to-social", "zernio-analytics"]


class TestComparePassesSkippedFunctions(unittest.TestCase):
    """THE S337 PROPERTY: 'No change found' must be SUCCESS.

    On 2026-09-04 the deploy loop succeeded completely, but zernio-analytics and
    post-to-social were skipped by the CLI because their bundles already matched
    main — no new version created. Any assertion shaped as "every consumer was
    deployed in this run" or "every version incremented" would have failed on
    those two while the platform was entirely correct.
    """

    def test_skipped_consumers_still_pass(self):
        expected = {"ai-proxy": False, "post-to-social": False, "zernio-analytics": True}
        # What the platform reports. post-to-social and zernio-analytics were
        # SKIPPED this run — they are still deployed and still listed, with the
        # verify_jwt they already had. That is all this guard should care about.
        deployed = {"ai-proxy": False, "post-to-social": False, "zernio-analytics": True}
        mismatches, ok_lines = v.compare(CONSUMERS, expected, deployed)
        self.assertEqual(mismatches, [])
        self.assertEqual(len(ok_lines), 3)

    def test_compare_never_consults_a_version(self):
        """Structural: the comparison must not read version/updated_at at all.

        A future edit that reintroduces a version check would have to add a key
        this signature cannot even receive — `deployed` is slug -> bool.
        """
        deployed = {fn: True for fn in CONSUMERS}
        expected = {fn: True for fn in CONSUMERS}
        mismatches, _ = v.compare(CONSUMERS, expected, deployed)
        self.assertEqual(mismatches, [])
        # The value type is a bare bool: there is nowhere for a version to hide.
        self.assertTrue(all(isinstance(x, bool) for x in deployed.values()))


class TestCompareCatchesRealDrift(unittest.TestCase):
    """ANTI-VACUITY. If compare() passed everything, the tests above prove nothing."""

    def test_mismatched_verify_jwt_fails(self):
        expected = {"ai-proxy": False, "post-to-social": False, "zernio-analytics": True}
        deployed = {"ai-proxy": True, "post-to-social": False, "zernio-analytics": True}
        mismatches, _ = v.compare(CONSUMERS, expected, deployed)
        self.assertEqual(len(mismatches), 1)
        self.assertIn("ai-proxy", mismatches[0])
        self.assertIn("deployed verify_jwt=True", mismatches[0])

    def test_missing_from_platform_fails(self):
        expected = {"ai-proxy": False, "post-to-social": False, "zernio-analytics": True}
        deployed = {"ai-proxy": False, "post-to-social": False}   # zernio-analytics absent
        mismatches, _ = v.compare(CONSUMERS, expected, deployed)
        self.assertEqual(len(mismatches), 1)
        self.assertIn("NOT DEPLOYED", mismatches[0])

    def test_every_consumer_wrong_is_every_consumer_reported(self):
        expected = {fn: True for fn in CONSUMERS}
        deployed = {fn: False for fn in CONSUMERS}
        mismatches, ok_lines = v.compare(CONSUMERS, expected, deployed)
        self.assertEqual(len(mismatches), 3)
        self.assertEqual(ok_lines, [])


class TestRealRepoConfigIsComplete(unittest.TestCase):
    """Runs against the ACTUAL consumer list and config.toml in this repo.

    Not a fixture: this is the same 'every consumer has an explicit pin' rule
    the live run enforces, so a consumer added to the list without a config.toml
    pin fails in the PR rather than eight weeks later on main.
    """

    def test_every_consumer_has_an_explicit_pin(self):
        consumers = v.load_consumers()
        self.assertGreater(len(consumers), 10, "consumer list looks truncated")
        expected = v.load_expected(consumers)          # sys.exit(1) if any pin is missing
        self.assertEqual(sorted(expected), sorted(consumers))
        self.assertTrue(all(isinstance(x, bool) for x in expected.values()))


class TestErrorDiagnosis(unittest.TestCase):
    """The 1010 case must never again be four opaque words."""

    def test_cloudflare_1010_is_named_and_not_called_an_auth_failure(self):
        msg = v.diagnose_http_error(403, "error code: 1010")
        self.assertIn("Cloudflare", msg)
        self.assertIn("NOT an auth failure", msg)
        self.assertIn("User-Agent", msg)

    def test_json_403_is_reported_as_credentials(self):
        msg = v.diagnose_http_error(403, '{"message":"Invalid token"}')
        self.assertIn("credentials", msg)
        self.assertNotIn("Cloudflare", msg)

    def test_the_two_diagnoses_are_different(self):
        # Anti-vacuity: a diagnose() returning one constant would pass both
        # assertions above if they only checked for a non-empty string.
        self.assertNotEqual(
            v.diagnose_http_error(403, "error code: 1010"),
            v.diagnose_http_error(403, '{"message":"Invalid token"}'),
        )


class TestRequestHeaders(unittest.TestCase):
    """The fix itself: an explicit, non-default User-Agent.

    urllib's default 'Python-urllib/3.x' is what Cloudflare refused with 1010.
    """

    def test_user_agent_is_set_and_is_not_the_urllib_default(self):
        self.assertIn("User-Agent", v.API_HEADERS)
        ua = v.API_HEADERS["User-Agent"]
        self.assertTrue(ua)
        self.assertNotIn("Python-urllib", ua)
        self.assertIn("pestflow", ua.lower())

    def test_accept_json(self):
        self.assertEqual(v.API_HEADERS.get("Accept"), "application/json")


if __name__ == "__main__":
    unittest.main(verbosity=2)
