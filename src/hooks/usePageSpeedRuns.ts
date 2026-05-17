import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type PageSpeedRun = {
  id: string
  tenant_id: string
  url: string
  status: 'success' | 'error'
  desktop_performance: number | null
  desktop_seo: number | null
  desktop_accessibility: number | null
  desktop_best_practices: number | null
  mobile_performance: number | null
  mobile_seo: number | null
  mobile_accessibility: number | null
  mobile_best_practices: number | null
  api_error_code: string | null
  api_error_msg: string | null
  ran_at: string
}

export function usePageSpeedRuns(tenantId: string | undefined) {
  const [latestRun, setLatestRun] = useState<PageSpeedRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLatest = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    // RLS scopes rows to the caller's tenant; explicit filter is defense-in-depth.
    const { data, error: fetchErr } = await supabase
      .from('pagespeed_runs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('ran_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (fetchErr) {
      setError(fetchErr.message)
    } else {
      setLatestRun((data as PageSpeedRun | null) ?? null)
      setError(null)
    }
    setLoading(false)
  }, [tenantId])

  const runCheck = useCallback(async (url: string) => {
    if (!tenantId) { setError('No tenant'); return }
    setRunning(true)
    setError(null)
    try {
      // refreshSession (not getSession) — avoids stale/expired access tokens.
      const { data: { session } } = await supabase.auth.refreshSession()
      if (!session) throw new Error('Not authenticated')
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const res = await fetch(`${supabaseUrl}/functions/v1/pagespeed-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, tenant_id: tenantId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`)
      }
      if (data?.status === 'error') {
        setError(data.message || 'PageSpeed check failed')
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
