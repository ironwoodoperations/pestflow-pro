// Supabase Edge Function: create-setup-invoice
// Creates a Stripe invoice for the one-time setup fee and returns the hosted invoice URL.
// JWT-verified: only admin@pestflowpro.com can call this.

import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    // JWT verification
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user || user.email !== 'admin@pestflowpro.com') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    const { setupFeeAmount, clientEmail, companyName, prospectId } = await req.json()
    if (!setupFeeAmount || !clientEmail || !companyName || !prospectId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

    const customer = await stripe.customers.create({ email: clientEmail, name: companyName })

    await stripe.invoiceItems.create({
      customer: customer.id,
      amount: Math.round(setupFeeAmount * 100),
      currency: 'usd',
      description: `One-Time Setup Fee — ${companyName}`,
    })

    const invoice = await stripe.invoices.create({
      customer: customer.id,
      auto_advance: true,
      collection_method: 'send_invoice',
      days_until_due: 1,
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
