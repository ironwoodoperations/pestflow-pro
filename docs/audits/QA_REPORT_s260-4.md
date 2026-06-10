# QA REPORT — S260-4 (v2): report link→text fix + retire no-photos rule

**Branch:** `feat/s260-4-report-link-text-drop-photos-rule`
**Date:** 2026-06-10
**Under test:** `supabase/functions/generate-monthly-report/index.ts`

---

## Static checks (post-edit grep over the file)

| Assertion | Result |
|-----------|--------|
| No `<a class="fix"` anchor remains | ✅ none |
| No `Fix it here` text remains | ✅ none |
| New `<p class="fixhint">…SEO → Pages…Needs update…</p>` present | ✅ line 379 |
| `.fix{…}` CSS removed; `.fixhint{…}` added | ✅ line 403 |
| `imagesAllEmpty` removed | ✅ none |
| `"no photos"` finding text removed | ✅ none |
| `NON_SERVICE_SLUGS` fully removed (def + usage) | ✅ none |
| Intro-text content rule still present | ✅ "very little intro text" intact |
| Narration / RPC persist / viewer / iframe untouched | ✅ not in diff |
| `config.toml` verify_jwt unchanged | ✅ not in diff |

Net diff: 1 file, +3 / −9.

## Behavioral reasoning

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 1 | Any finding renders | shows muted italic hint, no clickable link | ✅ `.fixhint` `<p>` |
| 2 | Page with empty image columns but real template hero | **no** "no photos" finding generated | ✅ rule deleted |
| 3 | Page with thin intro | still flagged (intro rule kept) | ✅ |
| 4 | Meta/keyword/engagement/technical findings | unchanged | ✅ not touched |
| 5 | `content` category affirmation when no content findings | still works (category still in `ranCategories`) | ✅ `ransRules.push('content')` retained |
| 6 | `admin_deeplink` still set on findings | harmless, just not rendered | ✅ field retained |

## Why no automated build run

This is a Deno edge function — it is not part of the Vite/Next build and there is no Deno toolchain in this web session. The change is a pure deletion (rule + unused constant) plus a literal string/CSS swap, with **no new imports, no type changes, and no signature changes**, so there is no compile surface to regress. The SELECT still fetches the (now-unused) image columns, so removing the rule cannot produce an "undefined property" error.

## Operator post-merge verification (per task)

1. Redeploy `generate-monthly-report` via MCP (`verify_jwt=false`; bundle `index.ts` + `_shared/delegationEnvelope.ts`).
2. Confirm rendered HTML has no `<a class="fix">` anchor.
3. Confirm no finding contains "no photos".
4. Regenerate Dang's report → expect ~28 → ~11 findings; service/legal pages lose the "Needs update" badge; plain-text Pages-tab hint shown.

## Verdict

✅ Ready for review. Both changes applied exactly; scope limited to the two edits + unused-constant cleanup; nothing else in the worker touched.
