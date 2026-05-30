# s248 — Review: fix "Tagging failed" false-error on already-tagged images

Single-file frontend fix. No backend changes.

## Root cause (confirmed by kickoff, not re-investigated)
`tag-image-vision` targeted mode returns HTTP 200 `{mode,claimed,tagged,failed,skipped}`. Its `claim()` never claims `tag_status='tagged'` rows, so re-tagging a tagged image returns `tagged:0 failed:0 skipped:1`. The MediaTab handler treated **any** `tagged===0` as failure, raising a red "Tagging failed" toast — even when the only outcome was `skipped`.

## Fix
`src/components/admin/MediaTab.tsx` — three coordinated changes:

1. **Result interpretation (per-image + bulk).** Parse `tagged / failed / skipped` separately. Branch:
   - `tagged ≥ 1` → success.
   - `failed ≥ 1` → error toast "Tagging failed — hover the image badge for details." (`tag_last_error` already surfaces in the badge tooltip via existing `tagBadge`).
   - `skipped ≥ 1` (and tagged=0 & failed=0) → informational `toast('Already tagged.')` — **not** the red error.
   - all-zero → defensive failure (unexpected envelope shape).
2. **Bulk breakdown.** Final bulk toast composes parts — e.g. *"3 tagged, 2 already tagged, 1 failed"* — instead of lumping any non-tagged as failure. `toast.success` when only successes/skips, `toast.error` when there are real failures, neutral `toast` when only skips.
3. **Option (a) — per-image control reflects already-tagged state.** When `img.tag_status === 'tagged'` and the user is entitled, the per-image action is now a **CheckCircle2 emerald affordance** with title "Already tagged"; clicking it shows `toast('Already tagged.')` and **fires no network call**. (Untagged, busy, and locked states keep their existing Sparkles / Loader / amber-Lock affordances.)

## Out of scope (intentional)
- `tag-image-vision` and any other edge function — not modified.
- No force-retag path.
- Bulk "Tag untagged" button still filters out `tag_status === 'tagged'` upstream; this fix is for the rare race where a row becomes tagged between filter and call, plus correctness if ever invoked over a mixed set.

## Validator gate
Waived (kickoff): frontend-only result-interpretation fix; no contested architecture.

## Verification
- `tsc --noEmit` 0 errors, eslint clean on MediaTab, `vite build` ✅.
- Per kickoff: **Vercel preview URLs 404** for the multi-tenant hostname-routed SPA → preview-tested impossible. Verification is **merge-then-verify-on-prod** (steps in QA report).
