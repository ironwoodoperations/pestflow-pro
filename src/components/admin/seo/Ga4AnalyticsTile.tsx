import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTenant } from '../../../context/TenantBootProvider'
import { useGa4Runs, type Ga4Run } from '../../../hooks/useGa4Runs'
import { relativeTime } from './pageSpeedShared'
import InfoTooltip from '../common/InfoTooltip'

// Admin-dashboard tile: hardcoded Tailwind per CLAUDE.md.
// S231 Phase 5: collapsible — default collapsed, showing 4 stat pills.
// Expand/collapse state persisted in localStorage.
// States: loading / unconfigured / error / success.

function StatPill({ label, value, metricKey }: { label: string; value: string; metricKey?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-4 py-3 text-center">
      <p className="text-xs text-gray-500 mb-0.5">{label}{metricKey && <InfoTooltip metricKey={metricKey} />}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-medium text-gray-500 px-2 py-1 text-xs">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-2 py-1.5 text-sm text-gray-700">{children}</td>
}

function fmtNum(n: number | null): string {
  if (n == null) return '—'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}
function fmtPct(n: number | null): string {
  if (n == null) return '—'
  return `${(n * 100).toFixed(1)}%`
}

const GA4_EXPANDED_KEY = 'pfp_ga4_tile_expanded'

function SummaryPills({ run }: { run: Ga4Run }) {
  const d = run.data
  if (!d) return null
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatPill label="Total Users"    value={fmtNum(d.total_users)} metricKey="ga4.users" />
      <StatPill label="Sessions"       value={fmtNum(d.total_sessions)} metricKey="ga4.sessions" />
      <StatPill label="Engagement Rate" value={fmtPct(d.avg_engagement_rate)} metricKey="ga4.engagement_rate" />
      <StatPill label="Page Views"     value={fmtNum(d.total_page_views)} metricKey="ga4.page_views" />
    </div>
  )
}

function SuccessBody({ run, expanded }: { run: Ga4Run; expanded: boolean }) {
  const d = run.data
  if (!d) return <p className="text-sm text-gray-400">No data in this run.</p>
  const channels = d.channels ?? []
  const topPages = d.top_pages ?? []
  return (
    <div className="space-y-5">
      <SummaryPills run={run} />
      {expanded && (
        <>
          {channels.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Traffic by Channel</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <Th>Channel<InfoTooltip metricKey="ga4.channel" /></Th>
                      <Th>Sessions</Th>
                      <Th>Users</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {channels.map((c, i) => (
                      <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                        <Td><span className="font-medium">{c.channel}</span></Td>
                        <Td>{fmtNum(c.sessions)}</Td>
                        <Td>{fmtNum(c.users)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {topPages.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Top Pages (Last 30 Days)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <Th>Page</Th>
                      <Th>Views<InfoTooltip metricKey="ga4.views" /></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.map((p, i) => (
                      <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                        <Td><span className="font-mono text-gray-600">{p.page}</span></Td>
                        <Td>{fmtNum(p.views)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function Ga4AnalyticsTile({ tenantId: tenantIdProp }: { tenantId?: string }) {
  const { id: ctxTenantId } = useTenant()
  const tenantId = tenantIdProp ?? ctxTenantId

  const { latestRun, loading, running, error, runCheck } = useGa4Runs(tenantId)

  const [expanded, setExpanded] = useState<boolean>(() => {
    try { return localStorage.getItem(GA4_EXPANDED_KEY) === 'true' } catch { return false }
  })
  const toggleExpanded = () => {
    const next = !expanded
    setExpanded(next)
    try { localStorage.setItem(GA4_EXPANDED_KEY, String(next)) } catch { /* ignore */ }
  }

  const isSuccess = !loading && latestRun?.status === 'success'
  const headerTime = latestRun?.ran_at ?? null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-blue-500 text-lg">📈</span>
          Google Analytics 4
        </h3>
        <div className="flex items-center gap-3">
          {headerTime && (
            <span className="text-xs text-gray-400">Last checked: {relativeTime(headerTime)}</span>
          )}
          <button
            onClick={runCheck}
            disabled={running || loading}
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {running ? 'Running…' : 'Run Now'}
          </button>
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

      {error && (
        <p className="text-xs text-red-600 mb-3">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !latestRun || latestRun.status === 'unconfigured' ? (
        <div className="bg-gray-50 rounded-lg px-4 py-5 text-center">
          <p className="text-sm text-gray-600 font-medium mb-1">Google Analytics 4 not connected</p>
          <p className="text-xs text-gray-400">Connect your Google account to see traffic, sessions, engagement rate, and top pages.</p>
        </div>
      ) : latestRun.status === 'error' ? (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-4">
          <p className="text-sm text-red-700 font-medium">
            {latestRun.api_error_code === 'token_revoked'
              ? 'Google authorization was revoked — reconnect Google Analytics.'
              : 'Last run failed — it will retry automatically on the next weekly check.'}
          </p>
          {latestRun.api_error_msg && latestRun.api_error_code !== 'token_revoked' && (
            <p className="text-xs text-red-500 mt-1">{latestRun.api_error_msg}</p>
          )}
        </div>
      ) : (
        <SuccessBody run={latestRun} expanded={expanded} />
      )}
    </div>
  )
}
