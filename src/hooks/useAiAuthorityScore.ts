// S253 / A1 — data hook for the AI Authority tile.
// Reads the operator-applied scoring RPC (get_ai_authority_scores — local DB read,
// no external call) + ai_authority_tier_engines for the tenant's current tier, then
// runs the pure per-engine scorer. The tile renders from this; no scoring logic in
// the component.

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantBootProvider'
import { usePlan } from '../context/PlanContext'
import { scoreEngine, type WeeklyAgg, type EngineScore } from '../lib/aiAuthority/score'
import type { EngineId } from '../lib/aiAuthority/engines'

interface RpcRow {
  engine: EngineId
  week_index: number | string
  week_start: string
  denom: number | string
  completed: number | string
  snapshots: number | string
  cited: number | string
  mentioned: number | string
  position_sum: number | string
  position_n: number | string
  sov_sum: number | string
  sov_n: number | string
}

const num = (v: number | string): number => (typeof v === 'number' ? v : Number(v) || 0)

function toWeekly(r: RpcRow): WeeklyAgg {
  return {
    week_index: num(r.week_index), week_start: r.week_start,
    denom: num(r.denom), completed: num(r.completed), snapshots: num(r.snapshots),
    cited: num(r.cited), mentioned: num(r.mentioned),
    position_sum: num(r.position_sum), position_n: num(r.position_n),
    sov_sum: num(r.sov_sum), sov_n: num(r.sov_n),
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
    const grouped = new Map<EngineId, WeeklyAgg[]>()
    for (const r of rows) {
      const list = grouped.get(r.engine) ?? []
      list.push(toWeekly(r))
      grouped.set(r.engine, list)
    }
    const byEngine: Partial<Record<EngineId, EngineScore>> = {}
    for (const [engine, weeks] of grouped) byEngine[engine] = scoreEngine(weeks)

    const engines = (tierRes.data?.engines as EngineId[] | null) ?? []
    setState({ loading: false, error: null, enabledEngines: new Set(engines), byEngine })
  }, [tenantId, tier])

  useEffect(() => { load() }, [load])

  return state
}
