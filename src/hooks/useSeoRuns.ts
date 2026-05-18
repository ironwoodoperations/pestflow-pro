import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type SeoKind = 'rankings' | 'competitors' | 'opportunities'

export type SeoRun = {
  id: string
  tenant_id: string
  kind: SeoKind
  status: 'success' | 'error'
  data: Record<string, unknown> | null
  data_raw: unknown
  api_error_code: string | null
  api_error_msg: string | null
  ran_at: string
}

export type SeoKindState = {
  // Success rows backing this kind. rankings/competitors: <=1 (latest success).
  // opportunities: one row per competitor (latest each) — tile groups by competitor.
  data: SeoRun[]
  loading: boolean
  // Set only when the most recent run for the kind is an error newer than the
  // latest success — tile decides stale-success-with-indicator vs error-only.
  error: { code: string | null; message: string | null; ran_at: string } | null
  lastRunAt: string | null
}

export type RunNowResult =
  | { ok: true; runIds: string[] }
  | { ok: false; reason: 'rate_limited'; nextAllowedAt: string | null }
  | { ok: false; reason: 'error'; message: string }

export function useSeoRuns(tenantId: string | undefined) {
  const [rows, setRows] = useState<SeoRun[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Single RLS-scoped fetch; bucketed by `kind` below. Diverges from
  // useZernioRuns' single maybeSingle() because seo_runs is a 3-kind
  // discriminated table — one round trip beats three.
  const refetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    // RLS scopes rows to the caller's tenant; explicit filter is defense-in-depth.
    const { data, error: fetchErr } = await supabase
      .from('seo_runs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('ran_at', { ascending: false })
      .limit(60)
    if (fetchErr) {
      setFetchError(fetchErr.message)
    } else {
      setRows((data as SeoRun[] | null) ?? [])
      setFetchError(null)
    }
    setLoading(false)
  }, [tenantId])

  const buildKind = (kind: SeoKind): SeoKindState => {
    const kindRows = rows.filter((r) => r.kind === kind)
    const success = kindRows.filter((r) => r.status === 'success')

    let data: SeoRun[]
    if (kind === 'opportunities') {
      // rows are ran_at DESC → first seen per competitor is the newest.
      const seen = new Set<string>()
      data = []
      for (const r of success) {
        const competitor = String((r.data as { competitor?: string } | null)?.competitor ?? '')
        if (seen.has(competitor)) continue
        seen.add(competitor)
        data.push(r)
      }
    } else {
      data = success.length ? [success[0]] : []
    }

    const lastRunAt = data.length
      ? data.reduce((max, r) => (r.ran_at > max ? r.ran_at : max), data[0].ran_at)
      : null

    const latest = kindRows[0]
    const newestSuccessAt = success[0]?.ran_at
    const error =
      latest && latest.status === 'error' && (!newestSuccessAt || latest.ran_at > newestSuccessAt)
        ? { code: latest.api_error_code, message: latest.api_error_msg, ran_at: latest.ran_at }
        : null

    return { data, loading, error, lastRunAt }
  }

  const runNow = useCallback(
    async (kind?: SeoKind): Promise<RunNowResult> => {
      if (!tenantId) return { ok: false, reason: 'error', message: 'No tenant' }
      setRunning(true)
      try {
        // refreshSession (not getSession) — avoids stale/expired access tokens.
        const { data: { session } } = await supabase.auth.refreshSession()
        if (!session) return { ok: false, reason: 'error', message: 'Not authenticated' }
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        const res = await fetch(`${supabaseUrl}/functions/v1/seo-analytics`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(kind ? { tenant_id: tenantId, kind } : { tenant_id: tenantId }),
        })
        const body = await res.json().catch(() => null)
        if (res.status === 429 || body?.rate_limited) {
          return { ok: false, reason: 'rate_limited', nextAllowedAt: body?.retry_after ?? null }
        }
        if (!res.ok || body?.status === 'error') {
          return {
            ok: false,
            reason: 'error',
            message: body?.error || body?.message || `HTTP ${res.status}`,
          }
        }
        const runIds: string[] = Array.isArray(body?.runs)
          ? body.runs.map((r: { id?: string }) => r?.id).filter((id: unknown): id is string => !!id)
          : []
        await refetch()
        return { ok: true, runIds }
      } catch (err) {
        return { ok: false, reason: 'error', message: (err as Error).message }
      } finally {
        setRunning(false)
      }
    },
    [tenantId, refetch],
  )

  useEffect(() => { refetch() }, [refetch])

  return {
    rankings: buildKind('rankings'),
    competitors: buildKind('competitors'),
    opportunities: buildKind('opportunities'),
    runNow,
    refetch,
    // `running` mirrors useZernioRuns' exposure — the tile disables the
    // Run Now button while a run is in flight. (Superset of the spec shape.)
    running,
    fetchError,
  }
}
