import type { SeoStats } from './seoTypes'
import InfoTooltip from '../common/InfoTooltip'

function StatCard({
  label, value, sub, emoji, colorClass, metricKey
}: {
  label: string
  value: string | number
  sub?: string
  emoji: string
  colorClass: string
  metricKey?: string
}) {
  return (
    <div className={`bg-white rounded-xl border p-4 flex items-start gap-3 shadow-sm ${colorClass}`}>
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm font-medium text-gray-700">{label}{metricKey && <InfoTooltip metricKey={metricKey} />}</p>
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
        label="Total Pages" value={totalPages} metricKey="seo.total_pages"
        emoji="📄" colorClass="border-gray-200"
      />
      <StatCard
        label="Live Pages" value={livePages} metricKey="seo.live_pages"
        emoji="🌐" colorClass="border-blue-200"
      />
      <StatCard
        label="SEO Configured" value={`${seoConfigured}/${totalPages}`} metricKey="seo.seo_configured"
        emoji="✅"
        colorClass={seoConfigured === totalPages ? 'border-emerald-200' : 'border-amber-200'}
      />
      <StatCard
        label="Issues Found" value={issuesFound} metricKey="seo.issues_found"
        sub={issuesFound > 0 ? 'Live pages missing SEO' : 'All clear'}
        emoji={issuesFound > 0 ? '⚠️' : '🎯'}
        colorClass={issuesFound > 0 ? 'border-red-200' : 'border-emerald-200'}
      />
    </div>
  )
}
