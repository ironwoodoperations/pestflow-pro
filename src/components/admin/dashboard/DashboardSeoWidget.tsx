import { Search } from 'lucide-react'
import { useTenant } from '../../../context/TenantBootProvider'
import { useSeoRuns } from '../../../hooks/useSeoRuns'
import { relativeTime } from '../seo/pageSpeedShared'

interface RankItem { keyword?: string; position?: number }

interface Props {
  onNavigate: (tab: string) => void
}

// Module-scoped so it isn't recreated each render (react/no-unstable-nested-components).
function SeoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: '#10b98118' }}>
        <Search className="w-5 h-5" style={{ color: '#10b981' }} />
      </div>
      <p className="text-sm font-semibold text-gray-700 mb-3">SEO Rankings</p>
      {children}
    </div>
  )
}

// S228: real-data mini-tile sourced from seo_runs (DataForSEO rankings),
// replacing the old Lighthouse/localStorage click-out. Mirrors the
// DashboardStats top-stat-card visual language (card shell + icon chip +
// big number + label) with a richer body. Lighthouse SEO score still lives
// on the Reports → Site Performance tile (no information loss).
export default function DashboardSeoWidget({ onNavigate }: Props) {
  const { id: tenantId } = useTenant()
  const { rankings } = useSeoRuns(tenantId)

  const items = ((rankings.data[0]?.data as { items?: RankItem[] } | null)?.items) ?? []
  const keywordCount = items.length
  const positions = items.map(i => i.position).filter((p): p is number => typeof p === 'number')
  const topPosition = positions.length ? Math.min(...positions) : null

  if (rankings.loading) {
    return <SeoCard><p className="text-xs text-gray-400">Loading…</p></SeoCard>
  }

  if (keywordCount === 0) {
    return (
      <SeoCard>
        <p className="text-xs text-gray-400 mb-3">
          {rankings.error ? `Last run failed: ${rankings.error.message || 'error'}` : 'No ranking data yet — refreshes weekly.'}
        </p>
        <button onClick={() => onNavigate('seo')}
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition">
          Open SEO Analytics →
        </button>
      </SeoCard>
    )
  }

  return (
    <SeoCard>
      <div className="flex items-end gap-6 mb-4">
        <div>
          <p className="text-3xl font-bold text-gray-900">{keywordCount}</p>
          <p className="text-sm text-gray-500 mt-1">Tracked keywords</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-900">{topPosition ?? '–'}</p>
          <p className="text-sm text-gray-500 mt-1">Best position</p>
        </div>
      </div>
      {rankings.lastRunAt && (
        <p className="text-xs text-gray-400 mb-3">Last refreshed: {relativeTime(rankings.lastRunAt)}</p>
      )}
      <button onClick={() => onNavigate('seo')}
        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition">
        View SEO Analytics →
      </button>
    </SeoCard>
  )
}
