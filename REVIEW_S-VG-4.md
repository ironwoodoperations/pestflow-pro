# REVIEW — S-VG-4: Vita Glow Polish

**Branch:** `claude/vita-glow-shell-713b3f` (restarted from `main` after S-VG-3 / PR #240 merged)
**Scope:** Five small polish changes — CSS + text + one link. No data, no palette additions, no other components. 3 files touched, +9/−5 lines.

## Changes

### 1 & 3. Logo backing panels (nav + footer)
Wrapped each logo `<img>` in an `inline-flex` rounded plaque so it reads as sitting on a gentle warm plate that lifts it off the surrounding surface:
- **Nav** (`VitaGlowNavbar.tsx`): plaque background `var(--vg-cream-2)` (#EFE7D8) — one step deeper than the cream nav — with a subtle gold `var(--vg-hairline)` border, `border-radius: 10px`, `padding: 5px 12px`. Logo height trimmed 64→60 so the plaque doesn't balloon the bar (bar ≈ 96px). `alignItems: center` preserves vertical centering; `width: auto` on the img preserves aspect.
- **Footer** (`VitaGlowFooter.tsx`): footer background is already cream-2, so the plaque uses a deeper warm `#E7DCC8` (the mid-stop of the hero gradient — a warm cream, deliberately NOT dark) with the same hairline border / radius / padding. Logo height unchanged (52).

Both plaques are understated (soft warm fill + 1px gold-tinted hairline, no shadow, no hard box) and keep the light-background logo on a light/warm surface, per the asset constraint.

### 2. Hero logo enlarged (`VitaGlowHome.tsx`)
`width: min(480px, 65%)` → `min(600px, 80%)` — exactly the value the brief specified. The percentage resolves against the hero-panel wrapper's content box (panel minus its `2rem` padding), so 80% there maps to **~71% of the full panel width** at desktop (up from ~58% in S-VG-3) — a clear "fills more of the panel" jump while staying ~86px clear of the gold seam and panel edges (verified, see QA). Centered + aspect preserved (unchanged flex-center wrapper + `height: auto`). Same padding nuance flagged in S-VG-3.

### 4. Badge text swap (`VitaGlowFooter.tsx`)
"Powered by PestFlow Pro" → **"Powered by Ironwood Operations Group"**. Styling, placement, and `href` unchanged — text only, per the brief. This intentionally overrides the repo-wide "design non-negotiable" **for the vita-glow shell only**; no other shell or shared footer was touched (confirmed: the badge string still reads "PestFlow Pro" in `MetroFooter`, `Dang/Bold/Clean/Rustic/ModernPro` footers and `src/components/Footer.tsx`).
- *Note:* the `href` still points to `https://pestflowpro.ai`. The brief said "just change the text," so I left the link target as-is rather than guess an Ironwood URL. Easy follow-up if Scott wants it repointed.

### 5. Copyright → dashboard link (`VitaGlowFooter.tsx`)
The `© 2026 {bizName}` text is now an `<a href="/admin">` pointing at the client admin dashboard. Confirmed `/admin` is the correct route: `src/App.tsx` has `<Route path="/admin" element={<Dashboard/>}>` and `middleware.ts` routes `/admin*` on the tenant subdomain to the Vite admin app. Because that's a cross-app boundary (Next public site → Vite admin SPA), I used a plain `<a>` (full navigation), not a Next `<Link>`. Styling is deliberately subtle — same muted `var(--vg-taupe)`, `text-decoration: none`, unchanged size/weight — so it does not advertise itself as an admin entrance.

## Constraints honored
- Logos remain on light/warm surfaces only; aspect ratios preserved everywhere (verified 1.222 == native at all widths).
- Responsive: all sizes relative (`min()` / height-based / inline-flex plaques hug content) — no new media queries needed; verified clean at 1440px and 375px.
- No data/palette/other-component changes; `branding.logo_url` and image `src` untouched.

## Verification
`tsc --noEmit` 0 errors · `next build` success · `eslint` 0 errors (pre-existing refresh warning only) · all three files < 200 lines. Headless geometry check in `QA_REPORT_S-VG-4.md`.
