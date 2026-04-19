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

export const BL_TOKENS =
  '--bl-surface:#0F1216;' +
  '--bl-surface-2:#1A1F27;' +
  '--bl-accent:#F5A623;' +
  '--bl-text:#FFFFFF;' +
  '--bl-text-secondary:#C9CDD2;' +
  '--bl-text-muted:#9AA3AD;' +
  '--bl-border:#2A3038;';
