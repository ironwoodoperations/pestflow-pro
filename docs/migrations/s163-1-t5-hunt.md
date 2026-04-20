# S163.1 — T5 page_content image column hunt

Raw grep: 133 lines across src/ + supabase/functions/ + shared/ + docs/
Non-doc lines (src + edge functions + shared): 75
Docs lines (DEAD): 58

---

## Summary counts

| Column              | Reads | Writes | Types | Helpers | Dead | Ignored | Total |
|---------------------|------:|-------:|------:|--------:|-----:|--------:|------:|
| image_url           |    16 |      1 |     6 |       2 |   38 |      30 |    93 |
| image_urls          |    10 |      1 |     1 |       0 |    7 |       0 |    19 |
| page_hero_image_url |     5 |      3 |     2 |       0 |    3 |       0 |    13 |
| image_1_url         |     4 |      1 |     2 |       0 |    3 |       0 |    10 |
| image_2_url         |     3 |      1 |     1 |       0 |    3 |       0 |     8 |
| image_3_url         |     3 |      1 |     1 |       0 |    4 |       0 |     9 |
| image_4_url         |     0 |      0 |     0 |       0 |    5 |       0 |     5 |
| image_5_url         |     0 |      0 |     0 |       0 |    3 |       0 |     3 |
| image_6_url         |     0 |      0 |     0 |       0 |    5 |       0 |     5 |
| (helpers)           |     — |      — |     — |       2 |    — |       — |     2 |

**Totals notes:**
- `image_url` Ignored=30 splits as: 13 hero_media JSONB key (not page_content), 17 social_posts table (unrelated)
- `image_url` Dead=38: all in docs/ files (stale analysis from S159.3a inventory)
- `image_4_url / image_5_url / image_6_url`: zero source code hits. Docs-only mentions. Safe DROP candidates.
- `(helpers)` row: 2 resolveHeroImage definitions (src + shared). Callers listed in Helper Inventory below.
- Multiple columns often appear on the same line (e.g. ContentTab.tsx:84 touches 5 columns). Column totals add up to 165 across 75 unique non-doc lines — expected due to multicolumn lines.

---

## Dang shell hits (src/shells/dang/** — FREEZE RULE FLASHPOINT)

Two hits under `src/shells/dang/`. Both are READs of `page_content.image_url` consumed via the `usePageContent('home')` hook.

- `src/shells/dang/HeroSection.tsx:135` — [READ] — `image_url` — `src={(content?.image_url || DEFAULT_THUMBNAIL)}` — thumbnail fallback for video poster (static img before user clicks play)
- `src/shells/dang/HeroSection.tsx:162` — [READ] — `image_url` — `poster={(content?.image_url || DEFAULT_THUMBNAIL)}` — HTML video element poster attribute

**Freeze-rule implication:** Dang shell reads `page_content.image_url` for its video thumbnail/poster. If `image_url` is dropped or renamed as part of T5, these two lines MUST be updated to the new canonical field before the DDL runs. This is the highest-risk dang-freeze interaction in T5.

---

## Edge function hits (supabase/functions/**)

10 total lines across 3 functions.

- `supabase/functions/provision-tenant/index.ts:255` — [IGNORE] — `image_url` — `value: { ..., image_url: '', ... }` — seeds hero_media JSONB key in settings table; NOT page_content column
- `supabase/functions/publish-scheduled-posts/index.ts:40` — [IGNORE] — `image_url` — type def for `social_posts.image_url`; unrelated table
- `supabase/functions/publish-scheduled-posts/index.ts:87` — [IGNORE] — `image_url` — `.select('... image_url ...')` on social_posts; unrelated table
- `supabase/functions/publish-scheduled-posts/index.ts:146` — [IGNORE] — `image_url` — `post.image_url` read from social_posts
- `supabase/functions/publish-scheduled-posts/index.ts:192` — [IGNORE] — `image_url` — `post.image_url` read from social_posts
- `supabase/functions/publish-scheduled-posts/index.ts:231` — [IGNORE] — `image_url` — `post.image_url` read from social_posts
- `supabase/functions/publish-scheduled-posts/index.ts:234` — [IGNORE] — `image_url` — `post.image_url` read from social_posts
- `supabase/functions/publish-scheduled-posts/index.ts:235` — [IGNORE] — `image_url` — `post.image_url` read from social_posts
- `supabase/functions/run-migration/index.ts:17` — [DEAD] — `image_urls` — comment: `// Add image_urls column to page_content` — orphaned migration runner (comment at top says "delete after use")
- `supabase/functions/run-migration/index.ts:18` — [DEAD] — `image_urls` — `ALTER TABLE page_content ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'` — orphaned migration DDL; column already applied

