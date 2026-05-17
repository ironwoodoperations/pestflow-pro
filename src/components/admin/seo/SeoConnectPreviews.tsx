// Mock preview widgets for unconnected SEO integrations
import { useTenant } from '../../../context/TenantBootProvider'
import { usePageSpeedRuns } from '../../../hooks/usePageSpeedRuns'
import { relativeTime, pageSpeedTargetUrl } from './pageSpeedShared'

const SAMPLE_BADGE = (
  <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">Sample Preview</span>
)

// Impressions + clicks over 28 days (4 weekly labels)
const IMP = [820, 950, 1100, 980, 1050, 1150, 1200, 1080, 920, 1020, 1100, 1150, 980, 1060, 1200, 1120, 950, 1000, 1080, 1150, 1200, 1050, 980, 1100, 1060, 1120, 1200, 1080]
const CLK = [42, 55, 68, 50, 58, 72, 78, 64, 44, 52, 66, 70, 55, 61, 76, 70, 48, 56, 63, 71, 76, 60, 55, 68, 62, 70, 76, 65]

function makePath(data: number[], min: number, max: number, w: number, h: number) {
  const norm = data.map(v => h - ((v - min) / (max - min)) * (h - 6) - 3)
  return norm.map((y, i) => `${i === 0 ? 'M' : 'L'}${(i / (data.length - 1)) * w},${y}`).join(' ')
}

export function SearchConsoleMockPreview() {
  const W = 280, H = 80
  const impPath = makePath(IMP, 700, 1300, W, H)
  const clkPath = makePath(CLK, 30, 90, W, H)
  return (
    <div className="space-y-2 mb-3">
      <div className="flex items-center justify-between">
        {SAMPLE_BADGE}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block" />Impressions</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500 inline-block" />Clicks</span>
        </div>
      </div>
      <svg width={W} height={H} className="w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <path d={impPath} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
        <path d={clkPath} fill="none" stroke="#10b981" strokeWidth="1.5" />
      </svg>
      <div className="flex justify-between text-xs text-gray-400">
        <span>4 wks ago</span><span>3 wks ago</span><span>2 wks ago</span><span>This wk</span>
      </div>
      <div className="border border-gray-100 rounded-lg overflow-hidden mt-1">
        <div className="bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500 grid grid-cols-4 gap-2">
          <span className="col-span-2">Query</span><span>Impr.</span><span>Clicks</span>
        </div>
        {[
          ['pest control tyler tx', 312, 28, 3.2],
          ['exterminator near me', 198, 14, 5.8],
          ['termite inspection tyler', 145, 19, 2.1],
        ].map(([q, imp, clk, pos]) => (
          <div key={String(q)} className="px-3 py-1.5 text-xs text-gray-700 grid grid-cols-4 gap-2 border-t border-gray-100">
            <span className="col-span-2 truncate">{q}</span>
            <span>{imp}</span>
            <span>{clk} <span className="text-gray-400">pos {pos}</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}

const SESSIONS = [65, 88, 72, 104, 118, 92, 47]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function GA4MockPreview() {
  const max = Math.max(...SESSIONS)
  return (
    <div className="space-y-2 mb-3">
      <div className="flex items-center justify-between">
        {SAMPLE_BADGE}
        <span className="text-xs text-gray-400">Last 7 days</span>
      </div>
      <div className="flex items-end gap-1 h-16">
        {SESSIONS.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full bg-blue-400 rounded-t-sm" style={{ height: `${(v / max) * 52}px` }} />
            <span className="text-xs text-gray-400">{DAYS[i]}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-1">
        {[['342', 'Users'], ['1,204', 'Sessions'], ['2m 18s', 'Avg Session']].map(([val, label]) => (
          <div key={label} className="flex-1 bg-gray-50 rounded-lg px-2 py-1.5 text-center">
            <div className="text-sm font-semibold text-gray-800">{val}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScoreGauge({ score, label }: { score: number | null; label: string }) {
  const color =
    score === null ? '#9ca3af'
    : score >= 90 ? '#10b981'
    : score >= 50 ? '#f59e0b'
    : '#ef4444'
  const r = 20, circ = 2 * Math.PI * r
  const dash = score === null ? 0 : (score / 100) * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 26 26)" />
        <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="700" fill="#111827">{score ?? '–'}</text>
      </svg>
      <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
    </div>
  )
}

function PageSpeedRunButton({ label, running, onRun }: { label: string; running: boolean; onRun: () => void }) {
  return (
    <button onClick={onRun} disabled={running}
      className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-1 disabled:opacity-50">
      {running ? '⏳ Running PageSpeed audit (this can take 30 seconds)…' : `🔄 ${label}`}
    </button>
  )
}

// Real PageSpeed panel for the SEO → Connect tab. Reads the latest cached run
// from pagespeed_runs via the shared hook; "Run Check Now" invokes the
// pagespeed-proxy edge function (C2-authenticated, writes back to the table).
export function PageSpeedPanel() {
  const { id: tenantId } = useTenant()
  const { latestRun, loading, running, error, runCheck } = usePageSpeedRuns(tenantId)
  const url = pageSpeedTargetUrl()
  const onRun = () => runCheck(url)

  if (loading) {
    return <div className="text-xs text-gray-400 py-4">Loading PageSpeed data…</div>
  }

  if (!latestRun) {
    return (
      <div className="space-y-3 mb-3">
        <p className="text-xs text-gray-500">No PageSpeed data yet. Run your first check to populate real Lighthouse scores.</p>
        <PageSpeedRunButton label="Run first check" running={running} onRun={onRun} />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  if (latestRun.status === 'error') {
    return (
      <div className="space-y-3 mb-3">
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
          PageSpeed check failed: {latestRun.api_error_msg || 'Unknown error'}
        </div>
        <PageSpeedRunButton label="Retry" running={running} onRun={onRun} />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2 mb-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Last checked: {relativeTime(latestRun.ran_at)}
        </span>
        <span className="text-xs text-gray-400">
          Perf — Desktop {latestRun.desktop_performance ?? '–'} / Mobile {latestRun.mobile_performance ?? '–'}
        </span>
      </div>
      <div className="flex justify-around py-1">
        <ScoreGauge score={latestRun.desktop_performance} label="Performance" />
        <ScoreGauge score={latestRun.desktop_accessibility} label="Accessibility" />
        <ScoreGauge score={latestRun.desktop_best_practices} label="Best Practices" />
        <ScoreGauge score={latestRun.desktop_seo} label="SEO" />
      </div>
      <PageSpeedRunButton label="Run Check Now" running={running} onRun={onRun} />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
