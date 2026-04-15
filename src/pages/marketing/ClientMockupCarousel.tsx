import { useState, useEffect } from 'react'

const F = { h: "'Bricolage Grotesque', sans-serif", b: "'Plus Jakarta Sans', sans-serif" }
const TABS = [
  { label: 'Lone Star', url: 'lone-star-pest-solutions.pestflowpro.com', badge: 'LIVE' },
  { label: 'Dang Pest',  url: 'dang.pestflowpro.com',                    badge: 'LIVE' },
  { label: 'Demo Site',  url: 'pestflow-pro.pestflowpro.com',             badge: 'DEMO' },
]

function LoneStarContent() {
  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f2744)', padding: '24px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#22c55e', fontFamily: F.b, fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>LONE STAR PEST SOLUTIONS</div>
        <div style={{ fontSize: 15, fontWeight: 800, fontFamily: F.h, color: '#fff', lineHeight: 1.3, marginBottom: 10 }}>Austin's Trusted Pest Control Experts</div>
        <div style={{ display: 'inline-block', background: '#22c55e', color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: F.b, padding: '5px 14px', borderRadius: 6 }}>Get a Free Quote →</div>
      </div>
      <div style={{ padding: '12px 20px', display: 'flex', flexWrap: 'wrap', gap: 6, background: '#0d1526' }}>
        {['Ant Control','Termite','Mosquito','Rodents','Roaches'].map(s => (
          <span key={s} style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: 10, color: '#22c55e', fontFamily: F.b }}>{s}</span>
        ))}
      </div>
      <div style={{ padding: '8px 20px 12px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 14, background: '#0d1526' }}>
        {['⭐ 4.9 Reviews','📍 Austin, TX','✓ Licensed & Insured'].map(t => (
          <span key={t} style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: F.b }}>{t}</span>
        ))}
      </div>
    </div>
  )
}

function DangContent() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: F.h }}>Dang Pest Control</span>
        <span style={{ fontSize: 9, color: '#F97316', fontFamily: F.b }}>Services | About | Contact</span>
      </div>
      <div style={{ background: '#0f172a', padding: '18px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: '#F97316', fontFamily: F.b, fontWeight: 600, marginBottom: 5, letterSpacing: 1 }}>SERVING EAST TEXAS</div>
        <div style={{ fontSize: 14, fontWeight: 800, fontFamily: F.h, color: '#fff', lineHeight: 1.3, marginBottom: 5 }}>East Texas Pest Control Experts</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: F.b, marginBottom: 10 }}>Same-day service. Family safe treatments.</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <span style={{ background: '#F97316', color: '#fff', fontSize: 9, fontWeight: 700, padding: '4px 10px', borderRadius: 5, fontFamily: F.b }}>Get a Free Quote →</span>
          <span style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 9, padding: '4px 10px', borderRadius: 5, fontFamily: F.b }}>(903) 871-0550</span>
        </div>
      </div>
      <div style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', gap: 5, background: '#0f172a' }}>
        {['🦟 Mosquito','🐜 Ants','🪳 Roaches','🐭 Rodents','🕷 Spiders'].map(s => (
          <span key={s} style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 20, padding: '3px 8px', fontSize: 9, color: '#F97316', fontFamily: F.b }}>{s}</span>
        ))}
      </div>
      <div style={{ padding: '8px 16px 12px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 12, background: '#0f172a' }}>
        {['⭐ 4.8 Reviews','📍 Tyler, TX','✓ Licensed & Insured'].map(t => (
          <span key={t} style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontFamily: F.b }}>{t}</span>
        ))}
      </div>
    </div>
  )
}

function DemoContent() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <img src="/pestflow-pro.png" alt="PestFlow Pro" style={{ height: 20, width: 'auto' }} />
        <span style={{ fontSize: 9, color: '#3b82f6', fontFamily: F.b }}>Services | About | Contact</span>
      </div>
      <div style={{ background: '#0f172a', padding: '18px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: '#3b82f6', fontFamily: F.b, fontWeight: 600, marginBottom: 5, letterSpacing: 1 }}>DEMO SITE</div>
        <div style={{ fontSize: 14, fontWeight: 800, fontFamily: F.h, color: '#fff', lineHeight: 1.3, marginBottom: 5 }}>Professional Pest Control You Can Trust</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: F.b, marginBottom: 10 }}>Serving the greater Dallas area</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <span style={{ background: '#22c55e', color: '#fff', fontSize: 9, fontWeight: 700, padding: '4px 10px', borderRadius: 5, fontFamily: F.b }}>Get a Free Quote →</span>
          <span style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 9, padding: '4px 10px', borderRadius: 5, fontFamily: F.b }}>(555) 000-0000</span>
        </div>
      </div>
      <div style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', gap: 5, background: '#0f172a' }}>
        {['🐜 Ants','🦟 Mosquito','🐭 Rodents'].map(s => (
          <span key={s} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 20, padding: '3px 8px', fontSize: 9, color: '#3b82f6', fontFamily: F.b }}>{s}</span>
        ))}
      </div>
      <div style={{ padding: '8px 16px 12px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 12, background: '#0f172a' }}>
        {['⭐ 5.0 Reviews','📍 Dallas, TX','✓ Licensed & Insured'].map(t => (
          <span key={t} style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontFamily: F.b }}>{t}</span>
        ))}
      </div>
    </div>
  )
}

export default function ClientMockupCarousel() {
  const [activeTab, setActiveTab] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setActiveTab(p => (p + 1) % 3), 3500)
    return () => clearInterval(t)
  }, [paused])

  const handleTabClick = (i: number) => { setActiveTab(i); setPaused(true) }

  const tab = TABS[activeTab]
  const isDemo = tab.badge === 'DEMO'
  const badgeRgb = isDemo ? '59,130,246' : '34,197,94'
  const badgeColor = isDemo ? '#3b82f6' : '#22c55e'

  return (
    <div style={{ maxWidth: 480, width: '100%' }}>
      <style>{`@keyframes pfpFadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}.pfp-slide{animation:pfpFadeUp 0.3s ease}`}</style>

      <div style={{ background: '#0d1526', borderRadius: 14, border: '1px solid rgba(34,197,94,0.25)', boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 40px rgba(34,197,94,0.08)', overflow: 'hidden' }}>
        {/* Chrome bar */}
        <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {['#ef4444','#f59e0b','#22c55e'].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 12px', fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', marginLeft: 6 }}>{tab.url}</div>
          <div style={{ background: `rgba(${badgeRgb},0.15)`, border: `1px solid rgba(${badgeRgb},0.35)`, borderRadius: 4, padding: '2px 8px', fontSize: 9, color: badgeColor, fontFamily: F.b, fontWeight: 600, flexShrink: 0 }}>{tab.badge}</div>
        </div>
        {/* Slide content */}
        <div key={activeTab} className="pfp-slide">
          {activeTab === 0 && <LoneStarContent />}
          {activeTab === 1 && <DangContent />}
          {activeTab === 2 && <DemoContent />}
        </div>
      </div>

      {/* Tab pills */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
        {TABS.map((t, i) => (
          <button key={t.label} onClick={() => handleTabClick(i)} style={{ width: 80, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', background: activeTab === i ? '#ffffff' : 'transparent', color: activeTab === i ? '#1e2d4a' : 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: activeTab === i ? 700 : 500, fontFamily: F.b, boxShadow: activeTab === i ? '0 2px 8px rgba(0,0,0,0.2)' : 'none', transition: 'all 0.2s ease' }}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
