import { useState, useEffect } from 'react'
import { resolveTenantId } from '../lib/tenant'

export function useTenant() {
  const [tenantId, setTenantId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    resolveTenantId().then(id => {
      setTenantId(id)
      setLoading(false)
    })
  }, [])

  return { tenantId, loading }
}
