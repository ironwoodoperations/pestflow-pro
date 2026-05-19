// Preview widgets for SEO Connect data sources.
// (S228 Phase 4b: SearchConsoleMockPreview + GA4MockPreview removed along with
// the GSC/GA4 cards — Google add-user bug parked, OAuth pivot is S230/S231.)
import { useTenant } from '../../../context/TenantBootProvider'
import { usePageSpeedRuns } from '../../../hooks/usePageSpeedRuns'
import { relativeTime, pageSpeedTargetUrl } from './pageSpeedShared'

function ScoreGauge({ score, label }: { score: number | null; label: string }) {
  const color =
    score === null ? '#9ca3af'
    : score >= 90 ? '#10b981'
    : score >= 50 ? '#f59e0b'
    : '#ef4444'
  const r = 20, circ = 2 * Math.PI * r
  const dash = score === null ? 0 : (score / 100) * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 26 26)" />
        <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="700" fill="#111827">{score ?? '–'}</text>
      </svg>
      <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
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

// Real PageSpeed panel for the SEO → Connect tab. Reads the latest cached run
// from pagespeed_runs via the shared hook; "Run Check Now" invokes the
// pagespeed-proxy edge function (C2-authenticated, writes back to the table).
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
    <div className="space-y-2 mb-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Last checked: {relativeTime(latestRun.ran_at)}
        </span>
        <span className="text-xs text-gray-400">
          Perf — Desktop {latestRun.desktop_performance ?? '–'} / Mobile {latestRun.mobile_performance ?? '–'}
        </span>
      </div>
      <div className="flex justify-around py-1">
        <ScoreGauge score={latestRun.desktop_performance} label="Performance" />
        <ScoreGauge score={latestRun.desktop_accessibility} label="Accessibility" />
        <ScoreGauge score={latestRun.desktop_best_practices} label="Best Practices" />
        <ScoreGauge score={latestRun.desktop_seo} label="SEO" />
      </div>
      <PageSpeedRunButton label="Run Check Now" running={running} onRun={onRun} />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
