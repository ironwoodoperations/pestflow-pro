// Edge Function: send-welcome-email
// Triggered after Stripe payment confirmed — site build is underway.
// No JWT required — called from stripe-webhook after payment.
//
// Deploy: supabase functions deploy send-welcome-email --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar

import { sendEmail } from '../_shared/sendEmail.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

const BOOKINGS_URL = 'https://outlook.office.com/book/PestFlowProOnboarding@ironwoodoperationsgroup.com/?ismsaljsauthenabled'

function buildHtml(companyName: string, bookingsLink: string): string {
  const bLink = bookingsLink || BOOKINGS_URL
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
          Payment confirmed — thank you! Your site is now being built.
        </p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:20px 24px;margin:0 0 24px">
          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#166534">Here's what happens next:</p>
          <p style="margin:4px 0;font-size:14px;color:#374151">✓ We build your site in the next 48–72 hours</p>
          <p style="margin:4px 0;font-size:14px;color:#374151">✓ You'll receive an email when it's ready to review</p>
          <p style="margin:4px 0;font-size:14px;color:#374151">✓ We'll walk through the live site together on a reveal call</p>
        </div>
        <p style="margin:0 0 16px;font-size:15px;color:#374151;font-weight:600">Want to get your reveal call on the calendar now?</p>
        <a href="${bLink}"
           style="display:inline-block;background:#16a34a;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:6px;text-decoration:none;margin-bottom:24px">
          Book Your Reveal Call →
        </a>
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
    const { to, company_name, bookings_link } = await req.json()
    if (!to || !company_name) return json({ error: 'to and company_name required' }, 400)

    await sendEmail({
      to,
      subject: `Your PestFlow Pro site is being built — here's what happens next`,
      html: buildHtml(company_name, bookings_link),
      replyTo: 'pfpsales@pestflowpro.com',
      fromName: 'PestFlow Pro',
    })
    return json({ success: true })
  } catch (err: any) {
    console.error('[send-welcome-email]', err?.message)
    return json({ error: err?.message || 'Internal server error' }, 500)
  }
})
