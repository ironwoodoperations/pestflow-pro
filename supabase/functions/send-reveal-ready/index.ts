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
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

const BOOKINGS_URL = 'https://outlook.office.com/book/PestFlowProOnboarding@ironwoodoperationsgroup.com/?ismsaljsauthenabled'

function buildHtml(companyName: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 16px">
    <div style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
      <div style="background:#1a3a2a;padding:24px 32px">
        <span style="color:#ffffff;font-size:22px;font-weight:bold">PestFlow Pro</span>
      </div>
      <div style="padding:36px 32px">
        <h1 style="margin:0 0 16px;font-size:24px;color:#111827">Hi ${companyName},</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6">
          Your new PestFlow Pro site is live and ready for your review.
        </p>
        <p style="margin:0 0 12px;font-size:15px;color:#374151;font-weight:600">Book your reveal call here — it takes about 45 minutes:</p>
        <!-- PRIMARY CTA — Bookings link -->
        <a href="${BOOKINGS_URL}"
           style="display:block;background:#16a34a;color:#ffffff;font-size:17px;font-weight:700;padding:18px 32px;border-radius:8px;text-decoration:none;text-align:center;margin-bottom:28px">
          Book Your Reveal Call →
        </a>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:20px 24px;margin:0 0 24px">
          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#166534">On the call we'll:</p>
          <p style="margin:4px 0;font-size:14px;color:#374151">✓ Walk through your live site together</p>
          <p style="margin:4px 0;font-size:14px;color:#374151">✓ Show you how to use your dashboard</p>
          <p style="margin:4px 0;font-size:14px;color:#374151">✓ Get your site onto your custom domain</p>
        </div>
        <p style="margin:0 0 8px;font-size:14px;color:#6b7280">Your site preview:</p>
        <p style="margin:0 0 24px;font-size:15px">
          <a href="${siteUrl}" style="color:#16a34a;text-decoration:none;font-weight:600">${siteUrl}</a>
        </p>
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280">Questions? Reply to this email or call (430) 367-5601.</p>
        <p style="margin:0;font-size:13px;color:#6b7280">— The PestFlow Pro Team</p>
      </div>
      <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center">
        <p style="margin:0;font-size:12px;color:#9ca3af">PestFlow Pro &nbsp;·&nbsp; <a href="https://pestflowpro.com" style="color:#9ca3af;text-decoration:none">pestflowpro.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  try {
    const { to, company_name, siteUrl, slug, firstName, businessName } = await req.json()
    const recipientName = company_name || businessName || firstName || ''
    const siteLink = siteUrl || (slug ? `https://${slug}.pestflowpro.com` : '')
    if (!to || !recipientName || !siteLink) {
      return json({ error: 'to, company_name (or businessName), and siteUrl (or slug) required' }, 400)
    }
    await sendEmail({
      to,
      subject: `Your site is ready — let's walk through it together`,
      html: buildHtml(recipientName, siteLink),
      replyTo: 'pfpsales@pestflowpro.com',
    })
    return json({ success: true })
  } catch (err: any) {
    console.error('[send-reveal-ready]', err?.message)
    return json({ error: err?.message || 'Internal server error' }, 500)
  }
})
