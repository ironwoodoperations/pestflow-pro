// Edge Function: send-onboarding-email v2
// Supports two modes:
//   1. Client welcome (triggered by stripe-webhook after provisioning):
//      { to, company_name, live_url, admin_url, admin_email, admin_password }
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

    if (body.to && body.company_name && body.admin_password) {
      // Mode 1: Client welcome email
      const { to, company_name, live_url, admin_url, admin_email, admin_password } = body
      emailPayload = {
        from: 'PestFlow Pro <onboarding@pestflow.ai>',
        to: [to],
        subject: `Your PestFlow Pro site is live — ${company_name}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1f2e">
            <div style="background:#1a1f2e;padding:32px;border-radius:12px 12px 0 0;text-align:center">
              <h1 style="color:#10b981;font-size:24px;margin:0">PestFlow Pro</h1>
              <p style="color:#9ca3af;font-size:14px;margin:8px 0 0">Your new website is ready</p>
            </div>
            <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
              <h2 style="font-size:20px;color:#111827;margin:0 0 16px">Welcome, ${company_name}!</h2>
              <p style="color:#374151;line-height:1.6;margin:0 0 24px">
                Your PestFlow Pro website has been provisioned and is ready to go. Here are your login details:
              </p>

              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Your Login Credentials</p>
                <p style="margin:0 0 6px;font-size:15px;color:#111827"><strong>Email:</strong> ${admin_email}</p>
                <p style="margin:0 0 6px;font-size:15px;color:#111827"><strong>Password:</strong> <code style="background:#e5e7eb;padding:2px 6px;border-radius:4px;font-size:14px">${admin_password}</code></p>
              </div>

              <div style="display:flex;gap:12px;margin-bottom:28px">
                <a href="${live_url}" style="display:inline-block;background:#10b981;color:#fff;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px;text-decoration:none">
                  View Live Site →
                </a>
                <a href="${admin_url}" style="display:inline-block;background:#1a1f2e;color:#fff;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px;text-decoration:none">
                  Admin Login →
                </a>
              </div>

              <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 8px">
                <strong>Live URL:</strong> <a href="${live_url}" style="color:#10b981">${live_url}</a>
              </p>
              <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0">
                <strong>Admin Panel:</strong> <a href="${admin_url}" style="color:#10b981">${admin_url}</a>
              </p>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0" />
              <p style="color:#9ca3af;font-size:12px;margin:0">
                Questions? Reply to this email or contact us at support@pestflowpro.com.<br />
                Powered by PestFlow Pro — built for home service businesses.
              </p>
            </div>
          </div>
        `,
      }
    } else {
      // Mode 2: Scott's setup notification (existing behavior)
      const { business_name, contact_name, plan, markdown_content } = body
      emailPayload = {
        from: 'PestFlow Pro <onboarding@pestflow.ai>',
        to: ['scott@ironwoodoperationsgroup.com'],
        subject: `New Client Setup — ${business_name} (${plan})`,
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
