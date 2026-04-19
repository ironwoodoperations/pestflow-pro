interface Props {
  serviceAreas?: string[];
}

const CHIP_STYLE = {
  display: 'inline-block',
  border: '1px solid var(--bl-accent)',
  color: 'var(--bl-accent)',
  fontFamily: "var(--font-inter,'Inter',sans-serif)",
  fontWeight: 500,
  fontSize: 14,
  padding: '6px 12px',
  borderRadius: 0,
  lineHeight: 1.4,
} as React.CSSProperties;

export function BoldLocalTrustCards({ serviceAreas = [] }: Props) {
  if (serviceAreas.length === 0) return null;

  return (
    <section style={{ backgroundColor: 'var(--bl-surface)', borderBottom: '1px solid var(--bl-border)', padding: '3.5rem 1rem' }}>
      <div className="max-w-6xl mx-auto">
        <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 11, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--bl-text-muted)', marginBottom: '0.5rem' }}>
          Service area
        </p>
        <h2 style={{ fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--bl-text)', marginBottom: '1.5rem', lineHeight: 1.1 }}>
          Where we work
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {serviceAreas.map((area) => (
            <span key={area} style={CHIP_STYLE}>{area}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
