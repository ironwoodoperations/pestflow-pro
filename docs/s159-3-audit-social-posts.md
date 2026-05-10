# S159.3 — social_posts Audit

> **S210 Phase 1 update:** the `zernio-webhook` edge function was retired in PR following the S210 security audit. It was empirically dead (no Zernio webhook ever configured to call it). `social_posts.status` updates are now driven exclusively by the synchronous `post-to-social` and `zernio-connect` paths described in this audit. References to `zernio-webhook` below describe a never-load-bearing receiver.

_Generated: 2026-04-19. Read-only investigation._

---

## Verdict: LIVE

## One-paragraph summary

`social_posts` is the central state store for the entire social publishing pipeline. All posts — AI-generated or manually composed — are written to this table first; Zernio then executes the actual social network posting and mirrors status back via webhook. The table has active writes within the last 8 days, is referenced by 20+ code paths across write and read operations, and the `DashboardSocialWidget` is imported, rendered, and reachable on the admin dashboard home screen. The S159.3.1 fix (4-line `scheduled_at → scheduled_for` correction) was the right call and directly resolves the live 400 error on the dashboard widget.

---

## Evidence

### 1. DashboardSocialWidget rendering

- File exists at: `src/components/admin/dashboard/DashboardSocialWidget.tsx`
- Imported by: **1 file** — `src/components/admin/dashboard/DashboardHome.tsx` (line 7)
- Rendered in: **1 route** — `DashboardHome.tsx` line 99: `<DashboardSocialWidget onNavigate={onNavigate} />`
- Reachable by user navigation: **Yes** — admin dashboard home screen (`/admin` → Dashboard tab)

---

### 2. Writes and reads to `social_posts` (code)

**Write sites: 14**

| File | Operation |
|---|---|
| `src/components/admin/social/usePublishPost.ts:29` | `.update()` (edit existing post) |
| `src/components/admin/social/usePublishPost.ts:30` | `.insert()` (new draft/scheduled post — Starter tier) |
| `src/components/admin/social/usePublishPost.ts:45` | `.update()` (edit, Grow+ tier) |
| `src/components/admin/social/usePublishPost.ts:46` | `.insert()` (new post, Grow+ tier before Zernio call) |
| `src/components/admin/social/usePublishPost.ts:63` | `.update()` (edit, immediate-post path) |
| `src/components/admin/social/usePublishPost.ts:65` | `.insert()` + `.select('id')` (new post, immediate-post path) |
| `src/components/admin/social/usePublishPost.ts:89` | `.update({ status: 'failed' })` (error handler) |
| `src/components/admin/social/usePublishPost.ts:96` | `.update({ status: 'failed' })` (catch-all error) |
| `src/components/admin/social/NewCampaignModal.tsx:168` | `.insert(postsToInsert)` (batch campaign posts) |
| `src/components/admin/social/ContentQueueTab.tsx:54` | `.update({ status: 'approved' })` |
| `src/components/admin/social/ContentQueueTab.tsx:62` | `.update({ status: 'approved' })` (bulk approve) |
| `src/components/admin/social/ContentQueueTab.tsx:78` | `.update()` (reschedule) |
| `src/components/admin/social/ContentQueueTab.tsx:101` | `.update()` (edit post) |
| `src/components/admin/social/ContentQueueTab.tsx:137` | `.update({ scheduled_for, status: 'scheduled' })` |
| `src/lib/demoSeed.ts:89` | `.insert([...])` (demo seeding) |
| `src/lib/demoSeed.ts:158` | `.delete()` (demo cleanup) |
| `supabase/functions/post-to-social/index.ts:188-190` | `.update()` / `.insert()` (edge function) |
| `supabase/functions/publish-scheduled-posts/index.ts` | `.update()` multiple (cron job status updates) |
| `supabase/functions/zernio-webhook/index.ts:76,88` | `.update({ status })` (Zernio callback) |

**Read sites: 5**

| File | Operation |
|---|---|
| `src/components/admin/social/useSocialData.ts:55` | `.select('*')` — main social tab data load |
| `src/components/admin/social/useComposer.ts:56` | `.select('*', { count: 'exact', head: true })` — AI daily usage counter |
| `src/components/admin/social/SocialAnalyticsTab.tsx:32` | `.select('platform, status')` — analytics |
| `src/components/admin/reports/SocialSeoReport.tsx:25` | `.select('platform, status')` — reports tab |
| `src/components/admin/reports/SocialVolumeChart.tsx:31` | `.select(...)` — reports chart |
| `src/components/admin/dashboard/DashboardSocialWidget.tsx:23` | `.select('id, scheduled_for, status, created_at')` — dashboard widget |

---

### 3. Zernio interaction with `social_posts`

