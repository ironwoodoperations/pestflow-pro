import { useEffect, useState, useRef } from 'react'
import { useRevealReportData } from '../../hooks/useRevealReportData'
import ReportCover       from './report/ReportCover'
import ReportPerformance from './report/ReportPerformance'
import ReportSEO         from './report/ReportSEO'
import ReportAISearch    from './report/ReportAISearch'
import ReportLocal       from './report/ReportLocal'
import ReportTechnical   from './report/ReportTechnical'
import ReportNextSteps   from './report/ReportNextSteps'

const COUNTDOWN_START = 60

interface Props {
  prospectId: string
  tenantId:   string
  siteUrl:    string
  oldSiteDesktop?: number
  oldSiteMobile?:  number
  onClose: () => void
}

export default function RevealReport({ prospectId, tenantId, siteUrl, oldSiteDesktop, oldSiteMobile, onClose }: Props) {
  const { loading, pagespeedLoading, pagespeedError, error, data } = useRevealReportData({ prospectId, tenantId, siteUrl, oldSiteDesktop, oldSiteMobile })
  const [countdown, setCountdown] = useState(COUNTDOWN_START)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Countdown while PageSpeed is loading
  useEffect(() => {
    if (!pagespeedLoading) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    setCountdown(COUNTDOWN_START)
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [pagespeedLoading])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handlePrint = () => {
    const reportEl = document.getElementById('reveal-report-content')
    if (!reportEl) return

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Client Reveal Report</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Georgia, serif; background: white; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${reportEl.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print() }, 500)
  }

  const printBtn = pagespeedError ? (
    // Scores failed (quota/rate limit) — still allow printing without scores
    <button
      onClick={handlePrint}
      title={pagespeedError}
      style={{
        backgroundColor: '#d97706',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600,
      }}
    >
      ⚠️ Scores Unavailable — Print Anyway
    </button>
  ) : (
    <button
      onClick={pagespeedLoading ? undefined : handlePrint}
      disabled={pagespeedLoading}
      style={{
        backgroundColor: pagespeedLoading ? '#6b7280' : '#22c55e',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        cursor: pagespeedLoading ? 'not-allowed' : 'pointer',
        opacity: pagespeedLoading ? 0.7 : 1,
        fontSize: '14px',
        fontWeight: 600,
      }}
    >
      {pagespeedLoading ? `⏳ Loading Scores... (${countdown}s)` : '🖨️ Print / Save PDF'}
    </button>
  )

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar — fixed at top */}
      <div
        style={{
          flexShrink: 0,
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
          {printBtn}
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

      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}
      >
        <div
          id="reveal-report-content"
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
              <ReportPerformance data={data} pagespeedLoading={pagespeedLoading} />
              <ReportSEO         data={data} />
              <ReportAISearch    data={data} />
              <ReportLocal       data={data} />
              <ReportTechnical   data={data} />
              <ReportNextSteps   data={data} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
