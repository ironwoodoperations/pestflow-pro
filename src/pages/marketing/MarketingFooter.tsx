const C = { bg: '#0f1a2e', green: '#22c55e', white: '#ffffff', muted: 'rgba(255,255,255,0.5)' }
const F = { h: "'Bricolage Grotesque', sans-serif", b: "'Plus Jakarta Sans', sans-serif" }

const NAV_LINKS = [
  { label: 'Features', id: 'features' },
  { label: 'Pricing', id: 'pricing' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'SMS Terms', href: '/sms-terms' },
]

export default function MarketingFooter() {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <footer style={{ background: C.bg, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '48px 32px 24px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
          {/* Brand */}
          <div style={{ maxWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <img
                src="/pestflow-pro-white.png"
                alt="PestFlow Pro"
                style={{ height: 56, width: 'auto' }}
              />
            </div>
            <p style={{ fontFamily: F.b, fontSize: 13, color: C.muted, lineHeight: 1.65, margin: 0 }}>
              The operating system for pest control companies. Professional website, SEO, social media, and lead capture — all done for you.
            </p>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {NAV_LINKS.map(link => (
              link.href ? (
                <a key={link.label} href={link.href} style={{ fontFamily: F.b, fontSize: 13, color: C.muted, textDecoration: 'none', padding: '4px 8px' }}>
                  {link.label}
                </a>
              ) : (
                <button key={link.label} onClick={() => scrollTo(link.id!)} style={{ fontFamily: F.b, fontSize: 13, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
                  {link.label}
                </button>
              )
            ))}
          </div>

          {/* Contact */}
          <div style={{ textAlign: 'right' }}>
            <a href="tel:4303675601" style={{ display: 'block', fontFamily: F.b, fontSize: 14, color: C.white, textDecoration: 'none', marginBottom: 6, fontWeight: 600 }}>
              (430) 367-5601
            </a>
            <a href="mailto:pfpsales@pestflowpro.com" style={{ fontFamily: F.b, fontSize: 13, color: C.muted, textDecoration: 'none' }}>
              pfpsales@pestflowpro.com
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontFamily: F.b, fontSize: 12, color: C.muted }}>
            © 2026 Ironwood Operations Group. All rights reserved.
          </span>
          <span style={{ fontFamily: F.b, fontSize: 12, color: C.muted }}>
            Powered by{' '}
            <a href="https://pestflowpro.com" style={{ color: C.green, textDecoration: 'none', fontWeight: 600 }}>
              PestFlow Pro
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
