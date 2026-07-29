// Signature devices for the Vita Glow shell (brief §4). The droplet-with-leaf
// mark does structural work — nav mark, section divider, and per-card glyph — so
// it lives here and is reused everywhere rather than redrawn. All strokes read
// the --vg-* tokens so the mark recolors with the shell. Placeholder brand mark
// until the flat logo asset lands from the client.
import type { CSSProperties } from 'react';

// Droplet-with-leaf glyph. `tone` picks the stroke token (gold on cream, cream on
// the dark footer/hero). Draws a teardrop with an interior leaf + central vein.
export function VitaGlowGlyph({
  size = 40,
  tone = 'gold',
}: {
  size?: number;
  tone?: 'gold' | 'ink' | 'cream';
}) {
  const stroke =
    tone === 'cream' ? 'var(--vg-cream)' : tone === 'ink' ? 'var(--vg-ink)' : 'var(--vg-gold)';
  const sw = 24 / size < 0.04 ? 1.1 : 1.3;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label="Vita Glow"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* teardrop */}
      <path
        d="M12 2.2 C12 2.2 4.6 11 4.6 16.3 A7.4 7.4 0 0 0 19.4 16.3 C19.4 11 12 2.2 12 2.2 Z"
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      {/* interior leaf */}
      <path
        d="M12 8.4 C9.1 10.4 9.1 15 12 17.4 C14.9 15 14.9 10.4 12 8.4 Z"
        fill="none"
        stroke={stroke}
        strokeWidth={sw * 0.82}
        strokeLinejoin="round"
      />
      {/* central vein */}
      <line x1="12" y1="8.4" x2="12" y2="17.4" stroke={stroke} strokeWidth={sw * 0.82} strokeLinecap="round" />
    </svg>
  );
}

// Full-width gold hairline divider with the glyph centered between two gradient
// rules (transparent → gold → transparent). Brief §4 signature element.
export function GoldDivider({ glyphSize = 26 }: { glyphSize?: number }) {
  const rule: CSSProperties = {
    flex: 1,
    height: 1,
    background:
      'linear-gradient(90deg, transparent 0%, var(--vg-hairline-strong) 50%, transparent 100%)',
  };
  return (
    <div
      aria-hidden="true"
      style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', maxWidth: 900, margin: '0 auto', padding: '0 1.25rem' }}
    >
      <span style={rule} />
      <VitaGlowGlyph size={glyphSize} tone="gold" />
      <span style={rule} />
    </div>
  );
}

// Booking href resolver (brief §6). Square URL from settings.integrations wins;
// empty ships as the Book-a-Consult fallback route. `external` distinguishes an
// off-site Square link (new tab) from the internal fallback.
export function resolveBookingHref(squareBookingUrl?: string | null): {
  href: string;
  external: boolean;
} {
  const url = (squareBookingUrl ?? '').trim();
  if (url) return { href: url, external: true };
  return { href: '/contact', external: false };
}