**Summary:** 8 IGNORE (provision-tenant writes hero_media settings, publish-scheduled-posts touches social_posts). 2 DEAD (run-migration orphan). Zero active page_content column reads or writes in edge functions.

---

## Per-column inventory

### image_url

#### Reads (page_content context)
- `src/components/PestPageTemplate.tsx:44` — `.select('title, subtitle, intro, image_url, image_urls')` from page_content
- `src/components/PestPageTemplate.tsx:47` — `image_url: pageRes.data.image_url || ''` — destructuring into state
- `src/components/PestPageTemplate.tsx:57` — `content.image_url` — fallback after `image_urls?.[0]` in pestImg derivation
- `src/components/admin/ContentTab.tsx:84` — `.select('..., image_url, ...')` load on slug change
- `src/components/admin/ContentTab.tsx:87` — `image_url: d?.image_url || ''` — setForm
- `src/components/admin/ContentTab.tsx:160` — `.select('title, subtitle, intro, video_url, image_url')` — snapshot read before save
- `src/components/admin/ContentTab.tsx:207` — `image_url: orig.image_url || ''` — revert path, reads from page_snapshot data
- `src/components/admin/ContentPageForm.tsx:114` — `.select('page_hero_image_url, image_url')` — HeroImageUpload component init
- `src/components/admin/ContentPageForm.tsx:118` — `d?.page_hero_image_url || d?.image_url || null` — sets currentUrl; image_url is fallback
- `src/shells/_shared/getShellImage.ts:17` — `args.pageContent?.image_url?.trim()` — second fallback after image_1_url
- `src/hooks/usePageHeroImage.ts:35` — `.select('image_url')` from page_content
- `src/hooks/usePageHeroImage.ts:39` — `pageRes.data?.image_url ?? null` — pageImg for per-page hero resolution
- `src/shells/dang/HeroSection.tsx:135` — `content?.image_url || DEFAULT_THUMBNAIL` — img src (DANG FREEZE)
- `src/shells/dang/HeroSection.tsx:162` — `content?.image_url || DEFAULT_THUMBNAIL` — video poster attr (DANG FREEZE)
- `src/shells/modern-pro/ShellHomeSections.tsx:44` — `aboutContent?.image_url` — about section image (reads page_content about row)
- `src/shells/clean-friendly/ShellHomeSections.tsx:44` — `aboutContent?.image_url` — same pattern, clean-friendly shell

#### Writes (page_content context)
- `src/components/admin/ContentTab.tsx:170` — `image_url: form.pageHeroImageUrl || form.image_url || ''` — upsert payload; backfills legacy column from pageHeroImageUrl or form state

#### Types (page_content context)
- `src/components/PestPageTemplate.tsx:37` — `useState({ ..., image_url: '', ... })` — local state shape mirroring page_content row
- `src/components/admin/ContentTab.tsx:24` — `interface ContentForm { ...; image_url: string; ... }` — form interface
- `src/components/admin/ContentTab.tsx:25` — `EMPTY_FORM: ContentForm = { ..., image_url: '', ... }` — empty form constant
- `src/components/admin/ContentPageForm.tsx:7` — `interface ContentForm { ...; image_url: string; ... }` — duplicate type in sibling component
- `src/components/admin/ContentPageForm.tsx:117` — `data as { page_hero_image_url?: string | null; image_url?: string | null } | null` — inline type cast
- `src/shells/_shared/getShellImage.ts:4` — `image_url?: string | null` — pageContent arg type

#### Helpers
- `src/lib/resolveHeroImage.ts:8` — `heroMedia.image_url` — reads from hero_media JSONB object; this function does NOT touch page_content directly
- `shared/lib/resolveHeroImage.ts:8` — same function, duplicate in shared/ for edge function use

#### Dead
- `docs/s159-3-2-hero-media-inspection.md` — 25 lines mentioning image_url (all analysis from prior S159 session)
- `docs/migrations/s159-3-3-t6-hero-media-type-drop.md` — 3 lines (T6 type-drop doc)
- `docs/s159-3a-inventory.md` — 10 lines referencing image_url stats and code ref counts

