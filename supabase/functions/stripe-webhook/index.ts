// Edge Function: stripe-webhook
// Handles Stripe webhook events: checkout.session.completed, invoice.payment_succeeded,
// customer.subscription.deleted.
// On checkout.session.completed: marks payment paid, then calls provision-tenant.

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  // Always return 200 to Stripe (even on errors) to prevent infinite retries
  const ok = () => new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
  const reject = (msg: string) => new Response(msg, { status: 400 })

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured — rejecting all webhook calls')
    return reject('Webhook secret not configured')
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    console.error('STRIPE_SECRET_KEY not configured')
    return ok()
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) return reject('Missing stripe-signature header')

  const body = await req.text()
  let event: Stripe.Event

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' as any })
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return reject(`Webhook Error: ${err.message}`)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  )

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // Fetch payment row — only process if status is 'pending' (idempotency)
      const { data: payment } = await supabase
        .from('stripe_payments')
        .select('id, status, provision_data')
        .eq('stripe_session_id', session.id)
        .maybeSingle()

      if (!payment) {
        console.warn(`No stripe_payments row found for session ${session.id}`)
        return ok()
      }

      if (payment.status !== 'pending') {
        console.log(`Session ${session.id} already processed — skipping`)
        return ok()
      }

      // Mark as paid
      await supabase
        .from('stripe_payments')
        .update({
          status: 'paid',
          stripe_subscription_id: session.subscription as string | null,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_session_id', session.id)

      console.log(`Payment paid for session ${session.id}`)

      // Call provision-tenant with full form data
      const meta = session.metadata || {}
      const pd: Record<string, any> = payment.provision_data || {}

      const provisionBody = {
        tenant_id: meta.tenant_id || pd.tenant_id || undefined,
        slug: meta.slug || pd.slug,
        admin_email: meta.client_email || pd.email,
        admin_password: pd.admin_password,
        business_info: pd.business_info || {
          name: pd.biz_name || '', phone: pd.phone || '',
          email: meta.client_email || '', address: '', tagline: '', industry: 'Pest Control',
        },
        branding: pd.branding || { logo_url: '', primary_color: '#10b981', template: 'modern-pro' },
        social_links: pd.social_links || { facebook: '', instagram: '', google: '', youtube: '' },
        integrations: pd.integrations || { google_place_id: '', ga4_id: '' },
        plan: pd.plan || 'starter',
        subscription: pd.subscription || { tier: 1, plan_name: 'Starter', monthly_price: 99 },
      }

      if (!provisionBody.slug) {
        console.error('Cannot provision — no slug in payment or metadata')
        return ok()
      }

      const provisionResp = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/provision-tenant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify(provisionBody),
        }
      )

      const provisionData = await provisionResp.json()
      if (provisionData.success) {
        console.log(`Tenant provisioned: ${provisionData.slug} (${provisionData.tenant_id})`)
      } else {
        console.error('provision-tenant failed:', JSON.stringify(provisionData))
      }

    } else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.subscription) {
        await supabase
          .from('stripe_payments')
          .update({ updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', invoice.subscription as string)
        console.log(`Recurring payment received for subscription ${invoice.subscription}`)
      }

    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      await supabase
        .from('stripe_payments')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', subscription.id)
      // Do NOT auto-delete tenant — Scott handles manually
      console.log(`Subscription cancelled: ${subscription.id}`)
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err.message)
    // Return 200 anyway — Stripe should not retry for app logic errors
  }

  return ok()
})
