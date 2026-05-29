import { supabase } from './supabase'
import { tierInfo } from './tierInfo'

// s247 — fire the notify-upgrade edge function as a real sales signal when a
// tenant requests a higher tier from an in-UI upgrade prompt. Payload matches
// the proven BillingTab caller (tenant_id/old_tier/new_tier/plan_name/
// monthly_price) PLUS an OPTIONAL `feature` field for sales context
// ("which feature did they want"). The edge fn ignores `feature` until its
// contract is extended (gated change), so this is backward-safe either way.
export async function requestUpgrade(
  tenantId: string,
  currentTier: number,
  targetTier: number,
  feature?: string,
): Promise<void> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Session expired — please log in again.')

  const t = tierInfo(targetTier)
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-upgrade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      tenant_id: tenantId,
      old_tier: currentTier,
      new_tier: t.tier,
      plan_name: t.name,
      monthly_price: t.price,
      ...(feature ? { feature } : {}),
    }),
  })
  if (!res.ok) throw new Error('Could not send upgrade request.')
}