#### Ignored (not page_content)
Hero_media JSONB key (settings table, T6 scope — already resolved):
- `src/components/admin/settings/BrandingHeroMedia.tsx:39` — reads hero_media.image_url
- `src/components/admin/settings/BrandingHeroMedia.tsx:79` — writes hero_media settings JSONB (image mode)
- `src/components/admin/settings/BrandingHeroMedia.tsx:80` — writes hero_media settings JSONB (video mode)
- `src/shells/_shared/getShellImage.ts:8` — `hero_media?: { image_url?: ... }` — type for settings arg
- `src/shells/_shared/getShellImage.ts:23` — `args.settings?.hero_media?.image_url?.trim()` — reads settings.hero_media.image_url
- `src/shells/rustic-rugged/ShellHero.tsx:16` — `interface HeroMedia { ...; image_url?: string }` — local type for hero_media value
- `src/shells/youpest/ShellHero.tsx:9` — HeroMedia interface
- `src/shells/youpest/ShellHero.tsx:17` — `useState<HeroMedia>({ image_url: cached.imageUrl })` — hero_media init from cache
- `src/shells/modern-pro/ShellHero.tsx:18` — HeroMedia interface
- `src/shells/bold-local/ShellHero.tsx:12` — HeroMedia interface
- `src/shells/metro-pro/ShellHero.tsx:11` — HeroMedia interface
- `src/shells/clean-friendly/ShellHero.tsx:12` — HeroMedia interface
- `supabase/functions/provision-tenant/index.ts:255` — seeds hero_media settings key `image_url: ''`

Social_posts table (wholly unrelated to page_content migration):
- `src/components/admin/social/useSocialData.ts:12` — `image_url: string | null` type in social post interface
- `src/components/admin/social/PostPreviewModal.tsx:66` — `post.image_url` conditional render
- `src/components/admin/social/PostPreviewModal.tsx:67` — `post.image_url` img src
- `src/components/admin/social/PostPreviewModal.tsx:87` — `post.image_url` ternary
- `src/components/admin/social/PostPreviewModal.tsx:88` — `post.image_url` img src
- `src/components/admin/social/PostCard.tsx:47` — `post.image_url` conditional
- `src/components/admin/social/PostCard.tsx:48` — `post.image_url` img src
- `src/components/admin/social/usePublishPost.ts:25` — `image_url: form.imageUrl || null` in insert payload
- `src/components/admin/social/usePublishPost.ts:42` — same, sent status
- `src/components/admin/social/usePublishPost.ts:58` — same, draft status
- `supabase/functions/publish-scheduled-posts/index.ts:40` — type def
- `supabase/functions/publish-scheduled-posts/index.ts:87` — .select()
- `supabase/functions/publish-scheduled-posts/index.ts:146` — `post.image_url` read
- `supabase/functions/publish-scheduled-posts/index.ts:192` — `post.image_url` read
- `supabase/functions/publish-scheduled-posts/index.ts:231` — `post.image_url` read
- `supabase/functions/publish-scheduled-posts/index.ts:234` — `post.image_url` read
- `supabase/functions/publish-scheduled-posts/index.ts:235` — `post.image_url` in object literal

---

### image_urls

#### Reads
- `src/components/PestPageTemplate.tsx:44` — `.select('..., image_urls')` from page_content
- `src/components/PestPageTemplate.tsx:47` — `image_urls: pageRes.data.image_urls || []` into state
- `src/components/PestPageTemplate.tsx:57` — `content.image_urls?.[0]` — primary pestImg source (first priority)
- `src/components/PestPageTemplate.tsx:58` — `content.image_urls?.[1]` — pestImg2
- `src/components/admin/ContentPageForm.tsx:43` — `.select('image_1_url, image_2_url, image_3_url, image_urls')` — legacy fallback init
- `src/components/admin/ContentPageForm.tsx:47` — `data?.image_urls?.[index]` — reads legacy image_urls array as fallback for numbered slots
- `src/pages/Index.tsx:32` — `.select('title, subtitle, image_urls')` from page_content home row
- `src/pages/Index.tsx:39` — `pageRes.data.image_urls?.[0]` — heroImageUrl for non-shell home page
- `src/pages/About.tsx:30` — `.select('title, subtitle, image_urls')` from page_content about row
- `src/pages/About.tsx:35` — `pageRes.data?.image_urls?.[0]` → setAboutImage

#### Writes
- `src/components/admin/ContentTab.tsx:171` — `image_urls: [form.image1Url, form.image2Url, form.image3Url].filter(Boolean)` — upsert payload; derives image_urls from numbered slots

