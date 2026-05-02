import { useTenant } from '../../../context/TenantBootProvider'

interface CachedAudit {
  scores: { performance: number; accessibility: number; best_practices: number; seo: number }
  run_at: string
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
    : score >= 70 ? 'bg-amber-100 text-amber-700 border-amber-300'
    : 'bg-red-100 text-red-700 border-red-300'
  return (
    <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center font-bold text-xl ${color}`}>
      {score}
    </div>
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface Props {
  onNavigate: (tab: string) => void
}

export default function DashboardSeoWidget({ onNavigate }: Props) {
  const { id: tenantId } = useTenant()
  let cached: CachedAudit | null = null
  try {
    const raw = localStorage.getItem(`lighthouse_score_${tenantId}`)
    if (raw) cached = JSON.parse(raw)
  } catch { /* ignore */ }

  if (!cached) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">SEO Performance</h3>
        <p className="text-xs text-gray-400 mb-4">No audit run yet</p>
        <button onClick={() => onNavigate('seo')}
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition">
          Run SEO Audit →
        </button>
      </div>
    )
  }

  const perf = cached.scores.performance

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">SEO Performance</h3>
          <p className="text-xs text-gray-400 mt-0.5">Lighthouse · Performance</p>
        </div>
        <ScoreBadge score={perf} />
      </div>
      <div className="space-y-1 mb-4">
        {(['accessibility', 'best_practices', 'seo'] as const).map(key => (
          <div key={key} className="flex justify-between text-xs text-gray-500">
            <span className="capitalize">{key.replace('_', ' ')}</span>
            <span className="font-medium text-gray-700">{cached!.scores[key]}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mb-3">Last checked: {fmtDate(cached.run_at)}</p>
      <button onClick={() => onNavigate('seo')}
        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition">
        View Full Report →
      </button>
    </div>
  )
}
