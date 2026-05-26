# S242 — AI Campaign Image Auto-Attach — Wave 1 Death Audit

**Session:** S242 (Wave 1 — investigate only)
**Date:** 2026-05-26
**Branch:** `s242/wave1-investigate`
**Author:** Claude Code (Web)
**Status:** Wave 1 audit. **STOP at gate** — Scott reviews before Wave 2 (spec) unlocks. No code, no spec.
**Mode:** `/investigate` (repo-side death audit; DB-side pre-baked by Claude.ai)

> ⚠️ **Blocker surfaced — see Open Question OQ1.** The locked design doc `docs/strategy/S242_AUTO_ATTACH_DESIGN.md` referenced by the kickoff **does not exist anywhere in the repo or git history**. This audit proceeds against the kickoff's embedded design summary (the 12 locked decisions + 3 strategies), which is self-contained for the repo probes. Cross-references to "design Section N" below are inferred from the kickoff text, not a committed doc.

---

## 1. DB audit (Claude.ai Supabase MCP, 2026-05-26) — verbatim, ground truth

**Tables**
- `public.social_campaigns` exists. Columns: `id`, `tenant_id`, `title`, `goal`, `tone`, `duration_days` (default 7), `platforms` text[], `start_date`, `status` (default 'active'), `created_at`. RLS on. No FKs. No CHECK constraints. Policy `social_campaigns_tenant_isolation` uses the `profiles.tenant_id` lookup pattern — different from `social_posts` and `image_library`, which use `current_tenant_id()`. Anonymous SELECT is allowed via `social_campaigns_anon_read` (pre-existing, mirrors social_posts).
- `public.image_library` schema: `id`, `tenant_id`, `bucket_id` (default 'social-uploads'), `storage_path`, `original_filename`, `mime_type`, `size_bytes`, `width`, `height`, `folder` (nullable), `uploaded_by`, `created_at`, `deleted_at`. No `tags` / `tag_status` / `tagged_at` columns yet.
- `public.social_posts` has `campaign_id` uuid (nullable) and `campaign_title` text (denormalized) — both already exist.

**Row counts**
- 6 total campaigns system-wide: 5 on master/demo, 1 on Dang. All `status='active'`. Migration `DEFAULT 'none'` is safe.
- 17 active library rows (12 master + 5 Dang). Zero deleted on master; 4 deleted on Dang.
- **Zero rows use the `folder` column.** 17/17 active have `folder IS NULL`. Strategy 3 needs an "All photos" sentinel — design Section 3 implies it; design Section 7 algorithm does not handle it.

**Dang empirical premise verified verbatim**
- 8 active posts, 3 with images, 2 campaign-generated, 2 of those imageless. Design's motivating data is accurate.

**Edge functions**
- 30 active. **No function named `generate-social-batch` exists.** None obviously generates AI captions. `pg_proc` has zero functions referencing 'anthropic', 'claude-', or 'caption'. No triggers on `social_campaigns` or `social_posts`. Yet campaign-generated posts have real AI-quality captions.
- → **CRITICAL Wave 1 task: locate the actual AI campaign generation surface in the repo.** Design Section 8's "fits in existing `generate-social-batch`" is wrong as written. The spec cannot be drafted until this surface is named. **[RESOLVED — see P1 below.]**

**Cron**
- Daily 03:00 UTC is free. None of the existing 7 jobs collide.
- New cron will need `tag_image_vision_internal_secret` in `vault.secrets` (Scott dashboard step, not MCP). Pattern matches `publish_scheduled_posts_internal_secret`, `process_sms_queue_internal_secret`, etc.

**Vault**
- 8 vault entries enumerated. `ANTHROPIC_API_KEY` is NOT in `vault.secrets` — lives in Edge Function Secrets (Dashboard-only), read via `Deno.env.get()`. Matches S224 PageSpeed precedent. Do NOT add it to vault.

---

## 2. Repo-side findings (P1–P8)

