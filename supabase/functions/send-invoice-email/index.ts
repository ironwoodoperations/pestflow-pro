// Edge Function: send-invoice-email
// Sends a Stripe setup invoice email to the prospect via Resend.
// JWT-protected.
//
// Deploy: supabase functions deploy send-invoice-email --project-ref biezzykcgzkrwdgqpsar

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/sendEmail.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    // Verify JWT
    const authHeader = req.headers.get('Authorization') || ''
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { prospectEmail, prospectName, businessName, invoiceUrl, amount } = await req.json()

    if (!prospectEmail || !invoiceUrl) {
      return new Response(JSON.stringify({ error: 'prospectEmail and invoiceUrl are required' }), { status: 400 })
    }

    const name = prospectName || 'there'
    const biz  = businessName || 'PestFlow Pro'
    const amtDisplay = amount ? `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : ''

    await sendEmail({
      to: prospectEmail,
      replyTo: 'pfsales@pestflowpro.com',
      subject: `Your PestFlow Pro setup invoice — ${biz}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:#16a34a">Your Website Setup Invoice</h2>
  <p>Hi ${name},</p>
  <p>Here is your invoice for your new <strong>${biz}</strong> website setup.</p>
  ${amtDisplay ? `<p style="font-size:24px;font-weight:bold;color:#111">Amount: ${amtDisplay}</p>` : ''}
  <p style="text-align:center;margin:32px 0">
    <a href="${invoiceUrl}"
       style="background:#16a34a;color:white;padding:14px 28px;
              border-radius:6px;text-decoration:none;font-weight:bold">
      View &amp; Pay Invoice →
    </a>
  </p>
  <p style="color:#666;font-size:14px">
    Questions? Reply to this email or call us directly.
  </p>
  <p style="margin-top:32px;color:#888;font-size:12px">
    Powered by <a href="https://pestflowpro.com" style="color:#888">PestFlow Pro</a>
  </p>
</div>`,
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    console.error('[send-invoice-email]', String(err))
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
