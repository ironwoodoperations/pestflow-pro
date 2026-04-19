const C = { navy: '#0d1526', text: '#f1f5f9', muted: '#cbd5e8', green: '#22c55e', amber: '#fbbf24' }

const PROBLEMS = [
  { emoji: '🕸️', title: 'A 2016 Website', body: 'Slow, outdated, invisible on Google. Losing leads to competitors who look more professional.' },
  { emoji: '📱', title: 'Sporadic Social', body: 'No time to post consistently. When you do, it\'s random and doesn\'t drive calls.' },
  { emoji: '📬', title: 'Leads in Your Inbox', body: 'Quote requests buried in email threads. No tracking. No follow-up system.' },
]
const SOLUTIONS = [
  'Professional website live in 30 days',
  'SEO blog posts generated weekly',
  'Social campaigns planned and scheduled',
  'Instant lead notifications to your phone',
  'Full CRM to track every customer',
]
const FEATURES = [
  { icon: '🌐', title: 'Professional Website', body: 'Mobile-first, SEO-optimized site with your brand, services, and service area pages.' },
  { icon: '✍️', title: 'SEO Blog Engine', body: 'AI-powered blog posts targeting local pest control keywords — posted weekly.' },
  { icon: '📲', title: 'Social Media Campaigns', body: 'Pre-planned campaigns and scheduled posts across Facebook and Instagram.' },
  { icon: '🔔', title: 'Lead Notifications', body: 'Instant text and email alerts the moment a customer submits a quote request.' },
  { icon: '📊', title: 'Analytics Dashboard', body: 'Track leads, blog traffic, and social performance in one clean view.' },
  { icon: '🔧', title: 'Full Admin Control', body: 'Update hours, add services, manage reviews — no developer needed.' },
]

export default function MarketingFeatures() {
  return (
    <>
      {/* Dashboard preview */}
      <section style={{ background: '#0a0f1e', padding: '0 24px 80px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          maxWidth: 920, width: '100%',
          background: C.navy, border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}>
          {/* Window bar */}
          <div style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {['#ef4444','#f59e0b','#22c55e'].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
            <div style={{ marginLeft: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 14px', fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>
              pestflow-pro.pestflowpro.com/admin
            </div>
          </div>
          {/* Content area */}
          <div style={{ display: 'flex', minHeight: 280 }}>
            {/* Sidebar */}
            <div style={{ width: 160, background: 'rgba(0,0,0,0.2)', padding: '16px 0', borderRight: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
              {['Dashboard','Content','Blog','Social','Reports','Settings'].map((item, i) => (
                <div key={item} style={{ padding: '8px 16px', fontSize: 12, color: i === 0 ? C.green : C.muted, fontFamily: "'Plus Jakarta Sans', sans-serif", borderLeft: i === 0 ? `2px solid ${C.green}` : '2px solid transparent' }}>{item}</div>
              ))}
            </div>
            {/* Main */}
            <div style={{ flex: 1, padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Website Leads', val: '37', badge: '↑42%', color: C.green },
                  { label: 'Blog Posts Live', val: '4', badge: 'SEO', color: '#93c5fd' },
                  { label: 'Social Posts', val: '18', badge: '✓', color: C.amber },
                ].map(k => (
                  <div key={k.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{k.label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{k.val}</span>
                      <span style={{ fontSize: 10, color: k.color, fontWeight: 600 }}>{k.badge}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Top Search Terms</div>
                  {['pest control near me','bed bug removal','ant exterminator'].map((t, i) => (
                    <div key={t} style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 10, color: C.text, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 3 }}>{t}</div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${[72,55,38][i]}%`, background: C.green, borderRadius: 2 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Content Queue</div>
                  {['Spring ant season post','Termite inspection tips','Summer mosquito guide'].map((t, i) => (
                    <div key={t} style={{ padding: '5px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : undefined, fontSize: 10, color: C.text, fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: C.green }}>●</span>{t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problems */}
      <section style={{ background: '#111827', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-0.02em', color: C.text, textAlign: 'center', margin: '0 0 48px', lineHeight: 1.2 }}>
            Most pest companies are losing leads before they ever answer the phone.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {PROBLEMS.map(p => (
                <div key={p.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '20px 22px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: 20 }}>{p.emoji}</p>
                  <p style={{ margin: '0 0 6px', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, color: C.text }}>{p.title}</p>
                  <p style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{p.body}</p>
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 17, color: C.text, margin: '0 0 20px' }}>PestFlow Pro fixes all of it:</p>
              {SOLUTIONS.map(s => (
                <div key={s} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                  <span style={{ color: C.green, fontWeight: 700, fontSize: 16, flexShrink: 0 }}>✓</span>
                  <p style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: C.text, lineHeight: 1.5 }}>{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section style={{ background: '#0a0f1e', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 'clamp(24px,3.5vw,36px)', letterSpacing: '-0.02em', color: C.text, textAlign: 'center', margin: '0 0 48px' }}>
            Everything you need. Nothing you don't.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: C.navy, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '24px 22px' }}>
                <p style={{ margin: '0 0 10px', fontSize: 26 }}>{f.icon}</p>
                <p style={{ margin: '0 0 8px', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, color: C.text }}>{f.title}</p>
                <p style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
