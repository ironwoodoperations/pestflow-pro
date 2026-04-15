const C = { bg: '#1e2d4a', green: '#22c55e', white: '#ffffff', muted: 'rgba(255,255,255,0.65)' }
const F = { h: "'Bricolage Grotesque', sans-serif", b: "'Plus Jakarta Sans', sans-serif" }

function BrowserMockup() {
  return (
    <div style={{
      background: '#0d1526', borderRadius: 14,
      border: '1px solid rgba(34,197,94,0.25)',
      boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 40px rgba(34,197,94,0.08)',
      overflow: 'hidden', maxWidth: 480, width: '100%',
    }}>
      {/* Browser chrome */}
      <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {['#ef4444','#f59e0b','#22c55e'].map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
        ))}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 12px', fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', marginLeft: 6 }}>
          lone-star-pest-solutions.pestflowpro.com
        </div>
      </div>
      {/* Site preview */}
      <div>
        <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f2744)', padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#22c55e', fontFamily: F.b, fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>LONE STAR PEST SOLUTIONS</div>
          <div style={{ fontSize: 15, fontWeight: 800, fontFamily: F.h, color: '#ffffff', lineHeight: 1.3, marginBottom: 10 }}>
            Austin's Trusted Pest Control Experts
          </div>
          <div style={{ display: 'inline-block', background: '#22c55e', color: '#ffffff', fontSize: 10, fontWeight: 700, fontFamily: F.b, padding: '5px 14px', borderRadius: 6 }}>
            Get a Free Quote →
          </div>
        </div>
        <div style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 6, background: '#0d1526' }}>
          {['Ant Control','Termite','Mosquito','Rodents','Roaches'].map(s => (
            <span key={s} style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: 10, color: '#22c55e', fontFamily: F.b }}>{s}</span>
          ))}
        </div>
        <div style={{ padding: '10px 20px 18px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 16, background: '#0d1526' }}>
          {['⭐ 4.9 Reviews','📍 Austin, TX','✓ Licensed & Insured'].map(t => (
            <span key={t} style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: F.b }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ padding: '8px 20px 12px', background: 'rgba(34,197,94,0.06)', borderTop: '1px solid rgba(34,197,94,0.1)', textAlign: 'center' }}>
        <span style={{ fontSize: 10, color: '#22c55e', fontFamily: F.b, fontWeight: 600 }}>Live Client Site — Lone Star Pest Solutions — Austin, TX</span>
      </div>
    </div>
  )
}

export default function MarketingHero() {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section style={{ background: C.bg, padding: '80px 32px', position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '20%', width: 600, height: 500, background: 'radial-gradient(ellipse, rgba(34,197,94,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(34,197,94,0.08) 0%, transparent 70%)' }} />
      </div>

      <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 64, position: 'relative', flexWrap: 'wrap' }}>
        {/* Left: Text */}
        <div style={{ flex: '1 1 400px' }}>
          <div style={{ display: 'inline-block', marginBottom: 20, padding: '5px 14px', borderRadius: 20, border: '1px solid rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.1)', color: C.green, fontSize: 12, fontFamily: F.b, fontWeight: 600, letterSpacing: 0.5 }}>
            Built for Pest Control Companies
          </div>

          <h1 style={{ fontFamily: F.h, fontWeight: 800, fontSize: 'clamp(36px,5vw,62px)', lineHeight: 1.1, letterSpacing: '-0.03em', color: C.white, margin: '0 0 20px' }}>
            The Complete Digital Presence for Pest Control Companies
          </h1>

          <p style={{ fontFamily: F.b, fontSize: 18, color: C.muted, lineHeight: 1.7, margin: '0 0 36px', maxWidth: 520 }}>
            Professional website. Local SEO. Social media. Lead capture. All done for you — so you can focus on running your business.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
            <button
              onClick={() => scrollTo('features')}
              style={{ padding: '14px 26px', borderRadius: 10, background: C.green, color: '#ffffff', fontSize: 15, fontWeight: 700, fontFamily: F.b, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(34,197,94,0.35)' }}
            >
              See How It Works
            </button>
            <a href="tel:4303675601" style={{ padding: '14px 26px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)', color: C.white, fontSize: 15, fontWeight: 600, fontFamily: F.b, textDecoration: 'none' }}>
              Call (430) 367-5601
            </a>
          </div>

          <p style={{ fontFamily: F.b, fontSize: 13, color: C.muted, margin: 0 }}>
            Trusted by pest control companies across Texas
          </p>
        </div>

        {/* Right: mockup */}
        <div style={{ flex: '1 1 380px', display: 'flex', justifyContent: 'center' }}>
          <BrowserMockup />
        </div>
      </div>
    </section>
  )
}
