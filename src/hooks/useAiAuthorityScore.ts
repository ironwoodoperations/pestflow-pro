// S253 / A1 — data hook for the AI Authority tile.
// Reads the operator-applied scoring RPC (get_ai_authority_scores — local DB read,
// no external call) + ai_authority_tier_engines for the tenant's current tier. The
// RPC scores each engine SERVER-SIDE over the trailing 56-day window and returns one
// aggregated row per engine (completed_runs, calibrating, score, …); the hook maps
// those fields straight onto EngineScore. The tile renders from this; no scoring
// logic in the component.

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantBootProvider'
import { usePlan } from '../context/PlanContext'
import { MIN_SAMPLE, type EngineScore } from '../lib/aiAuthority/score'
import type { EngineId } from '../lib/aiAuthority/engines'

// One row per engine, exactly as get_ai_authority_scores returns it. completed_runs
// is the live calibration progress (done jobs); calibrating + score are computed by
// the RPC. Numerics arrive as strings over the wire, so coerce defensively.
interface RpcRow {
  engine: EngineId
  scheduled_runs: number | string
  completed_runs: number | string
  calibrating: boolean
  score: number | string | null
  citation_rate: number | string | null
  mention_rate: number | string | null
  avg_position: number | string | null
  avg_share_voice: number | string | null
}

const num = (v: number | string): number => (typeof v === 'number' ? v : Number(v) || 0)

function toEngineScore(r: RpcRow): EngineScore {
  const calibrating = r.calibrating
  return {
    score: calibrating || r.score === null ? null : Math.round(num(r.score)),
    calibrating,
    completedTotal: num(r.completed_runs),
    threshold: MIN_SAMPLE,
    // The RPC returns a single aggregate over the window, not a weekly series, so
    // there is no trendline/delta to render yet.
    trend: [],
    delta: null,
  }
}

export interface AiAuthorityData {
  loading: boolean
  error: string | null
  enabledEngines: Set<EngineId>          // engines included in the tenant's CURRENT tier
  byEngine: Partial<Record<EngineId, EngineScore>>  // computed score per engine with data
}

export function useAiAuthorityScore(): AiAuthorityData {
  const { id: tenantId } = useTenant()
  const { tier } = usePlan()
  const [state, setState] = useState<AiAuthorityData>({
    loading: true, error: null, enabledEngines: new Set(), byEngine: {},
  })

  const load = useCallback(async () => {
    if (!tenantId) return
    setState((s) => ({ ...s, loading: true, error: null }))

    const [scoresRes, tierRes] = await Promise.all([
      supabase.rpc('get_ai_authority_scores', { p_tenant: tenantId }),
      supabase.from('ai_authority_tier_engines').select('tier, engines').eq('tier', tier).maybeSingle(),
    ])

    if (scoresRes.error) {
      setState({ loading: false, error: scoresRes.error.message, enabledEngines: new Set(), byEngine: {} })
      return
    }

    const rows = (scoresRes.data as RpcRow[] | null) ?? []
    // One row per engine — key by engine so each card reads its own count, never
    // by array position.
    const byEngine: Partial<Record<EngineId, EngineScore>> = {}
    for (const r of rows) byEngine[r.engine] = toEngineScore(r)

    const engines = (tierRes.data?.engines as EngineId[] | null) ?? []
    setState({ loading: false, error: null, enabledEngines: new Set(engines), byEngine })
  }, [tenantId, tier])

  useEffect(() => { load() }, [load])

  return state
}
