// Supabase Edge Function: notify-new-lead
// Triggered by DB webhook on leads INSERT.
// Sends two emails: customer acknowledgment (Email A) + owner notification (Email B).
// Non-fatal: if either email fails, the other still sends.
//
// Deploy: supabase functions deploy notify-new-lead --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/sendEmail.ts'

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

    if (!lead?.tenant_id) {
      return new Response(JSON.stringify({ error: 'No lead data' }), { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const [notifRes, brandRes, bizRes, intRes] = await Promise.all([
      supabase.from('settings').select('value').eq('tenant_id', lead.tenant_id).eq('key', 'notifications').maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', lead.tenant_id).eq('key', 'branding').maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', lead.tenant_id).eq('key', 'business_info').maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', lead.tenant_id).eq('key', 'integrations').maybeSingle(),
    ])

    const notifyEmail: string = notifRes.data?.value?.lead_email || ''
    const ccEmail: string = notifRes.data?.value?.cc_email || ''
    const primaryColor: string = brandRes.data?.value?.primary_color || '#10b981'
    const businessName: string = bizRes.data?.value?.name || 'PestFlow Pro'
    const businessPhone: string = bizRes.data?.value?.phone || ''
    const services = Array.isArray(lead.services) ? lead.services.join(', ') : (lead.services || 'Not specified')
    const firstName = lead.name?.split(' ')[0] || lead.name || 'there'
    const timestamp = new Date(lead.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })

    const results: Record<string, unknown> = {}

    // ── Email A: Customer acknowledgment ──────────────────────────────────
    if (lead.email) {
      try {
        await sendEmail({
          to: lead.email,
          cc: notifyEmail || undefined,
          subject: `Thank you for contacting ${businessName}!`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:${primaryColor}">${businessName}</h2>
  <p>Hi ${firstName},</p>
  <p>Thank you for reaching out! We've received your inquiry and will be in
  touch with you as soon as possible — usually within 1 business day.</p>
  ${businessPhone ? `<p>If you need immediate assistance, please call us at <strong>${businessPhone}</strong>.</p>` : ''}
  <p>We look forward to helping you!</p>
  <p style="margin-top:32px;color:#888;font-size:12px">
    Powered by <a href="https://pestflowpro.com" style="color:#888">PestFlow Pro</a>
  </p>
</div>`,
        })
        results.emailA = 'sent'
      } catch (e) {
        console.error('[notify-new-lead] Email A failed:', String(e))
        results.emailA = 'failed'
      }
    } else {
      results.emailA = 'skipped: no visitor email'
    }

    // ── Email B: Owner notification ───────────────────────────────────────
    if (notifyEmail) {
      try {
        await sendEmail({
          to: notifyEmail,
          cc: ccEmail || undefined,
          subject: `New lead from ${lead.name} — ${businessName}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:${primaryColor}">New Lead — ${businessName}</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:8px;font-weight:bold">Name</td>
        <td style="padding:8px">${lead.name}</td></tr>
    <tr style="background:#f9f9f9">
        <td style="padding:8px;font-weight:bold">Email</td>
        <td style="padding:8px">${lead.email}</td></tr>
    <tr><td style="padding:8px;font-weight:bold">Phone</td>
        <td style="padding:8px">${lead.phone}</td></tr>
    <tr style="background:#f9f9f9">
        <td style="padding:8px;font-weight:bold">Services</td>
        <td style="padding:8px">${services}</td></tr>
    ${lead.message ? `<tr><td style="padding:8px;font-weight:bold">Message</td>
        <td style="padding:8px">${lead.message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</td></tr>` : ''}
    <tr style="background:#f9f9f9">
        <td style="padding:8px;font-weight:bold">Submitted</td>
        <td style="padding:8px">${timestamp}</td></tr>
  </table>
  <p style="margin-top:32px;color:#888;font-size:12px">
    Powered by <a href="https://pestflowpro.com" style="color:#888">PestFlow Pro</a>
  </p>
</div>`,
        })
        results.emailB = 'sent'
      } catch (e) {
        console.error('[notify-new-lead] Email B failed:', String(e))
        results.emailB = 'failed'
      }
    } else {
      results.emailB = 'skipped: no lead_email configured'
    }

    // ── SMS (owner) — keep existing behavior ─────────────────────────────
    const ownerSms = intRes.data?.value?.owner_sms_number
    if (ownerSms) {
      const smsMsg = `New lead from ${lead.name} — ${services}. Phone: ${lead.phone}.`
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: ownerSms, message: smsMsg, type: 'lead-notification' }),
        })
        results.sms = 'sent'
      } catch { results.sms = 'failed' }
    }

    return new Response(JSON.stringify({ success: true, ...results }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
