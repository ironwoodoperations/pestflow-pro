# Pexels Phase 1b Death-Audit

**Session:** S192
**Date:** 2026-05-05
**Scope:** Read-only investigation of all hardcoded `images.pexels.com` URLs across the pestflow-pro repo, with focus on the five Next.js shells. Informs Phase 1b replacement strategy.

---

## TL;DR

**Total Pexels URL hits in active source code: 23** (across 6 files). Distribution: only **1 of 5 Next.js shells** has Pexels (rustic-rugged, 6 URLs in one file, all Pattern C — hardcoded mock array, no DB read, no tenant prop). The other 4 Next.js shells (modern-pro, clean-friendly, bold-local, metro) are already clean — their heroes consume `heroImageUrl` resolved server-side from `settings.hero_media` + `page_content.page_hero_image_url`. The remaining 17 hits live in **legacy Vite source** (`src/shells/bold-local/*`, `src/shells/rustic-rugged/*`, `src/data/pestVideos.ts`) — these still ship as the live admin/public surface but are out of the "five Next.js shells" primary scope. **Phase 1b is NOT a single grep-and-replace.** The Tenant TypeScript type (`shared/lib/tenant/types.ts`) carries only `logo_url` / `favicon_url` — no per-section image fields exist. The 6 Next.js Pexels URLs in `RusticRuggedResComFac` are mock service-section photos with no tenant column to absorb them; replacement requires either (a) a generic placeholder strategy, (b) deletion of the section, or (c) a new schema field + admin UI. Scott decision needed before implementation can fire.

---

## Inventory

| File | Line(s) | Surface | Shell | Role | Pattern | URL stem |
|---|---|---|---|---|---|---|
| `app/tenant/[slug]/_shells/rustic-rugged/RusticRuggedResComFac.tsx` | 18 | Next.js | rustic-rugged | Service section photos (Residential) | C | `photos/106399/...`, `photos/323780/...` |
| `app/tenant/[slug]/_shells/rustic-rugged/RusticRuggedResComFac.tsx` | 24 | Next.js | rustic-rugged | Service section photos (Commercial) | C | `photos/269077/...`, `photos/1015568/...` |
| `app/tenant/[slug]/_shells/rustic-rugged/RusticRuggedResComFac.tsx` | 30 | Next.js | rustic-rugged | Service section photos (Facility) | C | `photos/1267338/...`, `photos/257816/...` |
| `src/shells/bold-local/BoldLocalAboutStrip.tsx` | 1 | Vite | bold-local | About strip team photo fallback | A | `photos/8961421/...` |
| `src/shells/bold-local/ShellHero.tsx` | 9 | Vite | bold-local | Hero background fallback | A | `photos/3807517/...` |
| `src/shells/rustic-rugged/ShellHero.tsx` | 10–12 | Vite | rustic-rugged | Hero circle photos (3-up) | A+C | `photos/4252163/...`, `photos/7127718/...`, `photos/3669638/...` |
| `src/shells/rustic-rugged/RusticRuggedResComFac.tsx` | 18, 24, 30 | Vite | rustic-rugged | Service section photos (R/C/F) | C | same six URLs as Next.js mirror |
| `src/data/pestVideos.ts` | 3, 6, 7, 9–18 | Vite | shared | Pest page video URLs + thumbnails | C | 13 entries, 4 unique videos |

**By surface:** Next.js shells = 6 URLs in 1 file. Vite shells = 11 URLs in 4 files. Vite shared data = ~26 video/thumbnail URLs in 1 file (4 unique videos repeated across 13 pest categories).

**By Next.js shell:**
- `modern-pro` — clean
- `clean-friendly` — clean
- `bold-local` — clean
- `rustic-rugged` — 6 URLs (1 file, `RusticRuggedResComFac.tsx`)
- metro (`_components/Metro*.tsx`) — clean

---

## Categorization by role

### 1. Service-section mock photos (rustic-rugged R/C/F)
- **Where:** `RusticRuggedResComFac.tsx` (both Next.js and Vite copies)
- **Count:** 6 URLs × 2 file copies = 12 URL hits
- **Pattern:** C (hardcoded SECTIONS array, no props on the component, no DB read)
- **Shells affected:** rustic-rugged only
- **Live consumer:** Next.js `app/tenant/[slug]/page.tsx:164` calls `<RusticRuggedResComFac />` with no props. Vite `src/shells/rustic-rugged/ShellHomeSections.tsx:41` likewise.

