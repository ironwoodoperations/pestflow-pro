// Supabase Edge Function: zernio-connect
// Two actions:
//   get_connect_url — returns Zernio OAuth URL for a given platform
//   list_accounts   — lists connected accounts and syncs zernio_accounts in settings
// JWT: OFF — called directly from client admin dashboard
// DEPLOY:
//   supabase functions deploy zernio-connect --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Frontend platform key → Zernio platform string
const TO_ZERNIO: Record<string, string> = {
  facebook:       'facebook',
  instagram:      'instagram',
  youtube:        'youtube',
  linkedin:       'linkedin',
  tiktok:         'tiktok',
  google_business:'googlebusiness',
}

// Zernio platform string → frontend platform key
const FROM_ZERNIO: Record<string, string> = {
  facebook:       'facebook',
  instagram:      'instagram',
  youtube:        'youtube',
  linkedin:       'linkedin',
  tiktok:         'tiktok',
  googlebusiness: 'google_business',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const ZERNIO_API_KEY = Deno.env.get('ZERNIO_API_KEY')
  const SUPABASE_URL   = Deno.env.get('SUPABASE_URL') ?? ''
  const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!ZERNIO_API_KEY) {
    return new Response(JSON.stringify({ error: 'Social posting not configured. Contact your account manager.' }), {
      status: 503, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  let body: { action: string; tenantId: string; platform?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const { action, tenantId, platform } = body
  if (!action || !tenantId) {
    return new Response(JSON.stringify({ error: 'action and tenantId are required' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  // Load tenant integrations to get Zernio profile ID
  const { data: setting } = await supabase
    .from('settings')
    .select('value')
    .eq('tenant_id', tenantId)
    .eq('key', 'integrations')
    .maybeSingle()

  const integrations = setting?.value ?? {}
  const profileId: string | undefined = integrations.zernio_profile_id

  if (!profileId) {
    return new Response(JSON.stringify({ error: 'No Zernio profile found. Contact support.' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // ── get_connect_url ─────────────────────────────────────────────────────────
  if (action === 'get_connect_url') {
    if (!platform) {
      return new Response(JSON.stringify({ error: 'platform is required for get_connect_url' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }
    const zernioPlatform = TO_ZERNIO[platform] ?? platform

    // Fetch tenant slug for redirect URL
    const { data: tenantRow } = await supabase.from('tenants').select('slug').eq('id', tenantId).maybeSingle()
    const tenantSlug = tenantRow?.slug || tenantId
    const redirectUrl = `https://${tenantSlug}.pestflowpro.com/admin?tab=social&connected=true`

    const connectUrl = new URL(`https://zernio.com/api/v1/connect/${zernioPlatform}`)
    connectUrl.searchParams.set('profileId', profileId)
    connectUrl.searchParams.set('redirectUrl', redirectUrl)

    const res = await fetch(connectUrl.toString(), {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${ZERNIO_API_KEY}` },
    })
    const data = await res.json()
    console.log('[zernio-connect] get_connect_url response:', JSON.stringify(data))

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data?.error || `Zernio error: ${res.status}` }), {
        status: res.status, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ authUrl: data.authUrl || data.url }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // ── list_accounts ────────────────────────────────────────────────────────────
  if (action === 'list_accounts') {
    const res = await fetch(`https://zernio.com/api/v1/accounts?profileId=${profileId}`, {
      headers: { 'Authorization': `Bearer ${ZERNIO_API_KEY}` },
    })
    const data = await res.json()
    console.log('[zernio-connect] list_accounts response:', JSON.stringify(data))

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data?.error || `Zernio error: ${res.status}` }), {
        status: res.status, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Build zernio_accounts map using Zernio platform keys for storage
    // e.g. { facebook: 'acc_xxx', googlebusiness: 'acc_yyy' }
    const zernioAccounts: Record<string, string> = {}
    for (const account of data.accounts ?? []) {
      zernioAccounts[account.platform] = account._id
    }

    // Sync to settings
    await supabase.from('settings')
      .update({ value: { ...integrations, zernio_accounts: zernioAccounts } })
      .eq('tenant_id', tenantId)
      .eq('key', 'integrations')

    // Return accounts with frontend-friendly platform keys for UI display
    const accounts = (data.accounts ?? []).map((a: { _id: string; platform: string; name: string }) => ({
      ...a,
      frontendKey: FROM_ZERNIO[a.platform] ?? a.platform,
    }))

    return new Response(JSON.stringify({ accounts }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ error: 'Invalid action' }), {
    status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
