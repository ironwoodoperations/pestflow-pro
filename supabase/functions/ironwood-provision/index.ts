// Edge Function: ironwood-provision
// JWT-verified wrapper: verifies caller is admin@pestflowpro.com, then calls provision-tenant.
// Also updates the prospect record with tenant_id + provisioned_at.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

  try {
    // Verify JWT
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '').trim()
    if (!token) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user || user.email !== 'admin@pestflowpro.com') {
      return json({ error: 'Forbidden' }, 403)
    }

    const body = await req.json()
    const {
      prospect_id, slug, admin_email, admin_password,
      business_info, branding, customization, social, subscription,
    } = body

    if (!slug || !admin_email) return json({ error: 'slug and admin_email are required' }, 400)

    // Build provision-tenant payload
    const payload = {
      slug,
      admin_email,
      admin_password: admin_password || '',
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

    // Call provision-tenant (no JWT required — service role header bypasses RLS)
    const provRes = await fetch(`${SUPABASE_URL}/functions/v1/provision-tenant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify(payload),
    })
    const rawText = await provRes.text()
    let result: any
    try {
      result = JSON.parse(rawText)
    } catch {
      console.error('provision-tenant returned non-JSON:', rawText.slice(0, 500))
      return json({ error: 'provision-tenant returned an unexpected response. Check edge function logs.' }, 500)
    }

    console.log('provision-tenant result:', JSON.stringify(result))

    if (!result.success) return json({ error: result.error || 'Provision failed' }, 500)

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
    return json({ error: err?.message || 'Internal server error' }, 500)
  }
})
