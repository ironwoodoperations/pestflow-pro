# S237b — Composer Wiring — Wave 1 Death Audit

**Session:** S237b
**Date:** 2026-05-26
**Branch:** `claude/modest-einstein-aodiq` (reset to S237a merge `2ae7f01`)
**Author:** Claude Code (Web)
**Status:** Wave 1 complete — STOP-AND-REPORT. Spec NOT drafted pending Scott review.
**Scope:** Wire the shipped `image_library` into the social composer + blog editor via a new `ImageLibraryPicker` modal. No backend, no RLS, no migration.

---

## TL;DR

Pure UI composition. The integration points are clean and the shipped hook already does more than the kickoff assumed. **One material correction to the kickoff's spec assumptions:** the `useImageLibrary` hook does **not** expose `list(folder?)` or `folders()` functions — it auto-loads and exposes `items` (an array where **each row already carries a derived `publicUrl`**), `folders` (an **array**, not a method), `loading`, and `refresh`. The picker consumes those directly; folder-filter and search are client-side over `items`. No backend work, validator gate correctly waived.

---

## Probe 1 — Shipped `useImageLibrary.ts` shape

`useImageLibrary()` returns:

| Export | Type | Notes |
|--------|------|-------|
| `items` | `ImageLibraryItem[]` | Auto-loaded on mount; **each item already has `publicUrl`** (derived via `getPublicUrl(bucket_id, storage_path)`). |
| `loading` | `boolean` | For skeletons. |
| `error` | `string \| null` | |
| `refresh()` | `() => Promise<void>` | Re-fetch. |
| `upload`, `uploadMany`, `softDelete`, `setFolder` | mutations | Not needed by the picker. |
| `folders` | `string[]` | **An array, not a function.** Distinct non-null folders, sorted. |

`ImageLibraryItem` (exported) fields: `id, tenant_id, bucket_id, storage_path, original_filename, mime_type, size_bytes, width, height, folder, created_at, publicUrl`.

**Divergences from kickoff assumptions (correct these in the spec):**
- ❌ No `list(folder?)` function → use `items` directly; filter by folder client-side.
- ❌ No `folders()` method → `folders` is already an array.
- ✅ Active-row filter is client-side: `.is('deleted_at', null)` in the hook's query (line 57) — the picker does **not** need to filter deleted rows again.
- ✅ Public URL is **pre-derived** by the hook — the picker does **not** call `getPublicUrl`; it just reads `item.publicUrl`.

**Picker fetch freshness:** the hook fetches on mount (`useEffect`). So the picker should be **mounted only while open** (or call `refresh()` on open) so images uploaded in the Media tab during the same session appear without a page reload. Recommend conditional mount (`{open && <ImageLibraryPicker .../>}`) — simplest, and the modal owns its own hook instance.

---

## Probe 2 — `ComposerImagePicker.tsx` (social integration point)

Current shape (unchanged since S237a): a "Photo" card with **📁 Upload Photo**, **⬇ Download Template**, **Or paste image URL** input, and a preview.

Props:
```ts
{ imageUrl: string; onImageUrlChange: (v: string) => void;
  onFileUpload?: (file: File) => void; uploadState?: UploadState; previewUrl?: string }
```
- Selected image lands in `imageUrl` via `onImageUrlChange`.
- The preview (`displayPreview = imageUrl || previewUrl`) renders whatever URL is set — so a library selection shows automatically.

