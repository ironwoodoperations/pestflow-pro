// Edge Function: send-dunning-email
// Triggered by Stripe webhook on invoice.payment_failed (or Zapier ZAP 9).
// Sends escalating dunning emails based on attemptCount.
// No JWT required — called by Stripe webhook automation.
//
// Deploy: supabase functions deploy send-dunning-email --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar

import { sendEmail } from '../_shared/sendEmail.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

// Placeholder — will be replaced with Stripe customer portal URL after live mode cutover
const PAYMENT_UPDATE_URL = 'https://pestflowpro.com'

interface DunningContent {
  subject: string
  h1: string
  body: string
  ctaText: string
  ctaUrl: string
}

function getContent(firstName: string, businessName: string, attemptCount: number, nextAttemptDate?: string): DunningContent {
  const next = nextAttemptDate ? ` We'll try again on ${nextAttemptDate}.` : ''

  if (attemptCount <= 1) {
    return {
      subject: 'Action needed: payment issue for your PestFlow Pro subscription',
      h1: `There was an issue with your payment, ${firstName}.`,
      body: `We weren't able to process your subscription payment for <strong>${businessName}</strong>. This can happen when a card expires or has insufficient funds. Please update your payment method to keep your site running smoothly.${next}`,
      ctaText: 'Update Payment Method',
      ctaUrl: PAYMENT_UPDATE_URL,
    }
  }

  if (attemptCount === 2) {
    return {
      subject: 'Second notice: please update your payment method',
      h1: `We still couldn't process your payment.`,
      body: `This is a second notice that your payment for <strong>${businessName}</strong> has failed. Please update your payment method as soon as possible to avoid any interruption to your site.${next}`,
      ctaText: 'Update Payment Method Now',
      ctaUrl: PAYMENT_UPDATE_URL,
    }
  }

  return {
    subject: 'Final notice: your PestFlow Pro site is at risk of suspension',
    h1: `Your site is at risk of suspension.`,
    body: `We've been unable to process your payment for <strong>${businessName}</strong> after multiple attempts. If we don't receive payment, your site will be suspended. Please contact us immediately to resolve this.`,
    ctaText: 'Contact Us Now',
    ctaUrl: 'mailto:billing@ironwoodoperationsgroup.com',
  }
}

function buildHtml(firstName: string, businessName: string, attemptCount: number, nextAttemptDate?: string): string {
  const { h1, body, ctaText, ctaUrl } = getContent(firstName, businessName, attemptCount, nextAttemptDate)
  const isUrgent = attemptCount >= 3
  const headerBg = isUrgent ? '#7f1d1d' : '#1a3a2a'
  const alertBg  = isUrgent ? '#fef2f2' : '#fffbeb'
  const alertBorder = isUrgent ? '#fecaca' : '#fde68a'
  const alertText   = isUrgent ? '#991b1b' : '#92400e'
  const ctaBg       = isUrgent ? '#dc2626' : '#16a34a'

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 16px">
    <div style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">

      <!-- Header -->
      <div style="background:${headerBg};padding:24px 32px">
        <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:0.5px">PestFlow Pro</span>
      </div>

      <!-- Body -->
      <div style="padding:36px 32px">
        <h1 style="margin:0 0 16px;font-size:22px;color:#111827">${h1}</h1>

        <div style="background:${alertBg};border:1px solid ${alertBorder};border-radius:6px;padding:16px 20px;margin:0 0 24px">
          <p style="margin:0;font-size:14px;color:${alertText};line-height:1.6">
            Attempt <strong>${attemptCount}</strong> of 3
          </p>
        </div>

        <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6">${body}</p>

        <a href="${ctaUrl}"
           style="display:inline-block;background:${ctaBg};color:#ffffff;font-size:15px;font-weight:600;padding:12px 28px;border-radius:6px;text-decoration:none">
          ${ctaText}
        </a>

        ${isUrgent ? `
        <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5">
          You can also reach us at
          <a href="mailto:billing@ironwoodoperationsgroup.com" style="color:#16a34a;text-decoration:none">billing@ironwoodoperationsgroup.com</a>
        </p>` : ''}
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center">
        <p style="margin:0;font-size:12px;color:#9ca3af">
          PestFlow Pro &nbsp;·&nbsp;
          <a href="https://pestflowpro.com" style="color:#9ca3af;text-decoration:none">pestflowpro.com</a>
          &nbsp;·&nbsp; Powered by Ironwood Operations Group
        </p>
      </div>

    </div>
  </div>
</body>
</html>`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const { to, firstName, businessName, attemptCount, nextAttemptDate } = await req.json()
    if (!to || !firstName || !businessName) {
      return json({ error: 'to, firstName, businessName required' }, 400)
    }

    const attempt = Number(attemptCount) || 1
    const { subject } = getContent(firstName, businessName, attempt, nextAttemptDate)

    await sendEmail({
      to,
      subject,
      html: buildHtml(firstName, businessName, attempt, nextAttemptDate),
      replyTo: 'billing@ironwoodoperationsgroup.com',
    })

    return json({ success: true, attempt })
  } catch (err: any) {
    console.error('[send-dunning-email]', err?.message)
    return json({ error: err?.message || 'Internal server error' }, 500)
  }
})
