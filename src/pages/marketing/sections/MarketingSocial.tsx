const C = { bgAlt: '#111827', teal: '#06B6D4', green: '#10B981', white: '#f9fafb', muted: '#9ca3af' }
const F = { h: "'Bricolage Grotesque', sans-serif", b: "'Plus Jakarta Sans', sans-serif" }

const BULLETS = [
  'Facebook, Instagram, YouTube, LinkedIn, Google Business',
  'AI caption generator',
  'Post scheduling calendar',
  'One-click publish',
]

function SocialPostMockup() {
  return (
    <div style={{
      background: '#0d1526', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
      overflow: 'hidden', maxWidth: 360,
    }}>
      {/* Platform bar */}
      <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1a3a5c, #06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.white, fontFamily: F.h }}>LS</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.white, fontFamily: F.b }}>Lone Star Pest Solutions</div>
          <div style={{ fontSize: 10, color: C.muted, fontFamily: F.b }}>📘 Facebook · Scheduled</div>
        </div>
        <div style={{ marginLeft: 'auto', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: '2px 10px', fontSize: 10, color: C.green, fontFamily: F.b, fontWeight: 600 }}>Scheduled</div>
      </div>
      {/* Post image placeholder */}
      <div style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #0a1f3c 100%)', padding: '28px 20px', textAlign: 'center', position: 'relative' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🦟</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.white, fontFamily: F.h }}>Mosquito Season is Here</div>
        <div style={{ fontSize: 11, color: C.teal, fontFamily: F.b, marginTop: 4 }}>Lone Star Pest Solutions</div>
      </div>
      {/* Caption */}
      <div style={{ padding: '16px' }}>
        <p style={{ fontFamily: F.b, fontSize: 12, color: C.muted, lineHeight: 1.6, margin: '0 0 12px' }}>
          ☀️ Summer is here — and so are the mosquitoes. Don't let them ruin your backyard. Our seasonal mosquito treatment keeps your outdoor spaces bite-free all season long.
          <br /><br />
          📞 Call us or request a free quote at the link in bio!
          <br /><br />
          <span style={{ color: C.teal }}>#AustinPestControl #MosquitoTreatment #LoneStarPest</span>
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, background: C.teal, borderRadius: 8, padding: '8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#0a0f1e', fontFamily: F.b }}>Publish Now</div>
          <div style={{ flex: 1, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px', textAlign: 'center', fontSize: 11, color: C.muted, fontFamily: F.b }}>Edit Caption</div>
        </div>
      </div>
    </div>
  )
}

export default function MarketingSocial() {
  return (
    <section style={{ background: C.bgAlt, padding: '96px 32px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', gap: 72, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Social post mockup */}
        <div style={{ flex: '1 1 320px', display: 'flex', justifyContent: 'center' }}>
          <SocialPostMockup />
        </div>

        {/* Text */}
        <div style={{ flex: '1 1 380px' }}>
          <div style={{ fontFamily: F.b, fontSize: 12, fontWeight: 700, color: C.teal, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>Social Media</div>
          <h2 style={{ fontFamily: F.h, fontWeight: 800, fontSize: 'clamp(26px,3.5vw,40px)', letterSpacing: '-0.03em', color: C.white, margin: '0 0 18px', lineHeight: 1.2 }}>
            Stay Active Online Without Lifting a Finger
          </h2>
          <p style={{ fontFamily: F.b, fontSize: 15, color: C.muted, lineHeight: 1.75, margin: '0 0 28px' }}>
            We connect your Facebook, Instagram, Google Business, and more. Generate AI-written captions, schedule posts in advance, and track performance — all from your dashboard.
          </p>
          <div>
            {BULLETS.map(b => (
              <div key={b} style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'flex-start' }}>
                <span style={{ color: C.green, fontWeight: 700, fontSize: 15, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontFamily: F.b, fontSize: 14, color: C.white, lineHeight: 1.5 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
