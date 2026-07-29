import { Cormorant_Garamond, Jost } from 'next/font/google';

// Vita Glow display + body fonts (brief §2). next/font/google self-hosts at
// build time and applies size-adjust fallback metrics (CLS-safe; same precedent
// as the bold-local / dang next/font usage). Cormorant Garamond carries the
// editorial display voice (light weights, incl. italic 300); Jost carries body,
// eyebrows, and wide-tracked uppercase labels.
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

// Vita Glow design tokens — the shell's SOLE color authority (brief §3), injected
// as a :root{} block in the layout's vita-glow branch. Same joined-array shape as
// DANG_TOKENS / BL_TOKENS. Every color is a hardcoded literal; a tenant's
// branding.primary_color is bypassed via the computeShellCssVars vita-glow guard,
// so the fixed medical-aesthetics palette can never be re-derived. Palette hexes
// are exact per the approved brief.
export const VITA_GLOW_TOKENS = [
  // Palette (exact hex — brief §3)
  '--vg-cream:#FAF7F2',        // cream ground
  '--vg-cream-deep:#F2EDE4',   // cream deep (alt sections / card cells)
  '--vg-gold:#C9A227',         // gold (hairlines, price lines, primary accent)
  '--vg-gold-light:#E3C77B',   // gold light (soft highlights / gradient stops)
  '--vg-grey:#7A736E',         // warm grey (muted text / eyebrows)
  '--vg-ink:#3D3733',          // deep ink (headings, body, dark footer)
  '--vg-white:#FFFFFF',
  // Surfaces + text roles
  '--vg-surface:#FAF7F2',
  '--vg-surface-alt:#F2EDE4',
  '--vg-text:#3D3733',
  '--vg-text-muted:#7A736E',
  '--vg-on-gold:#3D3733',      // ink reads on gold — deliberate editorial choice
  // Typography
  "--vg-font-display:var(--font-cormorant),'Cormorant Garamond',serif",
  "--vg-font-body:var(--font-jost),'Jost',sans-serif",
  '--vg-weight-light:300',
  '--vg-weight-regular:400',
  '--vg-weight-medium:500',
  '--vg-tracking-display:-0.02em', // negative tracking on light serif display
  '--vg-tracking-wide:0.24em',     // wide tracking on Jost uppercase labels
  '--vg-line-tight:1.05',
  '--vg-line-body:1.7',
  // Structure
  '--vg-hairline:rgba(201,162,39,0.35)',      // gold-tinted 1px gridline
  '--vg-hairline-strong:rgba(201,162,39,0.6)',
  '--vg-radius:2px',                            // near-square, editorial
].join(';') + ';';
