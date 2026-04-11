import type { RevealReportData } from '../../../types/revealReport'

const TIER_LABELS: Record<string, string> = {
  starter: 'Starter', growth: 'Growth', pro: 'Pro', elite: 'Elite',
}

export default function ReportCover({ data }: { data: RevealReportData }) {
  return (
    <div style={{ position: 'relative', minHeight: '480px', background: '#fff', padding: '64px 56px 0', display: 'flex', flexDirection: 'column' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '64px' }}>
        <div style={{ fontWeight: 800, fontSize: '18px', color: data.primaryColor, letterSpacing: '-0.5px' }}>
          PestFlow<span style={{ color: '#111' }}>Pro</span>
        </div>
        <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>Powered by PestFlow Pro</span>
      </div>

      {/* Main headline */}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: data.primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
          Client Reveal Report
        </p>
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, color: '#111', lineHeight: 1.1, marginBottom: '16px' }}>
          Your New Website<br />Is Live.
        </h1>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, color: data.primaryColor, marginBottom: '16px' }}>
          {data.businessName}
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
          Generated {data.generatedAt} · {TIER_LABELS[data.tier] ?? data.tier} Plan
        </p>
        <p style={{ fontSize: '15px', color: '#374151', maxWidth: '520px', lineHeight: 1.6 }}>
          Everything we built. Everything it means for your business.
        </p>
      </div>

      {/* Bottom color band */}
      <div style={{ margin: '0 -56px', height: '12px', background: data.primaryColor, marginTop: '48px' }} />
    </div>
  )
}
