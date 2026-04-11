// Edge Function: send-intake-email
// Sends intake invitation email to a prospect via Resend.
// JWT-protected — caller must be an authenticated Ironwood user.
//
// Deploy: supabase functions deploy send-intake-email --project-ref biezzykcgzkrwdgqpsar

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

    const { prospectEmail, prospectName, intakeUrl, businessName } = await req.json()

    if (!prospectEmail || !intakeUrl) {
      return new Response(JSON.stringify({ error: 'prospectEmail and intakeUrl are required' }), { status: 400 })
    }

    const name = prospectName || businessName || 'there'

    await sendEmail({
      to: prospectEmail,
      replyTo: 'onboarding@pestflowpro.com',
      subject: `${businessName || 'PestFlow Pro'} — Your website setup link is ready`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:#16a34a">Your PestFlow Pro Website Setup</h2>
  <p>Hi ${name},</p>
  <p>We're getting your new website ready! Please take a few minutes to fill
  out the setup form so we can personalize everything for your business.</p>
  <p style="text-align:center;margin:32px 0">
    <a href="${intakeUrl}"
       style="background:#16a34a;color:white;padding:14px 28px;
              border-radius:6px;text-decoration:none;font-weight:bold">
      Complete My Website Setup →
    </a>
  </p>
  <p style="color:#666;font-size:14px">This link expires in 14 days.
  If you have questions, reply to this email.</p>
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
    console.error('[send-intake-email]', String(err))
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
