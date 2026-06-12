import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantBootProvider'

interface PlanContextValue {
  tier: number
  loading: boolean
  canAccess: (minTier: number) => boolean
  setTier: (newTier: number) => void
  refreshPlan: () => void
}

const PlanContext = createContext<PlanContextValue>({
  tier: 1,
  loading: true,
  canAccess: () => false,
  setTier: () => {},
  refreshPlan: () => {},
})

export function PlanProvider({ children }: { children: ReactNode }) {
  const { id: tenantId } = useTenant()
  const [tier, setTierState] = useState(1)
  const [loading, setLoading] = useState(true)

  // S262 — read the canonical access entitlement straight off tenants.entitlement
  // (smallint 1–4): the SINGLE source of truth, written only by operator action /
  // provisioning (enforced by tenants RLS). The old settings.subscription
  // string→number coercion ('elite'→4, 'pro'→3, …) is GONE — there is no string
  // tier to coerce anymore, which kills the client-vs-edge drift that let
  // string-"elite" pass on the client but fail-closed on the edge.
  //
  // This read is COSMETIC (dashboard show/hide). Real enforcement is server-side:
  // every gated action re-checks via the check_tenant_access RPC in the edge
  // functions, so a tampered client value cannot unlock a gated feature.
  const refreshPlan = useCallback(() => {
    if (!tenantId) return
    supabase
      .from('tenants')
      .select('entitlement')
      .eq('id', tenantId)
      .maybeSingle()
      .then(({ data }) => {
        const e = (data as { entitlement?: unknown } | null)?.entitlement
        // Fail-restrictive: anything unreadable/absent → Starter (cosmetic only).
        setTierState(typeof e === 'number' && e >= 1 && e <= 4 ? e : 1)
        setLoading(false)
      })
  }, [tenantId])

  useEffect(() => { refreshPlan() }, [refreshPlan])

  const canAccess = (minTier: number) => tier >= minTier

  // S262 — DEMO/PREVIEW ONLY. Entitlement is NOT client-writable (tenants RLS lets
  // only the Ironwood operator context write it). This sets LOCAL state so the
  // operator can preview the dashboard at a given tier during a sales demo; it does
  // NOT persist and does NOT change real entitlement or server-side gating.
  const setTier = (newTier: number) => {
    setTierState(newTier >= 1 && newTier <= 4 ? newTier : 1)
  }

  return (
    <PlanContext.Provider value={{ tier, loading, canAccess, setTier, refreshPlan }}>
      {children}
    </PlanContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlan() {
  return useContext(PlanContext)
}
