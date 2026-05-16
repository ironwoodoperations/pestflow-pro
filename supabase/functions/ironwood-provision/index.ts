// Edge Function: ironwood-provision
// JWT-verified wrapper: verifies caller is admin@pestflowpro.com, then calls provision-tenant.
// Also updates the prospect record with tenant_id + provisioned_at.
// S221: writes a durable provisioning_status row keyed by X-Correlation-ID
// so a dropped client can recover state on dashboard reload (Ghost Success).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL             = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  // S221: correlation ID threads provision + credentials-email status rows.
  const correlationId =
    req.headers.get('X-Correlation-ID') ||
    req.headers.get('x-correlation-id') ||
    crypto.randomUUID()

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json', 'X-Correlation-ID': correlationId, ...CORS },
    })

  // service_role client — bypasses RLS for provisioning_status writes.
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // S221: best-effort status writes — never let a status write break provisioning.
  const markFailed = async (message: string) => {
    try {
      await supabase.from('provisioning_status')
        .update({ status: 'provision_failed', error_message: message })
        .eq('correlation_id', correlationId)
        .eq('status', 'provision_requested')
    } catch (e) {
      console.error('[ironwood-provision] status markFailed write failed:', (e as Error)?.message)
    }
  }

  try {
    // Verify JWT — use service role client (reliable for any valid JWT)
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || ''
    const token = authHeader.replace(/^[Bb]earer\s+/, '').trim()
    if (!token) return json({ error: 'Unauthorized' }, 401)

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    console.log('ironwood-provision | user:', user?.email, '| cid:', correlationId, '| error:', authError?.message)
    if (authError || !user || user.email !== 'admin@pestflowpro.com') {
      return json({ error: 'Forbidden' }, 403)
    }

    const body = await req.json()
    const {
      prospect_id, slug, admin_email, admin_password,
      business_info, branding, customization, social, subscription,
    } = body

    if (!slug || !admin_email) return json({ error: 'slug and admin_email are required' }, 400)

    // S221: write provision_requested status row (best-effort).
    try {
      await supabase.from('provisioning_status').insert({
        correlation_id: correlationId,
        prospect_id: prospect_id || null,
        admin_email,
        operator_user_id: user.id,
        status: 'provision_requested',
      })
    } catch (e) {
      console.error('[ironwood-provision] status insert failed:', (e as Error)?.message)
    }

    // Build provision-tenant payload
    const payload = {
      slug,
      admin_email,
      admin_password: admin_password || '',
      prospect_id: prospect_id || null,
      business_info: business_info || {},
      branding: branding || {},
      customization: customization || {},
      social_links: {
        facebook:  social?.facebook  || '',
        instagram: social?.instagram || '',
        google:    social?.google    || '',
        youtube:   social?.youtube   || '',
      },
      subscription: subscription || { tier: 1, plan_name: 'Starter', monthly_price: 149 },
    }

    // Call provision-tenant. The S211a in-source gate validates
    // `x-pfp-internal-key` (not `apikey`) — distinct header name avoids
    // collision with the legacy belt-and-suspenders `apikey: SERVICE_ROLE_KEY`
    // header below. Backlog: that legacy `apikey` line is dead code (stripe-
    // webhook → provision-tenant works without it); cleanup belongs in a
    // hygiene PR, not S211a.
    const provRes = await fetch(`${SUPABASE_URL}/functions/v1/provision-tenant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'x-pfp-internal-key': Deno.env.get('PROVISION_TENANT_INTERNAL_SECRET') ?? '',
      },
      body: JSON.stringify(payload),
    })
    const rawText = await provRes.text()
    let result: any
    try {
      result = JSON.parse(rawText)
    } catch {
      console.error('provision-tenant returned non-JSON:', rawText.slice(0, 500))
      await markFailed('provision-tenant returned a non-JSON response')
      return json({ error: 'provision-tenant returned an unexpected response. Check edge function logs.' }, 500)
    }

    console.log('provision-tenant result:', JSON.stringify(result))

    if (!result.success) {
      await markFailed(result.error || 'Provision failed')
      return json({ error: result.error || 'Provision failed' }, 500)
    }

    // S221: mark provision_succeeded + record tenant_id (best-effort).
    try {
      await supabase.from('provisioning_status')
        .update({ status: 'provision_succeeded', tenant_id: result.tenant_id })
        .eq('correlation_id', correlationId)
        .eq('status', 'provision_requested')
    } catch (e) {
      console.error('[ironwood-provision] status succeeded write failed:', (e as Error)?.message)
    }

    // Update prospect record
    if (prospect_id) {
      const { error: upErr } = await supabase.from('prospects').update({
        tenant_id: result.tenant_id,
        provisioned_at: new Date().toISOString(),
        status: 'provisioned',
      }).eq('id', prospect_id)
      if (upErr) console.error('Failed to update prospect:', upErr.message)
    }

    return json({ success: true, tenant_id: result.tenant_id, slug: result.slug, url: result.url })
  } catch (err: any) {
    console.error('ironwood-provision error:', err?.message)
    await markFailed(err?.message ?? String(err))
    return json({ error: err?.message || 'Internal server error' }, 500)
  }
})
