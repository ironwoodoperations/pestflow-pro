// Edge Function: send-credentials-email
// Triggered manually from Ironwood after reveal call is complete.
// Sends admin login credentials to the client.
// No JWT required — called from authenticated Ironwood frontend.
//
// Deploy: supabase functions deploy send-credentials-email --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar

import { sendEmail } from '../_shared/sendEmail.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

function buildHtml(
  firstName: string,
  businessName: string,
  siteUrl: string,
  adminUrl: string,
  adminEmail: string,
  adminPassword: string,
): string {
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
        <h1 style="margin:0 0 16px;font-size:24px;color:#111827">Welcome to PestFlow Pro, ${firstName}!</h1>

        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6">
          Your <strong>${businessName}</strong> website is officially live.
          Here are your admin login credentials — save these somewhere safe.
        </p>

        <!-- Credentials box -->
        <div style="background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;padding:20px 24px;margin:0 0 24px;font-family:'Courier New',Courier,monospace;font-size:13px;color:#111827;line-height:2">
          <div><span style="color:#6b7280;min-width:110px;display:inline-block">Site URL:</span>
            <a href="${siteUrl}" style="color:#16a34a;text-decoration:none">${siteUrl}</a></div>
          <div><span style="color:#6b7280;min-width:110px;display:inline-block">Admin URL:</span>
            <a href="${adminUrl}" style="color:#16a34a;text-decoration:none">${adminUrl}</a></div>
          <div><span style="color:#6b7280;min-width:110px;display:inline-block">Email:</span> ${adminEmail}</div>
          <div><span style="color:#6b7280;min-width:110px;display:inline-block">Password:</span> ${adminPassword}</div>
        </div>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:20px 24px;margin:0 0 28px">
          <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#166534">From your dashboard you can:</p>
          <ul style="margin:0;padding:0 0 0 20px;font-size:14px;color:#374151;line-height:1.9">
            <li>Edit your content, services, and photos</li>
            <li>View and respond to leads</li>
            <li>Write and publish blog posts</li>
            <li>Schedule social media posts</li>
            <li>Submit a support request if you ever need help</li>
          </ul>
        </div>

        <a href="${adminUrl}"
           style="display:inline-block;background:#16a34a;color:#ffffff;font-size:15px;font-weight:600;padding:12px 28px;border-radius:6px;text-decoration:none;margin-bottom:24px">
          Log In to Your Dashboard
        </a>

        <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;line-height:1.5;border-top:1px solid #e5e7eb;padding-top:20px">
          Questions? Email <a href="mailto:itsupport@pestflowpro.com" style="color:#16a34a;text-decoration:none">itsupport@pestflowpro.com</a>
          or submit a ticket from your dashboard.
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
    const { to, firstName, businessName, siteUrl, adminUrl, adminEmail, adminPassword } = await req.json()

    // Support legacy callers that pass slug instead of siteUrl/adminUrl
    const resolvedSiteUrl  = siteUrl  || (req.body ? '' : '')
    const resolvedAdminUrl = adminUrl || (resolvedSiteUrl ? `${resolvedSiteUrl}/admin` : '')

    if (!to || !firstName || !businessName || !adminEmail) {
      return json({ error: 'to, firstName, businessName, adminEmail required' }, 400)
    }

    await sendEmail({
      to,
      subject: `You're live! Here are your ${businessName} login credentials`,
      html: buildHtml(
        firstName,
        businessName,
        resolvedSiteUrl || `https://pestflowpro.com`,
        resolvedAdminUrl || `https://pestflowpro.com/admin`,
        adminEmail,
        adminPassword || '(set during onboarding)',
      ),
      replyTo: 'itsupport@pestflowpro.com',
    })

    return json({ success: true })
  } catch (err: any) {
    console.error('[send-credentials-email]', err?.message)
    return json({ error: err?.message || 'Internal server error' }, 500)
  }
})
