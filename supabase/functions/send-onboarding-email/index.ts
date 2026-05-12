// Edge Function: send-onboarding-email v3
// Supports two modes:
//   1. Client welcome (triggered by stripe-webhook after provisioning):
//      { to, company_name, live_url } — no credentials in email
//   2. Scott's setup notification (triggered by Client Setup wizard):
//      { business_name, contact_name, plan, markdown_content }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const body = await req.json()
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not set')

    let emailPayload: Record<string, unknown>

    if (body.to && body.company_name) {
      // Mode 1: Client welcome email — no credentials, team delivers them separately
      const { to, company_name, live_url } = body
      emailPayload = {
        from: 'PestFlow Pro <noreply@pestflow.ai>',
        reply_to: 'onboarding@homeflowpro.ai',
        to: [to],
        subject: `Welcome to PestFlow Pro \u2014 ${company_name}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1f2e">
            <div style="background:#1a1f2e;padding:32px;border-radius:12px 12px 0 0;text-align:center">
              <h1 style="color:#10b981;font-size:24px;margin:0">PestFlow Pro</h1>
              <p style="color:#9ca3af;font-size:14px;margin:8px 0 0">Your new website platform</p>
            </div>
            <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
              <h2 style="font-size:20px;color:#111827;margin:0 0 16px">Thanks for choosing PestFlow Pro, ${company_name}!</h2>
              <p style="color:#374151;line-height:1.6;margin:0 0 24px">
                We've received your payment and our team is setting up your site.
                You'll receive your login details by email within 1&#x2013;2 business days once everything is ready.
                We're excited to work with you!
              </p>
              ${live_url ? `<div style="margin-bottom:28px"><a href="${live_url}" style="display:inline-block;background:#10b981;color:#fff;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px;text-decoration:none">Explore PestFlow Pro</a></div>` : ''}
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0" />
              <p style="color:#9ca3af;font-size:12px;margin:0">
                Questions? Reply to this email or contact us at onboarding@homeflowpro.ai.<br />
                Powered by PestFlow Pro &#x2014; built for home service businesses.
              </p>
            </div>
          </div>
        `,
      }
    } else {
      // Mode 2: Scott's setup notification (existing behavior)
      const { business_name, contact_name, plan, markdown_content } = body
      emailPayload = {
        from: 'PestFlow Pro <noreply@pestflow.ai>',
        reply_to: 'onboarding@homeflowpro.ai',
        to: ['scott@homeflowpro.ai'],
        subject: `New Client Setup \u2014 ${business_name} (${plan})`,
        html: `
          <h2>New PestFlow Pro Client Setup</h2>
          <p><strong>Business:</strong> ${business_name}</p>
          <p><strong>Contact:</strong> ${contact_name}</p>
          <p><strong>Plan:</strong> ${plan}</p>
          <hr />
          <h3>Full Setup Document</h3>
          <pre style="background:#f5f5f5;padding:16px;border-radius:8px;font-size:12px;white-space:pre-wrap">${markdown_content}</pre>
        `,
      }
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Resend error: ${err}`)
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-onboarding-email error:', (err as Error).message)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
