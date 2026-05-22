# S237 — Image Library / Media Tab — Wave 1 Death Audit

**Session:** S237
**Date:** 2026-05-22
**Branch:** `claude/modest-einstein-aodiq`
**Author:** Claude Code (Web)
**Status:** Wave 1 complete — STOP-AND-REPORT. Spec NOT drafted pending Scott review.
**Scope of audit:** Greenfield `image_library` table, new Media tab, `ImagePicker` modal, social + blog composer wiring, backfill of existing `social-uploads` objects.

---

## TL;DR — what changed about the plan after looking at reality

The kickoff is directionally correct but **several of its concrete assumptions are wrong against the live DB/codebase.** None are blockers; all change the spec. The five that matter most:

1. **The storage bucket policies the kickoff asks us to CREATE already exist.** `social-uploads` already has tenant-scoped SELECT (`tenant_read_social`) and INSERT (`tenant_upload_social`) policies with the *exact* `foldername[1] = current_tenant_id()::text` predicate the kickoff proposes. Only a **DELETE** policy is missing. Re-creating the read/write policies under new names just adds redundant, overlapping policies. **Action: add only the DELETE policy.**

2. **Path convention in production is `<tenant_uuid>/social/<uuid>.jpg`** — NOT the kickoff's proposed `<tenant>/<yyyy>/<mm>/<file>`. All 17 existing objects and the live `useComposer.ts` uploader use `<tenant>/social/`. The RLS `foldername[1]` predicate works for both, but switching conventions would fork the bucket and complicate backfill. **Recommend keeping `<tenant>/social/` (or `<tenant>/library/`).**

3. **The 17 files belong to TWO tenants, not just Dang:** Dang = 5, Demo (`9215b06b…`) = 12. The Wave 4 test "verify all 17 appear in Dang's library" is wrong — backfill must map each object to its correct tenant via `foldername[1]`. Expected post-backfill: **5 rows for Dang, 12 for Demo.**

4. **A client-side resize util already exists** (`src/components/admin/social/lib/resizeImage.ts`) and is already wired into the social uploader. It re-encodes via canvas (which strips EXIF) at 1200px. **The new `browser-image-compression` dependency is probably unnecessary** — reuse/extend the existing util (bump max edge to 2048 if desired).

5. **Blog images live in a DIFFERENT bucket** (`tenant-assets`, path `<tenant>/blog/`), not `social-uploads`. An `image_library` scoped only to `social-uploads` will not contain blog's existing assets, and blog's inline uploader won't feed the library. **Schema needs a `bucket_id` column** if the library is to serve both the social picker and the blog hero picker. Decision required (see §4, §8).

---

## Probe 1 — Does an `image_library` / media table already exist?

**No.** Greenfield.

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema='public'
  AND (table_name LIKE '%image%' OR '%media%' OR '%asset%' OR '%upload%' OR '%librar%');
