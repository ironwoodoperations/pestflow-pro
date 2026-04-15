const C = { bgAlt: '#111827', teal: '#06B6D4', green: '#10B981', white: '#f9fafb', muted: '#9ca3af' }
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
      border: '1px solid rgba(6,182,212,0.2)',
      boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
      overflow: 'hidden',
    }}>
      {/* Chrome bar */}
      <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {['#ef4444','#f59e0b','#22c55e'].map((c, i) => (
          <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
        ))}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '3px 10px', fontSize: 10, color: C.muted, fontFamily: 'monospace', marginLeft: 6 }}>
          lone-star-pest-solutions.pestflowpro.com
        </div>
        <div style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 4, padding: '2px 8px', fontSize: 9, color: C.teal, fontFamily: F.b, fontWeight: 600 }}>LIVE</div>
      </div>
      {/* Page content preview */}
      <div style={{ padding: '20px' }}>
        {/* Nav mockup */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.white, fontFamily: F.h }}>Lone Star Pest Solutions</span>
          <span style={{ fontSize: 9, color: C.teal, fontFamily: F.b }}>Services | About | Contact</span>
        </div>
        {/* Hero block */}
        <div style={{ background: 'linear-gradient(135deg, #1a3a5c, #0f2744)', borderRadius: 10, padding: '20px 16px', textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, fontFamily: F.h, color: C.white, marginBottom: 8 }}>Pest Control Austin TX</div>
          <div style={{ fontSize: 10, color: C.muted, fontFamily: F.b, marginBottom: 12, lineHeight: 1.5 }}>Fast, reliable pest control for homes and businesses</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <span style={{ background: C.teal, color: '#0a0f1e', fontSize: 9, fontWeight: 700, padding: '4px 10px', borderRadius: 5, fontFamily: F.b }}>Free Quote</span>
            <span style={{ border: '1px solid rgba(255,255,255,0.2)', color: C.white, fontSize: 9, padding: '4px 10px', borderRadius: 5, fontFamily: F.b }}>(512) 555-0100</span>
          </div>
        </div>
        {/* Service cards row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {['🐜 Ants','🦟 Mosquito','🐀 Rodents'].map(s => (
            <div key={s} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)', fontSize: 10, color: C.muted, fontFamily: F.b }}>{s}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MarketingWebsiteShowcase() {
  return (
    <section style={{ background: C.bgAlt, padding: '96px 32px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', gap: 72, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Text */}
        <div style={{ flex: '1 1 380px' }}>
          <div style={{ fontFamily: F.b, fontSize: 12, fontWeight: 700, color: C.teal, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>Your Website</div>
          <h2 style={{ fontFamily: F.h, fontWeight: 800, fontSize: 'clamp(26px,3.5vw,40px)', letterSpacing: '-0.03em', color: C.white, margin: '0 0 18px', lineHeight: 1.2 }}>
            A Site That Actually Gets You Calls
          </h2>
          <p style={{ fontFamily: F.b, fontSize: 15, color: C.muted, lineHeight: 1.75, margin: '0 0 28px' }}>
            We build you a fast, mobile-optimized website with real content about your business — not generic templates. Service pages for every pest you treat, city pages for every area you serve, and a quote form that sends leads straight to your phone.
          </p>
          <div style={{ marginBottom: 32 }}>
            {BULLETS.map(b => (
              <div key={b} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                <span style={{ color: C.green, fontWeight: 700, fontSize: 15, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontFamily: F.b, fontSize: 14, color: C.white, lineHeight: 1.5 }}>{b}</span>
              </div>
            ))}
          </div>
          <a
            href="https://lone-star-pest-solutions.pestflowpro.com"
            target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: F.b, fontSize: 14, fontWeight: 600, color: C.teal, textDecoration: 'none' }}
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
