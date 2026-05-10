// Edge Function: send-intake-email
// Sends intake invitation email to a prospect via Resend.
// Admin-only — verifies caller's user.email === admin@pestflowpro.com via Authorization Bearer.
//
// Deploy: supabase functions deploy send-intake-email --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL             = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendEmail({ to, subject, html, replyTo }: { to: string; subject: string; html: string; replyTo?: string }) {
  const key = Deno.env.get('RESEND_API_KEY') || ''
  const payload: Record<string, unknown> = { from: 'PestFlow Pro <noreply@pestflow.ai>', to, subject, html }
  if (replyTo) payload.reply_to = replyTo
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Resend failed: ${await res.text()}`)
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    // Verify JWT — service role client validates any valid Supabase JWT,
    // then enforce admin-only allowlist.
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || ''
    const token = authHeader.replace(/^[Bb]earer\s+/, '').trim()
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    console.log('[send-intake-email] user:', user?.email, '| error:', authErr?.message)
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
    if (user.email !== 'admin@pestflowpro.com') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
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
}

if (import.meta.main) {
  Deno.serve(handler)
}
