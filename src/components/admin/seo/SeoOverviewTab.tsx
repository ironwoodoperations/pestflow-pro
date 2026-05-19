import { useTenant } from '../../../context/TenantBootProvider'
import { useGscRuns } from '../../../hooks/useGscRuns'
import { useSeoRuns } from '../../../hooks/useSeoRuns'
import type { SeoStats, SeoCoverage, AuditResult } from './seoTypes'
import SeoStatCards from './SeoStatCards'

interface Props {
  stats: SeoStats
  coverage: SeoCoverage
  lastAudit: AuditResult | null
}

function CoverageCard({ emoji, label, total, live }: {
  emoji: string; label: string; total: number; live: number
}) {
  const pct = total > 0 ? Math.round((live / total) * 100) : 0
  const barColor = pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-400' : 'bg-gray-300'
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{emoji}</span>
        <span className="font-medium text-gray-800 text-sm">{label}</span>
      </div>
      <p className="text-xs text-gray-500 mb-2">{live} live &middot; {total} total</p>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className={`${barColor} h-1.5 rounded-full transition-all`}
          style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1">{pct}% live</p>
    </div>
  )
}

function fmtNum(n: number | null): string {
  if (n == null) return '–'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function PageSpeedMini({ lastAudit }: { lastAudit: AuditResult | null }) {
  const score = lastAudit?.scores.performance ?? null
  const scoreColor = score === null
    ? 'text-gray-400'
    : score >= 90 ? 'text-emerald-600' : score >= 50 ? 'text-amber-500' : 'text-red-500'
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-500 mb-2">⚡ PageSpeed</p>
      {score === null ? (
        <p className="text-xs text-gray-400">Run an audit on the Insights tab</p>
      ) : (
        <>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${scoreColor}`}>{score}</span>
            <span className="text-xs text-gray-400">/ 100</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Performance</p>
        </>
      )}
    </div>
  )
}

function GscMini({ tenantId }: { tenantId: string }) {
  const { latestRun, loading } = useGscRuns(tenantId)
  const data = latestRun?.status === 'success' ? latestRun.data : null
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-500 mb-2">🔍 Search Console</p>
      {loading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : !data ? (
        <p className="text-xs text-gray-400">Not connected — see Insights tab</p>
      ) : (
        <div className="flex gap-5">
          <div>
            <p className="text-2xl font-bold text-gray-900">{fmtNum(data.total_clicks)}</p>
            <p className="text-xs text-gray-400 mt-1">Clicks</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{fmtNum(data.total_impressions)}</p>
            <p className="text-xs text-gray-400 mt-1">Impressions</p>
          </div>
        </div>
      )}
    </div>
  )
}

function SeoAnalyticsMini({ tenantId }: { tenantId: string }) {
  const { rankings, opportunities } = useSeoRuns(tenantId)
  const keywordCount = ((rankings.data[0]?.data as { items?: unknown[] } | null)?.items ?? []).length
  const oppCount = opportunities.data.reduce((sum, row) => {
    return sum + ((row.data as { items?: unknown[] } | null)?.items ?? []).length
  }, 0)
  const loading = rankings.loading || opportunities.loading
  const hasData = rankings.data.length > 0 || opportunities.data.length > 0
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-500 mb-2">📈 SEO Analytics</p>
      {loading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : !hasData ? (
        <p className="text-xs text-gray-400">No data yet — see Insights tab</p>
      ) : (
        <div className="flex gap-5">
          <div>
            <p className="text-2xl font-bold text-gray-900">{keywordCount}</p>
            <p className="text-xs text-gray-400 mt-1">Keywords</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{oppCount}</p>
            <p className="text-xs text-gray-400 mt-1">Opportunities</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SeoOverviewTab({ stats, coverage, lastAudit }: Props) {
  const { id: tenantId } = useTenant()

  return (
    <div className="space-y-6">
      <SeoStatCards stats={stats} />

      {/* Content Coverage */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Content Coverage</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CoverageCard emoji="🐛" label="Pest Pages" total={coverage.pest.total} live={coverage.pest.live} />
          <CoverageCard emoji="📍" label="Service Area Pages" total={coverage.service_area.total} live={coverage.service_area.live} />
          <CoverageCard emoji="✍️" label="Blog Posts" total={coverage.blog.total} live={coverage.blog.live} />
          <CoverageCard emoji="📋" label="Static Pages" total={coverage.static.total} live={coverage.static.live} />
        </div>
      </div>

      {/* Data source snapshot — status-glance mini-tiles */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Data Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PageSpeedMini lastAudit={lastAudit} />
          <GscMini tenantId={tenantId} />
          <SeoAnalyticsMini tenantId={tenantId} />
        </div>
      </div>
    </div>
  )
}
