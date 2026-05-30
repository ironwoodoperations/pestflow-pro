# s248 — QA Report

## ⚠️ Preview QA is impossible (per kickoff)
Vercel preview URLs 404 ("Site Not Found") for this hostname-routed multi-tenant SPA. This is **merge-then-verify-on-prod**.

## Static verification (this PR)
| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npx eslint src/components/admin/MediaTab.tsx` | ✅ clean |
| `npm run build:vite` | ✅ built |
| Backend untouched (`tag-image-vision`, edge fns) | ✅ no edits |
| Single file changed (`MediaTab.tsx`) | ✅ |

## On-prod verification — TO RUN immediately after merge
Default test set: master-tenant images are all `tag_status='tagged'` (per kickoff).

1. **Per-image, already-tagged (the bug):** click the AI control on a tagged image. ✅ shows an emerald **CheckCircle** affordance with tooltip "Already tagged"; clicking it fires `toast('Already tagged.')` (neutral) — **no network call**, **no red error**.
2. **Per-image, untagged (regression check):** upload a new image (becomes `tag_status` null) → click Sparkles → success toast + badge flips to "N tags".
3. **Per-image, simulated real failure** (e.g. force a 5xx or an upstream error → backend marks `tag_status='failed'` with `tag_last_error`): clicking Sparkles still shows the **red** "Tagging failed — hover the image badge for details." toast; hovering the red "Tag failed" badge shows the actual `tag_last_error`.
4. **Bulk breakdown:** with a mixed view (some untagged, race a tagged in), click **Tag untagged** → final toast reads e.g. *"3 tagged, 0 already tagged, 0 failed"*; if any rows are skipped server-side, they appear in the "already tagged" bucket (never as a blanket failure). If any genuine failures occur, the toast is a red breakdown including them.
5. **Locked tier (regression check):** as a sub-Pro tenant, the per-image control still shows the amber lock and clicking opens the upgrade prompt (s247 behavior unchanged).

## Notes
- The corner badge ("Untagged" / "N tags" / "Tag failed" with tooltip) is unchanged and already surfaces `tag_last_error` on hover for real failures.
- No CRUD/DB writes from this change; the on-prod check is observation-only (no mutation needed beyond clicks).