#### Types
- `src/components/PestPageTemplate.tsx:37` — `useState({ ..., image_urls: [] as string[] })` — local state shape

#### Dead
- `supabase/functions/run-migration/index.ts:17` — `// Add image_urls column to page_content` — orphaned migration runner comment
- `supabase/functions/run-migration/index.ts:18` — `ALTER TABLE page_content ADD COLUMN IF NOT EXISTS image_urls` — orphaned DDL; column already exists
- `docs/s159-3a-inventory.md:22` — stats table row
- `docs/s159-3a-inventory.md:313` — column inventory row
- `docs/s159-3a-inventory.md:345` — narrative about image_urls
- `docs/s159-3a-inventory.md:349` — narrative
- `docs/s159-3a-inventory.md:362` — note about default value

---

### page_hero_image_url

#### Reads
- `src/components/admin/ContentTab.tsx:84` — `.select('..., page_hero_image_url, ...')` on slug change
- `src/components/admin/ContentTab.tsx:87` — `pageHeroImageUrl: d?.page_hero_image_url || ''` into form
- `src/components/admin/ContentPageForm.tsx:114` — `.select('page_hero_image_url, image_url')` in HeroImageUpload init
- `src/components/admin/ContentPageForm.tsx:118` — `d?.page_hero_image_url || d?.image_url || null` — primary choice for display
- `src/shells/_shared/getShellImage.ts:14` — `args.pageContent?.page_hero_image_url?.trim()` — first priority in shell image resolution

#### Writes
- `src/components/admin/ContentTab.tsx:166` — `page_hero_image_url: form.pageHeroImageUrl || null` in upsert payload
- `src/components/admin/ContentPageForm.tsx:132` — `{ ..., page_hero_image_url: publicUrl }` — upsert after upload
- `src/components/admin/ContentPageForm.tsx:142` — `{ ..., page_hero_image_url: '' }` — upsert on remove

#### Types
- `src/components/admin/ContentPageForm.tsx:117` — inline cast: `{ page_hero_image_url?: string | null; image_url?: string | null } | null`
- `src/shells/_shared/getShellImage.ts:3` — `page_hero_image_url?: string | null` in pageContent Args type

#### Dead
- `docs/s159-3a-inventory.md:22` — stats table (ref count: 10)
- `docs/s159-3a-inventory.md:314` — column inventory row (2 non-null, 10 code refs)
- `docs/s159-3a-inventory.md:347` — narrative

---

### image_1_url

#### Reads
- `src/components/admin/ContentTab.tsx:84` — `.select('..., image_1_url, ...')`
- `src/components/admin/ContentTab.tsx:87` — `image1Url: d?.image_1_url || ''`
- `src/components/admin/ContentPageForm.tsx:43` — `.select('image_1_url, image_2_url, image_3_url, image_urls')`
- `src/shells/_shared/getShellImage.ts:17` — `args.pageContent?.image_1_url?.trim()` — second priority after page_hero_image_url

#### Writes
- `src/components/admin/ContentTab.tsx:167` — `image_1_url: form.image1Url || null` in upsert payload

#### Types
- `src/components/admin/ContentPageForm.tsx:15` — `const IMAGE_COL = ['image_1_url', 'image_2_url', 'image_3_url'] as const`
- `src/shells/_shared/getShellImage.ts:5` — `image_1_url?: string | null` in pageContent Args type

#### Dead
- `docs/s159-3a-inventory.md:315` — column inventory (2 non-null, 7 code refs)
- `docs/s159-3a-inventory.md:348` — narrative
- `docs/s159-3a-inventory.md:602` — note about extra columns vs spec

---

### image_2_url

#### Reads
- `src/components/admin/ContentTab.tsx:84` — `.select('..., image_2_url, ...')`
- `src/components/admin/ContentTab.tsx:87` — `image2Url: d?.image_2_url || ''`
- `src/components/admin/ContentPageForm.tsx:43` — `.select('..., image_2_url, ...')`

#### Writes
- `src/components/admin/ContentTab.tsx:168` — `image_2_url: form.image2Url || null` in upsert

#### Types
- `src/components/admin/ContentPageForm.tsx:15` — IMAGE_COL const (contains 'image_2_url')

#### Dead
- `docs/s159-3a-inventory.md:316` — column inventory (0 non-null)
- `docs/s159-3a-inventory.md:349` — narrative
- `docs/s159-3a-inventory.md:356` — "Code cleanup then DROP" recommendation

