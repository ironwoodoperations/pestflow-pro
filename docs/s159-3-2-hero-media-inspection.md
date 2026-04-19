# S159.3.2 — hero_media JSONB Inspection

_Generated: 2026-04-19. Read-only inspection seeding the T6 migration gate._

---

## Summary

- Tenants with hero_media rows: **5** (via `settings WHERE key = 'hero_media'`)
- Tenants with matching slug in `tenants` table: **3** (2 rows are orphaned / test tenants without a `tenants` row)
- Total unique keys observed: **8** (`mode`, `type`, `url`, `image_url`, `master_hero_image_url`, `thumbnail_url`, `video_url`, `youtube_id`)
- Keys actively **written** by current save handler: **7** (all except `type`)
- Keys with code **READ** references: 7 (`mode`, `url`, `image_url`, `master_hero_image_url`, `thumbnail_url`, `video_url`, `youtube_id`)
- Keys with **no write path** (legacy drift): **1** — `type`
- Candidate for DROP: **`type`** only (1 row, demo tenant, value `"image"`, not written by current code)

---

## Per-tenant dump

### Tenant: `cityshield-pest-defense`

```json
{
    "url": "",
    "mode": "image",
    "image_url": "",
    "video_url": "",
    "youtube_id": "",
    "thumbnail_url": "",
    "master_hero_image_url": ""
}
```

_All fields empty — provisioned with default blank state via `provision-tenant`. 7-key schema matches current save handler exactly._

---

### Tenant: `dang`

```json
{
    "youtube_id": "",
    "thumbnail_url": ""
}
```

_Old 2-key schema — written by an earlier version of the provisioning function before the full 7-key shape was standardized. Neither `mode` nor the image URL fields are present. Both values are empty strings._

---

### Tenant: `pestflow-pro` (Demo Tenant — `9215b06b-3eb5-49a1-a16e-7ff214bf6783`)

```json
{
    "url": "https://biezzykcgzkrwdgqpsar.supabase.co/storage/v1/object/public/tenant-assets/9215b06b.../hero.jpg?v=1776370065",
    "mode": "image",
    "type": "image",
    "image_url": "https://biezzykcgzkrwdgqpsar.supabase.co/storage/v1/object/public/tenant-assets/9215b06b.../hero.jpg?v=1776370065",
    "video_url": "",
    "youtube_id": "",
    "thumbnail_url": "https://biezzykcgzkrwdgqpsar.supabase.co/storage/v1/object/public/tenant-assets/9215b06b.../hero.jpg?v=1776370065",
    "master_hero_image_url": "https://biezzykcgzkrwdgqpsar.supabase.co/storage/v1/object/public/tenant-assets/9215b06b.../hero.jpg?v=1776370065"
}
```

_Live hero image set. Contains `type: "image"` (legacy key — see key analysis below). Also contains `?v=1776370065` cache-bust params in URL fields — the current save handler strips these (`cleanUrl = media.url.split('?v=')[0]`) so this row was written by an older code version. Both issues fix themselves on the next admin save._

---

### Tenants 4 & 5 (2 rows without slug match)

Not returned by the JOIN against `tenants`. These settings rows exist for tenants that don't have a corresponding `tenants` table row — likely Tyler Pest (`1abd6f30-...`) and one other test tenant. Their key distributions are counted in the aggregate queries (accounting for why `thumbnail_url` shows 5 and `youtube_id` shows 5), but their schema is unknown from this query. Both likely have the old 2-key or full 7-key blank provisioning schema.

---

## Per-key analysis

### Key: `mode`

- Present in: **2/3 named tenants** (cityshield, pestflow-pro); likely 2/5 total
- Value type: string
- Observed values: `"image"` (all occurrences — `"video"` never set in any live row)
- **Write sites:** `BrandingHeroMedia.tsx:83-84` — always written by `handleSave()` as either `"image"` or `"video"`
- **Read sites:**
  - `BrandingHeroMedia.tsx:38-44` — primary discriminator on load: `if (v?.mode === 'image')` / `else if (v?.mode === 'video')`
  - `resolveHeroImage.ts:5` — `if (heroMedia.mode === 'video') return null` — prevents showing video frame as image
- **Inferred purpose:** Primary discriminator between image hero and video hero. Controls which set of fields are active.
- **Disposition:** **KEEP** — core to the current architecture. Not in CLAUDE.md's key table but is actively written and read. Add to CLAUDE.md.

