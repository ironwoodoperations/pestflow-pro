// Edge Function: create-checkout-session v17
// mode: 'subscription' — recurring only.
// Setup fee is handled separately by create-setup-invoice.
// No initial_invoice_items — Stripe rejects that param in checkout sessions.

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Accepts numeric tier (1-4) or string name (starter/growth/grow/pro/elite)
const PRICE_IDS: Record<string, string> = {
  '1':       Deno.env.get('STRIPE_PRICE_SUB_STARTER') || '',
  '2':       Deno.env.get('STRIPE_PRICE_SUB_GROWTH')  || '',
  '3':       Deno.env.get('STRIPE_PRICE_SUB_PRO')     || '',
  '4':       Deno.env.get('STRIPE_PRICE_SUB_ELITE')   || '',
  'starter': Deno.env.get('STRIPE_PRICE_SUB_STARTER') || '',
  'growth':  Deno.env.get('STRIPE_PRICE_SUB_GROWTH')  || '',
  'grow':    Deno.env.get('STRIPE_PRICE_SUB_GROWTH')  || '',
  'pro':     Deno.env.get('STRIPE_PRICE_SUB_PRO')     || '',
  'elite':   Deno.env.get('STRIPE_PRICE_SUB_ELITE')   || '',
}

interface RequestBody {
  tenant_id?: string
  client_email: string
  client_name?: string
  package_type?: string
  plan: string
  slug: string
  prospect_id?: string
  onboarding_session_id?: string
  provision_data?: Record<string, unknown>
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

  try {
    const body: RequestBody = await req.json()
    const { tenant_id, client_email, client_name,
            plan, slug, prospect_id, onboarding_session_id, provision_data } = body

    if (!client_email || !slug) return json({ error: 'client_email and slug are required' }, 400)
    if (!plan) return json({ error: 'plan is required (starter | grow | pro | elite)' }, 400)

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return json({ error: 'STRIPE_SECRET_KEY not configured' }, 500)

    const planKey = String(plan).toLowerCase()
    const recurringPriceId = PRICE_IDS[planKey]
    if (!recurringPriceId) return json({ error: `Invalid tier: ${plan}. Use starter/growth/pro/elite or 1-4` }, 400)

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' as any })

    // Create or retrieve Stripe customer
    const existing = await stripe.customers.list({ email: client_email, limit: 1 })
    const customer = existing.data.length > 0
      ? existing.data[0]
      : await stripe.customers.create({ email: client_email, name: client_name || client_email })

    console.log(`Customer: ${customer.id} (${client_email})`)

    // subscription_data: recurring only — no setup fee bundled here
    const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
      metadata: {
        prospect_id:           prospect_id           || '',
        tenant_id:             tenant_id             || '',
        slug,
        onboarding_session_id: onboarding_session_id || '',
      },
    }

    const session = await stripe.checkout.sessions.create({
      customer:          customer.id,
      mode:              'subscription',
      line_items:        [{ price: recurringPriceId, quantity: 1 }],
      subscription_data: subscriptionData,
      metadata: {
        prospect_id:           prospect_id           || '',
        tenant_id:             tenant_id             || '',
        slug,
        client_email,
        onboarding_session_id: onboarding_session_id || '',
      },
      success_url: 'https://pestflowpro.com/payment-success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:  'https://pestflowpro.com/payment-cancel',
    })

    console.log(`Checkout session created: ${session.id}`)

    // Store payment record
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )
    try {
      await supabase.from('stripe_payments').insert({
        tenant_id:             tenant_id || null,
        stripe_customer_id:    customer.id,
        stripe_session_id:     session.id,
        subscription_price_id: recurringPriceId,
        status:                'pending',
        payment_type:          'setup_plus_subscription',
        provision_data:        provision_data || null,
      })
    } catch (insertErr: any) {
      console.error('stripe_payments insert failed (non-fatal):', insertErr.message)
    }

    return json({ url: session.url, session_id: session.id })
  } catch (err: any) {
    console.error('create-checkout-session error:', err?.message, err?.type, err?.code)
    return json({ error: err?.message || 'Internal server error' }, 500)
  }
})
