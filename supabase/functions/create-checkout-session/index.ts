// Edge Function: create-checkout-session v15
// mode: 'subscription' with initial_invoice_items for setup fee.
// Setup fee appears as a visible line item on the first invoice.
// Recurring price IDs (price_1TIZ6D..., etc.) work correctly in subscription mode.

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PLAN_PRICE_MAP: Record<string, string> = {
  starter: 'price_1TIZ6DCZBM0TUusSaC2UdcYG',
  grow:    'price_1TIrvGCZBM0TUusSNBntvS6l',
  pro:     'price_1TIrvcCZBM0TUusS4BJt8oQi',
  elite:   'price_1TIrw3CZBM0TUusSomA1hsT4',
}

interface RequestBody {
  tenant_id?: string
  client_email: string
  client_name?: string
  package_type?: string
  setup_amount_override?: number  // in cents
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
    const { tenant_id, client_email, client_name, setup_amount_override,
            plan, slug, prospect_id, onboarding_session_id, provision_data } = body

    if (!client_email || !slug) return json({ error: 'client_email and slug are required' }, 400)
    if (!plan) return json({ error: 'plan is required (starter | grow | pro | elite)' }, 400)

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return json({ error: 'STRIPE_SECRET_KEY not configured' }, 500)

    const recurringPriceId = PLAN_PRICE_MAP[plan.toLowerCase()]
    if (!recurringPriceId) return json({ error: `Price ID not configured for plan: ${plan}` }, 500)

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' as any })

    // Create or retrieve Stripe customer
    const existing = await stripe.customers.list({ email: client_email, limit: 1 })
    const customer = existing.data.length > 0
      ? existing.data[0]
      : await stripe.customers.create({ email: client_email, name: client_name || client_email })

    console.log(`Customer: ${customer.id} (${client_email})`)

    const setupFeeCents = setup_amount_override ?? 0

    // Build subscription_data — only include initial_invoice_items when fee > 0
    // (empty array causes Stripe validation error)
    const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
      metadata: {
        prospect_id:           prospect_id           || '',
        tenant_id:             tenant_id             || '',
        slug,
        onboarding_session_id: onboarding_session_id || '',
      },
      ...(setupFeeCents > 0 ? {
        invoice_settings: {
          initial_invoice_items: [{
            price_data: {
              currency: 'usd' as const,
              product_data: { name: 'One-Time Setup Fee' },
              unit_amount: setupFeeCents,
            },
          }],
        },
      } : {}),
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
        setup_fee_amount:      String(setupFeeCents),
        onboarding_session_id: onboarding_session_id || '',
      },
      success_url: 'https://pestflowpro.com/ironwood?payment=success',
      cancel_url:  'https://pestflowpro.com/ironwood?payment=cancelled',
    })

    console.log(`Checkout session created: ${session.id}`)

    // Store payment record
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )
    await supabase.from('stripe_payments').insert({
      tenant_id:             tenant_id || null,
      stripe_customer_id:    customer.id,
      stripe_session_id:     session.id,
      subscription_price_id: recurringPriceId,
      setup_amount:          setupFeeCents || null,
      status:                'pending',
      payment_type:          'setup_plus_subscription',
      provision_data:        provision_data || null,
    })

    return json({ url: session.url, session_id: session.id })
  } catch (err: any) {
    console.error('create-checkout-session error:', err)
    return json({ error: err.message || 'Internal server error' }, 500)
  }
})