---

### Key: `type`

- Present in: **1/5 tenants** (pestflow-pro demo only)
- Value type: string
- Observed values: `"image"` (1 occurrence)
- **Write sites:** **NONE** — the current `handleSave()` does not write `type`. Never written by any current code path.
- **Read sites:**
  - `BrandingHeroMedia.tsx:45-48` — legacy fallback branch: `else if (v?.type)` — reads if `mode` is absent
- **Inferred purpose:** Legacy discriminator from an older version of the save handler that wrote `type` instead of `mode`. Superseded by `mode`. The fallback read path exists to handle old rows gracefully.
- **Disposition:** **DROP** from the 1 affected row (demo tenant). The legacy read fallback in `BrandingHeroMedia.tsx` can remain as harmless defense-in-depth — it only fires if `mode` is missing, which won't happen on any row once `type` is removed.

---

### Key: `url`

- Present in: **2/5 tenants** (cityshield, pestflow-pro)
- Value type: string
- Observed values: `""` (empty) and the supabase storage hero.jpg URL
- **Write sites:** `BrandingHeroMedia.tsx:83-84` — always written by `handleSave()` — set to `cleanUrl` for both image and video modes
- **Read sites:**
  - `BrandingHeroMedia.tsx:39` — third fallback: `v.master_hero_image_url || v.image_url || v.url || v.thumbnail_url`
  - `BrandingHeroMedia.tsx:43` — video mode fallback: `v.video_url || v.url || ''`
  - `resolveHeroImage.ts:9` — second candidate in resolver fallback chain
- **Inferred purpose:** Generic URL field — same value as `image_url` in image mode, same as `video_url` in video mode. Acts as a universal fallback so that any consumer with just `.url` can render something regardless of mode. Written by current code.
- **Note:** The `dang` tenant (old 2-key schema) does NOT have `url` — confirms it's a newer addition to the schema.
- **Disposition:** **KEEP** — written by current save handler, read as fallback. No rename needed.

---

### Key: `image_url`

- Present in: **2/5 tenants** (cityshield, pestflow-pro)
- Value type: string
- Observed values: `""` and the hero.jpg URL
- **Write sites:** `BrandingHeroMedia.tsx:83-84` — always written; set to `cleanUrl` in image mode, `''` in video mode
- **Read sites:**
  - `BrandingHeroMedia.tsx:39` — second choice: `v.master_hero_image_url || v.image_url || v.url`
  - `resolveHeroImage.ts:8` — **first** candidate in resolver (highest priority)
  - `getShellImage.ts:23` — `args.settings?.hero_media?.image_url?.trim()` — consumed by shell image picker for service-area and pest pages
- **Inferred purpose:** Primary image URL for shell rendering. First candidate in `resolveHeroImage`, consumed by `getShellImage`.
- **Disposition:** **KEEP** — actively consumed by shells. Rename would require coordinated shell + resolver updates.

---

### Key: `master_hero_image_url`

- Present in: **2/5 tenants** (cityshield, pestflow-pro)
- Value type: string
- Observed values: `""` and the hero.jpg URL
- **Write sites:** `BrandingHeroMedia.tsx:83-84` — written; set to `cleanUrl` in image mode, `''` in video mode
- **Read sites:**
  - `BrandingHeroMedia.tsx:39` — **highest priority** in load fallback chain
  - `getShellImage.ts:20` — `args.settings?.hero_media?.master_hero_image_url?.trim()` — checked **before** `image_url` in the shell image picker
- **Inferred purpose:** The "master" hero image used by `getShellImage.ts` for the "apply to all pages" feature — it is the canonical override URL when `apply_hero_to_all_pages` is true in branding settings. Semantically distinct from `image_url`: `master_hero_image_url` = the override for all pages, `image_url` = the hero page's own image.
- **Disposition:** **KEEP** — semantically important distinction from `image_url`. Critical to the apply-to-all-pages feature.

---

### Key: `thumbnail_url`

