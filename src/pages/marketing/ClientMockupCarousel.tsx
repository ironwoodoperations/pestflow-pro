import { useState, useEffect } from 'react'
import { DEMO_TENANTS, publicDemoUrl } from '../../lib/demoTenants'

const F = { b: "'Plus Jakarta Sans', sans-serif" }

const TABS = DEMO_TENANTS.map((t) => ({
  label: t.shortLabel,
  url: `${t.slug}.pestflowpro.com`,
  href: publicDemoUrl(t.slug),
  img: `/images/sites/${t.slug}-site.jpg`,
}))

export default function ClientMockupCarousel() {
  const [activeTab, setActiveTab] = useState(0)
  const [paused, setPaused] = useState(false)
  const [imgError, setImgError] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setActiveTab(p => (p + 1) % TABS.length), 3500)
    return () => clearInterval(t)
  }, [paused])

  const handleTabClick = (i: number) => { setActiveTab(i); setPaused(true) }

  const tab = TABS[activeTab]

  return (
    <div style={{ maxWidth: 480, width: '100%' }}>
      <style>{`@keyframes pfpFadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}.pfp-slide{animation:pfpFadeUp 0.3s ease}`}</style>

      <a
        href={tab.href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', background: '#0d1526', borderRadius: 14, border: '1px solid rgba(34,197,94,0.25)', boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 40px rgba(34,197,94,0.08)', overflow: 'hidden', textDecoration: 'none' }}
      >

        {/* Chrome bar */}
        <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {['#ef4444','#f59e0b','#22c55e'].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 12px', fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', marginLeft: 6 }}>
            {tab.url}
          </div>
          <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 4, padding: '2px 8px', fontSize: 9, color: '#22c55e', fontFamily: F.b, fontWeight: 600, flexShrink: 0 }}>
            DEMO
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
      </a>

      {/* Tab pills */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button
            key={t.label}
            onClick={() => handleTabClick(i)}
            style={{
              minWidth: 76, height: 28, padding: '0 12px', borderRadius: 14, border: 'none', cursor: 'pointer',
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
