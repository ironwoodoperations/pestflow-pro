import { Inter } from 'next/font/google';

export const interFont = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const CF_TOKENS = [
  '--cf-surface:#FBF7EF',
  '--cf-surface-card:#FFFFFF',
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
].join(';') + ';';
