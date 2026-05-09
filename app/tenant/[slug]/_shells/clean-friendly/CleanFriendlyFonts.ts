import { Inter } from 'next/font/google';

export const interFont = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const CF_TOKENS = [
  // Color
  '--cf-surface:#FBF7EF',
  '--cf-surface-card:#FFFFFF',
  '--cf-surface-elevated:#FFFFFF',
  '--cf-ink:#1F3A4D',
  '--cf-ink-secondary:#4A5E6F',
  '--cf-ink-muted:#78899A',
  '--cf-sky:#79B4D4',
  '--cf-mint:#6EB592',
  '--cf-ochre:#C9A268',
  '--cf-bg-sky:#E6F1F7',
  '--cf-bg-mint:#E8F2EC',
  '--cf-bg-cream:#F5EDE0',
  '--cf-divider:#E6DFD0',
  '--cf-border:#D9D2C2',
  // Typography
  "--cf-font-display:Georgia,'Source Serif Pro',serif",
  "--cf-font-body:var(--font-inter,'Inter',sans-serif)",
  '--cf-font-weight-regular:400',
  '--cf-font-weight-medium:500',
  '--cf-font-weight-bold:600',
  '--cf-letter-spacing-tight:-0.01em',
  '--cf-letter-spacing-normal:0',
  '--cf-letter-spacing-wide:0.02em',
  '--cf-line-height-tight:1.15',
  '--cf-line-height-normal:1.55',
  '--cf-line-height-loose:1.75',
  // Spacing (airy)
  '--cf-space-xs:0.5rem',
  '--cf-space-sm:0.75rem',
  '--cf-space-md:1.25rem',
  '--cf-space-lg:2rem',
  '--cf-space-xl:3rem',
  '--cf-space-2xl:4.5rem',
  '--cf-space-3xl:6rem',
  // Radius (soft)
  '--cf-radius-sm:8px',
  '--cf-radius-md:16px',
  '--cf-radius-lg:24px',
  '--cf-radius-pill:999px',
  // Shadows (subtle)
  '--cf-shadow-sm:0 1px 4px rgba(31,58,77,0.04)',
  '--cf-shadow-md:0 2px 12px rgba(31,58,77,0.06)',
  '--cf-shadow-lg:0 8px 24px rgba(31,58,77,0.10)',
  // Transitions
  '--cf-transition-fast:120ms ease',
  '--cf-transition-normal:200ms ease',
].join(';') + ';';
