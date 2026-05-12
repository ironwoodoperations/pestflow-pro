// Supabase Edge Function: api-quote
// Public API endpoint for quote/contact form submissions.
//
// POST /api-quote
// Body: { tenant_id, name, email, phone, services?, message?, address?, referral?, customer_sms_consent? }
// Returns: { success: true, lead_id: string }
//
// Customer-ack SMS (s202): if customer_sms_consent === true and the tenant has
// settings.notifications.customer_sms_enabled !== false, dispatch a customer
// acknowledgment SMS via send-sms with type 'customer'. Owner SMS is NOT
// dispatched here — that path runs through the trigger_notify_new_lead chain.
//
// CORS-enabled for cross-origin requests from external websites and the
// Next.js public lead forms (ContactForm, QuoteForm).
//
// SETUP:
// 1. Deploy: supabase functions deploy api-quote --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar
// 2. Set SEND_SMS_INTERNAL_SECRET secret on this function (matches send-sms env var).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  // ── C1 GATE — anonymous-public, rate-limit + origin ─────────────────
  const origin = req.headers.get('origin') ?? req.headers.get('referer') ?? ''
  const allowedOriginPattern = /^https?:\/\/([a-z0-9-]+\.)?pestflowpro\.com(\/|$)|^https?:\/\/([a-z0-9-]+\.)?homeflowpro\.ai(\/|$)|^https?:\/\/([a-z0-9-]+\.)?dangpestcontrol\.com(\/|$)/i

  if (origin && !allowedOriginPattern.test(origin)) {
    console.warn('[api-quote] origin rejected:', origin)
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const clientIp = (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim())
    || req.headers.get('cf-connecting-ip')
    || 'unknown'

  const supabaseForRL = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { count: rlCount } = await supabaseForRL
    .from('rate_limit_events')
    .select('id', { count: 'exact', head: true })
    .eq('key', `api-quote:${clientIp}`)
    .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())

  if ((rlCount ?? 0) >= 5) {
    console.warn('[api-quote] rate limit hit for IP:', clientIp)
    return new Response(JSON.stringify({ error: 'Too many submissions. Please try again in a few minutes.' }), {
      status: 429,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  await supabaseForRL.from('rate_limit_events').insert({
    key: `api-quote:${clientIp}`,
    created_at: new Date().toISOString(),
  })
  // ────────────────────────────────────────────────────────────────────

  try {
    const body = await req.json()
    const { tenant_id, name, email, phone, services, message, customer_sms_consent } = body

    if (!tenant_id || !name || !email || !phone) {
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        required: ['tenant_id', 'name', 'email', 'phone'],
      }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: tenant } = await supabase.from('tenants').select('id').eq('id', tenant_id).maybeSingle()
    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Invalid tenant_id' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()

    const { data: lead, error } = await supabase.from('leads').insert({
      tenant_id,
      name: trimmedName,
      email: email.trim().toLowerCase(),
      phone: trimmedPhone,
      services: Array.isArray(services) ? services : services ? [services] : null,
      message: message?.trim() || null,
    }).select('id').maybeSingle()

    if (error || !lead) {
      return new Response(JSON.stringify({ error: 'Failed to create lead' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Customer-ack SMS — optional, non-fatal. Owner SMS is the trigger's job.
    if (customer_sms_consent === true && trimmedPhone) {
      const { data: notifRow } = await supabase
        .from('settings')
        .select('value')
        .eq('tenant_id', tenant_id)
        .eq('key', 'notifications')
        .maybeSingle()
      const customerSmsEnabled = notifRow?.value?.customer_sms_enabled !== false

      if (customerSmsEnabled) {
        const { data: bizRow } = await supabase
          .from('settings')
          .select('value')
          .eq('tenant_id', tenant_id)
          .eq('key', 'business_info')
          .maybeSingle()
        const businessName: string = bizRow?.value?.name || 'our team'
        // Canonical template (post-S202): mirrors ContactForm's prior browser-side copy.
        const customerMessage = `Hi ${trimmedName}, thanks for contacting ${businessName}! We received your message and will be in touch shortly.`
        const SEND_SMS_INTERNAL_SECRET = Deno.env.get('SEND_SMS_INTERNAL_SECRET') ?? ''
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SEND_SMS_INTERNAL_SECRET,
            },
            body: JSON.stringify({
              tenant_id,
              to: trimmedPhone,
              message: customerMessage,
              type: 'customer',
            }),
          })
        } catch (err) {
          console.error('[api-quote] customer SMS dispatch failed (non-fatal):', String(err))
        }
      } else {
        console.log(`[api-quote] customer SMS skipped — tenant ${tenant_id} has customer_sms_enabled=false`)
      }
    }

    return new Response(JSON.stringify({ success: true, lead_id: lead.id }), {
      status: 201,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
}

if (import.meta.main) {
  Deno.serve(handler)
}