-- → [] (empty)
```

No partial scaffold, no migration history collision. The kickoff's `CREATE TABLE image_library` can proceed additively. **Decision: build fresh.**

Two schema gaps in the kickoff's DDL to fix in the spec:
- **`ON CONFLICT (storage_path) DO NOTHING` requires a UNIQUE constraint on `storage_path`** — the kickoff's `CREATE TABLE` does not define one. Add `UNIQUE (storage_path)` (or `UNIQUE (tenant_id, storage_path)`).
- **No `bucket_id` column.** Needed if the library spans `social-uploads` + `tenant-assets` (see Probe 3/4). Recommend adding `bucket_id text NOT NULL DEFAULT 'social-uploads'`.

---

## Probe 2 — Current `social-uploads` bucket state

**Object count: 17.** Confirmed exactly as v90 spec predicted.

Distribution by tenant (parsed from `foldername(name)[1]`):

| Tenant | UUID | Files |
|--------|------|-------|
| Dang Pest Control | `1611b16f-381b-4d4f-ba3a-fbde56ad425b` | **5** |
| PestFlow Pro (demo) | `9215b06b-3eb5-49a1-a16e-7ff214bf6783` | **12** |
| **Total** | | **17** |

- **Path convention:** `<tenant_uuid>/social/<random-uuid>.jpg` for every object. Segment 1 = tenant UUID, segment 2 = literal `social`.
- **All `image/jpeg`.** Sizes 30 KB – 318 KB (already resized on upload). No oversized originals.
- **`metadata` exposes `size` and `mimetype` only — no width/height.** Backfill cannot populate `image_library.width/height` from storage metadata; leave them NULL on backfill (columns are nullable — fine).
- **Bucket `public = true`**, `file_size_limit = null`, `allowed_mime_types = null`.

### Existing storage.objects RLS (CRITICAL — overlaps the kickoff's proposal)

```
tenant_read_social   SELECT  authenticated  USING  bucket_id='social-uploads' AND foldername[1]=current_tenant_id()::text
tenant_upload_social INSERT  authenticated  CHECK  bucket_id='social-uploads' AND foldername[1]=current_tenant_id()::text
(no DELETE policy for social-uploads)
authenticated_read_tenant_buckets SELECT authenticated  bucket_id IN ('logos','tenant-assets','social-uploads','videos')
```

So the kickoff's `social_uploads_tenant_read` and `social_uploads_tenant_write` are **functional duplicates of existing policies** — creating them adds redundant overlapping policies (OR-combined, no error, but messy). **The only genuinely new bucket policy needed is `social_uploads_tenant_delete`** (DELETE, `foldername[1]=current_tenant_id()::text`) — and even that is only needed if the Media tab hard-deletes storage objects. Since the kickoff specifies **soft-delete only (no hard-delete)**, a DELETE storage policy is *not strictly required for v1* and can be deferred to the future cleanup edge fn. **Recommend: add the DELETE policy now (cheap, scoped) so a future cleanup fn doesn't need a migration, but no read/write policy changes.**

---

## Probe 3 — Other relevant buckets

```sql
SELECT id, public, file_size_limit, allowed_mime_types FROM storage.buckets;
```

| Bucket | public | size limit | mime allowlist | Used for |
|--------|--------|-----------|----------------|----------|
| `logos` | true | none | none | Tenant logos (BrandingLogo, LogoUpload) |
| `social-uploads` | true | none | none | Social post images (`useComposer.ts`) |
| `tenant-assets` | true | none | none | **Blog featured images, content page images, hero media** (97 objects) |
| `videos` | true | none | none | Hero video uploads |

**All four buckets are public.** Reads via `getPublicUrl` need no RLS; the tenant-scoped SELECT policies only matter for authenticated `list()` calls.

**Recommendation: keep `social-uploads` as the home for the Media tab uploads** (matches kickoff and existing uploader). **But** because blog uses `tenant-assets`, the library schema should carry `bucket_id` so the blog hero picker can surface blog assets too. Do **not** create a new `customer-media` bucket — defer until a private-asset use case exists (kickoff agrees).

---

## Probe 4 — Post composer call path (the wiring target)

### Social (LIVE composer = `LegacyComposer`)
- `SocialTab.tsx` → renders `LegacyComposer` (line 205) when the post flow is active. `ContentQueueTab` is the queue view.
- `LegacyComposer` → `useComposer()` (`social/useComposer.ts`) + `ComposerImagePicker`.
- **Image flow today:** `useComposer.handleFileUpload()` resizes (`resizeImage`), uploads to `social-uploads` at `<tenant>/social/<uuid>.jpg`, calls `getPublicUrl`, stores the URL in `form.imageUrl`.
- **`ComposerImagePicker.tsx` ALREADY EXISTS** — but it is an *upload-or-paste-URL* card ("📁 Upload Photo" + "Or paste image URL" + "Download Template"), NOT a library browser. **Naming collision with the kickoff's proposed `ImagePicker.tsx`.**
- Persistence: `usePublishPost.ts` writes `image_url: form.imageUrl` onto `social_posts` (drives Zernio attachment).

### Blog (composer = `BlogPostEditor`)
- `BlogTab.tsx` → `BlogPostEditor.tsx`.
- **Image flow today:** `handleImageUpload()` uploads to **`tenant-assets`** at `<tenant>/blog/<timestamp>.<ext>` (NO resize, `upsert:true`, keeps original mime), `getPublicUrl` → `form.featured_image_url`.
- Save dual-writes `featured_image_url` + `intro_image` (S187.B47 mirror).

**Implication:** there are TWO independent upload paths with two buckets, two path conventions, two resize behaviors (social resizes, blog does not). The picker must plug into both `form.imageUrl` (social) and `form.featured_image_url` (blog). Recommend the picker emit a plain `{ url, storage_path }` and let each composer map it to its own field.

**Recommendation on the existing `ComposerImagePicker`:** do NOT replace it. Add a "Choose from Library" button alongside its existing Upload/Paste controls that opens the new library modal. Name the new modal distinctly (e.g. `ImageLibraryPicker.tsx` / `MediaPicker.tsx`) to avoid the collision.

---

## Probe 5 — AI image generation hook (future stub)

- **No AI image generation exists.** `ai_generated` on `social_posts` is purely a *caption* flag (set when `aiCaptions.length > 0`). No Flux/DALL·E/image-gen code anywhere.
- AI batch surfaces: `NewCampaignModal.tsx` (caption batches), `useComposer.generateCaptions()` (Claude `claude-sonnet-4-6` text only).
- **Stub plan:** future managed-services tier reads candidate images from `image_library` (filter `tenant_id`, `deleted_at IS NULL`, optional `folder`) to auto-attach. The `image_library` row shape (public URL derivable from `storage_path` + `bucket_id`) is sufficient for that future read. **No code in S237 — note the read contract in the spec only.**

---

## Probe 6 — Tier gate audit

- **Tier gating is driven by `gatedTabs` in `Dashboard.tsx`:** `{ blog: 2, seo: 2, social: 2, analytics: 2 }` + `canAccess()` from `PlanContext`. `media` is absent → **ungated → tier-1 (Starter) access by default.** This satisfies the "no tier-gate" requirement simply by NOT adding `media` to `gatedTabs`.
- **The kickoff's cited doc `pestflow-pro-pricing-features.md` does NOT exist in the repo** (grep found nothing). The authoritative tier source is `src/lib/pricingConfig.ts` + `gatedTabs`. `pricingConfig.ts` Starter (tier 1) features do **not** literally list "Media library" — so the "fulfills an existing tier-1 promise" framing is unverified. It doesn't matter for implementation (ungated is ungated), but **flag for Scott** so marketing copy isn't assumed.
- **Caveat for the QA "tier gate test":** Social and Blog tabs are themselves gated at tier 2. So a Starter tenant can open the **Media tab** but cannot reach the Social/Blog composers — the composer-picker integration is only exercisable at tier 2+. That is expected behavior, not a regression. QA test #8 should be reworded: *Starter sees Media tab; Starter does not see Social/Blog (pre-existing gate).*

---

## Probe 7 — Storage cost forecast

100 tenants × 30 images × ~2 MB post-resize ≈ **6 GB**. Supabase Pro includes 100 GB. **Negligible.** Real-world resized objects observed are 30–320 KB (well under 2 MB), so the true forecast is closer to **~1 GB**. Confirmed non-issue.

---

## Carry-forward verifications

- ✅ `current_tenant_id()` exists: `SECURITY DEFINER STABLE`, returns `uuid`, body = `SELECT tenant_id FROM public.profiles WHERE id = auth.uid()`. **This is the correct primitive for both the table RLS and the existing storage RLS** (the storage policies already use it). The validator-gate question "is `current_tenant_id()` the right primitive vs `requireTenantUser`?" resolves cleanly: they operate at **different layers** — `current_tenant_id()` for in-DB RLS (table + storage), `requireTenantUser` (C2, S213c-B) for the backfill **edge fn** auth. No conflict; use both in their own layers.
- ✅ Main HEAD is post-S236.5 merge (#118/#119 present in `git log`). Kickoff precondition met.
- ✅ `social-uploads` bucket exists — do not recreate (kickoff agrees).
- ✅ `require-pr.sh` hook active.

---

## Tier of remaining open decisions for Scott (resolve before/within Wave 2 spec)

| # | Decision | Recommendation |
|---|----------|----------------|
| D1 | Path convention | **Keep `<tenant>/social/` (or `<tenant>/library/`)** — do not adopt `<tenant>/<yyyy>/<mm>/`. Avoids forking the bucket + simplifies backfill. |
| D2 | Storage policies | **Add only `social-uploads` DELETE policy** (optional for v1 soft-delete). Do NOT recreate read/write — they exist. |
| D3 | Single vs multi-bucket library | **Add `bucket_id` column.** Media tab uploads → `social-uploads`. Blog hero picker reads library (incl. `tenant-assets` if backfilled). Decide whether to also backfill the 97 `tenant-assets` objects or only the 17 `social-uploads` objects. |
| D4 | Resize lib | **Reuse `resizeImage.ts`** (bump to 2048px); skip `browser-image-compression` unless multi-format/HEIC support is needed. |
| D5 | Picker component | **New `ImageLibraryPicker.tsx` modal** + add "Choose from Library" button to existing `ComposerImagePicker`; do not replace it. Rename to avoid the `ImagePicker` collision. |
| D6 | Nav placement | Kickoff's "after Testimonials, before Social" is **impossible** (actual order: …Blog, Social, Testimonials…). **Recommend Media between Blog and Social.** |
| D7 | Backfill scope | Backfill maps each of the 17 objects to its real tenant (Dang 5 / Demo 12), not all under Dang. Add `UNIQUE(storage_path)` so `ON CONFLICT` works. |
| D8 | Schema gaps | Add `UNIQUE (storage_path)` and `bucket_id`. |
| D9 | Insert/upload ordering | Upload → `getPublicUrl` → INSERT row. Orphan object (insert fails) is benign; orphan row (object missing) shows broken thumbnail. Order minimizes the bad case. |

---

## What did NOT turn up (clean)

- No schema collisions, no half-built scaffold, no conflicting migration.
- No public-RLS lockout risk (buckets public).
- No tier-gate landmine (media simply absent from `gatedTabs`).
- No security regression surface beyond the new table RLS (which is the validator-gate target).

**STOP. Awaiting Scott's review of this audit before drafting the Wave 2 spec.**