---

### image_3_url

#### Reads
- `src/components/admin/ContentTab.tsx:84` — `.select('..., image_3_url, ...')`
- `src/components/admin/ContentTab.tsx:87` — `image3Url: d?.image_3_url || ''`
- `src/components/admin/ContentPageForm.tsx:43` — `.select('..., image_3_url, ...')`

#### Writes
- `src/components/admin/ContentTab.tsx:169` — `image_3_url: form.image3Url || null` in upsert

#### Types
- `src/components/admin/ContentPageForm.tsx:15` — IMAGE_COL const (contains 'image_3_url')

#### Dead
- `docs/s159-3a-inventory.md:317` — column inventory (0 non-null)
- `docs/s159-3a-inventory.md:349` — narrative
- `docs/s159-3a-inventory.md:356` — "Code cleanup then DROP" recommendation
- `docs/s159-3a-inventory.md:602` — note about extra columns

---

### image_4_url

Zero source code hits. Docs only.

#### Dead
- `docs/s159-3a-inventory.md:318` — column inventory (0 non-null, 0 code refs)
- `docs/s159-3a-inventory.md:350` — "image_4_url through image_6_url: 0 non-null, 0 code refs — pure orphans"
- `docs/s159-3a-inventory.md:355` — "Safe DROP (no risk): image_4_url, image_5_url, image_6_url"
- `docs/s159-3a-inventory.md:561` — disposition table: DROP
- `docs/s159-3a-inventory.md:602` — extra columns note

---

### image_5_url

Zero source code hits. Docs only.

#### Dead
- `docs/s159-3a-inventory.md:319` — column inventory (0 non-null, 0 code refs)
- `docs/s159-3a-inventory.md:355` — Safe DROP mention
- `docs/s159-3a-inventory.md:562` — disposition table: DROP

---

### image_6_url

Zero source code hits. Docs only.

#### Dead
- `docs/s159-3a-inventory.md:320` — column inventory (0 non-null, 0 code refs)
- `docs/s159-3a-inventory.md:350` — "image_4_url through image_6_url" reference
- `docs/s159-3a-inventory.md:355` — Safe DROP mention
- `docs/s159-3a-inventory.md:563` — disposition table: DROP
- `docs/s159-3a-inventory.md:602` — extra columns note

---

## Helper inventory

### resolveHeroImage (src/lib/resolveHeroImage.ts:1 + shared/lib/resolveHeroImage.ts:1)

Two identical copies — one in src/lib/ for the browser bundle, one in shared/lib/ for edge functions.

- **Reads columns:** `heroMedia.image_url`, `heroMedia.url`, `heroMedia.thumbnail_url` (in priority order)
- **Context:** Operates on the hero_media JSONB value (from settings table), NOT on page_content columns. The `image_url` it reads is `settings.hero_media.image_url`, not `page_content.image_url`.
- **Returns:** `string | null` — first non-empty candidate from the list above, or null if mode is 'video'
- **Called by:**
  - `src/lib/heroCache.ts:76` — normalizes cached hero image via resolveHeroImage
  - `src/shells/rustic-rugged/ShellHero.tsx:63,77` — shell hero image resolution
  - `src/shells/youpest/ShellHero.tsx:36,49` — shell hero image resolution
  - `src/shells/modern-pro/ShellHero.tsx:63,92` — shell hero image resolution
  - `src/shells/bold-local/ShellHero.tsx:46,60` — shell hero image resolution
  - `src/shells/metro-pro/ShellHero.tsx:54,77` — shell hero image resolution
  - `src/shells/clean-friendly/ShellHero.tsx:56,75` — shell hero image resolution
  - `src/hooks/usePageHeroImage.ts:40` — resolves global hero fallback from settings.hero_media

### getShellImage (src/shells/_shared/getShellImage.ts:13)

Helper for shell image picking. Reads from both page_content columns AND hero_media settings.

- **Reads page_content columns:** `page_hero_image_url` (priority 1), `image_1_url` (priority 2), `image_url` (priority 3, fallback within page content)
- **Reads hero_media columns:** `master_hero_image_url` (priority 4), `image_url` (priority 5, hero_media key)
- **Returns:** `string | null` — first non-empty value in priority order
- **T5 implication:** If `image_url` or `image_1_url` are renamed/dropped from page_content, getShellImage.ts lines 4, 5, 17 must be updated.

### usePageHeroImage (src/hooks/usePageHeroImage.ts:15)

