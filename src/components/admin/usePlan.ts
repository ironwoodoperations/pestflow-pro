import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'

export function usePlan() {
  const { tenantId } = useTenant()
  const [tier, setTier] = useState(1)

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'subscription').maybeSingle()
      .then(({ data }) => {
        if (data?.value?.tier) setTier(data.value.tier)
      })
  }, [tenantId])

  const canAccess = (minTier: number) => tier >= minTier

  return { tier, canAccess }
}
