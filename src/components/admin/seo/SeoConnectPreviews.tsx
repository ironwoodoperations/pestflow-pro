// Preview widgets for SEO Connect data sources.
// (S228 Phase 4b: SearchConsoleMockPreview + GA4MockPreview removed along with
// the GSC/GA4 cards — Google add-user bug parked, OAuth pivot is S230/S231.)
// S231 Phase 0: PageSpeedPanel expanded to full-width layout with 4 score pills.
// Core Web Vitals (LCP, CLS, INP) backlog — not captured in pagespeed_runs schema.
import { useTenant } from '../../../context/TenantBootProvider'
import { usePageSpeedRuns } from '../../../hooks/usePageSpeedRuns'
import { relativeTime, pageSpeedTargetUrl } from './pageSpeedShared'

function scoreColor(score: number | null): string {
  if (score === null) return '#9ca3af'
  if (score >= 90) return '#10b981'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

function ScorePill({ score, label }: { score: number | null; label: string }) {
  return (
    <div className="flex-1 bg-gray-50 rounded-lg px-3 py-3 text-center min-w-0">
      <div className="text-2xl font-bold" style={{ color: scoreColor(score) }}>
        {score ?? '–'}
      </div>
      <div className="text-xs text-gray-500 mt-1 leading-tight">{label}</div>
    </div>
  )
}

function PageSpeedRunButton({ label, running, onRun }: { label: string; running: boolean; onRun: () => void }) {
  return (
    <button onClick={onRun} disabled={running}
      className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-1 disabled:opacity-50">
      {running ? '⏳ Running PageSpeed audit (this can take 30 seconds)…' : `🔄 ${label}`}
    </button>
  )
}

// Real PageSpeed panel for the SEO → Connect tab. Full-width layout (Vercel
// tile removed S231 Phase 0) with 4 desktop score pills + mobile performance.
export function PageSpeedPanel() {
  const { id: tenantId } = useTenant()
  const { latestRun, loading, running, error, runCheck } = usePageSpeedRuns(tenantId)
  const url = pageSpeedTargetUrl()
  const onRun = () => runCheck(url)

  if (loading) {
    return <div className="text-xs text-gray-400 py-4">Loading PageSpeed data…</div>
  }

  if (!latestRun) {
    return (
      <div className="space-y-3 mb-3">
        <p className="text-xs text-gray-500">No PageSpeed data yet. Run your first check to populate real Lighthouse scores.</p>
        <PageSpeedRunButton label="Run first check" running={running} onRun={onRun} />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  if (latestRun.status === 'error') {
    return (
      <div className="space-y-3 mb-3">
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
          PageSpeed check failed: {latestRun.api_error_msg || 'Unknown error'}
        </div>
        <PageSpeedRunButton label="Retry" running={running} onRun={onRun} />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-3 mb-3">
      <div className="flex gap-3">
        <ScorePill score={latestRun.desktop_performance}    label="Performance" />
        <ScorePill score={latestRun.desktop_accessibility}  label="Accessibility" />
        <ScorePill score={latestRun.desktop_best_practices} label="Best Practices" />
        <ScorePill score={latestRun.desktop_seo}            label="SEO" />
      </div>
      <div className="text-xs text-gray-500">
        Mobile performance:{' '}
        <span className="font-semibold" style={{ color: scoreColor(latestRun.mobile_performance) }}>
          {latestRun.mobile_performance ?? '–'}
        </span>
        {latestRun.mobile_seo != null && (
          <span className="ml-3">Mobile SEO: <span className="font-semibold" style={{ color: scoreColor(latestRun.mobile_seo) }}>{latestRun.mobile_seo}</span></span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Last checked: {relativeTime(latestRun.ran_at)}</span>
        <PageSpeedRunButton label="Run Check Now" running={running} onRun={onRun} />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
