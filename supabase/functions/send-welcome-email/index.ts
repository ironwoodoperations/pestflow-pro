// Edge Function: send-welcome-email
// Triggered after Stripe payment confirmed — site build is underway.
// Called from stripe-webhook or provision-tenant after payment.
// No JWT required — called by automation.
//
// Deploy: supabase functions deploy send-welcome-email --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar

import { sendEmail } from '../_shared/sendEmail.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

function buildHtml(firstName: string, businessName: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 16px">
    <div style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">

      <!-- Header -->
      <div style="background:#1a3a2a;padding:24px 32px">
        <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:0.5px">PestFlow Pro</span>
      </div>

      <!-- Body -->
      <div style="padding:36px 32px">
        <h1 style="margin:0 0 16px;font-size:24px;color:#111827">We're building your site, ${firstName}.</h1>

        <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6">
          Your payment for <strong>${businessName}</strong> has been confirmed — thank you!
          Your site build is now underway.
        </p>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:20px 24px;margin:0 0 24px">
          <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#166534">What to expect:</p>
          <ul style="margin:0;padding:0 0 0 20px;font-size:14px;color:#374151;line-height:1.8">
            <li>Your site will be ready for review within 3–5 business days.</li>
            <li>We'll send you a "Reveal Ready" email with a link to your live preview.</li>
            <li>We'll walk you through everything on a live reveal call before launch.</li>
          </ul>
        </div>

        <p style="margin:0 0 4px;font-size:14px;color:#6b7280">Your future site:</p>
        <p style="margin:0 0 20px;font-size:15px">
          <a href="${siteUrl}" style="color:#16a34a;text-decoration:none;font-weight:600">${siteUrl}</a>
        </p>
        <p style="margin:0 0 28px;font-size:13px;color:#9ca3af;line-height:1.5">
          (This link will go live once your build is complete.)
        </p>

        <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.5">
          Need anything in the meantime? Reply to this email.
        </p>

        <a href="https://pestflowpro.com"
           style="display:inline-block;background:#16a34a;color:#ffffff;font-size:15px;font-weight:600;padding:12px 28px;border-radius:6px;text-decoration:none">
          Learn What's Included
        </a>
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
    const { to, firstName, businessName, siteUrl } = await req.json()
    if (!to || !firstName || !businessName || !siteUrl) {
      return json({ error: 'to, firstName, businessName, siteUrl required' }, 400)
    }

    await sendEmail({
      to,
      subject: `Payment confirmed — your site build starts now 🚀`,
      html: buildHtml(firstName, businessName, siteUrl),
      replyTo: 'onboarding@pestflowpro.com',
    })

    return json({ success: true })
  } catch (err: any) {
    console.error('[send-welcome-email]', err?.message)
    return json({ error: err?.message || 'Internal server error' }, 500)
  }
})
