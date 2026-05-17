import { Gauge } from 'lucide-react'
import { useTenant } from '../../../context/TenantBootProvider'
import { usePageSpeedRuns } from '../../../hooks/usePageSpeedRuns'
import { relativeTime, pageSpeedTargetUrl } from '../seo/pageSpeedShared'

function scoreColor(score: number | null): string {
  if (score === null) return '#9ca3af'
  if (score >= 90) return '#10b981'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

function ScorePill({ score, label }: { score: number | null; label: string }) {
  return (
    <div className="flex-1 bg-gray-50 rounded-lg px-3 py-3 text-center">
      <div className="text-2xl font-bold" style={{ color: scoreColor(score) }}>
        {score ?? '–'}
      </div>
      <div className="text-xs text-gray-500 mt-1 leading-tight">{label}</div>
    </div>
  )
}

function RunButton({ label, running, onRun }: { label: string; running: boolean; onRun: () => void }) {
  return (
    <button onClick={onRun} disabled={running}
      className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">
      {running ? 'Running PageSpeed audit (this can take 30 seconds)…' : label}
    </button>
  )
}

export default function SitePerformanceTile() {
  const { id: tenantId } = useTenant()
  const { latestRun, loading, running, error, runCheck } = usePageSpeedRuns(tenantId)
  const url = pageSpeedTargetUrl()
  const onRun = () => runCheck(url)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Gauge className="w-5 h-5 text-emerald-600" />
          Site Performance
        </h3>
        {latestRun?.status === 'success' && (
          <span className="text-xs text-gray-400">Last checked: {relativeTime(latestRun.ran_at)}</span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading PageSpeed data…</p>
      ) : !latestRun ? (
        <div className="text-center py-6 space-y-3">
          <p className="text-sm text-gray-500">No PageSpeed data yet.</p>
          <RunButton label="Run your first check" running={running} onRun={onRun} />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      ) : latestRun.status === 'error' ? (
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
            PageSpeed check failed: {latestRun.api_error_msg || 'Unknown error'}
          </div>
          <RunButton label="Retry" running={running} onRun={onRun} />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-3">
            <ScorePill score={latestRun.desktop_performance} label="Performance" />
            <ScorePill score={latestRun.desktop_accessibility} label="Accessibility" />
            <ScorePill score={latestRun.desktop_best_practices} label="Best Practices" />
            <ScorePill score={latestRun.desktop_seo} label="SEO" />
          </div>
          <div className="text-sm text-gray-600">
            Performance — Desktop:{' '}
            <span className="font-semibold text-gray-900">{latestRun.desktop_performance ?? '–'}</span>
            {' / '}Mobile:{' '}
            <span className="font-semibold text-gray-900">{latestRun.mobile_performance ?? '–'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 truncate">{latestRun.url}</span>
            <RunButton label="Run Now" running={running} onRun={onRun} />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  )
}
