// Supabase Edge Function: notify-new-lead
// Sends a branded HTML email notification via Resend when a new lead is inserted.
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch notification, branding, and business settings in parallel
    const [notifRes, brandRes, bizRes] = await Promise.all([
      supabase.from('settings').select('value').eq('tenant_id', lead.tenant_id).eq('key', 'notifications').maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', lead.tenant_id).eq('key', 'branding').maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', lead.tenant_id).eq('key', 'business_info').maybeSingle(),
    ])

    const notifyEmail = notifRes.data?.value?.lead_email
    if (!notifyEmail) {
      return new Response(JSON.stringify({ skipped: 'No notification email configured' }), { status: 200 })
    }

    const ccEmail = notifRes.data?.value?.cc_email || null
    const services = Array.isArray(lead.services) ? lead.services.join(', ') : (lead.services || 'Not specified')

    // Branding
    const logoUrl = brandRes.data?.value?.logo_url || ''
    const primaryColor = brandRes.data?.value?.primary_color || '#10b981'
    const accentColor = brandRes.data?.value?.accent_color || '#f5c518'

    // Business info
    const businessName = bizRes.data?.value?.name || 'PestFlow Pro'
    const businessPhone = bizRes.data?.value?.phone || ''

    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="${businessName}" style="max-height: 40px; width: auto; margin-bottom: 8px;" />`
      : ''

    // Send branded email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `PestFlow Pro <no-reply@pestflow.ai>`,
        to: [notifyEmail],
        cc: ccEmail ? [ccEmail] : undefined,
        subject: `New Lead: ${lead.name} — ${services}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
            <!-- Header -->
            <div style="background: #0a0f1e; padding: 28px 32px; border-radius: 12px 12px 0 0; text-align: center;">
              ${logoHtml}
              <h1 style="color: ${primaryColor}; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">${businessName}</h1>
              <p style="color: #9ca3af; margin: 4px 0 0; font-size: 13px;">New Quote Request</p>
            </div>

            <!-- Lead Details -->
            <div style="background: #ffffff; padding: 28px 32px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
              <div style="background: ${primaryColor}10; border-left: 4px solid ${primaryColor}; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                <p style="margin: 0; color: #1f2937; font-weight: 600; font-size: 16px;">${lead.name}</p>
                <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">Submitted ${new Date(lead.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>

              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; width: 100px; vertical-align: top;">Name</td>
                  <td style="padding: 12px 0; color: #1f2937; font-weight: 500;">${lead.name}</td>
                </tr>
                <tr style="border-top: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; vertical-align: top;">Email</td>
                  <td style="padding: 12px 0;"><a href="mailto:${lead.email}" style="color: ${primaryColor}; text-decoration: none; font-weight: 500;">${lead.email}</a></td>
                </tr>
                <tr style="border-top: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; vertical-align: top;">Phone</td>
                  <td style="padding: 12px 0;"><a href="tel:${lead.phone}" style="color: ${primaryColor}; text-decoration: none; font-weight: 500;">${lead.phone}</a></td>
                </tr>
                <tr style="border-top: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; vertical-align: top;">Services</td>
                  <td style="padding: 12px 0; color: #1f2937; font-weight: 500;">${services}</td>
                </tr>
                ${lead.message ? `
                <tr style="border-top: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; vertical-align: top;">Message</td>
                  <td style="padding: 12px 0; color: #374151;">${lead.message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</td>
                </tr>` : ''}
              </table>
            </div>

            <!-- Action Button -->
            <div style="background: #ffffff; padding: 0 32px 28px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; text-align: center;">
              <a href="mailto:${lead.email}?subject=Re: Your Quote Request" style="display: inline-block; background: ${primaryColor}; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 28px; border-radius: 8px; font-size: 14px;">Reply to ${lead.name}</a>
            </div>

            <!-- Footer -->
            <div style="background: #0a0f1e; padding: 20px 32px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">This notification was sent by <strong style="color: #9ca3af;">${businessName}</strong></p>
              ${businessPhone ? `<p style="color: #6b7280; font-size: 12px; margin: 4px 0 0;"><a href="tel:${businessPhone}" style="color: ${primaryColor}; text-decoration: none;">${businessPhone}</a></p>` : ''}
              <p style="color: #4b5563; font-size: 11px; margin: 12px 0 0;">Powered by PestFlow Pro</p>
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
