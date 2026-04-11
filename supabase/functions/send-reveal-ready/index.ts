// Edge Function: send-reveal-ready
// Triggered manually from Ironwood when Scott marks a site as reveal-ready.
// No JWT required — called from authenticated Ironwood frontend.
//
// Deploy: supabase functions deploy send-reveal-ready --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar

import { sendEmail } from '../_shared/sendEmail.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BOOKINGS_URL = 'https://outlook.office.com/book/PestFlowProOnboarding@ironwoodoperationsgroup.com/?ismsaljsauthenabled'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

function buildHtml(firstName: string, businessName: string, siteUrl: string, adminUrl: string): string {
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
        <h1 style="margin:0 0 16px;font-size:24px;color:#111827">Your site is live — let's do the reveal.</h1>

        <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6">
          Great news, ${firstName}! Your <strong>${businessName}</strong> website is built and ready for your review.
        </p>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:20px 24px;margin:0 0 24px">
          <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#166534">Here's what we'll cover on your reveal call:</p>
          <ul style="margin:0;padding:0 0 0 20px;font-size:14px;color:#374151;line-height:1.9">
            <li>Full walkthrough of your live site</li>
            <li>How to update your content, photos, and services</li>
            <li>How to view and respond to leads</li>
            <li>How to post to social media from your dashboard</li>
            <li>Connecting your Google Search Console and Analytics</li>
          </ul>
        </div>

        <p style="margin:0 0 4px;font-size:14px;color:#6b7280">Your live site:</p>
        <p style="margin:0 0 28px;font-size:15px">
          <a href="${siteUrl}" style="color:#16a34a;text-decoration:none;font-weight:600">${siteUrl}</a>
        </p>

        <!-- Primary CTA -->
        <a href="${siteUrl}"
           style="display:inline-block;background:#16a34a;color:#ffffff;font-size:15px;font-weight:600;padding:12px 28px;border-radius:6px;text-decoration:none;margin-bottom:16px">
          View Your Site
        </a>

        <!-- Secondary link -->
        <p style="margin:16px 0 24px">
          <a href="${BOOKINGS_URL}"
             style="color:#16a34a;font-size:14px;font-weight:600;text-decoration:none">
            → Schedule Your Reveal Call
          </a>
        </p>

        <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;border-top:1px solid #e5e7eb;padding-top:20px">
          After the reveal call, you'll receive your admin login credentials and full access to your dashboard.
        </p>
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
    const { to, firstName, businessName, siteUrl, adminUrl } = await req.json()
    if (!to || !firstName || !businessName || !siteUrl || !adminUrl) {
      return json({ error: 'to, firstName, businessName, siteUrl, adminUrl required' }, 400)
    }

    await sendEmail({
      to,
      subject: `Your site is ready to review, ${firstName}! 🎉`,
      html: buildHtml(firstName, businessName, siteUrl, adminUrl),
      replyTo: 'onboarding@pestflowpro.com',
    })

    return json({ success: true })
  } catch (err: any) {
    console.error('[send-reveal-ready]', err?.message)
    return json({ error: err?.message || 'Internal server error' }, 500)
  }
})
