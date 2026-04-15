// Edge Function: send-marketing-lead
// Receives a marketing contact form submission from pestflowpro.com.
// 1) SMS owner via Textbelt
// 2) Email owner notification via Resend
// 3) Email prospect confirmation via Resend
//
// Deploy: supabase functions deploy send-marketing-lead --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt

import { sendEmail } from '../_shared/sendEmail.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

function ownerNotificationHtml(name: string, company: string, phone: string, email: string, message: string, ts: string): string {
  const row = (label: string, val: string) =>
    `<tr><td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;width:120px;border-bottom:1px solid #f3f4f6">${label}</td><td style="padding:10px 16px;font-size:14px;color:#111827;border-bottom:1px solid #f3f4f6">${val || '—'}</td></tr>`

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 16px">
  <div style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">
    <div style="background:#0a0f1e;padding:20px 28px;display:flex;align-items:center;gap:12px">
      <span style="background:linear-gradient(135deg,#06B6D4,#10B981);color:#0a0f1e;font-weight:800;font-size:14px;width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center">P</span>
      <span style="color:#f9fafb;font-size:18px;font-weight:700">PestFlow Pro — New Lead</span>
    </div>
    <div style="padding:28px">
      <p style="margin:0 0 20px;font-size:15px;color:#374151">A new prospect submitted the contact form on <strong>pestflowpro.com</strong>.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
        ${row('Name', name)}
        ${row('Company', company)}
        ${row('Phone', phone)}
        ${row('Email', email)}
        ${row('Message', message)}
        ${row('Submitted', ts)}
      </table>
      <div style="margin-top:24px">
        <a href="mailto:${email}?subject=Re: PestFlow Pro Inquiry" style="display:inline-block;background:#06B6D4;color:#0a0f1e;font-size:14px;font-weight:700;padding:11px 24px;border-radius:6px;text-decoration:none">Reply to ${name}</a>
        ${phone ? `<a href="tel:${phone.replace(/\D/g,'')}" style="display:inline-block;margin-left:12px;background:#f3f4f6;color:#111827;font-size:14px;font-weight:600;padding:11px 24px;border-radius:6px;text-decoration:none">Call ${phone}</a>` : ''}
      </div>
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 28px;text-align:center;font-size:12px;color:#9ca3af">
      PestFlow Pro · pestflowpro.com · Ironwood Operations Group
    </div>
  </div>
</div>
</body></html>`
}

function prospectConfirmationHtml(name: string): string {
  const firstName = name.split(' ')[0]
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 16px">
  <!-- Header -->
  <div style="text-align:center;padding:28px 0 20px">
    <span style="background:linear-gradient(135deg,#06B6D4,#10B981);color:#0a0f1e;font-weight:800;font-size:14px;width:36px;height:36px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">P</span>
    <div style="color:#06B6D4;font-size:22px;font-weight:800;letter-spacing:-0.5px">PestFlow Pro</div>
  </div>

  <!-- Hero -->
  <div style="background:#0d1526;border:1px solid rgba(6,182,212,0.2);border-radius:16px;padding:36px 32px;text-align:center;margin-bottom:24px">
    <h1 style="margin:0 0 14px;font-size:28px;font-weight:800;color:#f9fafb;line-height:1.2">This Could Be Your Business in 48 Hours</h1>
    <p style="margin:0;font-size:16px;color:#9ca3af;line-height:1.6">
      Hi ${firstName}, we received your message and will be in touch shortly.<br>
      Here's a preview of what we build for pest control companies like yours.
    </p>
  </div>

  <!-- Features -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
    <tr>
      <td style="padding:0 6px 0 0;width:33%;vertical-align:top">
        <div style="background:#0d1526;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px 16px;text-align:center">
          <div style="font-size:28px;margin-bottom:10px">🌐</div>
          <div style="font-size:13px;font-weight:700;color:#f9fafb;margin-bottom:6px">Professional Website</div>
          <div style="font-size:12px;color:#9ca3af;line-height:1.5">Mobile-first, fast, built to rank</div>
        </div>
      </td>
      <td style="padding:0 3px;width:33%;vertical-align:top">
        <div style="background:#0d1526;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px 16px;text-align:center">
          <div style="font-size:28px;margin-bottom:10px">📍</div>
          <div style="font-size:13px;font-weight:700;color:#f9fafb;margin-bottom:6px">Local SEO</div>
          <div style="font-size:12px;color:#9ca3af;line-height:1.5">Show up when customers search for pest control</div>
        </div>
      </td>
      <td style="padding:0 0 0 6px;width:33%;vertical-align:top">
        <div style="background:#0d1526;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px 16px;text-align:center">
          <div style="font-size:28px;margin-bottom:10px">📱</div>
          <div style="font-size:13px;font-weight:700;color:#f9fafb;margin-bottom:6px">Social Media</div>
          <div style="font-size:12px;color:#9ca3af;line-height:1.5">Scheduled posts, AI captions, one dashboard</div>
        </div>
      </td>
    </tr>
  </table>

  <!-- Stats -->
  <div style="background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.2);border-radius:12px;padding:18px 24px;text-align:center;margin-bottom:24px">
    <span style="font-size:13px;color:#06B6D4;font-weight:600">91/100 PageSpeed</span>
    <span style="color:#374151;margin:0 12px">·</span>
    <span style="font-size:13px;color:#06B6D4;font-weight:600">Live in 48–72 hours</span>
    <span style="color:#374151;margin:0 12px">·</span>
    <span style="font-size:13px;color:#06B6D4;font-weight:600">SMS lead alerts</span>
  </div>

  <!-- CTA -->
  <div style="text-align:center;margin-bottom:32px">
    <a href="https://lone-star-pest-solutions.pestflowpro.com" style="display:inline-block;background:#06B6D4;color:#0a0f1e;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none">
      See a Live Example →
    </a>
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding:20px 0 0;border-top:1px solid rgba(255,255,255,0.06)">
    <p style="margin:0 0 8px;font-size:13px;color:#6b7280">Questions? Call <a href="tel:4303675601" style="color:#06B6D4;text-decoration:none">(430) 367-5601</a> or reply to this email.</p>
    <p style="margin:0 0 16px;font-size:13px;color:#6b7280">— The PestFlow Pro Team</p>
    <p style="margin:0;font-size:11px;color:#4b5563">PestFlow Pro · pestflowpro.com · Ironwood Operations Group</p>
  </div>
</div>
</body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { name, company, phone, email, message } = await req.json() as {
      name: string; company: string; phone: string; email: string; message: string
    }

    if (!name || !email) return json({ error: 'name and email are required' }, 400)

    const ts = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' }) + ' CT'
    const results: Record<string, unknown> = {}

    // ── A) Owner SMS via Textbelt ──────────────────────────────────────────
    const TEXTBELT_KEY = Deno.env.get('TEXTBELT_API_KEY') || ''
    if (TEXTBELT_KEY) {
      try {
        const smsRes = await fetch('https://textbelt.com/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: '14303675601',
            message: `New PestFlow Pro lead: ${name} | ${company || 'no company'} | ${phone || 'no phone'} | ${email}`,
            key: TEXTBELT_KEY,
          }),
        })
        results.sms = await smsRes.json()
        console.log('[send-marketing-lead] SMS result:', JSON.stringify(results.sms))
      } catch (err) {
        console.error('[send-marketing-lead] SMS failed (non-fatal):', String(err))
        results.sms = { success: false, error: String(err) }
      }
    } else {
      console.warn('[send-marketing-lead] TEXTBELT_API_KEY not set — SMS skipped')
      results.sms = { skipped: true }
    }

    // ── B) Owner notification email ────────────────────────────────────────
    try {
      await sendEmail({
        to: 'pfpsales@pestflowpro.com',
        subject: `New Lead: ${name} — ${company || 'No Company'}`,
        html: ownerNotificationHtml(name, company, phone, email, message, ts),
        replyTo: email,
      })
      results.ownerEmail = 'sent'
    } catch (err) {
      console.error('[send-marketing-lead] Owner email failed (non-fatal):', String(err))
      results.ownerEmail = { error: String(err) }
    }

    // ── C) Prospect confirmation email ────────────────────────────────────
    try {
      await sendEmail({
        to: email,
        subject: "You're One Step Closer to More Leads — PestFlow Pro",
        html: prospectConfirmationHtml(name),
        replyTo: 'pfpsales@pestflowpro.com',
      })
      results.prospectEmail = 'sent'
    } catch (err) {
      console.error('[send-marketing-lead] Prospect email failed (non-fatal):', String(err))
      results.prospectEmail = { error: String(err) }
    }

    return json({ ok: true, results })
  } catch (err) {
    console.error('[send-marketing-lead] Fatal:', String(err))
    return json({ error: String(err) }, 500)
  }
})
