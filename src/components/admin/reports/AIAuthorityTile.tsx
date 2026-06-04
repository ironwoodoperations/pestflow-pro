// S253 / A1 — AI Authority Score Reports tile.
// Per-engine score cards (NO blended composite). Visibility is driven by what data
// EXISTS in the window (historical higher-tier data survives a downgrade) PLUS the
// current tier for the locked-upgrade upsell — never by stripping on live tier.
// All data comes from useAiAuthorityScore (local DB reads only).

import { Sparkles, Lock, ArrowUp, ArrowDown, Clock } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts'
import { useAiAuthorityScore } from '../../../hooks/useAiAuthorityScore'
import { ENGINES, TIER_LABEL, type EngineMeta } from '../../../lib/aiAuthority/engines'
import type { EngineScore } from '../../../lib/aiAuthority/score'

function scoreColor(score: number | null): string {
  if (score === null) return '#9ca3af'
  if (score >= 70) return '#10b981'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null || delta === 0) return null
  const up = delta > 0
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>
      {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}{Math.abs(delta)}
    </span>
  )
}

function Trendline({ data, accent }: { data: { week_start: string; score: number | null }[]; accent: string }) {
  const points = data.filter((d) => d.score !== null)
  if (points.length < 2) return <div className="h-12" />
  return (
    <div className="h-12">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <YAxis hide domain={[0, 100]} />
          <Tooltip formatter={(v) => [`${v}`, 'Score']} labelFormatter={() => ''} />
          <Line type="monotone" dataKey="score" stroke={accent} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function ScoreCard({ meta, score }: { meta: EngineMeta; score?: EngineScore }) {
  // Unlocked-but-no-runs-yet, or fewer than 40 completed runs → Calibrating.
  if (!score || score.calibrating) {
    const x = score?.completedTotal ?? 0
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-800">{meta.label}</span>
          <Clock size={14} className="text-gray-400" />
        </div>
        <div className="text-2xl font-bold text-gray-400">Calibrating</div>
        <div className="text-xs text-gray-500 mt-1">{x}/{score?.threshold ?? 40} runs collected</div>
      </div>
    )
  }
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-800">{meta.label}</span>
        <DeltaBadge delta={score.delta} />
      </div>
      <div className="text-3xl font-bold" style={{ color: scoreColor(score.score) }}>{score.score}</div>
      <div className="text-xs text-gray-400 mt-0.5 mb-1">Authority score · 8-week trend</div>
      <Trendline data={score.trend} accent={meta.accent} />
    </div>
  )
}

function LockedCard({ meta }: { meta: EngineMeta }) {
  const planLabel = TIER_LABEL[meta.minTier] ?? 'a higher plan'
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 text-center flex flex-col items-center justify-center min-h-[150px]">
      <Lock className="w-6 h-6 text-amber-500 mb-2" />
      <p className="text-sm font-semibold text-gray-700">Unlock your {meta.shortName} authority</p>
      <p className="text-xs text-gray-500 mt-1 mb-3">See how {meta.shortName} ranks you for buyer-intent searches.</p>
      <a
        href="mailto:support@pestflowpro.ai?subject=Upgrade Request - AI Authority"
        className="inline-block px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
      >
        Upgrade to {planLabel} →
      </a>
    </div>
  )
}

function ComingSoonCard({ meta }: { meta: EngineMeta }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center flex flex-col items-center justify-center min-h-[150px]">
      <Sparkles className="w-6 h-6 text-gray-400 mb-2" />
      <p className="text-sm font-semibold text-gray-600">{meta.label}</p>
      <p className="text-xs text-gray-400 mt-1">Authority tracking coming soon</p>
    </div>
  )
}

export default function AIAuthorityTile() {
  const { loading, error, enabledEngines, byEngine } = useAiAuthorityScore()

  return (
    <div className="mt-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          AI Authority Score
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          How AI answer engines cite and recommend you for buyer-intent local searches. Tracked per engine over the last 8 weeks.
        </p>

        {loading && <p className="text-sm text-gray-400">Loading AI authority data…</p>}
        {error && <p className="text-xs text-red-600">Couldn’t load AI authority scores: {error}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ENGINES.filter((e) => e.status !== 'hidden').map((meta) => {
              if (meta.status === 'coming_soon') return <ComingSoonCard key={meta.id} meta={meta} />
              const score = byEngine[meta.id]
              const unlocked = enabledEngines.has(meta.id)
              // Show data card when in-tier OR historical data exists; else upsell.
              if (unlocked || score) return <ScoreCard key={meta.id} meta={meta} score={score} />
              return <LockedCard key={meta.id} meta={meta} />
            })}
          </div>
        )}
      </div>
    </div>
  )
}
