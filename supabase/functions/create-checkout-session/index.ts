// Edge Function: create-checkout-session
// Creates a Stripe Checkout Session with a subscription + pending invoice item for setup fee.
// Stores provision_data in stripe_payments so the webhook can call provision-tenant after payment.

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  tenant_id: string
  client_email: string
  client_name: string
  setup_price_id: string
  setup_amount_override?: number  // in cents — only when custom price
  subscription_price_id: string
  slug: string
  provision_data: Record<string, unknown>  // full form data for post-payment provisioning
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

  try {
    const body: RequestBody = await req.json()
    const { tenant_id, client_email, client_name, setup_price_id, setup_amount_override, subscription_price_id, slug, provision_data } = body

    if (!client_email || !subscription_price_id || !slug) {
      return json({ error: 'client_email, subscription_price_id, and slug are required' }, 400)
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return json({ error: 'STRIPE_SECRET_KEY not configured' }, 500)

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' as any })

    // Create or retrieve Stripe customer by email
    const existing = await stripe.customers.list({ email: client_email, limit: 1 })
    const customer = existing.data.length > 0
      ? existing.data[0]
      : await stripe.customers.create({ email: client_email, name: client_name || client_email })

    // Create pending invoice item for setup fee (included in first subscription invoice)
    if (setup_amount_override && setup_amount_override > 0) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        amount: setup_amount_override,
        currency: 'usd',
        description: 'Custom Setup Fee',
      })
    } else if (setup_price_id) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        price: setup_price_id,
      })
    }

    // Create Checkout Session — subscription mode; setup fee is on first invoice
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      line_items: [{ price: subscription_price_id, quantity: 1 }],
      success_url: `https://${slug}.pestflowpro.com/admin/login?payment=success`,
      cancel_url: `https://pestflowpro.com/admin?payment=cancelled`,
      metadata: { tenant_id: tenant_id || '', slug, client_email },
    })

    // Store payment record with full provision_data for webhook use
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )
    await supabase.from('stripe_payments').insert({
      tenant_id: tenant_id || null,
      stripe_customer_id: customer.id,
      stripe_session_id: session.id,
      setup_price_id: setup_amount_override ? null : (setup_price_id || null),
      subscription_price_id,
      setup_amount: setup_amount_override || null,
      status: 'pending',
      payment_type: 'setup_plus_subscription',
      provision_data: provision_data || null,
    })

    return json({ url: session.url, session_id: session.id })
  } catch (err: any) {
    console.error('create-checkout-session error:', err)
    return json({ error: err.message || 'Internal server error' }, 500)
  }
})
