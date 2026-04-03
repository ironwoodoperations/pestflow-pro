// Supabase Edge Function: send-review-request
// Sends a review request email via Resend when a lead is marked "won".
//
// POST body: { lead_id, tenant_id }
// Returns: { sent: true } | { skipped: true, reason: string } | { error: string }
//
// Deploy: supabase functions deploy send-review-request --project-ref biezzykcgzkrwdgqpsar

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

Deno.serve(async (req) => {
  try {
    const { lead_id, tenant_id } = await req.json()
    if (!lead_id || !tenant_id) {
      return new Response(JSON.stringify({ error: 'Missing lead_id or tenant_id' }), { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch lead, business info, and integrations in parallel
    const [leadRes, bizRes, intRes] = await Promise.all([
      supabase.from('leads').select('name, email').eq('id', lead_id).maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', tenant_id).eq('key', 'business_info').maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', tenant_id).eq('key', 'integrations').maybeSingle(),
    ])

    const lead = leadRes.data
    if (!lead || !lead.email) {
      return new Response(JSON.stringify({ skipped: true, reason: 'no_lead_email' }), { status: 200 })
    }

    const businessName = bizRes.data?.value?.name || 'Our Team'
    const googlePlaceId = intRes.data?.value?.google_place_id

    if (!googlePlaceId) {
      return new Response(JSON.stringify({ skipped: true, reason: 'no_place_id' }), { status: 200 })
    }

    const googleReviewLink = `https://search.google.com/local/writereview?placeid=${googlePlaceId}`

    // Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${businessName} <no-reply@resend.dev>`,
        to: [lead.email],
        subject: `Thanks for choosing ${businessName}! Share your experience`,
        text: `Hi ${lead.name},

Thank you for choosing ${businessName}! We hope you're thrilled with the service.

We'd love to hear your feedback — it only takes a minute:
${googleReviewLink}

Thanks again,
The ${businessName} Team`,
      }),
    })

    if (!emailRes.ok) {
      const errBody = await emailRes.text()
      return new Response(JSON.stringify({ error: `Resend error: ${errBody}` }), { status: 500 })
    }

    return new Response(JSON.stringify({ sent: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