- Present in: **5/5 tenants** (all rows)
- Value type: string
- Observed values: `""` and the hero.jpg URL
- **Write sites:** `BrandingHeroMedia.tsx:83-84` — always written; set to `cleanUrl` in image mode, `''` in video mode
- **Read sites:**
  - `BrandingHeroMedia.tsx:49-50` — legacy load fallback when `mode` is absent (dang tenant path)
  - `resolveHeroImage.ts:10` — third fallback candidate in resolver
  - `src/shells/bold-local/ShellHero.tsx:19` — `useState<HeroMedia>({ thumbnail_url: cached.thumbnailUrl })`
  - `src/shells/bold-local/ShellHomeSections.tsx:40` — `const photoUrl = heroMedia.thumbnail_url`
  - `src/shells/rustic-rugged/ShellHero.tsx:35` — `useState<HeroMedia>({ thumbnail_url: cached.thumbnailUrl })`
  - `src/shells/metro-pro/ShellHero.tsx:24` — `useState<HeroMedia>({ thumbnail_url: cached.thumbnailUrl, youtube_id: ... })`
  - `src/shells/clean-friendly/ShellHero.tsx:32` — `useState<HeroMedia>({ thumbnail_url: cached.thumbnailUrl })`
- **Inferred purpose:** The shell-facing image URL. Most shell heroes read `thumbnail_url` directly for their `bg-image` CSS — they don't call `resolveHeroImage`. Also the only key present in the old dang 2-key schema, meaning it was the original/only image key before the schema expanded.
- **Disposition:** **KEEP** — most widely consumed key across shells. Present in all 5 rows.

---

### Key: `video_url`

- Present in: **2/5 tenants** (cityshield, pestflow-pro)
- Value type: string
- Observed values: `""` only (no live video in any tenant)
- **Write sites:** `BrandingHeroMedia.tsx:84` — written in video mode as `cleanUrl`; in image mode written as `''`
- **Read sites:**
  - `BrandingHeroMedia.tsx:43` — `v.video_url || v.url || ''` (video mode load)
  - `src/components/HeroVideoPlayer.tsx:21` — reads `hero_media` row, likely uses `video_url`
- **Inferred purpose:** URL for uploaded video files (MP4). Always empty in current data — video mode has never been used in production.
- **Disposition:** **KEEP** — written by current save handler, needed for video mode support. No data to migrate.

---

### Key: `youtube_id`

- Present in: **5/5 tenants** (all rows)
- Value type: string
- Observed values: `""` only (no YouTube video set in any tenant)
- **Write sites:** `BrandingHeroMedia.tsx:83-84` — always written; `youtubeId` for youtube video mode, `''` otherwise
- **Read sites:**
  - `BrandingHeroMedia.tsx:42,52-54` — `!!v.youtube_id` check; fallback load for old rows with youtube_id but no mode
  - `src/shells/metro-pro/ShellHero.tsx:24` — cached in state as `youtube_id`
- **Inferred purpose:** YouTube video ID (extracted from URL by `extractYouTubeId()`). Always empty in current data.
- **Disposition:** **KEEP** — written by current save handler, needed for YouTube video mode. Present in all 5 rows (including old dang schema).

---

## Admin write path

**Component:** `src/components/admin/settings/BrandingHeroMedia.tsx` (via `HeroMediaSection.tsx` → `SettingsTab.tsx`)

**Keys actively written by `handleSave()` (line 83-84):**

```typescript
// image mode:
{ mode: 'image', master_hero_image_url: cleanUrl, image_url: cleanUrl, url: cleanUrl, thumbnail_url: cleanUrl, video_url: '', youtube_id: '' }

// video mode (upload):
{ mode: 'video', master_hero_image_url: '', image_url: '', url: cleanUrl, video_url: cleanUrl, youtube_id: '', thumbnail_url: '' }

// video mode (youtube):
{ mode: 'video', master_hero_image_url: '', image_url: '', url: cleanUrl, video_url: cleanUrl, youtube_id: '<extracted_id>', thumbnail_url: '' }
```

**Keys NOT written by current save handler:** `type` — only in the demo tenant's row as legacy drift.

---

## Public read path

**Components:** `src/lib/resolveHeroImage.ts` + shell `ShellHero.tsx` files + `src/shells/_shared/getShellImage.ts`

**`resolveHeroImage.ts` — used by: `rustic-rugged/ShellHero`, `youpest/ShellHero`, `modern-pro/ShellHero`, `bold-local/ShellHero`, `metro-pro/ShellHero`**

