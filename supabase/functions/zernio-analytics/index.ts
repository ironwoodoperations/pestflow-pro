// Edge Function: zernio-analytics — S225
// On-demand social analytics snapshot. Mirrors the pagespeed-proxy (S224 C2)
// auth + write pattern: requireTenantUser gate, getCorsHeaders, every call
// writes a row to zernio_runs (service role).
//
// Deploy with verify_jwt: true (C2 pattern). tenant_id comes from the request
// body and is validated against the caller's JWT-derived profile.tenant_id.
//   supabase functions deploy zernio-analytics --project-ref biezzykcgzkrwdgqpsar
//
// STATUS — Zernio analytics API contract is UNKNOWN as of S225.
//   No analytics/insights call exists anywhere in the codebase, the Zernio
//   docs were unreachable from the build sandbox, and the S225 validator gate
//   was waived (harness lacked Perplexity/Gemini + network egress). Until the
//   real endpoint + response shape is confirmed, this function records a
//   status='unconfigured' row so the Reports surface works end-to-end and
//   shows an "analytics integration coming soon" empty state.
//
//   >>> TODO(S225-followup): wire the real Zernio analytics endpoint. <<<
//   Replace the marked block below with the live fetch. Auth/base-URL pattern
//   to copy: zernio-connect/index.ts + post-to-social/index.ts —
//     base   https://zernio.com/api/v1/
//     auth   Authorization: Bearer ${ZERNIO_API_KEY}   (platform env var)
//     scope  profileId = settings.integrations.zernio_profile_id
//     accts  settings.integrations.zernio_accounts  { zernioPlatform: accountId }
//   Expected normalized shape to persist in zernio_runs.data:
//     { fb:{followers,engagement,reach}, ig:{...}, yt:{...}, gbp:{...} }
//   and the untouched provider payload in zernio_runs.data_raw.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireTenantUser, AuthError } from '../_shared/auth/requireTenantUser.ts'
import { getCorsHeaders } from '../_shared/cors.ts'

// Zernio platform string → frontend/storage key (google_business is the exception)
const FROM_ZERNIO: Record<string, string> = {
  facebook: 'facebook',
  instagram: 'instagram',
  youtube: 'youtube',
  linkedin: 'linkedin',
  tiktok: 'tiktok',
  googlebusiness: 'google_business',
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // 1. CORS preflight bypass (no auth required)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Parse body (tenant_id required for auth scoping)
    const { tenant_id } = await req.json().catch(() => ({}))
    if (!tenant_id) throw new Error('tenant_id is required')

    // 3. Auth — validate JWT + tenant ownership
    try {
      await requireTenantUser(req, tenant_id)
    } catch (e) {
      if (e instanceof AuthError) {
        return new Response(JSON.stringify(e.body), {
          status: e.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw e
    }
    const tenantId = tenant_id

    // 4. Service-role client for settings read + run write
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const zernioApiKey = Deno.env.get('ZERNIO_API_KEY') ?? ''
    if (!zernioApiKey) {
      return new Response(
        JSON.stringify({ error: 'Social analytics not configured. Contact your account manager.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 5. Load tenant Zernio profile + connected accounts
    const { data: setting } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('tenant_id', tenantId)
      .eq('key', 'integrations')
      .maybeSingle()

    const integrations = (setting?.value ?? {}) as {
      zernio_profile_id?: string
      zernio_accounts?: Record<string, string>
    }
    const profileId = integrations.zernio_profile_id
    const zernioAccounts = integrations.zernio_accounts ?? {}

    const writeRun = async (row: Record<string, unknown>) => {
      const { data, error } = await supabaseAdmin
        .from('zernio_runs')
        .insert({ tenant_id: tenantId, ...row })
        .select()
        .single()
      if (error) {
        console.error('[zernio-analytics] run insert failed:', error.message)
        throw new Error(`Database write failed: ${error.message}`)
      }
      return data
    }

    if (!profileId) {
      const run = await writeRun({
        status: 'error',
        api_error_code: 'no_profile',
        api_error_msg: 'No Zernio profile connected for this tenant.',
      })
      return new Response(
        JSON.stringify({ status: 'error', message: 'No Zernio profile connected.', run }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ───────────────────────────────────────────────────────────────────────
    // >>> TODO(S225-followup): replace this block with the real Zernio
    //     analytics fetch once the endpoint + response shape is confirmed.
    //     Build `data` as { [storageKey]: { followers, engagement, reach } }
    //     using FROM_ZERNIO to map Zernio platform strings → storage keys,
    //     and persist the raw provider payload in `data_raw`.
    // ───────────────────────────────────────────────────────────────────────
    void FROM_ZERNIO
    const connectedCount = Object.values(zernioAccounts).filter(Boolean).length
    const run = await writeRun({
      status: 'unconfigured',
      data: null,
      data_raw: { profile_id: profileId, connected_accounts: connectedCount },
      api_error_code: 'analytics_not_wired',
      api_error_msg: 'Zernio analytics integration is not yet wired (S225 skeleton).',
    })

    return new Response(
      JSON.stringify({ status: 'unconfigured', run }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const msg = (err as Error).message
    const isAuth = msg.toLowerCase().includes('unauth') || msg.toLowerCase().includes('tenant')
    return new Response(
      JSON.stringify({ error: msg }),
      {
        status: isAuth ? 401 : 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      },
    )
  }
})
