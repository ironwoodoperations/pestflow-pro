# REVIEW — S-VG-3: Vita Glow Logo Sizing

**Branch:** `claude/vita-glow-shell-713b3f` (restarted from `main` after S-VG-2 / PR #239 merged)
**Scope:** CSS-only sizing tweak to the two existing logo `<img>` instances (nav + hero right panel). No logic, no data, no new files — exactly as scoped.

## Diff (3 lines total across 2 files)

### `VitaGlowNavbar.tsx`
- Nav logo: `height: 44` → `height: 64` (1.4545×, within the requested 1.4–1.6× range). `width: 'auto'` unchanged → aspect ratio preserved automatically.
- Nav row padding: `1rem 1.5rem` → `0.75rem 1.5rem`, to keep the overall bar height reasonable now that the logo is taller (total bar height goes from ~76px to ~88px — still a compact, normal nav height; `alignItems: 'center'` on the row, unchanged, keeps everything vertically centered regardless).

### `VitaGlowHome.tsx`
- Hero right-panel logo: `maxWidth: 'min(360px,80%)'` → `width: 'min(480px,65%)'`. The percentage resolves against the wrapper's content box, which is the panel width minus the wrapper's own `2rem` (64px total) padding — so `65%` of that inner box lands the image at **~58% of the full panel width** on desktop, comfortably inside the requested 55–65% band once padding is accounted for (verified numerically, see QA). `height: 'auto'` unchanged → aspect ratio preserved automatically. The `480px` cap prevents the image from ballooning on very wide viewports (the `.vg-hero` container itself is capped at `maxWidth: 1280`, so panel width — and thus the image — never grows unbounded).

## Why these exact numbers
Percentage widths on the hero logo don't resolve against the visual "panel" the brief describes — they resolve against the *content box* of the absolutely-positioned, padded wrapper around it. I computed the two independently (content-box % vs. full-panel %) to hit the actual target rather than eyeballing it: 65% of the content box ≈ 58% of the full panel at reference width, which is where I landed.

## No changes made to
- `branding.logo_url`, image `src`, or any data/query path.
- The droplet-glyph fallback (still renders unchanged when `logo_url` is unset).
- Any other component, the palette, content, or the espresso/cream surface rules — the logo remains cream-surface-only in both spots (nav is cream; hero panel is the warm cream gradient), exactly as before.
- `VG_A11Y_CSS` / reduced-motion handling — untouched; no fade/rise animation exists on the logo images in this codebase to begin with, so there was nothing to preserve there beyond the existing reduced-motion CSS, which is unchanged.

## Responsive / mobile
No media query was needed — both sizes are relative (percentage / `min()`), so they scale naturally:
- Hero logo: on the mobile-stacked panel (`@media max-width:768px`, unchanged breakpoint), the image is 65% of the (now full-width, stacked) panel's content box and stays comfortably inside the panel's `300px` min-height with clear top/bottom margin (verified at a 375px viewport — see QA).
- Nav logo: height-based sizing is viewport-independent; it doesn't reflow at any width.
