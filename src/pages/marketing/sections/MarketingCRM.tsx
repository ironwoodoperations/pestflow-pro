const C = { bg: '#ffffff', bgAlt: '#f8fafc', green: '#22c55e', navy: '#1e3a5f', text: '#1e293b', muted: '#64748b' }
const F = { h: "'Bricolage Grotesque', sans-serif", b: "'Plus Jakarta Sans', sans-serif" }

const MINI = [
  { icon: '📲', title: 'Instant SMS Alert', body: 'Get a text the second a lead comes in' },
  { icon: '📧', title: 'Email Notification', body: 'Full lead details sent to your inbox' },
  { icon: '📊', title: 'Lead Dashboard', body: 'All your leads in one place, organized and searchable' },
]

function LeadFeedMockup() {
  const leads = [
    { name: 'Sarah M.', service: 'Termite Inspection', time: '2 min ago', status: 'New' },
    { name: 'Robert T.', service: 'Mosquito Treatment', time: '1 hr ago', status: 'Contacted' },
    { name: 'Diana L.', service: 'Ant Control', time: '3 hrs ago', status: 'Quoted' },
  ]
  return (
    <div style={{
      background: '#0d1526', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 24px 60px rgba(30,58,95,0.15)',
      overflow: 'hidden', maxWidth: 420,
    }}>
      <div style={{ padding: '14px 18px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: F.h, fontWeight: 700, fontSize: 13, color: '#ffffff' }}>Lead Inbox</span>
        <span style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, padding: '2px 10px', fontSize: 10, color: '#22c55e', fontFamily: F.b, fontWeight: 600 }}>3 New</span>
      </div>
      <div style={{ padding: '8px 0' }}>
        {leads.map((l, i) => (
          <div key={l.name} style={{
            padding: '14px 18px',
            borderBottom: i < leads.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1a3a5c, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#ffffff', fontFamily: F.h, flexShrink: 0 }}>
              {l.name.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.b, fontWeight: 600, fontSize: 13, color: '#ffffff', marginBottom: 2 }}>{l.name}</div>
              <div style={{ fontFamily: F.b, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{l.service} · {l.time}</div>
            </div>
            <div style={{
              background: l.status === 'New' ? 'rgba(34,197,94,0.15)' : l.status === 'Contacted' ? 'rgba(34,197,94,0.12)' : 'rgba(251,191,36,0.12)',
              border: `1px solid ${l.status === 'New' ? 'rgba(34,197,94,0.3)' : l.status === 'Contacted' ? 'rgba(34,197,94,0.3)' : 'rgba(251,191,36,0.3)'}`,
              borderRadius: 20, padding: '2px 10px', fontSize: 10,
              color: l.status === 'Quoted' ? '#fbbf24' : '#22c55e',
              fontFamily: F.b, fontWeight: 600, flexShrink: 0,
            }}>{l.status}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 18px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <a href="https://pestflow-pro.pestflowpro.com/admin" target="_blank" rel="noopener noreferrer" style={{ fontFamily: F.b, fontSize: 12, fontWeight: 600, color: '#22c55e', textDecoration: 'none' }}>
          See the dashboard →
        </a>
      </div>
    </div>
  )
}

export default function MarketingCRM() {
  return (
    <section style={{ background: C.bg, padding: '96px 32px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontFamily: F.b, fontSize: 12, fontWeight: 700, color: C.green, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>Lead Management</div>
          <h2 style={{ fontFamily: F.h, fontWeight: 800, fontSize: 'clamp(28px,4vw,46px)', letterSpacing: '-0.03em', color: C.navy, margin: '0 0 20px', lineHeight: 1.15 }}>
            Never Miss a Lead Again
          </h2>
          <p style={{ fontFamily: F.b, fontSize: 17, color: C.muted, maxWidth: 620, margin: '0 auto' }}>
            Every quote request from your website goes into your CRM and fires an instant SMS and email to your phone. See every lead, track every conversation, and follow up fast — from any device.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 64 }}>
          {MINI.map(m => (
            <div key={m.title} style={{ background: C.bgAlt, border: '1px solid rgba(30,58,95,0.08)', borderRadius: 16, padding: '28px 26px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{m.icon}</div>
              <h3 style={{ fontFamily: F.h, fontWeight: 700, fontSize: 16, color: C.navy, margin: '0 0 10px' }}>{m.title}</h3>
              <p style={{ fontFamily: F.b, fontSize: 13, color: C.muted, lineHeight: 1.6, margin: 0 }}>{m.body}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <LeadFeedMockup />
        </div>

        <p style={{ textAlign: 'center', fontFamily: F.b, fontSize: 12, color: C.muted, marginTop: 16 }}>
          Demo login: admin@pestflowpro.com / pf123demo
        </p>
      </div>
    </section>
  )
}