### 2. Hero photo fallback (bold-local + rustic-rugged Vite heroes)
- **Where:** `src/shells/bold-local/ShellHero.tsx:9`, `src/shells/rustic-rugged/ShellHero.tsx:10–12`
- **Count:** 4 URLs (1 single + 3-up array)
- **Pattern:** A (bold-local: `resolveHeroImage(heroMedia) ?? FALLBACK_PHOTO`); A+C hybrid (rustic-rugged: `heroPhoto ? [heroPhoto, PHOTOS[1], PHOTOS[2]] : PHOTOS` — Pexels fallback for slot 0, but slots 1 & 2 are *always* Pexels)
- **Shells affected:** Vite-only (Next.js heroes use `heroImageUrl` prop and don't fall back to Pexels)

### 3. About-strip team-photo fallback (bold-local Vite)
- **Where:** `src/shells/bold-local/BoldLocalAboutStrip.tsx:1`
- **Count:** 1 URL
- **Pattern:** A (`photoUrl || FALLBACK_IMG`)
- **Shells affected:** Vite-only. Caller passes `photoUrl` prop — when caller omits, Pexels shows.

### 4. Pest page video thumbnails (Vite pest pages)
- **Where:** `src/data/pestVideos.ts`
- **Count:** ~26 URL hits (4 unique videos + 4 unique thumbnails repeated across 13 pest categories)
- **Pattern:** C (hardcoded category→URL map)
- **Live consumer:** 13 Vite pest pages import `PEST_VIDEOS` (e.g., `RoachControl.tsx:2`, `MosquitoControl.tsx:2`, etc.)
- **Shells affected:** Vite pest pages (cross-shell, used by all Vite public surfaces)

### 5. Doc-only mentions
- 7 markdown/audit docs reference "Pexels" historically (`SKILL.md`, `TASKS.md`, `pestflow-s68-prompt.md`, `pestflow-pro-master-roadmap-s37plus.md`, `IRONWOOD_OPS_PROCESS_STARTER_v2.md`, `docs/s188-1-audit-results.md`, `docs/audits/pestflow-pro-s189-drift-audit.md`). No code; not actionable for Phase 1b.

---

## Tenant branding fields

**File:** `shared/lib/tenant/types.ts` (only TS contract used by the Next.js shells).

```ts
export type TenantBranding = {
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  accent_color?: string;
  template?: string;
  cta_text?: string;
};

export type TenantBusinessInfo = {
  name?: string; phone?: string; email?: string; address?: string;
  hours?: string; tagline?: string; industry?: string;
  license_number?: string; certifications?: string;
  founded_year?: number | string; num_technicians?: number | string;
  owner_name?: string;
};

export type Tenant = {
  id: string; slug: string; name: string;
  // branding
  template: string; primary_color: string; accent_color: string;
  logo_url: string | null; favicon_url: string | null; cta_text: string | null;
  // business_info
  business_name: string | null; phone: string | null; email: string | null;
  address: string | null; hours: string | null; tagline: string | null;
  owner_name: string | null; founded_year: number | null;
  license_number: string | null; certifications: string | null;
  num_technicians: number | null;
  // seo
  meta_title: string | null; meta_description: string | null;
};
```

**Image-related fields on `Tenant`:**
- `logo_url` — actively read by all 5 Next.js Navbars (`{Modern,Clean,Bold,Rustic}*Navbar.tsx`, `MetroNavbar.tsx`)
- `favicon_url` — head/metadata only

**That's the entire surface.** No `hero_image_url`, no `team_photo`, no `services_image`, no `about_image`. Hero images flow via a separate path: server resolves `settings.hero_media` (`master_hero_image_url` / `image_url`) + `page_content.page_hero_image_url` into a `heroImageUrl: string | null` prop, plumbed into each shell's hero component. Per CLAUDE.md the `hero_media` settings JSONB also carries `thumbnail_url`, `video_url`, `youtube_id`, `mode`, `apply_hero_to_all_pages` — none of which expose service-section/team/about images.

**Verdict:** the only tenant-driven image surface today is **hero**. Every other image (service-section circles, about-strip photo, team avatars, pest video thumbnails) is either hardcoded mock data or a caller-supplied prop with no admin UI to populate it.

---

## Fallback chain inspection

### Pattern A hits

**`src/shells/bold-local/BoldLocalAboutStrip.tsx`** (Vite)
```tsx
const FALLBACK_IMG = 'https://images.pexels.com/photos/8961421/...'
// ...
const img = photoUrl || FALLBACK_IMG  // line 10
```
Caller behavior: not currently wired. Component accepts `photoUrl?: string` prop. If left undefined by caller, Pexels shows. If caller passes a URL (not currently observed in any caller — must verify), Pexels is bypassed.

**`src/shells/bold-local/ShellHero.tsx`** (Vite)
```tsx
const FALLBACK_PHOTO = 'https://images.pexels.com/photos/3807517/...'
// ...
const bgPhoto = resolveHeroImage(heroMedia) ?? FALLBACK_PHOTO  // line 58
```
Reads `settings.hero_media` directly via supabase query, falls back to Pexels only when both `image_url` and other resolved fields are empty. **This is a real fallback** — most provisioned tenants will hit DB-resolved images, but a fresh tenant with no hero media uploaded sees Pexels.

**`src/shells/rustic-rugged/ShellHero.tsx`** (Vite)
```tsx
const PHOTOS = [
  'https://images.pexels.com/photos/4252163/...',  // line 10
  'https://images.pexels.com/photos/7127718/...',  // line 11
  'https://images.pexels.com/photos/3669638/...',  // line 12
]
// ...
const heroPhoto = resolveHeroImage(heroMedia)
const photos = heroPhoto ? [heroPhoto, PHOTOS[1], PHOTOS[2]] : PHOTOS  // line 76
```
**Inconsistency:** even when DB hero is resolved, slots 1 & 2 are *always* hardcoded Pexels. Only slot 0 ever reads from DB. Pattern A applies to slot 0 only; slots 1 & 2 are Pattern C inside the same array.

### Pattern C hits

**`app/tenant/[slug]/_shells/rustic-rugged/RusticRuggedResComFac.tsx`** (Next.js — primary scope)
- 6 URLs in `const SECTIONS` array
- Component accepts no props. Page.tsx:164 calls `<RusticRuggedResComFac />` bare.
- No DB read. No tenant data accessible at the component boundary.
- **To replace:** must either (a) modify the component to accept a `services` prop and plumb data from `page.tsx`, (b) hardcode generic placeholder URLs, or (c) delete the component / replace with a CSS-only design.

**`src/shells/rustic-rugged/RusticRuggedResComFac.tsx`** (Vite mirror)
- Identical content to the Next.js copy.
- **Drift risk noted:** any replacement must touch both copies or delete the Vite copy if Vite admin no longer renders this section.

**`src/data/pestVideos.ts`**
- Map of pest categories → video URL + thumbnail URL
- Imported by 13 Vite pest pages
- No tenant-scoped data; same videos for every tenant
- **To replace:** either (a) remove video sections from pest pages, (b) host first-party MP4s in Supabase Storage, (c) use a third-party stock-video provider with attribution, (d) make videos optional via a tenant setting

### Cross-shell field-name consistency

The Next.js heroes uniformly accept `heroImageUrl: string | null` (a server-resolved prop). The Vite heroes uniformly read `heroMedia` directly via supabase + `resolveHeroImage(heroMedia)`. **No naming inconsistency for hero** — both surfaces use the same `master_hero_image_url` / `image_url` fields under `settings.hero_media`. Pexels fallbacks exist only on the Vite side.

---

## Replacement strategy recommendations

### Category 1: Service-section mock photos (rustic-rugged R/C/F)
**Blast radius:** 2 files (Next.js + Vite mirror), 6 URLs each. Single shell.
**Schema change required:** depends on choice (see below).
**Scott decision:** **YES — required.** Three viable paths:

- **Option A (smallest):** replace the SECTIONS array with three generic placeholder images (CSS gradient, neutral stock from a first-party Supabase Storage bucket, or SVG illustrations). No schema change. Same content for every rustic-rugged tenant. Negligible risk.
- **Option B (medium):** delete the `RusticRuggedResComFac` section entirely from the rustic-rugged shell. Removes 6 URLs and the whole component. Visual impact: rustic-rugged loses its R/C/F section.
- **Option C (largest):** add a `services_section_images` field to `settings.branding` or a new `settings.services_imagery` JSONB. Plumb through `page.tsx`. Add admin UI in Branding tab for Scott (or client) to upload three images. Per-tenant customizable.

**Recommendation:** Option A. The R/C/F section is supplemental, not a hero. Generic placeholders avoid blocking Phase 1b on a schema+UI change. If Scott later wants per-tenant service imagery, raise as a follow-up.

### Category 2: Hero photo fallbacks (bold-local + rustic-rugged Vite)
**Blast radius:** 2 files, 4 URLs.
**Schema change required:** none (DB already resolves hero via `settings.hero_media`).
**Scott decision:** **NO — strip the Pexels constants, let `resolveHeroImage` return null when nothing is set.**

- `bold-local/ShellHero.tsx`: change `?? FALLBACK_PHOTO` to handle null (e.g., render a CSS-driven gradient hero, or return early with a text-only hero). Minor UI redesign needed for the no-image case.
- `rustic-rugged/ShellHero.tsx`: the 3-up circle layout requires three images by design. Pattern A+C makes this awkward. Two paths: (a) collapse to a single circle when only DB image is available, (b) replace slots 1 & 2 with first-party SVG silhouettes/icons (pest control branding).

**Caveat:** these are Vite shells, not the "five Next.js shells" primary scope. The Next.js equivalents (`BoldLocalHero.tsx`, `RusticRuggedHero.tsx`) already handle null gracefully via `heroImageUrl` — so the design pattern is already proven on the Next.js side.

### Category 3: About-strip team-photo fallback (bold-local Vite)
**Blast radius:** 1 file, 1 URL.
**Schema change required:** open question — there's no `about_team_photo` field in any settings JSONB today.
**Scott decision:** **YES — required.** Three options:

- **Option A:** strip the FALLBACK_IMG, render a neutral "team photo coming soon" placeholder when `photoUrl` is undefined.
- **Option B:** add `about_team_photo_url` to `settings.business_info` (or new key). Surface in admin UI. Same plumbing pattern as `logo_url`.
- **Option C:** drop the photo column from the about strip when no image is set — render text-only.

**Recommendation:** Option B if team photos are a 1st-class feature for Scott; Option A otherwise. Phase 1b should NOT block on the schema change — start with Option A and revisit if Scott wants a richer about page.

### Category 4: Pest page video thumbnails (`pestVideos.ts`)
**Blast radius:** 1 data file, 13 importer pages.
**Schema change required:** no.
**Scott decision:** **YES — required.** Options:

- **Option A:** delete `pestVideos.ts` and remove video rendering from all 13 pest pages. Loses video content. Smallest code surface.
- **Option B:** replace Pexels video URLs with first-party MP4s hosted in Supabase Storage (`tenant_assets/shared/pest-videos/`). Same map structure, same imports, just different URLs. ~30 min of asset prep + URL swap.
- **Option C:** lazy-load videos only when `tenant.has_pro_video_pack` (or similar) — gates videos behind an upsell.

**Recommendation:** Option B. Pest pages with embedded video are a real differentiator; delete-only loses value. Hosting first-party MP4s in Supabase Storage is one-shot work. Pexels video license terms separately need a sanity check (commercial-use allowed, but recurring use in productized SaaS may sit in a gray area depending on attribution requirements — independent of the technical work, this is a legal/biz question).

### Category 5: Doc-only mentions
No action. Historical references in `SKILL.md`, audit docs, etc. They describe what *was* built — leaving them intact preserves the record. If Scott wants a clean read, do a single doc-update PR after Phase 1b completes.

---

## Open questions for Scott

1. **rustic-rugged R/C/F section** — keep with generic placeholders (Option A), delete entirely (Option B), or invest in a `services_imagery` schema + admin UI (Option C)?
2. **Vite shells in scope?** Phase 1b explicitly scopes "the five Next.js shells", but Vite is the live admin/public surface today. Two options: (a) Phase 1b = Next.js only, leave Vite Pexels for a Phase 1c, (b) Phase 1b = both surfaces in one PR.
3. **About-strip team photo (bold-local Vite)** — placeholder fallback (A), schema field (B), or drop the photo column (C)?
4. **Pest page videos** — delete (A), self-host (B), or gate behind a paid tier (C)?
5. **Pexels license posture** — does Scott want all Pexels URLs gone for licensing/branding reasons, or just to deduplicate/upgrade content? The answer changes the urgency of the Vite-side cleanup.
6. **`shared/lib/tenant/types.ts`** — the only image fields on `Tenant` are `logo_url` and `favicon_url`. If Phase 1b grows to need a per-tenant `services_image_*` or `about_image`, are we comfortable extending this type and the upstream loader (`shared/lib/tenant/resolve.ts`) in the same PR, or is the type addition a separate session?

---

## Side scan: S189 Pexels Phase 1a leftovers

**Vite admin (`src/`):**
- No `PestImagePicker.tsx` (deleted by S189).
- No `useComposer` Pexels API calls (verified clean).
- No `pexels_api_key` references in components.
- No `_archived_IntegrationsSection.tsx` (deleted).
- The only Pexels strings remaining in `src/` are the hardcoded URL constants documented above (4 shell files + `pestVideos.ts`). These are passive image references, not API integration — distinct from what S189 was scoped to remove.

**Env files:**
- No `PEXELS` / `VITE_PEXELS_API_KEY` in `.env.example`. Confirmed clean.

**Supabase:**
- `supabase/functions/provision-tenant/index.ts` — no `pexels_api_key` reference (the S188-1 audit had flagged `pexels_api_key: ''` at line 269 — this is now removed). Clean.
- `supabase/migrations/` — no Pexels-related DDL. Clean.
- `supabase/functions/` (other functions) — no Pexels references. Clean.

**Verdict:** S189's Phase 1a (delete the integration code path) appears to have completed correctly per repo state today. Phase 1b (delete the static URL constants) is genuinely a separate, non-overlapping surface.

---

## Recommended next-session shape

Phase 1b is **NOT** a single grep-and-replace. Recommend splitting into 2-3 PRs based on Scott's answers:

### PR-A: Next.js rustic-rugged R/C/F section (smallest, ship first)
- Single file: `app/tenant/[slug]/_shells/rustic-rugged/RusticRuggedResComFac.tsx`
- Apply chosen Option (A/B/C) for service-section photos
- 6 URLs removed
- No schema change in Option A; new field + UI only in Option C
- Risk: low (one shell, supplemental section)

### PR-B: Vite shell Pexels cleanup
- 4 files: `src/shells/bold-local/BoldLocalAboutStrip.tsx`, `src/shells/bold-local/ShellHero.tsx`, `src/shells/rustic-rugged/ShellHero.tsx`, `src/shells/rustic-rugged/RusticRuggedResComFac.tsx`
- Strip FALLBACK constants, handle null hero gracefully (mirror Next.js pattern), apply chosen about-strip option
- 11 URLs removed
- May need small UI redesign for the no-image hero state (CSS gradient + headline-only)
- Risk: medium — touches live Vite public surface, needs visual QA per shell

### PR-C: Pest video cleanup (`pestVideos.ts`)
- Single data file + 13 importer files (auto-touched if URLs are swapped, untouched if videos are deleted)
- Apply chosen Option (A/B/C)
- ~26 URLs removed in Option A or B; 0 removed but gated in Option C
- Risk: low (data swap) to medium (delete = visible content loss)

**Sequencing:** A → C → B. PR-A is independent and small. PR-C is mostly mechanical once the Storage assets are uploaded. PR-B is the most invasive (visual redesign for null hero) and should land last after the others prove the pattern.

**Optional pre-PR:** if Scott picks Option B/C for any category requiring a schema field (services imagery, about photo), add a "Phase 1b prep" migration session first — defines new `settings` keys / type fields, no UI yet — so the implementation PRs only do plumbing, not DDL + plumbing in one shot. Mirrors the Bug B backfill pattern from S192 Task #1.
