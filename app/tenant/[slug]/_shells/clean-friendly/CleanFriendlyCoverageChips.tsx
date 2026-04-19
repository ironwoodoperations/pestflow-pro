interface Props { serviceAreas?: string[] }

export function CleanFriendlyCoverageChips({ serviceAreas = [] }: Props) {
  if (serviceAreas.length === 0) return null;

  return (
    <section style={{ backgroundColor: 'var(--cf-surface)', borderBottom: '1px solid var(--cf-divider)', padding: '3rem 1rem' }}>
      <div className="max-w-5xl mx-auto">
        <div style={{ marginBottom: '1.75rem' }}>
          <p style={{ fontFamily: "Georgia,'Source Serif Pro',serif", fontStyle: 'italic', fontSize: 14, color: 'var(--cf-ink-secondary)', marginBottom: '0.5rem' }}>
            where we work
          </p>
          <h2 style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 'clamp(22px,3vw,32px)', color: 'var(--cf-ink)', lineHeight: 1.2 }}>
            Proudly serving our neighbors in:
          </h2>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {serviceAreas.map((city) => (
            <span key={city} style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 14, color: 'var(--cf-ink)', border: '1px solid var(--cf-sky)', borderRadius: 28, padding: '8px 16px', backgroundColor: 'var(--cf-bg-sky)' }}>
              {city}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
