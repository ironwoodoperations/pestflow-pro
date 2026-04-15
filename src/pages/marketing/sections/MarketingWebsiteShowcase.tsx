const C = { bgAlt: '#f8fafc', green: '#22c55e', navy: '#1e3a5f', text: '#1e293b', muted: '#64748b' }
const F = { h: "'Bricolage Grotesque', sans-serif", b: "'Plus Jakarta Sans', sans-serif" }

const BULLETS = [
  'Live in 48–72 hours',
  'Custom domain or we host it',
  'Service pages for every pest type',
  'City-specific SEO landing pages',
  'Quote form with instant SMS + email alerts',
]

function FloatingBrowser() {
  return (
    <div style={{
      background: '#0d1526', borderRadius: 14,
      border: '1px solid rgba(34,197,94,0.2)',
      boxShadow: '0 40px 100px rgba(30,58,95,0.2)',
      overflow: 'hidden',
    }}>
      {/* Chrome bar */}
      <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {['#ef4444','#f59e0b','#22c55e'].map((c, i) => (
          <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
        ))}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '3px 10px', fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', marginLeft: 6 }}>
          lone-star-pest-solutions.pestflowpro.com
        </div>
        <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 4, padding: '2px 8px', fontSize: 9, color: '#22c55e', fontFamily: F.b, fontWeight: 600 }}>LIVE</div>
      </div>
      {/* Real screenshot */}
      <img
        src="/images/sites/lone-star-site.jpg"
        alt="Lone Star Pest Solutions"
        style={{ width: '100%', height: '380px', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
      />
    </div>
  )
}

export default function MarketingWebsiteShowcase() {
  return (
    <section style={{ background: C.bgAlt, padding: '96px 32px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', gap: 72, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Text */}
        <div style={{ flex: '1 1 380px' }}>
          <div style={{ fontFamily: F.b, fontSize: 12, fontWeight: 700, color: C.green, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>Your Website</div>
          <h2 style={{ fontFamily: F.h, fontWeight: 800, fontSize: 'clamp(26px,3.5vw,40px)', letterSpacing: '-0.03em', color: C.navy, margin: '0 0 18px', lineHeight: 1.2 }}>
            A Site That Actually Gets You Calls
          </h2>
          <p style={{ fontFamily: F.b, fontSize: 15, color: C.muted, lineHeight: 1.75, margin: '0 0 28px' }}>
            We build you a fast, mobile-optimized website around your business — your services, your cities, your brand. And you can update any of it, any time, right from your dashboard.
          </p>
          <div style={{ marginBottom: 32 }}>
            {BULLETS.map(b => (
              <div key={b} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                <span style={{ color: C.green, fontWeight: 700, fontSize: 15, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontFamily: F.b, fontSize: 14, color: C.text, lineHeight: 1.5 }}>{b}</span>
              </div>
            ))}
          </div>
          <a
            href="https://lone-star-pest-solutions.pestflowpro.com"
            target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: F.b, fontSize: 14, fontWeight: 600, color: C.green, textDecoration: 'none' }}
          >
            See a live example →
          </a>
        </div>

        {/* Browser mockup */}
        <div style={{ flex: '1 1 380px' }}>
          <FloatingBrowser />
        </div>
      </div>
    </section>
  )
}
