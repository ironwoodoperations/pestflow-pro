import type { RevealReportData } from '../../../types/revealReport'

function TechRow({ label, value, done }: { label: string; value: string; done: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{
        width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
        background: done ? '#22c55e' : '#fef2f2',
        border: done ? 'none' : '1px solid #fca5a5',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', color: done ? '#fff' : '#ef4444',
      }}>
        {done ? '✓' : '✗'}
      </span>
      <span style={{ flex: 1, fontSize: '13px', color: '#111' }}>{label}</span>
      <span style={{ fontSize: '12px', color: done ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

export default function ReportTechnical({ data }: { data: RevealReportData }) {
  const items = [
    { label: 'SSL Certificate (HTTPS)',         value: data.hasSsl            ? 'Active'       : 'Missing',  done: data.hasSsl },
    { label: 'Open Graph / Social Share Tags',  value: data.hasOpenGraph      ? 'Installed'    : 'Missing',  done: data.hasOpenGraph },
    { label: 'Canonical Tags',                  value: data.hasCanonical      ? 'Installed'    : 'Missing',  done: data.hasCanonical },
    { label: 'Legal Pages',                     value: data.legalPagesInstalled ? 'Installed'  : 'Missing',  done: data.legalPagesInstalled },
    { label: '301 Redirects Configured',
      value: data.redirectCount > 0 ? `${data.redirectCount} redirect${data.redirectCount > 1 ? 's' : ''}` : 'None set',
      done: data.redirectCount > 0 },
    { label: 'XML Sitemap',                     value: 'Live',                done: true },
    { label: 'Robots.txt',                      value: 'Configured',          done: true },
    { label: 'Mobile Responsive',               value: 'Yes',                 done: true },
    { label: 'Core Web Vitals Optimized',       value: data.mobile?.performance && data.mobile.performance >= 70 ? 'Pass' : 'Check scores', done: !!(data.mobile?.performance && data.mobile.performance >= 70) },
    { label: 'Google Search Console Verified',  value: data.googleSearchConsoleVerified ? 'Active' : 'Not yet configured', done: data.googleSearchConsoleVerified },
  ]

  const passCount = items.filter(i => i.done).length

  return (
    <section style={{ padding: '48px 56px', borderBottom: '1px solid #e5e7eb', pageBreakInside: 'avoid' }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: data.primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
        Section 5
      </p>
      <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111', marginBottom: '8px' }}>
        Technical Foundation
      </h2>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', maxWidth: '600px' }}>
        The behind-the-scenes infrastructure that search engines and browsers require to trust and rank your site.
      </p>
      <p style={{ fontSize: '13px', color: data.primaryColor, fontWeight: 600, marginBottom: '28px' }}>
        {passCount} of {items.length} checks passing
      </p>

      <div style={{ maxWidth: '520px' }}>
        {items.map(item => (
          <TechRow key={item.label} {...item} />
        ))}
      </div>

      {data.redirectCount > 0 && (
        <div style={{ marginTop: '20px', padding: '14px 18px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fcd34d', maxWidth: '480px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#92400e', marginBottom: '2px' }}>
            301 Redirects
          </p>
          <p style={{ fontSize: '12px', color: '#78350f' }}>
            {data.redirectCount} redirect{data.redirectCount > 1 ? 's are' : ' is'} in place to preserve your existing Google rankings during the transition.
          </p>
        </div>
      )}
    </section>
  )
}