**Integration (additive, fallback preserved):** add a **"Choose from Library"** button in the button row; on select call `onImageUrlChange(item.publicUrl)`. The paste-URL input and upload path remain untouched. Modal open/close = local `useState` in `ComposerImagePicker`. Add an "X" on the preview that calls `onImageUrlChange('')` to clear (currently there's no clear affordance — minor UX add).

Consumer chain: `LegacyComposer` → `useComposer` (`form.imageUrl`) → `ComposerImagePicker`. `LegacyComposer` is the only consumer. `usePublishPost` persists `image_url: form.imageUrl` → drives Zernio attachment. No change needed there.

---

## Probe 3 — `BlogPostEditor.tsx` (blog integration point)

Featured-image section (lines 237–253):
- Field: **`form.featured_image_url`** (string).
- Setter: `setForm(p => ({ ...p, featured_image_url: <url> }))`.
- When set: shows thumbnail + "Remove" (clears to `''`).
- When empty: "Upload image" file input → `handleImageUpload` (uploads to `tenant-assets`, sets `featured_image_url`).
- On save: dual-writes `featured_image_url` + `intro_image` (S187.B47 mirror) — unchanged by this work.

**Integration (additive):** in the empty-state branch, add a **"Choose from Library"** button next to "Upload image"; on select call `setForm(p => ({ ...p, featured_image_url: item.publicUrl }))`. Existing preview/Remove already handle display + clear. The `tenant-assets` upload path stays as-is (note: library images come from `social-uploads`, blog uploads still go to `tenant-assets` — both public, both render fine as a hero URL).

---

## Probe 4 — AI auto-attach contract (doc-only)

Future managed-services read:
```sql
SELECT id, storage_path, bucket_id FROM image_library
WHERE tenant_id = current_tenant_id() AND deleted_at IS NULL [AND folder = $1]
ORDER BY created_at DESC;
```
The shipped row shape supports this directly (and the client equivalent is already `useImageLibrary().items`). **S237b action: add this as a comment in `useImageLibrary.ts`. No code.**

---

## Probe 5 — Naming collision

`find src -iname "ImageLibrary*" -o -iname "*LibraryPicker*"` → **none.** `ImageLibraryPicker` is safe. (`ComposerImagePicker` is distinct and stays.)

---

## Probe 6 — Public URL derivation

`social-uploads` is public (S237a confirmed). `getPublicUrl` returns a public, unsigned URL. The hook already derives `item.publicUrl` for every row, so the picker passes a public URL downstream — correct for both social (`image_url` → Zernio) and blog (`featured_image_url` → public site). No signed-URL concern.

---

## Probe 7 — Composer state shape (both surfaces)

| Surface | Field | How picker sets it |
|---------|-------|--------------------|
| Social (`LegacyComposer`/`useComposer`) | `form.imageUrl` | `onImageUrlChange(item.publicUrl)` (via `ComposerImagePicker`) |
| Blog (`BlogPostEditor`) | `form.featured_image_url` | `setForm(p => ({ ...p, featured_image_url: item.publicUrl }))` |

Both are plain string URL fields set through existing setters — the picker bypasses nothing.

---

## Proposed `onSelect` signature (correction)

Kickoff spec says `onSelect: (publicUrl, row: ImageLibraryRow)`. The exported type is **`ImageLibraryItem`** (the `ImageLibraryRow` alias is private to the hook). Use:
```ts
onSelect: (publicUrl: string, item: ImageLibraryItem) => void
```
Since `item.publicUrl === publicUrl`, the first arg is a convenience; both surfaces only need the URL.

---

## Decisions for Scott (resolve before/within Wave 2 spec)

| # | Item | Recommendation |
|---|------|----------------|
| D1 | Hook API mismatch | Picker consumes `items`/`folders`/`loading` from `useImageLibrary()` directly; **no hook signature change** (kickoff's "no behavior change" holds — only an AI-contract comment is added). |
| D2 | Picker freshness | Conditionally mount the modal (`{open && …}`) so it re-fetches on each open. |
| D3 | `onSelect` type | Use exported `ImageLibraryItem`, not the private `ImageLibraryRow`. |
| D4 | Clear affordance on social | Add an "X" to the social preview (`onImageUrlChange('')`) — small UX gap today. |
| D5 | Empty-state link | "Upload one in the Media tab" → the Media tab is keyed `media` in `Dashboard` tabs; there is **no standalone `/admin/media` route** (admin is a single `/admin` shell with `activeTab` state). A hard link to `/admin/media` won't work. Recommend the empty state just instruct the user verbally (no router link) OR fire an `onNavigateToMedia` callback if we want a working button. **Flag — kickoff assumed a `/admin/media` route that doesn't exist.** |

---

## Clean / no surprises

- No new RLS, migration, edge fn, or auth surface → **validator gate correctly WAIVED** (document in PR).
- No protected paths touched.
- Tier behavior unchanged: composers are tier-2-gated; Media tab tier-1. Picker only reachable where composers are.
- Single bucket (`social-uploads`); `tenant-assets` integration remains deferred (S237a D3).

**STOP. Awaiting Scott's review of this audit before drafting the Wave 2 spec.**
