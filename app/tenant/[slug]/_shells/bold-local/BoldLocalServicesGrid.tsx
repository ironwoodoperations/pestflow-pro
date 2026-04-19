import Link from 'next/link';
import { PEST_CONTENT_MAP } from '../../../../../src/shells/_shared/pestContent';
import { PestIcon } from '../../../../../src/shells/_shared/PestIcon';

const PESTS = Object.values(PEST_CONTENT_MAP);

const SECTION_STYLE = {
  backgroundColor: 'var(--bl-surface)',
  borderBottom: '1px solid var(--bl-border)',
  padding: '4rem 1rem',
} as React.CSSProperties;

const GRID_STYLE = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
  gap: '1px',
  backgroundColor: 'var(--bl-border)',
  border: '1px solid var(--bl-border)',
} as React.CSSProperties;

const CARD_STYLE = {
  backgroundColor: 'var(--bl-surface-2)',
  padding: '1.5rem',
  textDecoration: 'none',
  display: 'block',
  borderBottom: 'none',
  transition: 'border-color 0.15s',
} as React.CSSProperties;

function truncate(s: string, max = 80) {
  const first = s.split('.')[0];
  return first.length <= max ? first : first.slice(0, max) + '…';
}

export function BoldLocalServicesGrid() {
  return (
    <section style={SECTION_STYLE}>
      <div className="max-w-6xl mx-auto">
        <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 11, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--bl-text-muted)', marginBottom: '0.5rem' }}>
          What we treat
        </p>
        <h2 style={{ fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--bl-text)', marginBottom: '2rem', lineHeight: 1.1 }}>
          Pests we handle every day
        </h2>
        <div style={GRID_STYLE}>
          {PESTS.map((pest) => (
            <Link
              key={pest.slug}
              href={`/${pest.slug}`}
              style={CARD_STYLE}
              className="bl-service-card"
            >
              <span style={{ color: 'var(--bl-accent)', display: 'block', marginBottom: '0.75rem' }}>
                <PestIcon pest={pest.slug} size={40} />
              </span>
              <span style={{ fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontSize: 18, fontWeight: 700, color: 'var(--bl-text)', display: 'block', marginBottom: '0.35rem' }}>
                {pest.displayName}
              </span>
              <span style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13, color: 'var(--bl-text-secondary)', lineHeight: 1.4, display: 'block' }}>
                {truncate(pest.blurb)}
              </span>
            </Link>
          ))}
        </div>
      </div>
      <style>{`.bl-service-card:hover{outline:2px solid var(--bl-accent);outline-offset:-2px}`}</style>
    </section>
  );
}