Priority order:
1. `heroMedia.image_url` ← first candidate
2. `heroMedia.url` ← second
3. `heroMedia.thumbnail_url` ← third
4. Returns `null` if `heroMedia.mode === 'video'`

**`getShellImage.ts` — used by service-area pages and pest pages**

Priority order:
1. `hero_media.master_hero_image_url` ← checked first
2. `hero_media.image_url` ← checked second
3. Falls back to stock image

**Shell heroes that read `thumbnail_url` directly (bypass `resolveHeroImage`):**
- `bold-local/ShellHero.tsx` — `heroMedia.thumbnail_url` direct
- `bold-local/ShellHomeSections.tsx` — `heroMedia.thumbnail_url` direct
- `rustic-rugged/ShellHero.tsx` — seeds state with `thumbnail_url`, then calls `resolveHeroImage`
- `metro-pro/ShellHero.tsx` — seeds state with `thumbnail_url` + `youtube_id`
- `clean-friendly/ShellHero.tsx` — seeds state with `thumbnail_url`

---

## Canonical schema proposal

The **current `handleSave()` output is already the canonical schema**. No rename needed. The 7-key shape written today is:

```typescript
{
  mode: 'image' | 'video';              // Discriminator. Always present on any row saved by current code.
  master_hero_image_url: string;         // Override URL for apply-to-all-pages. Same value as image_url in image mode.
  image_url: string;                     // Primary image URL. First candidate in resolveHeroImage. Consumed by getShellImage.
  url: string;                           // Generic fallback URL. Same value as the active URL regardless of mode.
  thumbnail_url: string;                 // Shell-facing display URL. Consumed directly by most shell heroes.
  video_url: string;                     // Uploaded video file URL. Empty unless mode=video+upload.
  youtube_id: string;                    // YouTube video ID extracted from URL. Empty unless mode=video+youtube.
}
```

**Rationale:** All 7 keys are written atomically by the save handler on every save. `resolveHeroImage` and shell heroes have overlapping fallback chains because different tenants were saved at different historical schema versions — the redundancy is intentional and self-healing (any save normalizes to the full 7-key shape). The only action is removing the 8th legacy key (`type`) from the 1 row that has it.

---

## Migration implications

| Action | Key(s) | Rows affected | Complexity |
|---|---|---|---|
| **KEEP as-is** | mode, master_hero_image_url, image_url, url, thumbnail_url, video_url, youtube_id | — | None |
| **DROP** | `type` | 1 row (demo tenant `pestflow-pro`) | Trivial JSONB UPDATE |
| **No rename needed** | — | — | — |
| **Self-healing drift** (cache-bust params in URL values on demo tenant) | url, image_url, thumbnail_url, master_hero_image_url | 1 row | Resolves on next admin save; no explicit migration needed |
| **Backfill for dang tenant** | mode, image_url, master_hero_image_url, url, video_url | 1 row | Optional — add missing keys with empty strings so all rows have uniform 7-key shape |

**T6 migration total scope:** 2 JSONB UPDATEs on 2 rows. No code changes required.

---

## Ambiguities flagged for gate

1. **`url` vs `image_url` vs `thumbnail_url` redundancy:** In image mode all three hold the same value. The resolver tries them in series. This redundancy is intentional (backward compat with the old 2-key `dang` schema which only has `thumbnail_url`). The gate should confirm this is acceptable rather than consolidating.

2. **`dang` tenant 2-key schema:** Should the T6 migration backfill the missing 5 keys (`mode`, `image_url`, `master_hero_image_url`, `url`, `video_url`) with empty strings for uniformity? Or leave it as-is since the load path handles it gracefully? Gate question: is schema uniformity required for future type-safety enforcement?

3. **`type` legacy fallback code in BrandingHeroMedia.tsx:** After dropping `type` from the 1 DB row, the `else if (v?.type)` branch (lines 45-48) becomes dead code. Leave it or remove it? Low-risk either way — gate should confirm preference.

4. **`mode` not in CLAUDE.md:** The canonical settings key table in CLAUDE.md shows `hero_media` with keys `youtube_id, video_url, thumbnail_url, master_hero_image_url, image_url` — `mode`, `url`, and `type` are all absent. The gate should confirm that CLAUDE.md gets updated as part of T6 completion.

---

_End of inspection. 7 checks completed. No mutations performed._
