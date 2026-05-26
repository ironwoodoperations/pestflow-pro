# S237b — Composer Wiring — Wave 2 Spec

**Session:** S237b
**Date:** 2026-05-26
**Branch:** `claude/modest-einstein-aodiq`
**Author:** Claude Code (Web)
**Status:** Wave 2 FINAL. Validator gate **WAIVED** (no RLS / migration / auth / payments). Proceeding to Wave 3.
**Predecessor:** `docs/audits/s237b-composer-wiring-audit.md`

---

## 0. Scott's Wave-1 decisions (locked)

| Ref | Decision |
|-----|----------|
| D1 | Picker consumes `useImageLibrary()` directly (`items`, `folders`, `loading`, `refresh`). **No hook signature change** — only an AI-contract comment is added. |
| D2 | Picker is **conditionally mounted** (`{open && <ImageLibraryPicker/>}`) so it re-fetches on each open. |
| D3 | `onSelect` row type = exported `ImageLibraryItem`. |
| D4 | Add an "X" clear affordance to the social composer preview. |
| D5 | **Empty state = text-only** ("No images yet. Upload photos in the Media tab."). No button, no `/admin/media` link. |

---

## 1. Component — `src/components/admin/social/ImageLibraryPicker.tsx`

```ts
import type { ImageLibraryItem } from '../../../hooks/useImageLibrary'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (publicUrl: string, item: ImageLibraryItem) => void
  initialFolder?: string | null
}
```

Behavior:
- Render nothing when `!open` (caller conditionally mounts, but guard internally too).
- Modal overlay (`fixed inset-0 z-50 bg-black/50`), centered white panel. Click backdrop → `onClose`. `Escape` key → `onClose` (window keydown listener while open).
- Calls `useImageLibrary()` internally → `items`, `folders`, `loading`. (Tenant scoping is automatic via the hook's RLS-filtered query.)
- **Header:** folder `<select>` (All / Unfiled / each of `folders`) + search `<input>` (filters `items` by `original_filename`, case-insensitive substring). Local `useState` for `folderFilter` (seeded from `initialFolder`) and `query`.
- **Body grid:** `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3` matching MediaTab. Each cell: `<img src={item.publicUrl}>` `object-cover aspect-square`, hover highlight (`ring-2 ring-emerald-500`). Click → `onSelect(item.publicUrl, item)` then `onClose()`.
- **Loading:** while `loading`, render ~8 skeleton tiles (`animate-pulse bg-gray-100`).
- **Empty (not loading, filtered list empty):** centered text "No images yet. Upload photos in the Media tab." (no button per D5). If the empty is due to search/filter (items exist but none match), show "No matches." instead.
- Single-select only. No multi-select, no upload, no delete (Media tab owns those).

No `getPublicUrl` call — `item.publicUrl` is pre-derived by the hook.

---

## 2. Integration — `ComposerImagePicker.tsx` (social)

- Add local `const [pickerOpen, setPickerOpen] = useState(false)`.
- Add a **"🖼️ Choose from Library"** button in the existing button row (next to Upload Photo / Download Template).
- Render `{pickerOpen && <ImageLibraryPicker open onClose={() => setPickerOpen(false)} onSelect={(url) => { onImageUrlChange(url); setPickerOpen(false) }} />}`.
- The existing `displayPreview` already renders `imageUrl`, so a library pick shows immediately.
- **D4:** add a small "✕ Clear" control near the preview that calls `onImageUrlChange('')` (also clears any blob preview by leaving `previewUrl` alone — `imageUrl=''` makes `displayPreview` fall back to `previewUrl`; acceptable, the upload preview is transient).
- Paste-URL input + Upload Photo path untouched (fallback preserved).

No prop changes to `ComposerImagePicker` — it already has `imageUrl`/`onImageUrlChange`. (`useComposer` wiring unchanged.)

---

## 3. Integration — `BlogPostEditor.tsx` (blog hero)

- Add local `const [pickerOpen, setPickerOpen] = useState(false)`.
- In the **Featured Image** empty-state branch (currently only "Upload image"), add a **"🖼️ Choose from Library"** button beside it.
- `{pickerOpen && <ImageLibraryPicker open onClose={...} onSelect={(url) => { setForm(p => ({ ...p, featured_image_url: url })); setPickerOpen(false) }} />}`.
- Existing thumbnail + "Remove" (when `featured_image_url` set) already handle display/clear — no change.
- `tenant-assets` upload path stays as-is. Library images (from `social-uploads`, public) render fine as a hero URL.
- Import `ImageLibraryPicker` from `./social/ImageLibraryPicker`.

---

## 4. AI auto-attach contract (doc-only)

Add a comment block to `useImageLibrary.ts` (no code change):
```
// AI auto-attach (future managed-services tier, S242/S243): read candidate
// images via this hook's `items` (already tenant-scoped, deleted_at filtered),
// equivalent to:
//   SELECT id, storage_path, bucket_id FROM image_library
//   WHERE tenant_id = current_tenant_id() AND deleted_at IS NULL [AND folder = $1]
//   ORDER BY created_at DESC;
// Derive the public URL via getPublicUrl(bucket_id, storage_path); set
// social_posts.image_url / blog_posts.featured_image_url accordingly.
```

---

## 5. Files

- **New:** `src/components/admin/social/ImageLibraryPicker.tsx`
- **Modified:** `src/components/admin/social/ComposerImagePicker.tsx` (button + modal + clear)
- **Modified:** `src/components/admin/BlogPostEditor.tsx` (hero "Choose from Library" + modal)
- **Modified:** `src/hooks/useImageLibrary.ts` (AI-contract comment only)
- **None:** no migration, edge fn, RLS, route.

---

## 6. QA plan (Wave 4)

Browser QA (upload/select/render) needs the running app + Doppler — exercised by Scott on `dang.pestflowpro.ai/admin` post-merge. CC Web verifies: type-check + build green; picker reads `items` (RLS already proven tenant-isolated in S237a — Dang 5 / Demo 12); fallback URL path unchanged; no protected paths touched. QA tests #1–#10 from the kickoff map to the browser pass.

---

**Validator gate WAIVED — documented in PR. Proceeding to Wave 3 implementation.**
