// Edge Function: stripe-webhook v42
// Handles Stripe webhook events: checkout.session.completed, invoice.payment_succeeded,
// customer.subscription.deleted.
// On checkout.session.completed: marks payment paid, then calls provision-tenant.
//
// Outbound calls:
//   - provision-tenant     : x-pfp-internal-key + Authorization Bearer service-role [unchanged]
//   - send-onboarding-email: apikey: SEND_ONBOARDING_EMAIL_INTERNAL_SECRET [v42: swapped
//                            from Authorization Bearer service-role; matches new C3 gate
//                            on send-onboarding-email v36+]

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  const ok = () => new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
  const reject = (msg: string) => new Response(msg, { status: 400 })

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured — rejecting all webhook calls')
    return reject('Webhook secret not configured')
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) { console.error('STRIPE_SECRET_KEY not configured'); return ok() }

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

  const supabaseUrl    = Deno.env.get('SUPABASE_URL') || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      const { data: payment } = await supabase
        .from('stripe_payments').select('id, status, provision_data')
        .eq('stripe_session_id', session.id).maybeSingle()

      if (!payment) {
        console.warn(`No stripe_payments row found for session ${session.id}`)
        return ok()
      }
      if (payment.status !== 'pending') {
        console.log(`Session ${session.id} already processed — skipping`)
        return ok()
      }

      await supabase.from('stripe_payments').update({
        status: 'paid',
        stripe_subscription_id: session.subscription as string | null,
        updated_at: new Date().toISOString(),
      }).eq('stripe_session_id', session.id)

      console.log(`Payment paid for session ${session.id}`)

      const meta = session.metadata || {}
      const pd: Record<string, any> = payment.provision_data || {}

      const provisionBody = {
        tenant_id:             meta.tenant_id || pd.tenant_id || undefined,
        slug:                  meta.slug || pd.slug,
        admin_email:           meta.client_email || pd.email,
        admin_password:        pd.admin_password,
        onboarding_session_id: meta.onboarding_session_id || undefined,
        business_info: pd.business_info || {
          name: pd.biz_name || '', phone: pd.phone || '',
          email: meta.client_email || '', address: '', tagline: '', industry: 'Pest Control',
        },
        branding:     pd.branding     || { logo_url: '', primary_color: '#10b981', template: 'modern-pro' },
        social_links: pd.social_links || { facebook: '', instagram: '', google: '', youtube: '' },
        integrations: pd.integrations || { google_place_id: '', ga4_id: '' },
        plan:         pd.plan         || 'starter',
        subscription: pd.subscription || { tier: 1, plan_name: 'Starter', monthly_price: 149 },
      }

      if (!provisionBody.slug) {
        console.error('[stripe-webhook] FATAL: no slug in metadata or provision_data — returning 500 so Stripe retries')
        return new Response('Missing slug', { status: 500 })
      }

      const provisionResp = await fetch(`${supabaseUrl}/functions/v1/provision-tenant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'x-pfp-internal-key': Deno.env.get('PROVISION_TENANT_INTERNAL_SECRET') ?? '',
        },
        body: JSON.stringify(provisionBody),
      })
      const provisionData = await provisionResp.json()

      if (provisionData.success) {
        console.log(`Tenant provisioned: ${provisionData.slug} (${provisionData.tenant_id})`)

        const clientEmail = meta.client_email || pd.email
        const companyName = pd.business_info?.name || pd.biz_name || clientEmail
        const slug = provisionData.slug || meta.slug || pd.slug

        if (clientEmail && pd.admin_password) {
          // v42: swapped from Authorization Bearer service-role → apikey C3 gate
          fetch(`${supabaseUrl}/functions/v1/send-onboarding-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': Deno.env.get('SEND_ONBOARDING_EMAIL_INTERNAL_SECRET') ?? '',
            },
            body: JSON.stringify({ to: clientEmail, company_name: companyName, live_url: `https://${slug}.pestflowpro.ai`, admin_url: `https://${slug}.pestflowpro.ai/admin/login`, admin_email: clientEmail, admin_password: pd.admin_password }),
          }).catch(e => console.error('send-onboarding-email failed:', e.message))
        }

        try {
          const prospectEmail = session.customer_details?.email || (session as any).customer_email || clientEmail || ''
          const prospectId = session.metadata?.prospect_id
          const { data: prospect } = await supabase
            .from('prospects').select('id, company_name, slug')
            .or(prospectId ? `id.eq.${prospectId}` : `email.eq.${prospectEmail}`)
            .maybeSingle()
          if (prospect) {
            await supabase.from('prospects').update({ pipeline_stage: 'paid', payment_confirmed_at: new Date().toISOString() }).eq('id', prospect.id)
          }
        } catch (e: any) { console.error('[stripe-webhook] post-provision actions failed:', e.message) }

      } else {
        console.error('provision-tenant failed:', JSON.stringify(provisionData))
      }

    } else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.subscription) {
        await supabase.from('stripe_payments').update({ updated_at: new Date().toISOString() }).eq('stripe_subscription_id', invoice.subscription as string)
        console.log(`Recurring payment received for subscription ${invoice.subscription}`)
      }

    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      await supabase.from('stripe_payments').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('stripe_subscription_id', subscription.id)
      console.log(`Subscription cancelled: ${subscription.id}`)

    } else if (event.type === 'customer.subscription.updated') {
      // S262 — webhook SEVERED from the gate path. This block NO LONGER writes
      // settings.subscription (tier/plan_name/monthly_price). Access entitlement
      // lives in tenants.entitlement and changes ONLY by deliberate operator action
      // / provisioning — NEVER derived from the Stripe price.
      //
      // WHY: intentional entitlement≠price divergence is a PERMANENT business rule.
      // Dang is the canonical case (Elite entitlement, Starter price $149). Before
      // severance, a customer.subscription.updated for Dang would resolve his stored
      // price_1TNP7E2…(Starter) → tier 1 and silently downgrade him out of Elite.
      // Re-coupling entitlement to Stripe price in any future change requires an
      // explicit decision (see view: entitlement_price_reconciliation).
      //
      // We STILL maintain BILLING-ONLY state (stripe_billing.current_price_id) that
      // NOTHING gates on, for invoice/billing tracking + the reconciliation report.

      const TIER_PRICE: Record<number, string> = {
        1: 'price_1TNP7E2SfqMqfaLwlydZQM5u', 2: 'price_1TNP7A2SfqMqfaLwxVVdp6rf',
        3: 'price_1TNP762SfqMqfaLwhC7MTvIm', 4: 'price_1TNP722SfqMqfaLwu8vH6hre',
      }
      const KNOWN_PRICES = new Set(Object.values(TIER_PRICE))

      // event.id idempotency (at-least-once delivery)
      const { data: seen } = await supabase
        .from('processed_webhook_events').select('event_id').eq('event_id', event.id).maybeSingle()
      if (seen) { console.log(`[sub.updated] event ${event.id} already processed`); return ok() }

      const evtSub = event.data.object as Stripe.Subscription

      // fetch FRESH from Stripe (ordering/retry safety)
      let sub: Stripe.Subscription
      try {
        const stripeClient = new Stripe(stripeKey, { apiVersion: '2023-10-16' as any })
        sub = await stripeClient.subscriptions.retrieve(evtSub.id)
      } catch (e: any) {
        console.error('[sub.updated] subscription retrieve failed (transient):', e.message)
        return new Response('retrieve failed', { status: 500 })
      }

      if (sub.status !== 'active') { console.log(`[sub.updated] status=${sub.status} — skip`); return ok() }

      const tierItem = sub.items.data.find(it => KNOWN_PRICES.has(it.price.id))
      if (!tierItem) { console.warn(`[sub.updated] no known managed price on ${sub.id} — skip`); return ok() }

      // resolve tenant by STORED stripe_customer_id (no email)
      const { data: rows, error: rowsErr } = await supabase
        .from('settings').select('tenant_id, value').eq('key', 'stripe_billing')
      if (rowsErr) { console.error('[sub.updated] settings read failed (transient):', rowsErr.message); return new Response('db error', { status: 500 }) }
      const match = (rows || []).find((r: any) => r.value?.customer_id === sub.customer)
      const tenantId = match?.tenant_id || null
      if (!tenantId) { console.warn(`[sub.updated] no tenant for customer ${sub.customer} — skip`); return ok() }

      // BILLING-ONLY: keep stripe_billing.current_price_id in sync. This is NOT a
      // gate input — entitlement is untouched. (best-effort, non-fatal)
      const newVal = { ...(match.value || {}), current_price_id: tierItem.price.id }
      const { error: billErr } = await supabase.from('settings').update({ value: newVal }).eq('tenant_id', tenantId).eq('key', 'stripe_billing')
      if (billErr) { console.error('[sub.updated] stripe_billing write failed (transient):', billErr.message); return new Response('db error', { status: 500 }) }
      console.log(`[sub.updated] tenant ${tenantId} billing price → ${tierItem.price.id} (entitlement UNCHANGED — gate severed)`)

      // mark event processed LAST
      await supabase.from('processed_webhook_events').insert({ event_id: event.id, event_type: event.type })
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err.message)
  }

  return ok()
})
