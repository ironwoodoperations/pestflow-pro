import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type GscData = {
  total_clicks:      number | null
  total_impressions: number | null
  avg_ctr:           number | null
  avg_position:      number | null
  top_queries:       Array<{ query: string; clicks: number; impressions: number; position: number }>
}

export type GscRun = {
  id:            string
  tenant_id:     string
  status:        'success' | 'error' | 'unconfigured'
  data:          GscData | null
  data_raw:      unknown
  api_error_code: string | null
  api_error_msg:  string | null
  ran_at:        string
}

export function useGscRuns(tenantId: string | undefined) {
  const [latestRun, setLatestRun] = useState<GscRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLatest = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const { data, error: fetchErr } = await supabase
      .from('gsc_runs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('ran_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (fetchErr) {
      setError(fetchErr.message)
    } else {
      setLatestRun((data as GscRun | null) ?? null)
      setError(null)
    }
    setLoading(false)
  }, [tenantId])

  const runCheck = useCallback(async () => {
    if (!tenantId) { setError('No tenant'); return }
    setRunning(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.refreshSession()
      if (!session) throw new Error('Not authenticated')
      const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const res = await fetch(`${supabaseUrl}/functions/v1/gsc-analytics`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenant_id: tenantId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`)
      }
      if (data?.status === 'error') {
        setError(data.message || 'GSC analytics check failed')
      }
      await fetchLatest()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setRunning(false)
    }
  }, [tenantId, fetchLatest])

  useEffect(() => { fetchLatest() }, [fetchLatest])

  return { latestRun, loading, running, error, runCheck, refetch: fetchLatest }
}
