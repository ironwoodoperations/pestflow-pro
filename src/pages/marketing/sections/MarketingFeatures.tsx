const C = { bg: '#ffffff', bgAlt: '#f8fafc', green: '#22c55e', navy: '#1e3a5f', text: '#1e293b', muted: '#64748b' }
const F = { h: "'Bricolage Grotesque', sans-serif", b: "'Plus Jakarta Sans', sans-serif" }

const FEATURES = [
  { icon: '🌐', title: 'Professional Website', body: 'Custom-branded, mobile-first site live in days. Not weeks.' },
  { icon: '📍', title: 'Local SEO', body: 'Show up when homeowners search for pest control in your city.' },
  { icon: '📱', title: 'Social Media', body: 'Scheduled posts, AI-generated captions, one dashboard.' },
  { icon: '📋', title: 'Lead CRM', body: 'Every quote request captured, logged, and sent to your phone instantly.' },
  { icon: '✏️', title: 'Content Control', body: 'Update your services, hours, photos, and more — any time.' },
  { icon: '🚀', title: 'Done For You', body: 'We build it, we optimize it, we maintain it. You just answer the phone.' },
]

export default function MarketingFeatures() {
  return (
    <section id="features" style={{ background: C.bg, padding: '96px 32px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontFamily: F.b, fontSize: 12, fontWeight: 700, color: C.green, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>
            Everything You Need
          </div>
          <h2 id="how-it-works" style={{ fontFamily: F.h, fontWeight: 800, fontSize: 'clamp(28px,4vw,46px)', letterSpacing: '-0.03em', color: C.navy, margin: '0 0 16px', lineHeight: 1.15 }}>
            One Platform. Zero Headaches.
          </h2>
          <p style={{ fontFamily: F.b, fontSize: 17, color: C.muted, margin: '0 auto', maxWidth: 480 }}>
            We handle the tech. You handle the bugs.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              background: C.bgAlt,
              border: '1px solid rgba(30,58,95,0.08)',
              borderRadius: 16, padding: '28px 26px',
            }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontFamily: F.h, fontWeight: 700, fontSize: 17, color: C.navy, margin: '0 0 10px' }}>
                {f.title}
              </h3>
              <p style={{ fontFamily: F.b, fontSize: 14, color: C.muted, lineHeight: 1.65, margin: 0 }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
