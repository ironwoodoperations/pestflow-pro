import { useEffect, useRef } from 'react'
import { useRevealReportData } from '../../hooks/useRevealReportData'
import ReportCover       from './report/ReportCover'
import ReportPerformance from './report/ReportPerformance'
import ReportSEO         from './report/ReportSEO'
import ReportAISearch    from './report/ReportAISearch'
import ReportLocal       from './report/ReportLocal'
import ReportTechnical   from './report/ReportTechnical'
import ReportNextSteps   from './report/ReportNextSteps'

const PRINT_STYLES = `
@media print {
  body > *:not(#reveal-report-root) { display: none !important; }
  #reveal-report-root { position: static !important; overflow: visible !important; }
  #reveal-report-toolbar { display: none !important; }
  .reveal-report-paper {
    box-shadow: none !important;
    border-radius: 0 !important;
    margin: 0 !important;
    max-width: none !important;
  }
  @page { margin: 0; size: letter; }
  section { page-break-inside: avoid; }
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
`

interface Props {
  prospectId: string
  tenantId:   string
  siteUrl:    string
  oldSiteDesktop?: number
  oldSiteMobile?:  number
  onClose: () => void
}

export default function RevealReport({ prospectId, tenantId, siteUrl, oldSiteDesktop, oldSiteMobile, onClose }: Props) {
  const { loading, error, data } = useRevealReportData({ prospectId, tenantId, siteUrl, oldSiteDesktop, oldSiteMobile })
  const styleRef = useRef<HTMLStyleElement | null>(null)

  // Inject print styles on mount, clean up on unmount
  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = PRINT_STYLES
    document.head.appendChild(el)
    styleRef.current = el
    return () => { el.remove() }
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      id="reveal-report-root"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}
    >
      {/* Toolbar */}
      <div
        id="reveal-report-toolbar"
        style={{
          position: 'sticky', top: 0, zIndex: 1,
          width: '100%', background: '#111',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 24px', gap: '16px',
        }}
      >
        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>
          Client Reveal Report
          {data && <span style={{ color: '#9ca3af', fontWeight: 400 }}> · {data.businessName}</span>}
        </span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: '8px 18px', background: '#10b981', color: '#fff',
              border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🖨️ Print / Save PDF
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 14px', background: 'transparent', color: '#9ca3af',
              border: '1px solid #374151', borderRadius: '6px', fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Paper */}
      <div
        className="reveal-report-paper"
        style={{
          width: '100%', maxWidth: '860px',
          background: '#fff',
          margin: '24px auto 48px',
          borderRadius: '8px',
          boxShadow: '0 4px 40px rgba(0,0,0,0.3)',
          fontFamily: 'Georgia, "Times New Roman", serif',
          overflow: 'hidden',
        }}
      >
        {loading && (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>Loading report data…</p>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px' }}>Fetching PageSpeed scores from Google. This may take 15–30 seconds.</p>
          </div>
        )}

        {error && (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', color: '#ef4444', marginBottom: '8px' }}>Failed to load report</p>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>{error}</p>
          </div>
        )}

        {data && (
          <>
            <ReportCover       data={data} />
            <ReportPerformance data={data} />
            <ReportSEO         data={data} />
            <ReportAISearch    data={data} />
            <ReportLocal       data={data} />
            <ReportTechnical   data={data} />
            <ReportNextSteps   data={data} />
          </>
        )}
      </div>
    </div>
  )
}