Hook that queries page_content.image_url directly AND calls resolveHeroImage for the global fallback.

- **Reads page_content columns:** `image_url` (line 35 .select, line 39 read)
- **Logic:** If `apply_hero_to_all_pages` flag is set OR pageImg is empty → returns `resolveHeroImage(globalRes.data?.value)`. Otherwise returns `pageImg` (page_content.image_url).
- **T5 implication:** This hook is the primary consumer of `page_content.image_url` as a per-page hero image. If T5 replaces `image_url` with `page_hero_image_url` as the canonical per-page hero, this hook needs updating.

---

## Filtered out (IGNORE bucket)

### Hero_media JSONB key — T6 scope, not T5 (13 lines)
These lines use the identifier `image_url` as a key inside the hero_media JSONB settings value, not as a column of page_content. T6 (hero-media type drop) already audited and resolved these.

- `src/components/admin/settings/BrandingHeroMedia.tsx:39` — reads `v.image_url` from settings.hero_media value
- `src/components/admin/settings/BrandingHeroMedia.tsx:79` — writes `{ ..., image_url: cleanUrl, ... }` as hero_media settings payload (image mode)
- `src/components/admin/settings/BrandingHeroMedia.tsx:80` — writes `{ ..., image_url: '', ... }` as hero_media settings payload (video mode)
- `src/shells/_shared/getShellImage.ts:8` — `hero_media?: { image_url?: string | null; ... }` — type for settings arg (hero_media context)
- `src/shells/_shared/getShellImage.ts:23` — `args.settings?.hero_media?.image_url?.trim()` — reads from settings.hero_media
- `src/shells/rustic-rugged/ShellHero.tsx:16` — `interface HeroMedia { ...; image_url?: string }` — local type for hero_media JSONB value
- `src/shells/youpest/ShellHero.tsx:9` — HeroMedia interface
- `src/shells/youpest/ShellHero.tsx:17` — `useState<HeroMedia>({ image_url: cached.imageUrl })` — hero_media local state
- `src/shells/modern-pro/ShellHero.tsx:18` — HeroMedia interface
- `src/shells/bold-local/ShellHero.tsx:12` — HeroMedia interface
- `src/shells/metro-pro/ShellHero.tsx:11` — HeroMedia interface
- `src/shells/clean-friendly/ShellHero.tsx:12` — HeroMedia interface
- `supabase/functions/provision-tenant/index.ts:255` — seeds hero_media key `image_url: ''` in settings table

### Social_posts table — unrelated to page_content migration (17 lines)
These reference `social_posts.image_url`, a column on a completely different table.

- `src/components/admin/social/useSocialData.ts:12`
- `src/components/admin/social/PostPreviewModal.tsx:66,67,87,88`
- `src/components/admin/social/PostCard.tsx:47,48`
- `src/components/admin/social/usePublishPost.ts:25,42,58`
- `supabase/functions/publish-scheduled-posts/index.ts:40,87,146,192,231,234,235`

---

## Review needed

- `src/hooks/usePageHeroImage.ts:35,39` — Hook reads `page_content.image_url` as the per-page hero image, but the newer `page_hero_image_url` column exists for exactly this purpose. If T5 establishes `page_hero_image_url` as canonical, this hook needs a migration path. Currently `image_url` and `page_hero_image_url` serve overlapping roles — this hook uses only `image_url` while `getShellImage.ts` prefers `page_hero_image_url`. **Gate question:** should T5 unify these two per-page hero slots?

- `src/components/admin/ContentTab.tsx:170` — Write path sets `image_url: form.pageHeroImageUrl || form.image_url || ''`. This keeps the legacy `image_url` column in sync with `page_hero_image_url`. Removing `image_url` would break `usePageHeroImage` until that hook is updated in the same PR. The two changes are coupled.

- `src/components/admin/ContentPageForm.tsx:118` — `d?.page_hero_image_url || d?.image_url || null` — HeroImageUpload falls back to `image_url` if `page_hero_image_url` is empty. After T5, this fallback must become `|| d?.image_urls?.[0]` or be removed.

- `src/shells/dang/HeroSection.tsx:135,162` — Reads `page_content.image_url` via `usePageContent('home')` hook. **FREEZE RULE ACTIVE.** These two lines cannot be changed. If `image_url` is renamed, the `usePageContent` hook return type must still include the old name OR a data migration must populate whatever the new column is called. This is the binding constraint on T5's DDL choices.
