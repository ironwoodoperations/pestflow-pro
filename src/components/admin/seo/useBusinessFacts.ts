import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../context/TenantBootProvider'
import { cityFromBusinessInfo } from '../../../lib/businessCity'

/**
 * S293 PR B — the tenant's own name and city, for prompts and for the AIO
 * description write.
 *
 * Both are TENANT FACTS: they are read from settings.business_info and are ''
 * when the tenant has not supplied them. A caller that gets '' must OMIT the
 * clause, never substitute — that is the whole point of returning the empty
 * string rather than a placeholder.
 *
 * The city is PARSED from the address rather than passed whole. The SEO
 * generator previously sent the entire postal address under a "City:" label,
 * which is how a PO box became a city.
 */
export function useBusinessFacts(): { businessName: string; city: string; resolved: boolean } {
  const { id: tenantId } = useTenant()
  const [facts, setFacts] = useState({ businessName: '', city: '' })
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    let cancelled = false
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        const v = (data?.value ?? {}) as { name?: unknown }
        setFacts({
          businessName: typeof v.name === 'string' ? v.name : '',
          city: cityFromBusinessInfo(data?.value),
        })
        setResolved(true)
      })
    return () => { cancelled = true }
  }, [tenantId])

  return { ...facts, resolved }
}
