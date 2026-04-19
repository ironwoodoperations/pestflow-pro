import Link from 'next/link';

const STEPS = [
  { num: '1', title: 'Call or request online', body: 'Tell us what you\'re seeing. We\'ll ask a few questions to understand the situation before we show up.' },
  { num: '2', title: 'We inspect the property', body: 'A licensed technician walks the perimeter and interior, identifying pest species, entry points, and activity level.' },
  { num: '3', title: 'Targeted treatment', body: 'We treat with the right product for the right pest — not a one-size spray. Gel baits, exclusion, and residuals where they belong.' },
  { num: '4', title: 'Guaranteed follow-up', body: 'Pests come back? So do we. Re-service is included at no charge between scheduled visits for active plans.' },
];

export function BoldLocalHowItWorks() {
  return (
    <section style={{ backgroundColor: 'var(--bl-surface)', borderBottom: '1px solid var(--bl-border)', padding: '4rem 1rem' }}>
      <div className="max-w-6xl mx-auto">
        <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 11, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--bl-text-muted)', marginBottom: '0.5rem' }}>
          Our process
        </p>
        <h2 style={{ fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontSize: 'clamp(26px,4vw,42px)', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--bl-text)', marginBottom: '2.5rem', lineHeight: 1.1 }}>
          How it works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '0' }}>
          {STEPS.map((s, i) => (
            <div key={s.num} style={{ padding: '1.5rem', borderRight: i < STEPS.length - 1 ? '1px solid var(--bl-border)' : 'none' }}>
              <div style={{ width: 36, height: 36, backgroundColor: 'var(--bl-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', borderRadius: 0 }}>
                <span style={{ fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontWeight: 700, fontSize: 16, color: '#0F1216' }}>{s.num}</span>
              </div>
              <h3 style={{ fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontSize: 18, fontWeight: 700, color: 'var(--bl-text)', marginBottom: '0.4rem', letterSpacing: '-0.01em' }}>{s.title}</h3>
              <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13, color: 'var(--bl-text-secondary)', lineHeight: 1.55 }}>{s.body}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '2.5rem' }}>
          <Link href="/quote" style={{ display: 'inline-block', backgroundColor: 'var(--bl-accent)', color: '#0F1216', fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontWeight: 700, fontSize: 15, padding: '0.75rem 1.75rem', borderRadius: 0, textDecoration: 'none' }}>
            Schedule your inspection
          </Link>
        </div>
      </div>
    </section>
  );
}
