import type { SeoStats } from './seoTypes'

function StatCard({
  label, value, sub, emoji, colorClass
}: {
  label: string
  value: string | number
  sub?: string
  emoji: string
  colorClass: string
}) {
  return (
    <div className={`bg-white rounded-xl border p-4 flex items-start gap-3 shadow-sm ${colorClass}`}>
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function SeoStatCards({ stats }: { stats: SeoStats }) {
  const { totalPages, livePages, seoConfigured, issuesFound } = stats
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total Pages" value={totalPages}
        emoji="📄" colorClass="border-gray-200"
      />
      <StatCard
        label="Live Pages" value={livePages}
        emoji="🌐" colorClass="border-blue-200"
      />
      <StatCard
        label="SEO Configured" value={`${seoConfigured}/${totalPages}`}
        emoji="✅"
        colorClass={seoConfigured === totalPages ? 'border-emerald-200' : 'border-amber-200'}
      />
      <StatCard
        label="Issues Found" value={issuesFound}
        sub={issuesFound > 0 ? 'Live pages missing SEO' : 'All clear'}
        emoji={issuesFound > 0 ? '⚠️' : '🎯'}
        colorClass={issuesFound > 0 ? 'border-red-200' : 'border-emerald-200'}
      />
    </div>
  )
}
