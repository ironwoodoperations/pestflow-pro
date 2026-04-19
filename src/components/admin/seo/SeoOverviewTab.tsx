import type { SeoStats, SeoCoverage, AuditResult, IntegrationValues } from './seoTypes'
import SeoStatCards from './SeoStatCards'
import ScoreRing from './ScoreRing'
import GSCStatusPanel from './GSCStatusPanel'

interface Props {
  stats: SeoStats
  coverage: SeoCoverage
  integrations: IntegrationValues
  lastAudit: AuditResult | null
  auditLoading: boolean
  auditMode: 'mobile' | 'desktop'
  onSetAuditMode: (m: 'mobile' | 'desktop') => void
  onRunAudit: () => void
  onRefreshScore: () => void
  onGoToConnect: () => void
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

export default function SeoOverviewTab({
  stats, coverage, integrations, lastAudit,
  auditLoading, auditMode, onSetAuditMode, onRunAudit, onRefreshScore, onGoToConnect
}: Props) {
  const { google_api_key } = integrations

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })

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

      {/* Lighthouse */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Lighthouse Scores</h3>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
              {(['mobile', 'desktop'] as const).map(m => (
                <button key={m} onClick={() => onSetAuditMode(m)}
                  className={`px-3 py-1.5 capitalize font-medium transition-colors ${
                    auditMode === m
                      ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}>
                  {m === 'mobile' ? '📱' : '🖥️'} {m}
                </button>
              ))}
            </div>
            {lastAudit && (
              <button onClick={onRefreshScore} disabled={auditLoading}
                className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-50">
                🔄 Refresh Score
              </button>
            )}
            <button onClick={onRunAudit} disabled={auditLoading || !google_api_key}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1">
              {auditLoading ? '⏳ Running...' : '🔍 Run Audit'}
            </button>
          </div>
        </div>

        {!google_api_key ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
            <p className="text-sm text-gray-500 mb-2">Add a Google API key to enable Lighthouse scores.</p>
            <button onClick={onGoToConnect} className="text-sm text-emerald-600 hover:underline font-medium">
              Go to Connect tab →
            </button>
          </div>
        ) : (
          <>
            {auditLoading && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                <p className="text-sm text-gray-500">Running audit… this takes 10–15 seconds</p>
              </div>
            )}
            {!auditLoading && lastAudit && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex justify-center gap-8 mb-4">
                  <ScoreRing score={lastAudit.scores.performance} label="Performance" />
                  <ScoreRing score={lastAudit.scores.accessibility} label="Accessibility" />
                  <ScoreRing score={lastAudit.scores.best_practices} label="Best Practices" />
                  <ScoreRing score={lastAudit.scores.seo} label="SEO" />
                </div>
                {lastAudit.webVitals && (lastAudit.webVitals.lcp || lastAudit.webVitals.tbt || lastAudit.webVitals.cls) && (
                  <div className="flex gap-6 justify-center border-t pt-3 text-xs text-gray-500">
                    {lastAudit.webVitals.lcp && <span>LCP: <b>{lastAudit.webVitals.lcp}</b></span>}
                    {lastAudit.webVitals.tbt && <span>TBT: <b>{lastAudit.webVitals.tbt}</b></span>}
                    {lastAudit.webVitals.cls && <span>CLS: <b>{lastAudit.webVitals.cls}</b></span>}
                  </div>
                )}
                {lastAudit.opportunities.length > 0 && (
                  <div className="mt-4 border-t pt-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Top Opportunities</p>
                    {lastAudit.opportunities.map((o, i) => (
                      <div key={i} className="flex justify-between text-xs text-gray-500 py-1">
                        <span>{o.title}</span>
                        <span className="text-amber-600 font-medium">{o.savings}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 text-center mt-3 border-t pt-3">
                  Last checked: {fmtTime(lastAudit.run_at)}
                </p>
              </div>
            )}
            {!auditLoading && !lastAudit && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                <p className="text-sm text-gray-500">Click Run Audit to fetch Lighthouse scores.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Core Web Vitals placeholder */}
      {(!lastAudit || !lastAudit.webVitals || (!lastAudit.webVitals.lcp && !lastAudit.webVitals.tbt && !lastAudit.webVitals.cls)) && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <h4 className="font-semibold text-gray-700 text-sm mb-1">Core Web Vitals</h4>
          <p className="text-xs text-gray-500">
            Run a Lighthouse audit to see LCP, FID, and CLS scores for your site.
            These are Google's primary ranking signals for page experience.
          </p>
        </div>
      )}

      {/* Google Search Console Status */}
      <GSCStatusPanel gscUrl={integrations.google_search_console_url || null} />
    </div>
  )
}
