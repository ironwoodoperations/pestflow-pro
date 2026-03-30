// Supabase Edge Function: api-quote
// Public API endpoint for headless quote form embeds on external sites.
//
// POST /api-quote
// Body: { tenant_id, name, email, phone, services?, message?, address?, referral? }
// Returns: { success: true, lead_id: string }
//
// CORS-enabled for cross-origin requests from external websites.
//
// SETUP:
// 1. Deploy: supabase functions deploy api-quote --project-ref biezzykcgzkrwdgqpsar
// 2. The function URL will be: https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/api-quote

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    const { tenant_id, name, email, phone, services, message, address, referral } = body

    // Validate required fields
    if (!tenant_id || !name || !email || !phone) {
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        required: ['tenant_id', 'name', 'email', 'phone'],
      }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Verify tenant exists
    const { data: tenant } = await supabase.from('tenants').select('id').eq('id', tenant_id).maybeSingle()
    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Invalid tenant_id' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Insert lead
    const { data: lead, error } = await supabase.from('leads').insert({
      tenant_id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      services: Array.isArray(services) ? services : services ? [services] : null,
      message: message?.trim() || null,
    }).select('id').single()

    if (error) {
      return new Response(JSON.stringify({ error: 'Failed to create lead' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
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
})