### P1 — AI campaign generation surface  ✅ LOCATED (and it changes the architecture)

`grep "generate-social-batch"` across `src/` + `supabase/` → **nothing**. Confirmed: no such edge function.

**The generation surface is 100% client-side, in the browser.** It is `src/components/admin/social/NewCampaignModal.tsx`, function `handleGenerate()` (lines 85–136):

```ts
// NewCampaignModal.tsx:110
const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  },
  body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 4000, messages: [...] }),
})
```

- It is **option (b)** from the kickoff: a direct client-side call exposing `VITE_ANTHROPIC_API_KEY` in the bundle (pre-existing; blessed by CLAUDE.md non-negotiable #3's "anthropic-dangerous-direct-browser-access" pattern, also used by `scrape-prospect`-adjacent flows).
- Response is stripped (`text.replace(/```json|```/g, '').trim()`) and `JSON.parse`d into `GeneratedPost[]` (`{ day, platform, caption, hashtags }`). Matches CLAUDE.md non-negotiable #5.
- There is **NO edge function and NO server-side step** in campaign generation. "Campaign-generated posts have AI captions" because the browser called Anthropic directly and the saved caption text persists.

**Architectural consequence (critical):** Design Section 8's `selectImageForPost(...)` "after caption generation, before social_posts INSERT" cannot live in an edge function, because no edge function exists in this path. It must live **client-side**, inside `handleSave()`. See P6. This is **Open Question OQ2** — confirm we keep generation client-side rather than refactoring it into a new edge function (large out-of-scope change).

### P2 — The New AI Campaign dialog  ✅ LOCATED (different filename than assumed)

Not `NewCampaignDialog.tsx`. It is **`src/components/admin/social/NewCampaignModal.tsx`**.

- **Parent:** `src/components/admin/SocialTab.tsx` renders it at line 211 (`postFlow === 'campaign'`), gated behind `canAccess(3)` (see P8). Also imported by `CampaignsTab.tsx` (line 103) for the "+ New Campaign" button.
- **Props:** `{ onClose, onCreated, connectedKeys? }` (lines 16–20).
- **Shape:** 4-step wizard (`setup → generating → review → saving`), single `useState` `form` object (lines 50–57) — complies with CLAUDE.md rule #4.
- **Persistence (NOT a single RPC / NOT a transaction):** two sequential client-side inserts in `handleSave()` (lines 138–186):
  1. `supabase.from('social_campaigns').insert({...}).select('id').single()` (line 143)
  2. `supabase.from('social_posts').insert(postsToInsert)` (line 178)
  If step 2 partially fails, the campaign row still exists (toast warns; no rollback).
- **Where the strategy chooser slots in:** the `setup` step form, between the **Duration** select (lines 226–234) and the **Platforms** group (lines 235–258). It must be disabled when the library is empty (design decision) — the modal would need the library count, which it does not currently fetch.

### P3 — ImageLibraryPicker integration point  ✅ NO MODIFICATION NEEDED

`src/components/admin/social/ImageLibraryPicker.tsx` (shipped S237b, PR #121):
- Props: `{ open, onClose, onSelect: (publicUrl, item) => void, initialFolder? }`.
- **Single-select only** — line 102: `onClick={() => { onSelect(item.publicUrl, item); onClose() }}`. One click selects and closes.
- Strategy 5 ("Use one image for all posts") needs exactly single-select → **reusable as-is, zero delta.** `onSelect` already returns the full `ImageLibraryItem`, so the campaign INSERT can store `item.id` as `image_strategy_image_id`.

### P4 — "All photos" sentinel for Strategy 3  ✅ DECISION FORCED

`useImageLibrary` has **no `list(folder?)` method**. It exposes (line 133): `{ items, loading, error, refresh, upload, uploadMany, softDelete, setFolder, folders }`.
- `items` is the full active list; `refresh()` filters `.is('deleted_at', null)` (line 66) — **soft-deleted already excluded.** RLS scopes to tenant.
- `folders` (lines 129–131) is a derived `string[]` of distinct **non-null** folder values → **currently `[]`** (17/17 rows have `folder IS NULL`).
- The SELECT (line 65) does **not** include a `tags` column (doesn't exist yet).

Selection is therefore a **client-side filter over `items`**, not a SQL `WHERE folder = ?`. The design's Section 7 SQL is conceptual only.

**Locked sentinel (recommend approving in Wave 2):** the folder dropdown carries `'__all__'` for "All photos".
- `'__all__'` → use all of `items` (already deleted-filtered, tenant-scoped).
- a real folder name → `items.filter(i => i.folder === name)`.
- Persist on the campaign as `image_strategy_folder = '__all__'` (or the folder name). Since no rows use folders today, "All photos" is the only meaningful option at launch — the per-folder UI is forward-compatible but inert until tenants start foldering.

### P5 — Caller INSERT pattern vs RLS  ✅ NO POLICY CHANGE NEEDED (no stop condition)

`handleSave()` inserts via the **tenant-scoped JS client** (line 143):
```ts
supabase.from('social_campaigns').insert({ tenant_id: tenantId, ... }).select('id').single()
```
`tenantId` comes from `useTenant()` (line 44). The authed user's JWT drives `social_campaigns_tenant_isolation` (the `profiles.tenant_id` lookup policy); `tenant_id` is set explicitly to the user's tenant. **No service role anywhere in this path.** Adding the three new columns (`image_strategy`, `image_strategy_folder`, `image_strategy_image_id`) to this insert object satisfies the existing policy with **no RLS migration**. Stop condition P5 does **not** fire.

### P6 — Where the selection algorithm lives  ✅ NAMED (client-side, per P1)

Because generation is client-side (P1), `selectImageForPost` lives client-side, invoked inside `handleSave()` in the `postsToInsert` map (NewCampaignModal.tsx:162–176), where each post object is shaped:
```ts
const postsToInsert = generatedPosts.map((p, i) => ({
  tenant_id: tenantId, campaign_id: campaign.id, ...,
  // NEW: image_url: selectCampaignImage(p, form, libraryItems),
}))
```
At that point in scope we already have: `tenantId`, `generatedPosts`, the chosen strategy (in `form`), and the campaign id. The **missing input is the `image_library` list** — the modal does not currently load it. Wave 2 must add either (a) a one-shot scoped query in `handleSave()`, or (b) `useImageLibrary()` in the modal to expose `items`. Recommend a new helper `src/components/admin/social/lib/selectCampaignImage.ts` (pure function: `(post, strategy, items) => imageUrl | null`), including the in-function stem-matcher for the `ai_vision` strategy. **No Anthropic call at generation time** — `ai_vision` matches the campaign topic against pre-computed `image_library.tags` (populated async by the tagging cron), honoring "tagging cost paid on upload."

### P7 — Tagging edge function shape  ✅ PRECEDENTS CONFIRMED

`tag-image-vision` (new, `verify_jwt: false`, cron-only) mirrors two existing functions verbatim:

**Auth + service-role + cron-claim** — from `supabase/functions/process-sms-queue/index.ts`:
```ts
import { timingSafeEqual } from 'node:crypto'
const expectedSecret  = Deno.env.get('PROCESS_SMS_QUEUE_INTERNAL_SECRET') || ''  // → TAG_IMAGE_VISION_INTERNAL_SECRET
const presentedSecret = req.headers.get('apikey') || ''
// 500 if expectedSecret unset; timingSafeEqual; 401 on mismatch (lines 48–70)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)  // line 76
// atomic claim to survive overlapping cron runs (lines 80–86):
//   UPDATE image_library SET tag_status='tagging' WHERE tag_status='pending' ... RETURNING ...
```
Deploy: `supabase functions deploy tag-image-vision --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar`.

**Anthropic call** — from `supabase/functions/scrape-prospect/index.ts`:
```ts
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || ''  // line 12 — Edge Function Secret, NOT vault
fetch('https://api.anthropic.com/v1/messages', {
  headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
  body: JSON.stringify({ model: 'claude-sonnet-4-6', ... }),  // lines 138–151
})
```
For vision, the `messages` content becomes an array with an `image` block (base64 from the storage object, or a public URL block) + a text instruction returning the 8-tag free-form taxonomy. Strip-and-parse the JSON exactly as P1/CLAUDE.md #5.

**Secret lives in two places** (note for Scott's dashboard step): the edge fn reads `TAG_IMAGE_VISION_INTERNAL_SECRET` from **Edge Function Secrets** (`Deno.env.get`), while the **cron job** reads `tag_image_vision_internal_secret` from `vault.secrets` to pass as the `apikey` header — same dual-location pattern as `process_sms_queue_internal_secret`.

### P8 — Tier gating surface  ⚠️ DESIGN SAYS ELITE; CODE SAYS PRO+

The AI Campaign feature is gated by **`canAccess(3)` — Pro tier (3+), NOT Elite (4)**:
- `SocialTab.tsx:131` — Campaigns tab body renders only if `canAccess(3)`, else `SocialUpgradeNudge planName="Pro"` (line 137) or `<FeatureGate minTier={3}>`.
- `SocialTab.tsx:184` — the "Campaign" choice card in the New Post dialog renders only `{canAccess(3) && ...}`.
- `NewCampaignModal` itself uses `tier` only to pick durations (Pro = 1–5 days, Elite = up to 30; lines 32–47) — no internal gate.
- Gate primitives: `FeatureGate` (`src/components/common/FeatureGate.tsx`) + `canAccess(n)` / `tier` from `usePlan()`.

Since the image-strategy section sits **inside** `NewCampaignModal`, which only ever mounts via the `canAccess(3)` path, auto-attach **inherits a Pro+ gate with no new gate code** — *but that is Pro+, not Elite-only as the design states.* This is **Open Question OQ3**.

---

## 3. Locked decisions

**From the kickoff's embedded design summary (re-stated):**
1. Three strategies only: `folder`, `ai_vision`, `fixed`. Round-robin / random-no-repeat rejected.
2. Per-campaign chooser, not tenant-default.
3. Anthropic Sonnet vision for tagging. No new vendor.
4. Free-form 8-tag taxonomy, no enum CHECK.
5. Tagging cost paid on upload, not on generation.
6. Empty library → strategy section disabled; campaigns generate captions-only.
7. Soft-deleted images excluded (already enforced by `useImageLibrary` line 66).
8. Tier inherits from AI Campaign feature; no new gate. *(Conflict — see OQ3: the inherited gate is Pro+, not Elite.)*
9. Phase-2 "Auto folder per post" deferred to S242.1.
10. Stem-matching via in-function lemmatizer, no dependency.
11. `tag-image-vision` deployed via MCP, `verify_jwt: false`, cron-only.
12. Validator gate (Perplexity + Gemini) REQUIRED before Wave 2.

**New decision forced by this audit (P4):**
13. **"All photos" sentinel = `'__all__'`** carried by the folder dropdown and persisted to `social_campaigns.image_strategy_folder`. Selection is a client-side filter over `useImageLibrary().items`, not SQL `WHERE folder = ?`.

---

## 4. Open questions for Scott (binary — answer before Wave 2)

**OQ1 — Missing design doc. [BLOCKER for traceability]**
`docs/strategy/S242_AUTO_ATTACH_DESIGN.md` does not exist in the repo/git. Pick one:
- **(A)** Commit the design doc to `docs/strategy/` so the Wave 2 spec can cite real section numbers and future sessions are self-contained. *(Recommended.)*
- **(B)** Declare the kickoff message the canonical source; the doc stays a Claude.ai artifact and the spec cites the kickoff.

**OQ2 — Generation stays client-side?** [architecture]
Generation is a browser-side direct Anthropic call (P1); there is no edge function to host `selectImageForPost`. Pick one:
- **(A)** Keep generation client-side; `selectCampaignImage` is a client-side pure helper called in `handleSave()`. No new edge function for selection. *(Recommended — small, matches reality.)*
- **(B)** Refactor campaign generation into a new server-side edge function first, then do selection there. *(Large out-of-scope change; would also move the Anthropic key server-side.)*

**OQ3 — Auto-attach tier: Pro+ or Elite-only?** [scope]
The AI Campaign feature is `canAccess(3)` = Pro+. The design says "Elite-only, no new gate" — contradictory. Pick one:
- **(A)** Auto-attach available to **Pro+** (tier ≥3), inherits the existing gate, **no new gate code**. *(Recommended — matches code + "no new gate".)*
- **(B)** Restrict auto-attach to **Elite-only**, which **requires a new gate** inside `NewCampaignModal` (contradicts locked decision #8).

**OQ4 — Confirm the `'__all__'` sentinel (decision #13)** as the launch behavior, given 0 tenants use folders today (so "All photos" is effectively the only live option). Yes / adjust.

**OQ5 — Migration FK on-delete.** `social_campaigns` has no FKs today. `image_strategy_image_id` → `image_library.id` will be its first. Confirm **`ON DELETE SET NULL`** (images soft-delete via `deleted_at`, but a hard delete shouldn't break a campaign row). Yes / prefer `RESTRICT`.

---

## 5. Recommended Wave 2 spec outline (do NOT draft until Scott unlocks)

Pending validator gate (decision #12) + OQ answers, the Wave 2 spec should contain:

1. **Migration** — `image_library`: add `tags text[]`, `tag_status text DEFAULT 'none'` (`none|pending|tagging|done|error`), `tagged_at timestamptz`. `social_campaigns`: add `image_strategy text DEFAULT 'none'`, `image_strategy_folder text`, `image_strategy_image_id uuid REFERENCES image_library(id) ON DELETE SET NULL`. No RLS changes (P5). Backfill `tag_status='pending'` for existing 17 active rows so the cron tags them.
2. **`useImageLibrary` SELECT** — add `tags, tag_status` to line 65 so `items` carry tags for the selector.
3. **`tag-image-vision` edge fn** — full source mirroring P7 (internal-secret auth, service-role client, atomic claim of `tag_status='pending'`, Sonnet vision call, write `tags`+`tag_status='done'`+`tagged_at`; `error` on failure).
4. **Cron migration** — daily 03:00 UTC, reads `tag_image_vision_internal_secret` from vault, POSTs `apikey` header. Plus Scott's two dashboard steps (Edge Function Secret + vault entry).
5. **Tag-on-upload trigger** — set `tag_status='pending'` when a new `image_library` row is inserted (DB trigger or in `useImageLibrary.upload`), so new uploads enter the queue.
6. **`selectCampaignImage` helper** (`src/components/admin/social/lib/`) — pure `(post, strategy, items) => url|null`; folder filter; `ai_vision` stem-match topic↔tags with in-function lemmatizer; `fixed` returns the chosen image; `'__all__'` sentinel handling.
7. **`NewCampaignModal` wiring** — load library `items`; insert an `<ImageStrategyChooser>` in the `setup` step (between Duration and Platforms), disabled when `items.length === 0`; reuse `ImageLibraryPicker` (single-select) for the `fixed` strategy; persist `image_strategy*` columns in the campaign insert; call `selectCampaignImage` in the `postsToInsert` map to set `image_url`.
8. **Tier** — per OQ3 (default: inherit Pro+, no new gate).
9. **QA plan** — browser pass on Dang (5 library images, currently all untagged): run cron once to tag, create a campaign per strategy, verify `image_url` populated on generated posts and renders in Content Queue + on publish.

---

**Wave 1 complete. Validator gate (Perplexity + Gemini) + OQ1–OQ5 answers required before Wave 2 spec. Do not merge — Scott reviews.**
