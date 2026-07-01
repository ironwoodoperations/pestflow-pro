// Authored inline-SVG comic devices for the Dang comic shell (design spec §3).
// The branded burst/seal assets live in the out-of-scope Vite repo and could
// not be migrated; per the PR 4 asset decision these are hand-built SVG devices
// using the --dang-* tokens (scalable, tokenized, no 404). Refine toward the
// real brand marks in a follow-up once the assets are available.
import type { CSSProperties, ReactElement } from 'react';

// Halftone dot field as a CSS background (orange dots fading over a surface).
export function halftoneStyle(dot = 'rgba(242,107,15,0.18)'): CSSProperties {
  return {
    backgroundImage: `radial-gradient(${dot} 1.5px, transparent 1.6px)`,
    backgroundSize: '14px 14px',
  };
}

// DANG! starburst — jagged cyan-outline + orange-fill explosion with halftone
// dots; the wordmark IS the burst (spec §3). Used as logo, nav/footer centerpiece.
export function DangBurst({ size = 96, wordmark = true }: { size?: number; wordmark?: boolean }) {
  const pts = burstPoints(24, size / 2, size / 2, size * 0.5, size * 0.34);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Dang Pest Control">
      <polygon points={pts} fill="var(--dang-orange)" stroke="var(--dang-cyan)" strokeWidth={size * 0.045} strokeLinejoin="round" />
      <polygon points={pts} fill="none" stroke="var(--dang-ink)" strokeWidth={size * 0.02} strokeLinejoin="round" opacity={0.5} />
      {wordmark && (
        <text
          x="50%" y="54%" textAnchor="middle" dominantBaseline="middle"
          fontFamily="var(--dang-font-display)" fill="var(--dang-yellow)"
          stroke="var(--dang-ink)" strokeWidth={size * 0.012}
          fontSize={size * 0.32} style={{ letterSpacing: '0.02em' }}
        >DANG!</text>
      )}
    </svg>
  );
}

// Super-Powered Guarantee shield — green-outlined superhero shield (spec §3).
export function DangShield({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Super-Powered Guarantee">
      <path d="M32 3 L57 12 V30 C57 46 46 56 32 61 C18 56 7 46 7 30 V12 Z"
        fill="var(--dang-white)" stroke="var(--dang-green)" strokeWidth={4} strokeLinejoin="round" />
      <path d="M32 3 L57 12 V30 C57 46 46 56 32 61 C18 56 7 46 7 30 V12 Z"
        fill="none" stroke="var(--dang-ink)" strokeWidth={1.5} strokeLinejoin="round" opacity={0.4} />
      <path d="M22 32 l7 7 l14 -15" fill="none" stroke="var(--dang-orange)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// White comic cloud-puff bottom edge (spec §3 — orange→white transitions).
export function CloudBottom({ fill = 'var(--dang-white)' }: { fill?: string }) {
  return (
    <svg viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true"
      style={{ position: 'absolute', left: 0, bottom: -1, width: '100%', height: 48, display: 'block' }}>
      <path d="M0 60 V30 C60 10 120 10 180 26 C240 6 320 6 380 28 C450 4 540 8 600 30 C670 6 760 8 820 28 C890 6 980 8 1040 26 C1100 12 1160 14 1200 30 V60 Z"
        fill={fill} stroke="var(--dang-ink)" strokeWidth={3} />
    </svg>
  );
}

// Teal halftone + sunburst-rays band backdrop (testimonials, spec §5.8).
export function SunburstBand() {
  const rays: ReactElement[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i * 15 * Math.PI) / 180;
    rays.push(<line key={i} x1="600" y1="200" x2={600 + Math.cos(a) * 900} y2={200 + Math.sin(a) * 900} stroke="rgba(255,255,255,0.10)" strokeWidth={40} />);
  }
  return (
    <svg viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <rect width="1200" height="400" fill="var(--dang-cyan)" />
      {rays}
    </svg>
  );
}

function burstPoints(spikes: number, cx: number, cy: number, outer: number, inner: number): string {
  const pts: string[] = [];
  const step = Math.PI / spikes;
  let rot = -Math.PI / 2;
  for (let i = 0; i < spikes; i++) {
    pts.push(`${cx + Math.cos(rot) * outer},${cy + Math.sin(rot) * outer}`);
    rot += step;
    pts.push(`${cx + Math.cos(rot) * inner},${cy + Math.sin(rot) * inner}`);
    rot += step;
  }
  return pts.join(' ');
}
