import ScoreGauge from './ScoreGauge'
import type { RevealReportData } from '../../../types/revealReport'

interface Props {
  data:       RevealReportData
  desktopNew: number | null
  mobileNew:  number | null
  desktopOld: number | null
  mobileOld:  number | null
}

function GaugeRow({ score, label }: { score: number | null; label: string }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
        {label}
      </p>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <ScoreGauge score={score} label="Performance" size={110} />
      </div>
    </div>
  )
}

function CompareBar({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color }}>{score}</span>
      </div>
      <div style={{ height: '10px', background: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' }}>
        <div style={{ height: '10px', width: `${score}%`, background: color, borderRadius: '5px' }} />
      </div>
    </div>
  )
}

export default function ReportPerformance({ data, desktopNew, mobileNew, desktopOld, mobileOld }: Props) {
  const showCompare = (desktopOld !== null || mobileOld !== null) && (desktopNew !== null || mobileNew !== null)

  return (
    <section style={{ padding: '48px 56px', borderBottom: '1px solid #e5e7eb', pageBreakInside: 'avoid' }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: data.primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
        Section 1
      </p>
      <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111', marginBottom: '8px' }}>
        Built for Speed
      </h2>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px', maxWidth: '600px' }}>
        Google measures page speed on a 0–100 scale. Most pest control websites score under 60. Here's how your new site performs.
      </p>

      <GaugeRow score={desktopNew} label="Desktop" />
      <GaugeRow score={mobileNew}  label="Mobile"  />

      {showCompare && (
        <div style={{ marginTop: '32px', padding: '24px', background: '#f9fafb', borderRadius: '12px', maxWidth: '480px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>
            Before vs. After — Performance Score
          </p>
          {desktopOld !== null && desktopNew !== null && (
            <>
              <CompareBar score={desktopOld} label="Old Site (Desktop)"       color="#ef4444" />
              <CompareBar score={desktopNew} label="Your New Site (Desktop)"  color="#22c55e" />
            </>
          )}
          {mobileOld !== null && mobileNew !== null && (
            <>
              <div style={{ height: '1px', background: '#e5e7eb', margin: '12px 0' }} />
              <CompareBar score={mobileOld} label="Old Site (Mobile)"        color="#ef4444" />
              <CompareBar score={mobileNew} label="Your New Site (Mobile)"   color="#22c55e" />
            </>
          )}
        </div>
      )}

      {desktopNew === null && mobileNew === null && (
        <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>
          PageSpeed scores not yet entered for this report.
        </p>
      )}
    </section>
  )
}
