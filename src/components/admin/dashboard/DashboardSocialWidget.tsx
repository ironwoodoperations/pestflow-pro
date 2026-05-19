import { BarChart3 } from 'lucide-react'
import { useTenant } from '../../../context/TenantBootProvider'
import { useZernioRuns, type ZernioPlatformStats } from '../../../hooks/useZernioRuns'
import { relativeTime } from '../seo/pageSpeedShared'

interface Props {
  onNavigate: (tab: string) => void
}

// S228: real-data mini-tile sourced from zernio_runs, replacing the old
// social_posts-count click-out. Mirrors the DashboardStats top-stat-card
// visual language. F3: followers are NULL until S229 fixes the zernio-analytics
// edge fn, so the followers slot is intentionally omitted (engagement + reach
// both populate today); S229 backfills with no S228 rework needed.
export default function DashboardSocialWidget({ onNavigate }: Props) {
  const { id: tenantId } = useTenant()
  const { latestRun, loading } = useZernioRuns(tenantId)

  const platforms = latestRun?.status === 'success' && latestRun.data
    ? Object.values(latestRun.data as Record<string, ZernioPlatformStats>)
    : []
  const totalEngagement = platforms.reduce((s, p) => s + (p.engagement ?? 0), 0)
  const totalReach = platforms.reduce((s, p) => s + (p.reach ?? 0), 0)

  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: '#a855f718' }}>
        <BarChart3 className="w-5 h-5" style={{ color: '#a855f7' }} />
      </div>
      <p className="text-sm font-semibold text-gray-700 mb-3">Social Engagement</p>
      {children}
    </div>
  )

  if (loading) {
    return <Card><p className="text-xs text-gray-400">Loading…</p></Card>
  }

  if (platforms.length === 0) {
    return (
      <Card>
        <p className="text-xs text-gray-400 mb-3">No social analytics yet — refreshes weekly.</p>
        <button onClick={() => onNavigate('social')}
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition">
          Go to Social →
        </button>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-end gap-6 mb-4">
        <div>
          <p className="text-3xl font-bold text-gray-900">{totalEngagement.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Engagement</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-900">{totalReach.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Reach</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        {latestRun ? `Last refreshed: ${relativeTime(latestRun.ran_at)}` : ''} · across {platforms.length} platform{platforms.length === 1 ? '' : 's'}
      </p>
      <button onClick={() => onNavigate('social')}
        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition">
        View Social Analytics →
      </button>
    </Card>
  )
}
