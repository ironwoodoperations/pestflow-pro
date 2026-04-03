import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'

const TIER_MAP: Record<number, { plan_name: string; monthly_price: number }> = {
  1: { plan_name: 'Starter', monthly_price: 149 },
  2: { plan_name: 'Grow', monthly_price: 249 },
  3: { plan_name: 'Pro', monthly_price: 349 },
  4: { plan_name: 'Elite', monthly_price: 499 },
}

export function usePlan() {
  const { tenantId } = useTenant()
  const [tier, setTierState] = useState(1)
  const [loading, setLoading] = useState(true)

  const refreshPlan = useCallback(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'subscription').maybeSingle()
      .then(({ data }) => {
        if (data?.value?.tier) setTierState(data.value.tier)
        setLoading(false)
      })
  }, [tenantId])

  useEffect(() => {
    refreshPlan()
  }, [refreshPlan])

  const canAccess = (minTier: number) => tier >= minTier

  const setTier = async (newTier: number) => {
    const meta = TIER_MAP[newTier] || TIER_MAP[1]
    await supabase.from('settings').upsert(
      { tenant_id: tenantId, key: 'subscription', value: { tier: newTier, ...meta } },
      { onConflict: 'tenant_id,key' }
    )
    refreshPlan()
  }

  return { tier, canAccess, setTier, loading, refreshPlan }
}
