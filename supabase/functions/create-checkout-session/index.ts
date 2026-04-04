// Edge Function: create-checkout-session v2
// Creates a Stripe Checkout Session with a subscription + pending invoice item for setup fee.
// The pending invoice item is bundled automatically into the first subscription invoice by Stripe.
// Stores provision_data in stripe_payments so the webhook can call provision-tenant after payment.

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Price ID map — read from edge function env (set via supabase secrets set)
const SETUP_PRICE_MAP: Record<string, string> = {
  standard: Deno.env.get('STRIPE_PRICE_STANDARD_SETUP') || '',
  custom:   Deno.env.get('STRIPE_PRICE_CUSTOM_MIGRATION') || '',
  premium:  Deno.env.get('STRIPE_PRICE_PREMIUM_MIGRATION') || '',
}
const PLAN_PRICE_MAP: Record<string, string> = {
  starter: Deno.env.get('STRIPE_PRICE_STARTER') || '',
  grow:    Deno.env.get('STRIPE_PRICE_GROW') || '',
  pro:     Deno.env.get('STRIPE_PRICE_PRO') || '',
  elite:   Deno.env.get('STRIPE_PRICE_ELITE') || '',
}

interface RequestBody {
  tenant_id: string
  client_email: string
  client_name: string
  package_type: 'standard' | 'custom' | 'premium'
  setup_amount_override?: number  // in cents — only when custom price passkey used
  plan: 'starter' | 'grow' | 'pro' | 'elite'
  slug: string
  provision_data: Record<string, unknown>
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

  try {
    const body: RequestBody = await req.json()
    const { tenant_id, client_email, client_name, package_type, setup_amount_override, plan, slug, provision_data } = body

    if (!client_email || !slug) return json({ error: 'client_email and slug are required' }, 400)
    if (!package_type) return json({ error: 'package_type is required (standard | custom | premium)' }, 400)
    if (!plan) return json({ error: 'plan is required (starter | grow | pro | elite)' }, 400)

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return json({ error: 'STRIPE_SECRET_KEY not configured' }, 500)

    // Resolve price IDs from server-side env — never trust frontend for price IDs
    const setupPriceId = SETUP_PRICE_MAP[package_type]
    const subscriptionPriceId = PLAN_PRICE_MAP[plan]

    if (!subscriptionPriceId) return json({ error: `Subscription price ID not configured for plan: ${plan}` }, 500)
    if (!setup_amount_override && !setupPriceId) return json({ error: `Setup price ID not configured for package: ${package_type}` }, 500)

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' as any })

    // Create or retrieve Stripe customer by email
    const existing = await stripe.customers.list({ email: client_email, limit: 1 })
    const customer = existing.data.length > 0
      ? existing.data[0]
      : await stripe.customers.create({ email: client_email, name: client_name || client_email })

    console.log(`Customer: ${customer.id} (${client_email})`)

    // Step 1: Create pending invoice item for setup fee
    // Stripe will automatically include this in the first subscription invoice.
    if (setup_amount_override && setup_amount_override > 0) {
      // Custom price — use price_data so it appears descriptively on the invoice
      const item = await stripe.invoiceItems.create({
        customer: customer.id,
        price_data: {
          currency: 'usd',
          unit_amount: setup_amount_override,
          product_data: { name: 'Setup Fee (Custom)' },
        },
      })
      console.log(`Created invoice item (custom override): ${item.id} — $${setup_amount_override / 100}`)
    } else {
      // Standard price — use price ID directly
      const item = await stripe.invoiceItems.create({
        customer: customer.id,
        price: setupPriceId,
      })
      console.log(`Created invoice item (price): ${item.id} — price ${setupPriceId}`)
    }

    // Step 2: Create Checkout Session in subscription mode
    // The pending invoice item above is automatically bundled into the first invoice.
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      line_items: [{ price: subscriptionPriceId, quantity: 1 }],
      success_url: `https://${slug}.pestflowpro.com/payment-success`,
      cancel_url: `https://pestflowpro.com/admin?payment=cancelled`,
      metadata: { tenant_id: tenant_id || '', slug, client_email },
    })

    console.log(`Checkout session created: ${session.id}`)

    // Store payment record with provision_data for webhook use
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )
    const { error: insertError } = await supabase.from('stripe_payments').insert({
      tenant_id: tenant_id || null,
      stripe_customer_id: customer.id,
      stripe_session_id: session.id,
      setup_price_id: setup_amount_override ? null : setupPriceId,
      subscription_price_id: subscriptionPriceId,
      setup_amount: setup_amount_override || null,
      status: 'pending',
      payment_type: 'setup_plus_subscription',
      provision_data: provision_data || null,
    })
    if (insertError) console.error('stripe_payments insert error:', insertError.message)

    return json({ url: session.url, session_id: session.id })
  } catch (err: any) {
    console.error('create-checkout-session error:', err)
    return json({ error: err.message || 'Internal server error' }, 500)
  }
})
