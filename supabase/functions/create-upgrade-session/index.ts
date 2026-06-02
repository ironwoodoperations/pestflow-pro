// Edge Function: create-upgrade-session v1 (S251)
// Self-serve UPGRADE only. Opens a Stripe Billing Portal subscription_update_confirm
// flow that swaps the active subscription to a higher recurring price with proration.
// Resolution by STORED Stripe IDs (settings.stripe_billing), NOT email. Stripe price is
// the source of current-tier truth, NOT the app's settings.subscription.tier.

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { requireTenantAdmin, AuthError } from '../_shared/auth/requireTenantUser.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// tier -> live recurring price (confirmed live-mode, S251). MUST stay in sync with webhook.
const TIER_PRICE: Record<number, string> = {
  1: 'price_1TNP7E2SfqMqfaLwlydZQM5u', // Starter $149
  2: 'price_1TNP7A2SfqMqfaLwxVVdp6rf', // Growth  $249
  3: 'price_1TNP762SfqMqfaLwhC7MTvIm', // Pro     $349
  4: 'price_1TNP722SfqMqfaLwu8vH6hre', // Elite   $499
}
const PRICE_TIER: Record<string, number> =
  Object.fromEntries(Object.entries(TIER_PRICE).map(([t, p]) => [p, Number(t)]))
const KNOWN_PRICES = new Set(Object.values(TIER_PRICE))
const TIER_NAME: Record<number, string> = { 1: 'Starter', 2: 'Growth', 3: 'Pro', 4: 'Elite' }

const RETURN_URL = 'https://pestflowpro.ai/admin/billing'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } })

  try {
    const { tenant_id, target_tier } = await req.json() as { tenant_id?: string; target_tier?: number }
    if (!tenant_id || !target_tier) return json({ error: 'tenant_id and target_tier required' }, 400)
    if (!TIER_PRICE[target_tier]) return json({ error: 'Invalid target_tier (1-4)' }, 400)

    // AUTH — caller must be THIS tenant's admin (JWT + ownership + admin role)
    await requireTenantAdmin(req, tenant_id)

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return json({ error: 'Billing not configured' }, 500)
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' as any })
    const svc = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '')

    // Resolve Stripe IDs from STORED stripe_billing key (no email lookup)
    const { data: billingRow } = await svc
      .from('settings').select('value').eq('tenant_id', tenant_id).eq('key', 'stripe_billing').maybeSingle()
    const billing = billingRow?.value as { customer_id?: string; subscription_id?: string } | null
    if (!billing?.subscription_id)
      return json({ error: 'No managed subscription on file. Contact us to change your plan.' }, 409)

    // Fetch the subscription fresh from Stripe (truth) and verify ownership
    let sub: Stripe.Subscription
    try {
      sub = await stripe.subscriptions.retrieve(billing.subscription_id)
    } catch {
      return json({ error: 'Could not retrieve your subscription. Contact us.' }, 409)
    }
    if (billing.customer_id && sub.customer !== billing.customer_id)
      return json({ error: 'Billing record mismatch. Contact us.' }, 409)
    if (sub.status !== 'active')
      return json({ error: 'Your subscription is not active. Contact us.' }, 409)

    // Find OUR managed tier item via .find against known prices — never items.data[0]
    const managedItems = sub.items.data.filter(it => KNOWN_PRICES.has(it.price.id))
    if (managedItems.length === 0)
      return json({ error: 'Your plan is managed manually. Contact us to change it.' }, 409)
    if (managedItems.length > 1)
      return json({ error: 'Your plan is managed manually. Contact us to change it.' }, 409)
    const tierItem = managedItems[0]

    const currentTier = PRICE_TIER[tierItem.price.id]

    // UPGRADE-ONLY GUARD
    if (target_tier <= currentTier)
      return json({
        error: `Self-serve changes are upgrades only. You're on ${TIER_NAME[currentTier]}. To downgrade, contact us.`,
      }, 422)

    // Open Billing Portal confirm flow. Preserve existing quantity (don't hardcode 1).
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.customer as string,
      return_url: RETURN_URL,
      flow_data: {
        type: 'subscription_update_confirm',
        subscription_update_confirm: {
          subscription: sub.id,
          items: [{ id: tierItem.id, price: TIER_PRICE[target_tier], quantity: tierItem.quantity ?? 1 }],
        },
        after_completion: { type: 'redirect', redirect: { return_url: RETURN_URL } },
      },
    })

    return json({ url: portal.url })
  } catch (err: any) {
    if (err instanceof AuthError) return err.toResponse()
    console.error('create-upgrade-session error:', err?.message)
    return json({ error: 'Internal server error' }, 500)
  }
})
