// Edge Function: stripe-webhook
// Handles Stripe webhook events: checkout.session.completed, invoice.payment_succeeded,
// customer.subscription.deleted.
// On checkout.session.completed: marks payment paid, then calls provision-tenant.

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

        // Send onboarding email with login creds (non-blocking)
        if (clientEmail && pd.admin_password) {
          fetch(`${supabaseUrl}/functions/v1/send-onboarding-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceRoleKey}` },
            body: JSON.stringify({ to: clientEmail, company_name: companyName, live_url: `https://${slug}.pestflowpro.com`, admin_url: `https://${slug}.pestflowpro.com/admin/login`, admin_email: clientEmail, admin_password: pd.admin_password }),
          }).catch(e => console.error('send-onboarding-email failed:', e.message))
        }

        // Update prospect stage + Teams ping + welcome email
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
          if (prospectEmail) await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceRoleKey}` },
            body: JSON.stringify({ to: prospectEmail, company_name: prospect?.company_name || companyName, bookings_link: 'https://outlook.office.com/book/PestFlowProOnboarding@ironwoodoperationsgroup.com/?ismsaljsauthenabled' }),
          })
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
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err.message)
  }

  return ok()
})
