interface Props { businessName: string; intro?: string }

const REASONS = [
  { num: '01', heading: 'No callbacks, no excuses', body: 'When we say the problem is gone, it\'s gone. We re-treat at no charge if pests come back between scheduled visits.' },
  { num: '02', heading: 'Same-day and next-day service', body: 'We staff for urgency. Most customers get an appointment within 24 hours of calling — often the same day.' },
  { num: '03', heading: 'Flat pricing, no surprises', body: 'You get a number upfront. No bait-and-switch add-ons, no "environmental fees" in the fine print.' },
];

export function BoldLocalWhyUs({ businessName }: Props) {
  return (
    <section style={{ backgroundColor: 'var(--bl-surface-2)', borderBottom: '1px solid var(--bl-border)', padding: '4rem 1rem' }}>
      <div className="max-w-6xl mx-auto">
        <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 11, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--bl-text-muted)', marginBottom: '0.5rem' }}>
          Why choose us
        </p>
        <h2 style={{ fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontSize: 'clamp(26px,4vw,42px)', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--bl-text)', marginBottom: '2.5rem', lineHeight: 1.1 }}>
          How {businessName} is different
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '2rem' }}>
          {REASONS.map((r) => (
            <div key={r.num}>
              <p style={{ fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontSize: 36, fontWeight: 700, color: 'var(--bl-accent)', lineHeight: 1, marginBottom: '0.5rem', opacity: 0.6 }}>{r.num}</p>
              <h3 style={{ fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontSize: 20, fontWeight: 700, color: 'var(--bl-text)', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>{r.heading}</h3>
              <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, color: 'var(--bl-text-secondary)', lineHeight: 1.6 }}>{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
