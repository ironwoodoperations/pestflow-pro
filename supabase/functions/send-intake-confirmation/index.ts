// Edge Function: send-intake-confirmation
// Triggered after a prospect submits their intake form.
// Called manually from Ironwood or via Zapier ZAP 2.
// No JWT required — called by automation.
//
// Deploy: supabase functions deploy send-intake-confirmation --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar

import { sendEmail } from '../_shared/sendEmail.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

function buildHtml(firstName: string, businessName: string): string {
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
        <h1 style="margin:0 0 16px;font-size:24px;color:#111827">You're in good hands, ${firstName}.</h1>

        <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6">
          Thanks for submitting your business information for <strong>${businessName}</strong>.
          We've received everything and our team is already reviewing it.
        </p>

        <p style="margin:0 0 12px;font-size:15px;color:#374151;font-weight:600">Here's what happens next:</p>

        <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
          <tr>
            <td style="width:36px;vertical-align:top;padding:8px 12px 8px 0">
              <div style="background:#16a34a;color:#fff;width:24px;height:24px;border-radius:50%;text-align:center;font-size:13px;font-weight:bold;line-height:24px">1</div>
            </td>
            <td style="padding:8px 0;font-size:14px;color:#374151;line-height:1.5">
              We'll review your info and reach out within 1 business day to confirm your setup details.
            </td>
          </tr>
          <tr>
            <td style="width:36px;vertical-align:top;padding:8px 12px 8px 0">
              <div style="background:#16a34a;color:#fff;width:24px;height:24px;border-radius:50%;text-align:center;font-size:13px;font-weight:bold;line-height:24px">2</div>
            </td>
            <td style="padding:8px 0;font-size:14px;color:#374151;line-height:1.5">
              Once confirmed, we'll send your setup invoice.
            </td>
          </tr>
          <tr>
            <td style="width:36px;vertical-align:top;padding:8px 12px 8px 0">
              <div style="background:#16a34a;color:#fff;width:24px;height:24px;border-radius:50%;text-align:center;font-size:13px;font-weight:bold;line-height:24px">3</div>
            </td>
            <td style="padding:8px 0;font-size:14px;color:#374151;line-height:1.5">
              After payment, your site build begins — most sites are ready for review within 3–5 business days.
            </td>
          </tr>
        </table>

        <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.5">
          Questions? Just reply to this email — we're here.
        </p>

        <a href="https://pestflowpro.com"
           style="display:inline-block;background:#16a34a;color:#ffffff;font-size:15px;font-weight:600;padding:12px 28px;border-radius:6px;text-decoration:none">
          Visit PestFlow Pro
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
    const { to, firstName, businessName } = await req.json()
    if (!to || !firstName || !businessName) return json({ error: 'to, firstName, businessName required' }, 400)

    await sendEmail({
      to,
      subject: `We've got your info, ${firstName} — here's what happens next`,
      html: buildHtml(firstName, businessName),
      replyTo: 'onboarding@pestflowpro.com',
    })

    return json({ success: true })
  } catch (err: any) {
    console.error('[send-intake-confirmation]', err?.message)
    return json({ error: err?.message || 'Internal server error' }, 500)
  }
})
