import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type ZernioPlatformStats = {
  followers?: number | null
  engagement?: number | null
  reach?: number | null
}

export type ZernioRun = {
  id: string
  tenant_id: string
  status: 'success' | 'error' | 'unconfigured'
  data: Record<string, ZernioPlatformStats> | null
  data_raw: unknown
  api_error_code: string | null
  api_error_msg: string | null
  ran_at: string
}

export function useZernioRuns(tenantId: string | undefined) {
  const [latestRun, setLatestRun] = useState<ZernioRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLatest = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    // RLS scopes rows to the caller's tenant; explicit filter is defense-in-depth.
    const { data, error: fetchErr } = await supabase
      .from('zernio_runs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('ran_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (fetchErr) {
      setError(fetchErr.message)
    } else {
      setLatestRun((data as ZernioRun | null) ?? null)
      setError(null)
    }
    setLoading(false)
  }, [tenantId])

  const runCheck = useCallback(async () => {
    if (!tenantId) { setError('No tenant'); return }
    setRunning(true)
    setError(null)
    try {
      // refreshSession (not getSession) — avoids stale/expired access tokens.
      const { data: { session } } = await supabase.auth.refreshSession()
      if (!session) throw new Error('Not authenticated')
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const res = await fetch(`${supabaseUrl}/functions/v1/zernio-analytics`, {
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
        setError(data.message || 'Social analytics check failed')
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
