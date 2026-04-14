// Supabase Edge Function: create-setup-invoice v2
// Correct Stripe sequence: create draft invoice → attach item → verify total → finalize
// Supports action:'void' to void the most recent open invoice for a prospect's customer.

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
    const SUPABASE_URL              = Deno.env.get('SUPABASE_URL') || ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const STRIPE_SECRET_KEY         = Deno.env.get('STRIPE_SECRET_KEY') || ''

    // JWT verification
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || ''
    const token = authHeader.replace(/^[Bb]earer\s+/, '')
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized — no token' }), {
        status: 401, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user || !IRONWOOD_ALLOWED.includes(user.email ?? '')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    const body = await req.json()
    const { action, priceId, clientEmail, companyName, prospectId } = body

    if (!prospectId) {
      return new Response(JSON.stringify({ error: 'prospectId is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

    // ── VOID ACTION ──────────────────────────────────────────────────────────
    if (action === 'void') {
      // Look up the Stripe customer ID from the prospect
      const { data: prospect } = await supabase
        .from('prospects')
        .select('stripe_customer_id')
        .eq('id', prospectId)
        .maybeSingle()

      const customerId = prospect?.stripe_customer_id
      if (!customerId) {
        return new Response(JSON.stringify({ error: 'No Stripe customer on file for this prospect' }), {
          status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
        })
      }

      // Find the most recent open invoice for this customer and void it
      const invoices = await stripe.invoices.list({ customer: customerId, status: 'open', limit: 1 })
      if (invoices.data.length === 0) {
        return new Response(JSON.stringify({ error: 'No open invoice found to void' }), {
          status: 404, headers: { 'Content-Type': 'application/json', ...CORS },
        })
      }
      await stripe.invoices.voidInvoice(invoices.data[0].id)

      // Clear setup_invoice_url so a new one can be generated
      await supabase
        .from('prospects')
        .update({ setup_invoice_url: null, setup_invoice_sent_at: null })
        .eq('id', prospectId)

      return new Response(JSON.stringify({ success: true, voided: invoices.data[0].id }), {
        headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    // ── GENERATE ACTION ──────────────────────────────────────────────────────
    if (!clientEmail || !companyName) {
      return new Response(JSON.stringify({ error: 'clientEmail and companyName are required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    // Waived fee — mark prospect as paid and return early
    if (!priceId) {
      await supabase
        .from('prospects')
        .update({ status: 'paid', payment_confirmed_at: new Date().toISOString() })
        .eq('id', prospectId)
      return new Response(JSON.stringify({ success: true, skipped: true, message: 'No setup fee — marked as paid' }), {
        headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    // Step 1: Get or create Stripe customer (reuse existing if present)
    const { data: prospectRow } = await supabase
      .from('prospects')
      .select('stripe_customer_id')
      .eq('id', prospectId)
      .maybeSingle()

    let customerId = prospectRow?.stripe_customer_id || ''
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: clientEmail,
        name:  companyName,
        metadata: { prospect_id: prospectId },
      })
      customerId = customer.id
      await supabase.from('prospects').update({ stripe_customer_id: customerId }).eq('id', prospectId)
    }

    // Step 2: Create DRAFT invoice first
    const draftInvoice = await stripe.invoices.create({
      customer:           customerId,
      collection_method:  'send_invoice',
      days_until_due:     7,
      metadata:           { prospect_id: prospectId },
    })

    // Step 3: Attach invoice item to this specific draft invoice
    await stripe.invoiceItems.create({
      customer: customerId,
      invoice:  draftInvoice.id,   // ← critical: binds item to this draft
      price:    priceId,
    })

    // Step 4: Verify draft total > 0
    const draft = await stripe.invoices.retrieve(draftInvoice.id)
    if (draft.amount_due === 0) {
      await stripe.invoices.deleteInvoice(draftInvoice.id)
      return new Response(JSON.stringify({ error: 'Invoice total is $0 — price ID may be invalid or zero-amount' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    // Step 5: Finalize
    const finalized = await stripe.invoices.finalizeInvoice(draftInvoice.id)
    const invoiceUrl = finalized.hosted_invoice_url || ''

    // Save to prospect
    await supabase
      .from('prospects')
      .update({ setup_invoice_url: invoiceUrl, setup_invoice_sent_at: new Date().toISOString() })
      .eq('id', prospectId)

    return new Response(JSON.stringify({ success: true, invoice_url: invoiceUrl, invoice_id: finalized.id }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  } catch (err) {
    console.error('create-setup-invoice error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }
})
