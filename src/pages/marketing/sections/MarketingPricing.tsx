const C = { bgAlt: '#111827', teal: '#06B6D4', green: '#10B981', white: '#f9fafb', muted: '#9ca3af' }
const F = { h: "'Bricolage Grotesque', sans-serif", b: "'Plus Jakarta Sans', sans-serif" }

const PLANS = [
  {
    name: 'Starter', price: 149, featured: false, cta: 'Get Started',
    features: ['Professional website', 'Quote form', 'Lead email alerts', 'Basic SEO'],
  },
  {
    name: 'Growth', price: 249, featured: false, cta: 'Get Started',
    features: ['Everything in Starter', 'Social media (3 platforms)', 'AI captions', 'SMS alerts', 'City SEO pages'],
  },
  {
    name: 'Pro', price: 349, featured: true, cta: 'Get Started',
    features: ['Everything in Growth', 'Your current site re-imagined', 'Full social suite', 'Priority support'],
  },
  {
    name: 'Elite', price: 499, featured: false, cta: 'Contact Us',
    features: ['Everything in Pro', 'Full custom site — or keep your current site', 'Dedicated onboarding', 'White-glove setup'],
  },
]

export default function MarketingPricing() {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section id="pricing" style={{ background: C.bgAlt, padding: '96px 32px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontFamily: F.b, fontSize: 12, fontWeight: 700, color: C.teal, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>Simple Pricing</div>
          <h2 style={{ fontFamily: F.h, fontWeight: 800, fontSize: 'clamp(28px,4vw,46px)', letterSpacing: '-0.03em', color: C.white, margin: '0 0 14px', lineHeight: 1.15 }}>
            Plans Built for Pest Control Companies
          </h2>
          <p style={{ fontFamily: F.b, fontSize: 16, color: C.muted }}>No long-term contracts. Cancel any time.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {PLANS.map(plan => (
            <div key={plan.name} style={{
              background: plan.featured ? 'linear-gradient(160deg, rgba(6,182,212,0.1) 0%, rgba(16,185,129,0.06) 100%)' : '#0d1526',
              border: plan.featured ? '2px solid rgba(6,182,212,0.5)' : '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '28px 22px',
              position: 'relative',
              transform: plan.featured ? 'translateY(-4px)' : undefined,
            }}>
              {plan.featured && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: C.teal, color: '#0a0f1e', fontSize: 11, fontWeight: 700, fontFamily: F.b, padding: '3px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  Most Popular
                </div>
              )}

              <div style={{ fontFamily: F.h, fontWeight: 700, fontSize: 16, color: C.white, marginBottom: 6 }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                <span style={{ fontFamily: F.h, fontWeight: 800, fontSize: 34, letterSpacing: '-0.03em', color: plan.featured ? C.teal : C.white }}>${plan.price}</span>
                <span style={{ fontFamily: F.b, fontSize: 13, color: C.muted }}>/mo</span>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 18, marginBottom: 22 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: C.green, fontWeight: 700, fontSize: 12, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontFamily: F.b, fontSize: 12.5, color: C.muted, lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollTo('contact')}
                style={{
                  width: '100%', padding: '11px 0', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  fontFamily: F.b, cursor: 'pointer', border: 'none',
                  background: plan.featured ? C.teal : 'rgba(255,255,255,0.07)',
                  color: plan.featured ? '#0a0f1e' : C.white,
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p style={{ fontFamily: F.b, fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 28 }}>
          No long-term contracts. Monthly subscription billed automatically.
        </p>
      </div>
    </section>
  )
}
