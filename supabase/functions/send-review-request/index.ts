// Supabase Edge Function: send-review-request
// Sends a review request email via Resend when a lead is marked "won".
//
// POST body: { lead_id, tenant_id } OR { tenant_id, email_override, name_override }
// Returns: { sent: true } | { skipped: true, reason: string } | { error: string }
//
// Deploy: supabase functions deploy send-review-request --project-ref biezzykcgzkrwdgqpsar

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

Deno.serve(async (req) => {
  try {
    const { lead_id, tenant_id, email_override, name_override } = await req.json()
    if (!tenant_id) {
      return new Response(JSON.stringify({ error: 'Missing tenant_id' }), { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    let recipientEmail: string | undefined
    let recipientName: string | undefined

    if (email_override) {
      // Direct call with override (e.g. from testimonial cards)
      recipientEmail = email_override
      recipientName = name_override || 'Valued Customer'
    } else {
      // Normal flow: fetch lead by lead_id
      if (!lead_id) {
        return new Response(JSON.stringify({ error: 'Missing lead_id or email_override' }), { status: 400 })
      }
      const { data: lead } = await supabase.from('leads').select('name, email').eq('id', lead_id).maybeSingle()
      if (!lead || !lead.email) {
        return new Response(JSON.stringify({ skipped: true, reason: 'no_lead_email' }), { status: 200 })
      }
      recipientEmail = lead.email
      recipientName = lead.name
    }

    // Fetch business info and integrations in parallel
    const [bizRes, intRes] = await Promise.all([
      supabase.from('settings').select('value').eq('tenant_id', tenant_id).eq('key', 'business_info').maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', tenant_id).eq('key', 'integrations').maybeSingle(),
    ])

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
        from: `${businessName} <noreply@pestflow.ai>`,
        to: [recipientEmail],
        subject: `Thanks for choosing ${businessName}! Share your experience`,
        text: `Hi ${recipientName},

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
