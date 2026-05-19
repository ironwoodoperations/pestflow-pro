import { useState } from 'react'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import { useTenant } from '../../../context/TenantBootProvider'
import { useSeoRuns, type SeoKindState, type SeoRun } from '../../../hooks/useSeoRuns'
import { relativeTime } from '../seo/pageSpeedShared'

// Admin-dashboard tile: hardcoded Tailwind per CLAUDE.md ("Admin dashboard
// components keep their own hardcoded colors"). Mirrors SocialAnalyticsTile.
// S231 Phase 0: collapsible — default collapsed, showing summary counts.
// Expand/collapse state persisted in localStorage.

const SEO_EXPANDED_KEY = 'pfp_seo_tile_expanded'

function fmtNextAllowed(iso: string | null): string {
  if (!iso) return 'soon'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 'soon'
  const diffDays = Math.ceil((then - Date.now()) / 86400000)
  if (diffDays <= 0) return 'shortly'
  if (diffDays === 1) return 'in 1 day'
  return `in ${diffDays} days`
}

function RunButton(
  { running, rateLimitedUntil, onRun }:
  { running: boolean; rateLimitedUntil: string | null; onRun: () => void },
) {
  const rateLimited = !!rateLimitedUntil
  const disabled = running || rateLimited
  const title = running
    ? 'Refreshing…'
    : rateLimited
      ? `Next refresh available ${fmtNextAllowed(rateLimitedUntil)}`
      : 'Refresh now'
  return (
    <button
      onClick={onRun}
      disabled={disabled}
      title={title}
      className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
    >
      {running ? 'Running…' : rateLimited ? `Refreshes ${fmtNextAllowed(rateLimitedUntil)}` : 'Run Now'}
    </button>
  )
}

