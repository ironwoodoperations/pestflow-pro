// Supabase Edge Function: notify-new-lead
// Sends an email notification via Resend when a new lead is inserted.
//
// SETUP:
// 1. Set env vars in Supabase Dashboard → Edge Functions → notify-new-lead:
//    - RESEND_API_KEY: your Resend API key (https://resend.com)
//    - SUPABASE_URL: auto-set by Supabase
//    - SUPABASE_SERVICE_ROLE_KEY: auto-set by Supabase
// 2. Create a Supabase database webhook:
//    - Table: leads
//    - Event: INSERT
//    - Type: Edge Function → notify-new-lead
// 3. Deploy: supabase functions deploy notify-new-lead --project-ref biezzykcgzkrwdgqpsar

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

interface LeadPayload {
  type: 'INSERT'
  table: string
  record: {
    id: string
    tenant_id: string
    name: string
    email: string
    phone: string
    services: string[] | null
    message: string | null
    created_at: string
  }
}

Deno.serve(async (req) => {
  try {
    const payload: LeadPayload = await req.json()
    const lead = payload.record

    if (!lead || !lead.tenant_id) {
      return new Response(JSON.stringify({ error: 'No lead data' }), { status: 400 })
    }

    // Fetch notification settings for this tenant
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: settings } = await supabase
      .from('settings')
      .select('value')
      .eq('tenant_id', lead.tenant_id)
      .eq('key', 'notifications')
      .maybeSingle()

    const notifyEmail = settings?.value?.lead_email
    if (!notifyEmail) {
      return new Response(JSON.stringify({ skipped: 'No notification email configured' }), { status: 200 })
    }

    const ccEmail = settings?.value?.cc_email || null
    const services = Array.isArray(lead.services) ? lead.services.join(', ') : (lead.services || 'Not specified')

    // Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PestFlow Pro <leads@pestflowpro.com>',
        to: [notifyEmail],
        cc: ccEmail ? [ccEmail] : undefined,
        subject: `New Lead: ${lead.name} — ${services}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #0a0f1e; padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: #10b981; margin: 0; font-size: 20px;">New Quote Request</h1>
            </div>
            <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Name</td><td style="padding: 8px 0; font-weight: 600;">${lead.name}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Email</td><td style="padding: 8px 0;"><a href="mailto:${lead.email}">${lead.email}</a></td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Phone</td><td style="padding: 8px 0;"><a href="tel:${lead.phone}">${lead.phone}</a></td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Services</td><td style="padding: 8px 0;">${services}</td></tr>
                ${lead.message ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Message</td><td style="padding: 8px 0;">${lead.message.replace(/\n/g, '<br>')}</td></tr>` : ''}
              </table>
              <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #f3f4f6;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">Submitted ${new Date(lead.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        `,
      }),
    })

    const emailData = await emailRes.json()
    return new Response(JSON.stringify({ success: true, emailId: emailData.id }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
