# S242 Session 2 — QA Report

**Branch:** `feature/s242-session2-frontend`

## ⚠️ Browser QA could NOT be run in this environment
This was implemented in **CC Web (headless, no display/browser)**. I cannot produce the PR-required **screenshots (A/B/C)**, the **network-tab create-payload capture**, or the **manual realtime flip-test**. Those must be done in a local/desktop Claude Code session or by a human **before merge**. Everything below is static verification + the exact manual steps to run.

## A. Static verification (done here)
| Check | Result |
|---|---|
| `tsc --noEmit` (CI config) | ✅ 0 errors |
| `eslint` | ✅ 0 errors (warnings pre-existing; new files add none) |
| `vite build` | ✅ built |
| Anthropic grep-guard (`api.anthropic.com` / `VITE_ANTHROPIC` in `src/`) | ✅ clean (tag-image-vision via `functions.invoke`, not direct) |
| Backend contract match (enums, body/response shapes, column names) | ✅ verified live (see REVIEW pre-work) |
| `supabase` client is untyped → new table/columns compile | ✅ |

## B. Manual browser QA — TO RUN before merge (local/desktop)

Use an **Elite** tenant (the composer now routes to `generate-social-batch`, which is Elite-only).

### Item A — image-strategy selector + create payload
1. Social → Campaigns → **+ New Campaign**. Confirm the **Image attachment** block (4 options) renders between Duration and Platforms.
2. `folder`: a folder `<select>` appears; submit blocked until a folder is chosen. `fixed`: "Choose image" opens the library picker; thumbnail shows after pick; submit blocked until chosen. `ai_vision`/`none`: no extra required input. With an empty library, non-`none` options are disabled.
3. Submit with each strategy. **[SCREENSHOT each]**
4. **[NETWORK CAPTURE]** the `generate-social-batch` request — body must include `image_strategy` (+ `image_strategy_folder` or `image_strategy_image_id`) and `posts_requested`. Response 202 `{job_id, campaign_id}`.

### Item B — Tag with AI Vision
1. Media tab: each image shows a `tag_status` badge; hover shows the Sparkles **Tag with AI Vision** button. Toolbar shows **Tag untagged (N)** when applicable. **[SCREENSHOT]**
2. Click per-image tag → spinner → success toast → badge flips to "N tags" (or "Tag failed" with tooltip). Multi: progress toast `Tagging i/N…`.
3. Force a failure (e.g. a row whose storage object is missing) → failure toast carries the function's error; badge shows "Tag failed" + `tag_last_error` tooltip (no swallowed error).

### Item C — realtime status **[REQUIRED realtime test]**
1. Campaigns tab shows **Generation activity** with the new job(s). **[SCREENSHOT]**
2. In the Supabase dashboard, flip a `campaign_jobs` row `status` (queued→processing→completed). The panel badge must update **within ~2s without refresh**. Record the observed latency. (Backend prereq confirmed: `campaign_jobs` is in `supabase_realtime`, RLS tenant-scoped.)
3. Unmount check: navigate away and back → no duplicate channel errors in console.

## C. Verdict
Code complete + statically green. **Browser/realtime QA pending** (CC-Web limitation) — must be completed locally before merge; capture the screenshots, network payload, and realtime latency in this report.
