import { useState } from 'react'

const C = { bg: '#ffffff', green: '#22c55e', navy: '#1e3a5f', text: '#1e293b', muted: '#64748b' }
const F = { h: "'Bricolage Grotesque', sans-serif", b: "'Plus Jakarta Sans', sans-serif" }

export default function MarketingNav() {
  const [, setMenuOpen] = useState(false)

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
      background: 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(30,58,95,0.08)',
      boxShadow: '0 1px 8px rgba(30,58,95,0.06)',
      padding: '0 32px', height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src="/pestflow-pro.png" alt="PestFlow Pro" style={{ height: 40, width: 'auto' }} />
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
        <a href="tel:4303675601" style={{ fontFamily: F.b, fontSize: 14, color: C.text, textDecoration: 'none', fontWeight: 500 }}>
          (430) 367-5601
        </a>
        <a
          href="#contact"
          onClick={e => { e.preventDefault(); scrollTo('contact') }}
          style={{
            padding: '8px 18px', borderRadius: 8,
            background: C.green, color: '#ffffff',
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
