import { Cormorant_Garamond, Jost } from 'next/font/google';

// Vita Glow display + body fonts (brief §type). next/font/google self-hosts at
// build time and applies size-adjust fallback metrics (CLS-safe). Cormorant
// Garamond carries the editorial display voice (light weights, incl. italic
// 300/400); Jost carries body, eyebrows, and wide-tracked uppercase labels.
export const cormorantFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const jostFont = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-jost',
  display: 'swap',
});

// ⚠️ SERIF-BUG FIX (S-VG-2). The display font is resolved DIRECTLY from the
// next/font object's `.style.fontFamily` (the self-hosted, mangled family name)
// and baked into the token below — NOT via `var(--font-cormorant)`.
//
// Why: next/font's `.variable` class defines `--font-cormorant` on the shell
// WRAPPER <div>. `--vg-font-display` is declared at `:root`, so a nested
// `var(--font-cormorant)` inside it resolves in the :root scope where the
// wrapper's variable is NOT visible → the custom property became invalid →
// every heading using `font-family: var(--vg-font-display)` fell back to the
// inherited sans-serif. Baking the resolved family in at :root removes the
// nested var entirely, so the value is valid without depending on wrapper scope.
// (Verified via headless computed-style check — see QA_REPORT_S-VG-2.md.)
const DISPLAY_FAMILY = `${cormorantFont.style.fontFamily}, 'Cormorant Garamond', serif`;
const BODY_FAMILY = `${jostFont.style.fontFamily}, 'Jost', sans-serif`;

// Vita Glow design tokens — the shell's SOLE color authority (S-VG-2 v3 palette:
// CREAM-LED, espresso as ACCENT ONLY, gold as highlight). Same joined-array shape
// as DANG_TOKENS / BL_TOKENS, injected as a :root{} block in the layout's
// vita-glow branch. Every color is a hardcoded literal; a tenant's
// branding.primary_color is bypassed via the computeShellCssVars vita-glow guard.
export const VITA_GLOW_TOKENS = [
  // Palette (exact hex — S-VG-2 v3)
  '--vg-espresso:#3B2A21',      // brown — ACCENT ONLY (body ink, hairlines, one dark button)
  '--vg-espresso-deep:#2A1D16',
  '--vg-cream:#F7F2E9',         // PRIMARY ground — nav, hero, most surfaces
  '--vg-cream-2:#EFE7D8',       // secondary cream — treatments band bg
  '--vg-gold:#C9A227',          // highlight / accent
  '--vg-gold-light:#E3C77B',
  '--vg-taupe:#9C8574',         // muted body text / secondary labels
  '--vg-white:#FFFFFF',
  // Surfaces + text roles (aliases kept stable for components)
  '--vg-surface:#F7F2E9',
  '--vg-surface-alt:#EFE7D8',
  '--vg-ink:#3B2A21',          // = espresso (heading/body ink)
  '--vg-text:#3B2A21',
  '--vg-text-muted:#9C8574',   // = taupe
  '--vg-on-espresso:#F7F2E9',  // cream text on the single espresso button
  // Typography (resolved families — see SERIF-BUG FIX above)
  `--vg-font-display:${DISPLAY_FAMILY}`,
  `--vg-font-body:${BODY_FAMILY}`,
  '--vg-weight-light:300',
  '--vg-weight-regular:400',
  '--vg-weight-medium:500',
  '--vg-tracking-display:-0.02em', // negative tracking on light serif display
  '--vg-tracking-wide:0.22em',     // wide tracking on Jost uppercase labels
  '--vg-line-tight:1.05',
  '--vg-line-body:1.7',
  // Structure
  '--vg-hairline:rgba(201,162,39,0.35)',      // gold-tinted 1px gridline
  '--vg-hairline-strong:rgba(201,162,39,0.55)',
  '--vg-radius:2px',                            // near-square, editorial
].join(';') + ';';
