import { Bangers, Open_Sans } from 'next/font/google';

// Comic display + body fonts (design spec §2). next/font/google self-hosts at
// build time and applies size-adjust fallback metrics (chosen over a <link> on
// CLS grounds — validator gate G3; mirrors the bold-local next/font precedent).
// Bangers is single-weight (400), so no multi-weight fallback-override caveat.
export const bangersFont = Bangers({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bangers',
  display: 'swap',
});

export const openSansFont = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-open-sans',
  display: 'swap',
});

// Comic design tokens — the shell's SOLE color authority (design spec §1–§3),
// injected as a :root{} block in the layout's dang-comic branch. Same
// joined-array shape as BL_TOKENS. branding.primary_color (#F97316 shadow) is
// bypassed via the computeShellCssVars dang-comic guard — every color here is a
// hardcoded literal.
//
// ⚠️ COLOR APPROXIMATION FLAG: the design spec (§1) gives an exact hex ONLY for
// orange (#F26B0F, canonical). Cyan/teal, yellow, and green are described by
// role but have no published hex, and the branded values live in the (out-of-
// scope) Vite repo / brand assets. The three below are standard comic-palette
// APPROXIMATIONS, authorized as flagged placeholders — CORRECT THEM to the real
// brand values before any dang-comic cutover/activation.
export const DANG_TOKENS = [
  // Brand colors
  '--dang-orange:#F26B0F',        // canonical PRIMARY (exact, locked)
  '--dang-orange-dark:#D15C0A',   // derived hover/shade
  '--dang-cyan:#29ABE2',          // APPROX — burst outline / testimonial band / video border
  '--dang-yellow:#FFD100',        // APPROX — DANG! wordmark / ribbons / angled fills / stars
  '--dang-green:#39B54A',         // APPROX — shield outline / step-4 accent
  // Ink + surface
  '--dang-ink:#111111',           // heavy black outlines
  '--dang-white:#FFFFFF',
  '--dang-surface:#FFFFFF',
  '--dang-surface-alt:#FFF6EE',   // halftone-tinted section wash
  '--dang-text:#1A1A1A',
  '--dang-text-muted:#555555',
  '--dang-text-on-orange:#FFFFFF',
  // Typography
  "--dang-font-display:var(--font-bangers),'Bangers',cursive",
  "--dang-font-body:var(--font-open-sans),'Open Sans',sans-serif",
  '--dang-weight-regular:400',
  '--dang-weight-semibold:600',
  '--dang-weight-bold:700',
  '--dang-letter-spacing-comic:0.02em',
  '--dang-line-height-tight:1.05',
  '--dang-line-height-body:1.6',
  // Structure
  '--dang-outline:3px solid #111111',
  '--dang-outline-thick:4px solid #111111',
  '--dang-radius:14px',
  '--dang-radius-pill:999px',
  '--dang-shadow-comic:4px 4px 0 #111111',
].join(';') + ';';
