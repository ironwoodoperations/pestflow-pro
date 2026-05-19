import { useState } from 'react'
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react'
import { useTenant } from '../../../context/TenantBootProvider'
import { useZernioRuns, type ZernioPlatformStats } from '../../../hooks/useZernioRuns'
import { relativeTime } from '../seo/pageSpeedShared'

// S231 Phase 0.5: collapsible — default collapsed, summary pills visible.
// Expand/collapse state persisted in localStorage.
// States: loading / unconfigured / error / success.

const SOCIAL_EXPANDED_KEY = 'pfp_social_analytics_tile_expanded'

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  google_business: 'Google Business',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
}

function StatPill({ value, label }: { value: number | null | undefined; label: string }) {
  return (
    <div className="flex-1 bg-gray-50 rounded-lg px-3 py-3 text-center">
      <div className="text-2xl font-bold text-gray-900">
        {value == null ? '–' : value.toLocaleString()}
      </div>
      <div className="text-xs text-gray-500 mt-1 leading-tight">{label}</div>
    </div>
  )
}

function RunButton({ label, running, onRun }: { label: string; running: boolean; onRun: () => void }) {
  return (
    <button onClick={onRun} disabled={running}
      className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">
      {running ? 'Fetching social analytics…' : label}
    </button>
  )
}

export default function SocialAnalyticsTile() {
  const { id: tenantId } = useTenant()
  const { latestRun, loading, running, error, runCheck } = useZernioRuns(tenantId)

  const [expanded, setExpanded] = useState<boolean>(() => {
    try { return localStorage.getItem(SOCIAL_EXPANDED_KEY) === 'true' } catch { return false }
  })
  const toggleExpanded = () => {
    const next = !expanded
    setExpanded(next)
    try { localStorage.setItem(SOCIAL_EXPANDED_KEY, String(next)) } catch { /* ignore */ }
  }

  const platforms: [string, ZernioPlatformStats][] =
    latestRun?.status === 'success' && latestRun.data
      ? Object.entries(latestRun.data as Record<string, ZernioPlatformStats>)
      : []

  const isSuccess = !loading && latestRun?.status === 'success' && platforms.length > 0

  const totalFollowers = platforms.reduce((sum, [, s]) => sum + (s.followers ?? 0), 0)
  const platformCount = platforms.length

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          Social Analytics
        </h3>
        <div className="flex items-center gap-3">
          {latestRun?.status === 'success' && (
            <span className="text-xs text-gray-400">Last checked: {relativeTime(latestRun.ran_at)}</span>
          )}
          {isSuccess && (
            <button
              onClick={toggleExpanded}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading social analytics…</p>
      ) : !latestRun || latestRun.status === 'unconfigured' ? (
        <div className="text-center py-6 space-y-3">
          <p className="text-sm text-gray-500">
            Social analytics integration is coming soon — connect your accounts in
            the Social tab to be ready when it goes live.
          </p>
          <RunButton label="Check for updates" running={running} onRun={runCheck} />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      ) : latestRun.status === 'error' ? (
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
            Analytics check failed: {latestRun.api_error_msg || 'Unknown error'}
          </div>
          <RunButton label="Retry" running={running} onRun={runCheck} />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      ) : !expanded ? (
        // Collapsed: summary pills
        <div className="flex gap-3">
          <StatPill value={platformCount} label="Platforms" />
          <StatPill value={totalFollowers} label="Total Followers" />
        </div>
      ) : (
        // Expanded: full per-platform breakdown
        <div className="space-y-5">
          {platforms.map(([key, stats]) => (
            <div key={key}>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                {PLATFORM_LABELS[key] ?? key}
              </p>
              <div className="flex gap-3">
                <StatPill value={stats.followers} label="Followers" />
                <StatPill value={stats.engagement} label="Engagement" />
                <StatPill value={stats.reach} label="Reach" />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-end">
            <RunButton label="Run Now" running={running} onRun={runCheck} />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  )
}
