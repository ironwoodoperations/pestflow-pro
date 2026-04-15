import ClientMockupCarousel from '../ClientMockupCarousel'

const C = { bg: '#1e2d4a', green: '#22c55e', white: '#ffffff', muted: 'rgba(255,255,255,0.65)' }
const F = { h: "'Bricolage Grotesque', sans-serif", b: "'Plus Jakarta Sans', sans-serif" }

export default function MarketingHero() {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section style={{ background: C.bg, padding: '80px 32px 48px', position: 'relative', overflow: 'hidden' }}>
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
            Professional website. Local SEO. Social media. Lead capture. All done for you — and always in your control. No agency gatekeeping. Update your site, your content, and your services on your schedule.
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

        {/* Right: logo + carousel */}
        <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <img src="/pestflow-pro-white.png" alt="PestFlow Pro" style={{ height: 240, width: 'auto' }} />
          </div>
          <ClientMockupCarousel />
        </div>
      </div>
    </section>
  )
}