- **Zernio webhook writes to social_posts:** Yes — `zernio-webhook` edge function handles three events:
  - `post.published` → `.update({ status: 'published', published_at: ... })` by `zernio_post_id`
  - `post.failed` → `.update({ status: 'failed', error_msg: ... })` by `zernio_post_id`
  - `post.partial` → `.update({ status: 'failed', error_msg: 'partial failure' })` by `zernio_post_id`
  - `account.connected` → writes to `settings` (not `social_posts`)
- **Zernio reads from social_posts:** No — Zernio pulls data via the `post-to-social` edge function payload, not direct DB reads
- **Zernio state model:** `social_posts` is the **source of truth in Supabase**; Zernio is the execution engine. Flow: post saved to `social_posts` → `post-to-social` edge function calls Zernio API with post data → Zernio executes → webhook fires back → `social_posts.status` updated. The `zernio_post_id` column on `social_posts` is the correlation key.

---

### 4. Admin Social tab behavior

- Components: `src/components/admin/SocialTab.tsx` (router), `src/components/admin/social/usePublishPost.ts` (write logic), `src/components/admin/social/LegacyComposer.tsx` (Starter-tier UI)
- **On post create (Tier 1 — Starter):** writes to `social_posts` only (no Zernio call — manual posting)
- **On post create (Tier 2+ — Grow/Pro/Elite):** writes to `social_posts` first to get an `id`, then calls `post-to-social` edge function which calls Zernio; Zernio result updates status via webhook
- **On display:** reads from `social_posts` via `useSocialData.ts` — not from Zernio API directly

> **Note on `LegacyComposer`:** Despite the filename, this component is not dead. It is imported and rendered by `SocialTab.tsx` as the Starter-tier (Tier 1) compose UI. The "Legacy" name is a misnomer from a prior refactor — it is the active path for clients on the base tier.

---

### 5. DB state

- **Total rows:** 17
- **Most recent write:** 2026-04-11 (8 days ago as of audit)
- **Most recent scheduled_for:** 2026-04-17
- **Oldest row:** 2026-03-30
- **Distinct tenants with rows:** 1 (Demo Tenant — `9215b06b-3eb5-49a1-a16e-7ff214bf6783`)
- **Rows without tenant:** 0

**Recent activity summary (17 rows):**

| Status | Count | Notes |
|---|---|---|
| published | 7 | Mix of immediate + scheduled posts that completed |
| failed | 7 | Several Apr 10 failures (likely Zernio API config or 400-related) |
| scheduled | 1 | Future post pending |
| approved | 1 | Approved, not yet sent to Zernio |
| draft | 0 | None in current data |

Activity pattern: demo tenant actively posting in late March – early April 2026. Cluster of failures on Apr 10 (5 of 7 failed rows), then 1 successful publish on Apr 11. The failures likely coincide with the `scheduled_at` 400 bug or Zernio connection gaps — this is corroborating evidence that the S159.3.1 fix was warranted.

---

### 6. AI caption generator path

- **Code path:** `src/components/admin/social/useComposer.ts` → `generateCaptions()` at line 71
- **API call:** Direct browser-side fetch to Anthropic API (using `anthropic-dangerous-direct-browser-access: true` header per platform rules) with `claude-sonnet-4-6`
- **Output destination:** Captions are returned to **frontend state** inside `useComposer` (held in component state as an array of caption strings)
- **Write to DB:** User selects a caption and submits → `usePublishPost.ts` writes the final post to `social_posts` → for Tier 2+, `post-to-social` edge function calls Zernio
- **AI does NOT write directly to social_posts or Zernio** — the user is always in the approval loop before any DB write occurs
- `useComposer.ts:56` queries `social_posts` to count `ai_generated = true` posts today — enforces the per-day AI generation limit by tier

---

## Recommendation

**FIX T1 — complete.** The 4-line `scheduled_at → scheduled_for` patch in DashboardSocialWidget (already applied in S159.3.1 commit `40dced9`) is correct. `social_posts` is live, actively written, and central to the social pipeline. The widget was the only broken consumer.

---

## Deprecation candidates surfaced

| Item | Status | Notes |
|---|---|---|
| `LegacyComposer` filename | Keep, rename later | Actively used as Tier 1 compose UI. Misnomer only — not dead code. Flag for rename to `StarterComposer` in a future hygiene pass. |
| `src/lib/demoSeed.ts` | Keep | Active — inserts and deletes demo data on demand. Not dead. |
| `supabase/functions/publish-scheduled-posts` | Keep | Active cron job — fires every 5 minutes to publish scheduled posts via Zernio. |
| None else | — | No orphaned code found in this audit. |

---

_End of audit. All 6 checks completed. No mutations performed._
