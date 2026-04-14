// Supabase Edge Function: create-setup-invoice
// Creates a Stripe invoice for the one-time setup fee and returns the hosted invoice URL.
// JWT-verified: only Ironwood admins can call this.

import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const IRONWOOD_ALLOWED = ['admin@pestflowpro.com', 'murphygurl92@gmail.com']

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const SUPABASE_URL             = Deno.env.get('SUPABASE_URL') || ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const STRIPE_SECRET_KEY        = Deno.env.get('STRIPE_SECRET_KEY') || ''

    // JWT verification — use service role client so we can verify any valid JWT
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || ''
    const token = authHeader.replace(/^[Bb]earer\s+/, '')
    console.log('create-setup-invoice | auth header present:', !!authHeader, '| token length:', token.length)

    if (!token) {
      console.log('create-setup-invoice | no token in request')
      return new Response(JSON.stringify({ error: 'Unauthorized — no token' }), {
        status: 401, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    console.log('create-setup-invoice | user:', user?.email, '| error:', userError?.message)

    if (userError || !user || !IRONWOOD_ALLOWED.includes(user.email ?? '')) {
      console.log('create-setup-invoice | UNAUTHORIZED — user:', user?.email, 'allowed:', IRONWOOD_ALLOWED)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    const { priceId, clientEmail, companyName, prospectId } = await req.json()

    if (!clientEmail || !companyName || !prospectId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    // No priceId (waived) — mark prospect as paid and return skipped
    if (!priceId) {
      await supabase
        .from('prospects')
        .update({ status: 'paid', payment_confirmed_at: new Date().toISOString() })
        .eq('id', prospectId)
      return new Response(JSON.stringify({ success: true, skipped: true, message: 'No setup fee — marked as paid' }), {
        headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

    const customer = await stripe.customers.create({ email: clientEmail, name: companyName })

    await stripe.invoiceItems.create({
      customer: customer.id,
      price: priceId,
    })

    const invoice = await stripe.invoices.create({
      customer: customer.id,
      auto_advance: true,
      collection_method: 'send_invoice',
      days_until_due: 7,
    })

    const finalized = await stripe.invoices.finalizeInvoice(invoice.id)
    const invoiceUrl = finalized.hosted_invoice_url || ''

    // Save to prospects
    await supabase
      .from('prospects')
      .update({ setup_invoice_url: invoiceUrl, setup_invoice_sent_at: new Date().toISOString() })
      .eq('id', prospectId)

    return new Response(JSON.stringify({ success: true, invoice_url: invoiceUrl }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  } catch (err) {
    console.error('create-setup-invoice error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }
})
