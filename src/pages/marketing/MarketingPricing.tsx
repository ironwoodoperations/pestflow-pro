const C = { navy: '#0d1526', text: '#f1f5f9', muted: '#cbd5e8', green: '#22c55e', amber: '#fbbf24' }

const PLANS = [
  {
    name: 'Starter', price: 149, featured: false,
    features: ['Professional website', 'Basic SEO setup', 'Lead capture forms', 'Mobile-optimized design', 'Email lead notifications'],
  },
  {
    name: 'Growth', price: 249, featured: false,
    features: ['Everything in Starter', 'SEO blog (4 posts/mo)', 'Google Business sync', 'Social content queue', 'Analytics dashboard'],
  },
  {
    name: 'Pro', price: 349, featured: true,
    features: ['Everything in Growth', 'Social campaigns', 'AI caption generator', 'Review request system', 'CRM lead tracking'],
  },
  {
    name: 'Elite', price: 499, featured: false,
    features: ['Everything in Pro', 'Full social autopilot', 'Priority support', 'Custom integrations', 'Quarterly strategy call'],
  },
]

export default function MarketingPricing() {
  return (
    <section style={{ background: '#111827', padding: '80px 24px' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>
        <h2 style={{
          fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
          fontSize: 'clamp(24px,3.5vw,36px)', letterSpacing: '-0.02em', color: C.text,
          textAlign: 'center', margin: '0 0 12px',
        }}>Simple, Transparent Pricing</h2>
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15,
          color: C.muted, textAlign: 'center', margin: '0 0 48px',
        }}>No setup fees hidden in fine print. Scott walks you through everything on a live call.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {PLANS.map(plan => (
            <div key={plan.name} style={{
              background: plan.featured ? 'linear-gradient(160deg, rgba(34,197,94,0.12) 0%, rgba(59,130,246,0.08) 100%)' : C.navy,
              border: plan.featured ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '28px 22px',
              position: 'relative',
              transform: plan.featured ? 'scale(1.03)' : undefined,
            }}>
              {plan.featured && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: C.green, color: '#0a0f1e',
                  fontSize: 11, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif",
                  padding: '3px 12px', borderRadius: 20,
                  whiteSpace: 'nowrap',
                }}>Most Popular</div>
              )}

              <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, color: C.text, margin: '0 0 8px' }}>{plan.name}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 32, letterSpacing: '-0.02em', color: plan.featured ? C.green : C.text }}>${plan.price}</span>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: C.muted }}>/mo</span>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 18 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 9, marginBottom: 11, alignItems: 'flex-start' }}>
                    <span style={{ color: C.green, fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12.5, color: C.muted, lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: C.muted,
          textAlign: 'center', marginTop: 32,
        }}>All plans include a personalized onboarding call. No contracts — cancel anytime.</p>
      </div>
    </section>
  )
}
