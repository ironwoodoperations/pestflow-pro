// Signature devices for the Vita Glow shell. The droplet-with-leaf mark does
// structural work — nav/hero fallback mark, section divider, per-card glyph — so
// it lives here and is reused everywhere. Strokes read the --vg-* tokens so the
// mark recolors with the shell. Used as the placeholder brand mark ONLY when
// branding.logo_url is unset (the real logo is a raster asset rendered on cream).
import type { CSSProperties } from 'react';

// Droplet-with-leaf glyph. `tone` picks the stroke token.
export function VitaGlowGlyph({
  size = 40,
  tone = 'gold',
}: {
  size?: number;
  tone?: 'gold' | 'espresso' | 'cream';
}) {
  const stroke =
    tone === 'cream' ? 'var(--vg-cream)' : tone === 'espresso' ? 'var(--vg-espresso)' : 'var(--vg-gold)';
  const sw = 1.3;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label="Vita Glow"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <path
        d="M12 2.2 C12 2.2 4.6 11 4.6 16.3 A7.4 7.4 0 0 0 19.4 16.3 C19.4 11 12 2.2 12 2.2 Z"
        fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin="round"
      />
      <path
        d="M12 8.4 C9.1 10.4 9.1 15 12 17.4 C14.9 15 14.9 10.4 12 8.4 Z"
        fill="none" stroke={stroke} strokeWidth={sw * 0.82} strokeLinejoin="round"
      />
      <line x1="12" y1="8.4" x2="12" y2="17.4" stroke={stroke} strokeWidth={sw * 0.82} strokeLinecap="round" />
    </svg>
  );
}

// Full-width gold hairline divider with the glyph centered between two gradient
// rules (transparent → gold → transparent). Signature section device.
export function GoldDivider({ glyphSize = 24 }: { glyphSize?: number }) {
  const rule: CSSProperties = {
    flex: 1, height: 1,
    background: 'linear-gradient(90deg, transparent 0%, var(--vg-hairline-strong) 50%, transparent 100%)',
  };
  return (
    <div
      aria-hidden="true"
      style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', maxWidth: 900, margin: '0 auto', padding: '0 1.5rem' }}
    >
      <span style={rule} />
      <VitaGlowGlyph size={glyphSize} tone="gold" />
      <span style={rule} />
    </div>
  );
}

// Booking href resolver — Square URL from settings.integrations wins; empty ships
// as the Book-a-Consult fallback route. `external` marks an off-site Square link.
export function resolveBookingHref(squareBookingUrl?: string | null): {
  href: string;
  external: boolean;
} {
  const url = (squareBookingUrl ?? '').trim();
  if (url) return { href: url, external: true };
  return { href: '/contact', external: false };
}

// Shell-wide accessibility CSS — visible keyboard focus + reduced-motion opt-out.
// Injected once per page via a <style> tag.
export const VG_A11Y_CSS =
  '.vg-focus:focus-visible{outline:2px solid var(--vg-gold);outline-offset:3px}' +
  '@media (prefers-reduced-motion: reduce){.vg-card,.vg-btn{transition:none!important}}';
