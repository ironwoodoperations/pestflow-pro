// Edge Function: send-credentials-email
// Sends admin login credentials to the client after their site is provisioned.
// JWT-protected.
//
// Deploy: supabase functions deploy send-credentials-email --project-ref biezzykcgzkrwdgqpsar

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/sendEmail.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    // Verify JWT
    const authHeader = req.headers.get('Authorization') || ''
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { adminEmail, adminPassword, slug, businessName } = await req.json()

    if (!adminEmail || !slug) {
      return new Response(JSON.stringify({ error: 'adminEmail and slug are required' }), { status: 400 })
    }

    const biz   = businessName || 'Your Business'
    const siteUrl  = `https://${slug}.pestflowpro.com`
    const adminUrl = `https://${slug}.pestflowpro.com/admin/login`

    await sendEmail({
      to: adminEmail,
      subject: `Your ${biz} website is live!`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:#16a34a">🎉 Your Website is Live!</h2>
  <p>Hi there,</p>
  <p>Your new <strong>${biz}</strong> website is ready. Here are your admin login details:</p>
  <table style="width:100%;border-collapse:collapse;margin:24px 0">
    <tr style="background:#f9f9f9">
      <td style="padding:12px;font-weight:bold">Website</td>
      <td style="padding:12px">
        <a href="${siteUrl}" style="color:#16a34a">${siteUrl}</a>
      </td>
    </tr>
    <tr>
      <td style="padding:12px;font-weight:bold">Admin Login</td>
      <td style="padding:12px">
        <a href="${adminUrl}" style="color:#16a34a">${adminUrl}</a>
      </td>
    </tr>
    <tr style="background:#f9f9f9">
      <td style="padding:12px;font-weight:bold">Email</td>
      <td style="padding:12px">${adminEmail}</td>
    </tr>
    ${adminPassword ? `<tr>
      <td style="padding:12px;font-weight:bold">Password</td>
      <td style="padding:12px">${adminPassword}</td>
    </tr>` : ''}
  </table>
  <p style="color:#666;font-size:14px">
    We recommend changing your password after your first login.
  </p>
  <p style="margin-top:32px;color:#888;font-size:12px">
    Powered by <a href="https://pestflowpro.com" style="color:#888">PestFlow Pro</a>
  </p>
</div>`,
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    console.error('[send-credentials-email]', String(err))
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
