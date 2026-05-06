import { useState, useEffect } from 'react'

const F = { b: "'Plus Jakarta Sans', sans-serif" }

const TABS = [
  { label: 'Lone Star', url: 'lone-star-pest-solutions.pestflowpro.com', badge: 'LIVE', img: '/images/sites/lone-star-site.jpg' },
  { label: 'Dang Pest',  url: 'dang.pestflowpro.com',                    badge: 'LIVE', img: '/images/sites/dang-site.jpg'      },
  { label: 'Demo Site',  url: 'demo.pestflowpro.com',                     badge: 'DEMO', img: '/images/sites/demo-site.jpg'      },
]

export default function ClientMockupCarousel() {
  const [activeTab, setActiveTab] = useState(0)
  const [paused, setPaused] = useState(false)
  const [imgError, setImgError] = useState<Record<number, boolean>>({})

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
          {['#ef4444','#f59e0b','#22c55e'].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 12px', fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', marginLeft: 6 }}>
            {tab.url}
          </div>
          <div style={{ background: `rgba(${badgeRgb},0.15)`, border: `1px solid rgba(${badgeRgb},0.35)`, borderRadius: 4, padding: '2px 8px', fontSize: 9, color: badgeColor, fontFamily: F.b, fontWeight: 600, flexShrink: 0 }}>
            {tab.badge}
          </div>
        </div>

        {/* Screenshot or fallback */}
        <div key={activeTab} className="pfp-slide" style={{ position: 'relative', height: 420, background: '#0d1526' }}>
          {imgError[activeTab] ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: F.b }}>
              Coming Soon
            </div>
          ) : (
            <img
              src={tab.img}
              alt={tab.label}
              style={{ width: '100%', height: '420px', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
              onError={() => setImgError(prev => ({ ...prev, [activeTab]: true }))}
            />
          )}
        </div>
      </div>

      {/* Tab pills */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
        {TABS.map((t, i) => (
          <button
            key={t.label}
            onClick={() => handleTabClick(i)}
            style={{
              width: 80, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
              background: activeTab === i ? '#ffffff' : 'transparent',
              color: activeTab === i ? '#1e2d4a' : 'rgba(255,255,255,0.6)',
              fontSize: 11, fontWeight: activeTab === i ? 700 : 500, fontFamily: F.b,
              boxShadow: activeTab === i ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
