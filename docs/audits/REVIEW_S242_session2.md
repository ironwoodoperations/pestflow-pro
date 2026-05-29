# S242 Session 2 — Review (frontend wiring)

**Branch:** `feature/s242-session2-frontend` · No backend changes, no edge-fn deploys, no migrations, no protected files. Frontend (`src/`) + docs only.

## Pre-work (verified against the LIVE backend, per "trust the backend")

1. **image-strategy column/enum.** Canonical column `social_campaigns.image_strategy`, enum **`none | folder | ai_vision | fixed`** — confirmed by the live CHECK `image_strategy_known` and `process-campaign-job`. Config cols: `image_strategy_folder` (folder), `image_strategy_image_id` (fixed).
2. **`process-campaign-job`** reads `social_campaigns.image_strategy/_folder/_image_id` and runs the strategy + caption gen + `social_posts` insert **server-side** (it is NOT a client concern).
3. **`tag-image-vision`** targeted: request `{ mode:'targeted', image_ids:[…], tenant_id }`; response `{ mode, claimed, tagged, failed, skipped }`; user-JWT auth path works (so `supabase.functions.invoke` with the session token is correct — direct, not via ai-proxy).
4. **`campaign_jobs`** (live): `status ∈ {queued,processing,completed,failed}`; columns `posts_requested/posts_created/posts_with_images/last_error/started_at/completed_at/created_at`. **No `error_msg`** (it's `last_error`) and **no `current step`** column — Item C renders what exists.
5. **Components:** composer `src/components/admin/social/NewCampaignModal.tsx`; pickers `ImageLibraryPicker.tsx`; media mgmt `src/components/admin/MediaTab.tsx`; campaigns list `src/components/admin/social/CampaignsTab.tsx`; hook `src/hooks/useImageLibrary.ts`.

### ⚠️ Doc drift (flagged, trusted backend)
`docs/audits/s242-auto-attach-spec.md` describes the **superseded Path-B synchronous** design (chooser + client-side `social_campaigns`/`social_posts` inserts + client-side image selection; literally states "generate-social-batch doesn't exist"). The **live Session-1 backend is the v3 async flow**: `generate-social-batch` → `campaign_jobs` → `process-campaign-job`. Per the task, we trusted the backend. Recommend marking that spec superseded.

## Items

### A — image-strategy selector + async composer refactor
- New `ImageStrategyChooser.tsx`: 4 radios (`none/folder/ai_vision/fixed`); folder → `<select>` of `useImageLibrary().folders`; fixed → reuses `ImageLibraryPicker` (single-select); ai_vision → hint. Switching strategy clears the other's config so the payload always satisfies the `image_strategy_config_matches` CHECK. Disabled (except `none`) when the library is empty.
- `NewCampaignModal` **refactored to async**: removed client-side `callAi('campaign_generation')` + direct `social_campaigns`/`social_posts` inserts + the review/edit step. Submit now `functions.invoke('generate-social-batch', { body: {…, image_strategy, image_strategy_folder, image_strategy_image_id, posts_requested} })` → 202 → toast + close. Validation: folder requires a folder, fixed requires an image id (client-side, mirrors the backend). Errors unwrapped from `FunctionsHttpError.context`.

### B — "Tag with AI Vision" (targeted)
- `MediaTab`: per-image Sparkles button + a bulk **"Tag untagged (N)"** toolbar button. Each calls `functions.invoke('tag-image-vision', { mode:'targeted', image_ids:[id], tenant_id })` **directly** (not ai-proxy). Per-image loop → real progress toast for batches; success/failure toasts surface the function's error (unwrapped); `refresh()` after so tags/status appear without reload.
- `useImageLibrary` extended to select `tags, tag_status, tag_last_error`; `MediaTab` shows a corner `tag_status` badge (Untagged / Queued / Tagging… / N tags / Tag failed[+tooltip]).

### C — campaign_jobs realtime status
- New `CampaignJobsPanel.tsx` embedded in `CampaignsTab` (no detail view exists). Initial fetch + `supabase.channel('campaign_jobs:<tenant>').on('postgres_changes', {event:'*', filter:'tenant_id=eq.<id>'})`; merges INSERT/UPDATE by id; unsubscribes on unmount (`removeChannel`). Status badge (queued/processing/completed/failed) + posts counts + `last_error`. Orchestrator already added `campaign_jobs` to `supabase_realtime` (confirmed live), RLS tenant-scoped SELECT, REPLICA IDENTITY default+PK — sufficient for status flips. No polling (clean realtime per decision).

## Flags
- **Tier gating change.** `generate-social-batch` is **Elite-only** (tier 4); the old `callAi('campaign_generation')` path was Pro+. So the composer is now effectively Elite-only — a Pro tenant submitting gets the backend's `403 "AI Campaigns require the Elite plan."` (surfaced cleanly in the modal). The modal is still reachable for Pro (duration logic unchanged). **Recommend** updating the upstream gating (where "+ New Campaign" is exposed) to Elite-only so Pro users don't hit a 403 — left as-is here (outside the 3 items).

## Risk
Frontend-only; behavior-preserving for unrelated surfaces. The composer's submit UX changes sync→async by design.
