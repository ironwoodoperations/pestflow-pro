# REVIEW — S-VG-1: Vita Glow Wellness Shell

**Branch:** `claude/vita-glow-shell-713b3f`
**Scope:** ONE feature branch + ONE PR. New one-off medical-aesthetics tenant shell `vita-glow`.
**Out of scope (untouched):** tenant provisioning (row/entitlements/settings/branding/industry/voice_receptionist — done via MCP after merge), AI social generator / generate-social-batch / process-campaign-job, ai-proxy, auth, RLS, Stripe, edge functions. No theme switcher, no theme-selection UI.

---

## What this PR builds

### New shell — `app/tenant/[slug]/_shells/vita-glow/`
Mirrors the STRUCTURE of the `dang` shell (barrel + `*_TOKENS` joined-string array + `next/font/google` objects + guard-clause pattern). Does NOT copy dang's comic styling — elevated editorial medical-aesthetics language.

| File | Lines | Role |
|---|---|---|
| `VitaGlowFonts.ts` | 58 | `cormorantFont` (Cormorant Garamond 300/400/500/600 + italic), `jostFont` (Jost 300/400/500), `VITA_GLOW_TOKENS` — the shell's sole `--vg-*` color authority (exact brief hexes). |
| `VitaGlowGlyph.tsx` | 82 | Signature droplet-with-leaf inline SVG (`VitaGlowGlyph`), `GoldDivider` (transparent→gold→transparent hairlines + centered glyph), `resolveBookingHref` (booking config resolver). Placeholder brand mark until the flat logo asset lands. |
| `VitaGlowNavbar.tsx` | 112 | Cream sticky nav, glyph+wordmark brand (logo_url if set), desktop links + mobile drawer, config-driven Book-a-Consult CTA. |
| `VitaGlowFooter.tsx` | 90 | Dark-ink footer, treatment/explore/book columns, legal row, **"Powered by PestFlow Pro"** gold badge (design non-negotiable). |
| `VitaGlowHome.tsx` | 120 | **Asymmetric hero** (oversized droplet bleeds left, display type right), gold hairline dividers, **service card grid** (1px gold gridlines, cream cells → white on hover, glyph + serif heading + gold price line), dark CTA band. |
| `VitaGlowServicesPage.tsx` | 104 | One content-driven component reused for IV Infusions / Injectables & Aesthetics / Weight & Wellness (by page slug). Hero + optional editorial intro + gridline treatment list + CTA band. |
| `VitaGlowAboutPage.tsx` | 107 | Editorial about — hero, asymmetric story (image/glyph + prose), optional team grid, CTA band. |
| `VitaGlowContactPage.tsx` | 82 | Book-a-Consult — editorial chrome around the SHARED `ContactForm` (same wrapper pattern as `DangComicContactPage`), config-driven booking CTA. |
| `index.ts` | 10 | Barrel export. |

All files < 200 lines; relative imports only.

### Design-token registration — `shared/lib/shellCssVars.ts`
- Added `SHELL_THEMES['vita-glow']` mapping the cream/gold/ink palette onto the base `--color-*` vars shared inner pages (service-area / faq / legal / blog / reviews / quote) read.
- Added a `computeShellCssVars` **guard clause** for `'vita-glow'` (mirrors the `bold-local` and `dang-comic` guards): pins `--color-primary`/`--color-accent` to gold `#C9A227`, `--color-btn-text` to ink `#3D3733`, and returns the base map. A tenant's `branding.primary_color` therefore **cannot** re-derive the surfaces — the palette is fixed. Verified with a hostile `primary_color=#ff0000, accent=#00ff00` (see QA).

### Dispatch wiring (one `tenant.template === 'vita-glow'` branch each; `template` = `branding.theme`)
- `layout.tsx` — injects `:root{${VITA_GLOW_TOKENS}}`, wraps `VitaGlowNavbar` + `VitaGlowFooter`, computes `bookingUrl` from `settings.integrations.square_booking_url`. Emits the same universal localBusiness org node + GA4 chrome as every other branch.
- `page.tsx` — `VitaGlowHome`; service card names/hrefs are structural, blurbs/prices come from `page_content.services` when present. Emits `websiteSchema`.
- `[service]/page.tsx` — vita-glow branch placed BEFORE the pest `SERVICE_SLUGS` / location logic (that vertical does not apply). Content-driven by slug; a slug with no `page_content` row → `notFound()` (arbitrary URLs don't render empty).
- `about/page.tsx` — `VitaGlowAboutPage`; emits `aboutSchema`.
- `contact/page.tsx` — `VitaGlowContactPage`.

### New unlisted route — `app/tenant/[slug]/consult/page.tsx`
Doctor hand-off consult-link route (brief §5). **Not in nav.** Vita-glow only — every other template `notFound()`s, so the route is invisible platform-wide. `robots: noindex,nofollow`. Renders the Book-a-Consult experience honoring the same Square booking config (blank → in-page consult form).

---

## Key decisions & rationale
- **Service routing through `[service]`, not new top-level dirs.** The three treatment categories are "content-driven by page slug" per the brief; routing them through the existing catch-all (guarded before the pest logic) keeps the route namespace clean and mirrors how `dang` reuses `[service]`. Only the fixed, unlisted `consult` path got its own dir.
- **Booking ships BLANK, config-driven.** No hardcoded Square URL anywhere. `resolveBookingHref('')` → internal `/contact` fallback; a set `square_booking_url` → external new-tab link. Same key (`settings.integrations.square_booking_url`) stubs the later $30 paid-consult flow.
- **"Nothing hardcoded" line.** Page COPY (headlines, subheads, treatment blurbs, prices, intro prose, team) is read from `page_content` / `team_members` — components carry none. Navigation labels, section eyebrows, and button text are UI chrome and live in components (identical posture to every existing shell, incl. `dang`).
- **Medical-content constraint honored.** Component defaults introduce NO dosing / contraindication / protocol detail. Fallbacks are neutral and category-level only; clinical specificity, if any, can only ever come from operator-authored `page_content`.
- **Placeholder logo.** The inline droplet glyph is the brand mark until the flat logo asset arrives; `branding.logo_url`, once set, overrides it in the navbar.

---

## Verification
- `tsc --noEmit -p tsconfig.next.json` → **0 errors**.
- `npm run build:next` → **success**; `next/font/google` fetched Cormorant Garamond + Jost; `/tenant/[slug]/consult` registered as SSG.
- `eslint` on all new/changed files → **0 errors** (only the pre-existing `react-refresh/only-export-components` warnings shared by every route file).
- Palette guard hostile-input test → primary/accent/surfaces stay fixed (QA).

## Left for Scott / next
- **Provisioning (MCP, out of scope):** create the `vita-glow` tenant row + `settings.branding.theme='vita-glow'` + `business_info` + `page_content` rows (home, iv-infusions, injectables, weight-wellness, about, contact; optional consult) + `settings.integrations` (leave `square_booking_url` empty for now). Shell renders at `pestflowpro.ai/tenant/vita-glow` once provisioned.
- Flat logo asset (pending from client) → set `branding.logo_url`.
- `square_booking_url` + $30 paid-consult flow → wire when Square is live.
