import type { RevealReportData } from '../../../types/revealReport'

function CheckItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{
        width: '20px', height: '20px', borderRadius: '50%',
        background: done ? '#22c55e' : '#e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: '12px', color: done ? '#fff' : '#9ca3af',
      }}>
        {done ? '✓' : '–'}
      </span>
      <span style={{ fontSize: '13px', color: done ? '#111' : '#9ca3af' }}>{label}</span>
    </div>
  )
}

export default function ReportSEO({ data }: { data: RevealReportData }) {
  const pct = Math.round((data.seoScore / 12) * 100)
  const barColor = pct >= 90 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444'

  const schemaItems: { label: string; done: boolean }[] = [
    { label: 'LocalBusiness Schema',      done: data.schemaTypes.includes('LocalBusiness') },
    { label: 'PestControlService Schema', done: data.schemaTypes.includes('PestControlService') },
    { label: 'FAQPage Schema',            done: data.hasFaqSchema },
    { label: 'AggregateRating Schema',    done: data.hasAggregateRating },
    { label: 'BreadcrumbList Schema',     done: data.schemaTypes.includes('BreadcrumbList') },
    { label: 'XML Sitemap',               done: true },
    { label: 'Robots.txt',                done: true },
    { label: 'Open Graph Tags',           done: data.hasOpenGraph },
    { label: 'Canonical Tags',            done: data.hasCanonical },
    { label: 'SSL / HTTPS',               done: data.hasSsl },
    { label: 'Legal Pages Installed',     done: data.legalPagesInstalled },
    { label: 'Aggregate Rating Score',    done: data.hasAggregateRating },
  ]

  return (
    <section style={{ padding: '48px 56px', borderBottom: '1px solid #e5e7eb', pageBreakInside: 'avoid' }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: data.primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
        Section 2
      </p>
      <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111', marginBottom: '8px' }}>
        SEO Foundation
      </h2>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px', maxWidth: '600px' }}>
        Your site is wired with structured data that tells Google exactly who you are, what you do, and where you serve.
      </p>

      {/* Score bar */}
      <div style={{ marginBottom: '32px', maxWidth: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>SEO Readiness Score</span>
          <span style={{ fontSize: '16px', fontWeight: 800, color: barColor }}>{data.seoScore}/12</span>
        </div>
        <div style={{ height: '12px', background: '#e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ height: '12px', width: `${pct}%`, background: barColor, borderRadius: '6px', transition: 'width 0.3s' }} />
        </div>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
          {data.seoScore === 12 ? 'Perfect score — all 12 SEO signals in place.' : `${12 - data.seoScore} signal${12 - data.seoScore > 1 ? 's' : ''} can be added to reach a perfect score.`}
        </p>
      </div>

      {/* Checklist */}
      <div style={{ maxWidth: '480px' }}>
        {schemaItems.map(item => (
          <CheckItem key={item.label} {...item} />
        ))}
      </div>

      {data.aggregateRating && (
        <div style={{ marginTop: '24px', padding: '16px 20px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #86efac', maxWidth: '360px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#15803d', marginBottom: '2px' }}>
            ⭐ {data.aggregateRating.score} stars · {data.aggregateRating.count} reviews
          </p>
          <p style={{ fontSize: '12px', color: '#166534' }}>
            Aggregate rating is live and visible to Google.
          </p>
        </div>
      )}
    </section>
  )
}
