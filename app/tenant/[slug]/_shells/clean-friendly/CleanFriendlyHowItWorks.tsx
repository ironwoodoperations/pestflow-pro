import Link from 'next/link';

const STEPS = [
  {
    num: '1',
    label: 'step one',
    title: 'Get your free quote',
    body: "Call or fill out the form. We'll talk through what you're seeing and what you need — no pushy sales pitch.",
    circleBg: 'var(--cf-bg-sky)',
    numColor: '#3A7FA0',
  },
  {
    num: '2',
    label: 'step two',
    title: 'We schedule your visit',
    body: 'Licensed technician arrives on time, in a marked truck. Treatment is tailored to your property and your family.',
    circleBg: 'var(--cf-bg-mint)',
    numColor: '#3A8A64',
  },
  {
    num: '3',
    label: 'step three',
    title: 'You relax. We handle it.',
    body: 'Most clients see results in 24 hours. If pests come back between visits, so do we — at no charge.',
    circleBg: 'var(--cf-bg-cream)',
    numColor: '#9A7040',
  },
];

interface Props { ctaHref?: string }

export function CleanFriendlyHowItWorks({ ctaHref = '/quote' }: Props) {
  return (
    <section style={{ backgroundColor: 'var(--cf-surface)', borderTop: '1px solid var(--cf-divider)', borderBottom: '1px solid var(--cf-divider)', padding: '4rem 1rem' }}>
      <div className="max-w-5xl mx-auto">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p style={{ fontFamily: "Georgia,'Source Serif Pro',serif", fontStyle: 'italic', fontSize: 14, color: 'var(--cf-ink-secondary)', marginBottom: '0.5rem' }}>
            our process
          </p>
          <h2 style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 'clamp(24px,3.5vw,36px)', color: 'var(--cf-ink)', lineHeight: 1.2 }}>
            Simple, considerate, effective
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1.5rem' }}>
          {STEPS.map((s) => (
            <div key={s.num} style={{ backgroundColor: 'var(--cf-surface-card)', border: '1px solid var(--cf-divider)', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 12px rgba(31,58,77,0.06)' }}>
              <p style={{ fontFamily: "Georgia,'Source Serif Pro',serif", fontStyle: 'italic', fontSize: 12, color: 'var(--cf-ink-muted)', marginBottom: '0.75rem' }}>
                {s.label}
              </p>
              <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: s.circleBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <span style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 22, color: s.numColor }}>{s.num}</span>
              </div>
              <h3 style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 18, color: 'var(--cf-ink)', marginBottom: '0.5rem', lineHeight: 1.25 }}>
                {s.title}
              </h3>
              <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 400, fontSize: 14, color: 'var(--cf-ink-secondary)', lineHeight: 1.65 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link href={ctaHref} style={{ display: 'inline-block', backgroundColor: 'var(--cf-ink)', color: 'var(--cf-surface)', fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 15, padding: '0.75rem 1.75rem', borderRadius: 28, textDecoration: 'none' }}>
            Schedule your free visit
          </Link>
        </div>
      </div>
    </section>
  );
}
