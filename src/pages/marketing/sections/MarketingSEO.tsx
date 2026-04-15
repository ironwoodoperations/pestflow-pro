const C = { bg: '#0a0f1e', teal: '#06B6D4', green: '#10B981', white: '#f9fafb', muted: '#9ca3af' }
const F = { h: "'Bricolage Grotesque', sans-serif", b: "'Plus Jakarta Sans', sans-serif" }

const STATS = [
  { val: '91/100', label: 'PageSpeed Score', sub: 'vs avg 54 before' },
  { val: 'City Pages', label: 'For Every Service Area', sub: 'Built in from day one' },
  { val: 'Built In', label: 'Schema, Sitemap, robots.txt', sub: 'Zero config needed' },
]

export default function MarketingSEO() {
  return (
    <section style={{ background: C.bg, padding: '96px 32px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontFamily: F.b, fontSize: 12, fontWeight: 700, color: C.teal, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>
            Local SEO
          </div>
          <h2 style={{ fontFamily: F.h, fontWeight: 800, fontSize: 'clamp(28px,4vw,46px)', letterSpacing: '-0.03em', color: C.white, margin: '0 0 20px', lineHeight: 1.15 }}>
            Rank #1 When Homeowners Search for Pest Control
          </h2>
          <p style={{ fontFamily: F.b, fontSize: 17, color: C.muted, maxWidth: 660, margin: '0 auto' }}>
            We optimize every page for the searches your customers are actually making.
            Ant control Austin TX. Termite inspection Tyler TX. Mosquito treatment near me.
            Your site is built to rank — not just look good.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 48 }}>
          {STATS.map(s => (
            <div key={s.label} style={{
              background: 'rgba(6,182,212,0.06)',
              border: '1px solid rgba(6,182,212,0.2)',
              borderRadius: 16, padding: '32px 28px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: F.h, fontWeight: 800, fontSize: 36, color: C.teal, letterSpacing: '-0.02em', marginBottom: 8 }}>
                {s.val}
              </div>
              <div style={{ fontFamily: F.b, fontWeight: 600, fontSize: 14, color: C.white, marginBottom: 6 }}>
                {s.label}
              </div>
              <div style={{ fontFamily: F.b, fontSize: 12, color: C.muted }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <a
            href="https://pagespeed.web.dev"
            target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: F.b, fontSize: 14, fontWeight: 600, color: C.teal, textDecoration: 'none' }}
          >
            See your PageSpeed score →
          </a>
        </div>
      </div>
    </section>
  )
}
