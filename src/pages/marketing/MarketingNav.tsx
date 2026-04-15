import { useState } from 'react'

const C = { bg: '#0a0f1e', teal: '#06B6D4', white: '#f9fafb', muted: '#9ca3af' }
const F = { h: "'Bricolage Grotesque', sans-serif", b: "'Plus Jakarta Sans', sans-serif" }

export default function MarketingNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const linkStyle = {
    color: C.muted, fontSize: 14, fontFamily: F.b, fontWeight: 500,
    textDecoration: 'none', cursor: 'pointer', background: 'none', border: 'none',
    padding: 0,
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10,15,30,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      padding: '0 32px', height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #06B6D4, #10B981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 15, color: '#0a0f1e', flexShrink: 0,
        }}>P</div>
        <span style={{ fontFamily: F.h, fontWeight: 800, fontSize: 18, color: C.white, letterSpacing: '-0.3px' }}>
          PestFlow Pro
        </span>
      </div>

      {/* Desktop links */}
      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        <button onClick={() => scrollTo('features')} style={linkStyle}>Features</button>
        <button onClick={() => scrollTo('how-it-works')} style={linkStyle}>How It Works</button>
        <button onClick={() => scrollTo('pricing')} style={linkStyle}>Pricing</button>
        <button onClick={() => scrollTo('contact')} style={linkStyle}>Contact</button>
      </div>

      {/* Right CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href="tel:4303675601" style={{ fontFamily: F.b, fontSize: 14, color: C.muted, textDecoration: 'none', fontWeight: 500 }}>
          (430) 367-5601
        </a>
        <a
          href="#contact"
          onClick={e => { e.preventDefault(); scrollTo('contact') }}
          style={{
            padding: '8px 18px', borderRadius: 8,
            background: C.teal, color: '#0a0f1e',
            fontSize: 14, fontWeight: 700, fontFamily: F.b,
            textDecoration: 'none',
          }}
        >
          Get Started
        </a>
      </div>
    </nav>
  )
}
