// Edge Function: list-checkout-sessions
// S221: Lists Stripe Checkout Sessions for the Ironwood operator Payment Links page.
// Auth: requireTenantUser + master-tenant gate (caller's tenant slug must be
// 'pestflow-pro'). Stripe client setup mirrors create-checkout-session.
//
// Deploy: supabase functions deploy list-checkout-sessions --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireTenantUser, AuthError } from '../_shared/auth/requireTenantUser.ts'

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const MASTER_TENANT_ID          = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'
const MASTER_TENANT_SLUG        = 'pestflow-pro'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    // C2-tenant-user auth, scoped to the master tenant.
    await requireTenantUser(req, MASTER_TENANT_ID)

    // Defense-in-depth: confirm the master tenant's slug is what we expect.
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: tenant } = await supabase
      .from('tenants').select('slug').eq('id', MASTER_TENANT_ID).maybeSingle()
    if (tenant?.slug !== MASTER_TENANT_SLUG) {
      return json({ error: 'Forbidden' }, 403)
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return json({ error: 'STRIPE_SECRET_KEY not configured' }, 500)
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' as any })

    const url = new URL(req.url)
    const rawLimit = parseInt(url.searchParams.get('limit') || '25', 10)
    const limit = Math.min(Math.max(Number.isNaN(rawLimit) ? 25 : rawLimit, 1), 100)
    const startingAfter = url.searchParams.get('starting_after') || undefined
    const status = url.searchParams.get('status') || undefined
    const customerEmail = (url.searchParams.get('customer_email') || '').trim().toLowerCase()

    const listParams: Record<string, unknown> = { limit }
    if (startingAfter) listParams.starting_after = startingAfter
    if (status && ['complete', 'open', 'expired'].includes(status)) listParams.status = status

    const page = await stripe.checkout.sessions.list(listParams as any)

    let sessions = page.data.map((s: any) => ({
      id: s.id,
      customer_email: s.customer_details?.email || s.customer_email || null,
      amount_total: s.amount_total ?? 0,
      currency: s.currency || 'usd',
      status: s.status || 'unknown',
      payment_status: s.payment_status || 'unknown',
      created: s.created,
      metadata: s.metadata || {},
    }))

    // Stripe's list endpoint has no email filter — filter the returned page.
    if (customerEmail) {
      sessions = sessions.filter((s) =>
        (s.customer_email || '').toLowerCase().includes(customerEmail))
    }

    const nextCursor = page.has_more && page.data.length > 0
      ? page.data[page.data.length - 1].id
      : null

    return json({
      sessions,
      has_more: page.has_more,
      next_cursor: nextCursor,
    })
  } catch (err: any) {
    if (err instanceof AuthError) return err.toResponse()
    console.error('[list-checkout-sessions]', err?.message)
    return json({ error: err?.message || 'Internal server error' }, 500)
  }
})
