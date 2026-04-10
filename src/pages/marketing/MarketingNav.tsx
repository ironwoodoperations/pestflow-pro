const DEMO = 'https://pestflow-pro.pestflowpro.com'
const ADMIN = 'https://pestflow-pro.pestflowpro.com/admin'

const C = {
  navy: '#0a0f1e',
  green: '#22c55e',
  text: '#f1f5f9',
  muted: '#cbd5e8',
}

export default function MarketingNav() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10,15,30,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      padding: '0 24px',
      height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, #22c55e, #3b82f6, #22c55e)',
          boxShadow: '0 0 12px rgba(34,197,94,0.5)',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 14, color: '#0a0f1e',
        }}>P</div>
        <span style={{
          fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700,
          fontSize: 17, color: C.text, letterSpacing: '-0.3px',
        }}>PestFlow Pro</span>
      </div>

      {/* CTA buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <a href={DEMO} target="_blank" rel="noopener noreferrer" style={{
          padding: '7px 16px',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 8, color: C.text,
          fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif",
          textDecoration: 'none', fontWeight: 500,
          transition: 'border-color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}>
          View Demo Site
        </a>
        <a href={ADMIN} target="_blank" rel="noopener noreferrer" style={{
          padding: '7px 16px',
          background: C.green, borderRadius: 8,
          color: '#0a0f1e', fontSize: 13,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          textDecoration: 'none', fontWeight: 600,
        }}>
          Try the Admin →
        </a>
      </div>
    </nav>
  )
}