function SectionShell(
  { title, subtitle, children }:
  { title: string; subtitle?: string; children: React.ReactNode },
) {
  return (
    <div>
      <div className="mb-2">
        <p className="text-sm font-semibold text-gray-700">{title}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

// Renders one kind's body: loading / empty / error-only / success
// (+ "last attempt failed" indicator when a recent error sits atop older success).
function KindBody(
  { state, render }:
  { state: SeoKindState; render: (rows: SeoRun[]) => React.ReactNode },
) {
  if (state.loading) {
    return <p className="text-sm text-gray-400">Loading…</p>
  }
  const hasData = state.data.length > 0
  if (!hasData && state.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
        Last run failed: {state.error.message || state.error.code || 'Unknown error'}
        <span className="block text-xs text-red-500 mt-0.5">It will retry automatically on the next weekly run.</span>
      </div>
    )
  }
  if (!hasData) {
    return <p className="text-sm text-gray-400">No data yet — runs weekly.</p>
  }
  return (
    <div className="space-y-2">
      {state.error && (
        <p className="text-xs text-amber-600">
          Last attempt failed ({relativeTime(state.error.ran_at)}) — showing the most recent successful data.
        </p>
      )}
      {render(state.data)}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-medium text-gray-500 px-2 py-1">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-2 py-1 text-gray-700">{children}</td>
}

type RankItem = { keyword?: string; position?: number; search_volume?: number; url?: string }
type CompItem = { domain?: string; avg_position?: number; intersections?: number; visibility?: number }
type OppItem = { keyword?: string; competitor_position?: number | null; target_position?: number | null; search_volume?: number }

export default function SeoAnalyticsTile({ tenantId: tenantIdProp }: { tenantId?: string }) {
  // Mirrors SocialAnalyticsTile (which self-pulls via useTenant); also accepts
  // an explicit prop per the Phase 6 spec. Prop wins when provided.
  const { id: ctxTenantId } = useTenant()
  const tenantId = tenantIdProp ?? ctxTenantId

  const { rankings, competitors, opportunities, runNow, running } = useSeoRuns(tenantId)
  const [rateLimitedUntil, setRateLimitedUntil] = useState<string | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<boolean>(() => {
    try { return localStorage.getItem(SEO_EXPANDED_KEY) === 'true' } catch { return false }
  })

  const onRun = async () => {
    setRunError(null)
    const result = await runNow()
    if (result.ok) {
      setRateLimitedUntil(null)
    } else if (result.reason === 'rate_limited') {
      setRateLimitedUntil(result.nextAllowedAt)
    } else {
      setRunError(result.message)
    }
  }

  const toggleExpanded = () => {
    const next = !expanded
    setExpanded(next)
    try { localStorage.setItem(SEO_EXPANDED_KEY, String(next)) } catch { /* ignore */ }
  }

  const target =
    (rankings.data[0]?.data as { target?: string } | undefined)?.target ??
    (competitors.data[0]?.data as { target?: string } | undefined)?.target ??
    null

  const headerTime =
    rankings.lastRunAt || competitors.lastRunAt || opportunities.lastRunAt

  const anyLoading = rankings.loading || competitors.loading || opportunities.loading
  const hasAnyData = rankings.data.length > 0 || competitors.data.length > 0 || opportunities.data.length > 0

  // Summary counts for collapsed view
  const keywordCount = ((rankings.data[0]?.data as { items?: RankItem[] } | null)?.items ?? []).length
  const competitorCount = ((competitors.data[0]?.data as { items?: CompItem[] } | null)?.items ?? []).length
  const oppCount = opportunities.data.reduce((sum, row) => {
    return sum + ((row.data as { items?: OppItem[] } | null)?.items ?? []).length
  }, 0)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Search className="w-5 h-5 text-emerald-600" />
          SEO Analytics
        </h3>
        <div className="flex items-center gap-3">
          {headerTime && (
            <span className="text-xs text-gray-400">Last updated: {relativeTime(headerTime)}</span>
          )}
          <RunButton running={running} rateLimitedUntil={rateLimitedUntil} onRun={onRun} />
          {hasAnyData && (
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

      {runError && <p className="text-xs text-red-600 mb-3">{runError}</p>}

      {anyLoading && !hasAnyData ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !hasAnyData ? (
        <p className="text-sm text-gray-400">No data yet — runs weekly.</p>
      ) : !expanded ? (
        <div className="flex gap-3">
          <div className="flex-1 bg-gray-50 rounded-lg px-3 py-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{keywordCount}</div>
            <div className="text-xs text-gray-500 mt-1">Keywords</div>
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg px-3 py-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{competitorCount}</div>
            <div className="text-xs text-gray-500 mt-1">Competitors</div>
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg px-3 py-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{oppCount}</div>
            <div className="text-xs text-gray-500 mt-1">Opportunities</div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Rankings */}
          <SectionShell
            title="Keyword Rankings"
            subtitle={target ? `Top keywords for ${target}` : undefined}
          >
            <KindBody
              state={rankings}
              render={(rows) => {
                const items = (((rows[0]?.data as { items?: RankItem[] } | null)?.items) ?? [])
                  .slice()
                  .sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999))
                  .slice(0, 20)
                return (
                  <table className="w-full text-xs">
                    <thead><tr><Th>Keyword</Th><Th>Position</Th><Th>Volume</Th><Th>URL</Th></tr></thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i} className="border-t border-gray-50">
                          <Td>{it.keyword ?? '–'}</Td>
                          <Td>{it.position ?? '–'}</Td>
                          <Td>{it.search_volume ?? '–'}</Td>
                          <Td><span className="text-gray-400 truncate block max-w-[220px]">{it.url ?? '–'}</span></Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }}
            />
          </SectionShell>

          {/* Competitors */}
          <SectionShell title="Competitor Visibility">
            <KindBody
              state={competitors}
              render={(rows) => {
                const items = (((rows[0]?.data as { items?: CompItem[] } | null)?.items) ?? [])
                return (
                  <table className="w-full text-xs">
                    <thead><tr><Th>Domain</Th><Th>Avg Position</Th><Th>Shared Keywords</Th><Th>Visibility</Th></tr></thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i} className="border-t border-gray-50">
                          <Td>{it.domain ?? '–'}</Td>
                          <Td>{it.avg_position != null ? Math.round(it.avg_position) : '–'}</Td>
                          <Td>{it.intersections ?? '–'}</Td>
                          <Td>{it.visibility != null ? it.visibility.toFixed(1) : '–'}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }}
            />
          </SectionShell>

          {/* Opportunities — grouped by competitor (one hook row per competitor) */}
          <SectionShell title="Keyword Opportunities" subtitle="Keywords competitors rank for that you don't">
            <KindBody
              state={opportunities}
              render={(rows) => (
                <div className="space-y-4">
                  {rows.map((row) => {
                    const d = row.data as { competitor?: string; items?: OppItem[] } | null
                    const items = (d?.items ?? []).slice(0, 10)
                    return (
                      <div key={row.id}>
                        <p className="text-xs font-semibold text-gray-600 mb-1">vs {d?.competitor ?? 'competitor'}</p>
                        <table className="w-full text-xs">
                          <thead><tr><Th>Keyword</Th><Th>Their Position</Th><Th>Volume</Th></tr></thead>
                          <tbody>
                            {items.map((it, i) => (
                              <tr key={i} className="border-t border-gray-50">
                                <Td>{it.keyword ?? '–'}</Td>
                                <Td>{it.competitor_position ?? '–'}</Td>
                                <Td>{it.search_volume ?? '–'}</Td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  })}
                </div>
              )}
            />
          </SectionShell>
        </div>
      )}
    </div>
  )
}
