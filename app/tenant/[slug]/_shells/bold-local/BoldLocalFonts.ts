import { Barlow_Condensed, Inter } from 'next/font/google';

export const barlowFont = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-barlow',
  display: 'swap',
});

export const interFont = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const BL_TOKENS = [
  // Color
  '--bl-surface:#0F1216',
  '--bl-surface-2:#1A1F27',
  '--bl-surface-elevated:#22282F',
  '--bl-accent:#F5A623',
  '--bl-accent-hot:#E2541C',
  '--bl-text:#FFFFFF',
  '--bl-text-secondary:#C9CDD2',
  '--bl-text-muted:#9AA3AD',
  '--bl-border:#2A3038',
  '--bl-border-strong:#3A434F',
  // Typography
  "--bl-font-display:var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)",
  "--bl-font-body:var(--font-inter,'Inter',sans-serif)",
  '--bl-font-weight-regular:400',
  '--bl-font-weight-medium:500',
  '--bl-font-weight-bold:700',
  '--bl-letter-spacing-tight:-0.01em',
  '--bl-letter-spacing-normal:0',
  '--bl-letter-spacing-wide:0.13em',
  '--bl-line-height-tight:1.05',
  '--bl-line-height-normal:1.4',
  '--bl-line-height-loose:1.65',
  // Spacing (tight)
  '--bl-space-xs:0.25rem',
  '--bl-space-sm:0.5rem',
  '--bl-space-md:1rem',
  '--bl-space-lg:1.5rem',
  '--bl-space-xl:2.5rem',
  '--bl-space-2xl:3.5rem',
  '--bl-space-3xl:5rem',
  // Radius (sharp)
  '--bl-radius-sm:0px',
  '--bl-radius-md:0px',
  '--bl-radius-lg:2px',
  '--bl-radius-pill:0px',
  // Shadows (stark / mostly none)
  '--bl-shadow-sm:0 1px 0 rgba(0,0,0,0.4)',
  '--bl-shadow-md:0 4px 0 rgba(0,0,0,0.5)',
  '--bl-shadow-lg:0 8px 0 rgba(0,0,0,0.6)',
  // Transitions
  '--bl-transition-fast:80ms ease',
  '--bl-transition-normal:140ms ease',
].join(';') + ';';
