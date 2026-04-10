// Supabase Edge Function: notify-new-lead
// Triggered by DB webhook on leads INSERT.
// Sends two emails: customer acknowledgment (Email A) + owner notification (Email B).
// Non-fatal: if either email fails, the other still sends.
//
// Deploy: supabase functions deploy notify-new-lead --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/sendEmail.ts'

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  if (digits.length === 11 && digits[0] === '1') return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  return raw
}

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
    const logoUrl: string = brandRes.data?.value?.logo_url || ''
    const businessName: string = bizRes.data?.value?.name || 'PestFlow Pro'
    const businessPhone: string = bizRes.data?.value?.phone || ''
    const businessEmail: string = bizRes.data?.value?.email || ''
    const businessAddress: string = bizRes.data?.value?.address || ''
    const services = Array.isArray(lead.services) ? lead.services.join(', ') : (lead.services || 'Not specified')
    const firstName = lead.name?.split(' ')[0] || lead.name || 'there'
    const timestamp = new Date(lead.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })

    const results: Record<string, unknown> = {}

    // ── Email A: Customer acknowledgment ──────────────────────────────────
    if (lead.email) {
      const logoHtml = logoUrl
        ? `<img src="${logoUrl}" alt="${businessName}" style="max-height:60px;max-width:200px;object-fit:contain;margin-bottom:16px" />`
        : `<h1 style="margin:0 0 16px;font-size:22px;color:${primaryColor}">${businessName}</h1>`

      const autoReplyHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
<tr><td align="center">
<table width="100%" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
  <tr><td style="background:${primaryColor};padding:28px 32px;text-align:center">
    ${logoHtml}
  </td></tr>
  <tr><td style="padding:32px">
    <p style="margin:0 0 16px;font-size:16px;color:#111">Hi ${firstName},</p>
    <p style="margin:0 0 16px;font-size:16px;color:#333;line-height:1.6">
      Thank you for reaching out to <strong>${businessName}</strong>!
      We've received your request and will be in touch within <strong>1 business day</strong>.
    </p>
    <table style="width:100%;background:#f9fafb;border-radius:6px;padding:16px;margin:24px 0;border-collapse:collapse">
      <tr><td style="padding:6px 12px;font-size:13px;color:#555;font-weight:bold;width:120px">Name</td>
          <td style="padding:6px 12px;font-size:13px;color:#111">${lead.name}</td></tr>
      <tr style="background:#f1f3f5"><td style="padding:6px 12px;font-size:13px;color:#555;font-weight:bold">Phone</td>
          <td style="padding:6px 12px;font-size:13px;color:#111">${lead.phone || '—'}</td></tr>
      ${lead.services?.length ? `<tr><td style="padding:6px 12px;font-size:13px;color:#555;font-weight:bold">Services</td>
          <td style="padding:6px 12px;font-size:13px;color:#111">${services}</td></tr>` : ''}
    </table>
    ${businessPhone ? `<p style="margin:0 0 24px;text-align:center">
      <a href="tel:${businessPhone.replace(/\D/g,'')}" style="display:inline-block;background:${primaryColor};color:#fff;font-size:16px;font-weight:bold;padding:12px 28px;border-radius:6px;text-decoration:none">
        Call us: ${formatPhone(businessPhone)}
      </a>
    </p>` : ''}
    <p style="margin:0;font-size:15px;color:#333">We look forward to speaking with you!</p>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;font-size:12px;color:#888;text-align:center">
    ${businessAddress ? `${businessAddress}<br>` : ''}
    Powered by <a href="https://pestflowpro.com" style="color:#888">PestFlow Pro</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`

      const autoReplyText = `Hi ${firstName},\n\nThank you for contacting ${businessName}! We received your request and will be in touch within 1 business day.\n\nYour submitted information:\n- Name: ${lead.name}\n- Phone: ${lead.phone || '—'}\n${lead.services?.length ? `- Services: ${services}\n` : ''}\n${businessPhone ? `If you need immediate assistance, call us: ${businessPhone}\n\n` : ''}We look forward to speaking with you!\n\n${businessName}${businessAddress ? '\n' + businessAddress : ''}\n\n---\nPowered by PestFlow Pro — https://pestflowpro.com`

      try {
        await sendEmail({
          to: lead.email,
          subject: `We received your request, ${firstName}! — ${businessName}`,
          replyTo: businessEmail || notifyEmail || undefined,
          html: autoReplyHtml,
          text: autoReplyText,
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

    // ── SMS (owner) ───────────────────────────────────────────────────────
    const ownerSms = intRes.data?.value?.owner_sms_number
    // Use tenant's own Textbelt key if set; fall back to platform key from secrets
    const textbeltKey = intRes.data?.value?.textbelt_api_key?.trim() ||
                        Deno.env.get('TEXTBELT_API_KEY') || ''
    if (ownerSms) {
      const smsMsg = `New lead from ${lead.name} — ${services}. Phone: ${lead.phone}.`
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: ownerSms, message: smsMsg, type: 'lead-notification', key: textbeltKey }),
        })
        results.sms = 'sent'
      } catch { results.sms = 'failed' }
    }

    return new Response(JSON.stringify({ success: true, ...results }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
