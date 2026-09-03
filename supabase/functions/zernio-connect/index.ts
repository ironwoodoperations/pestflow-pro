// Supabase Edge Function: zernio-connect
// Two actions:
//   get_connect_url — returns the social-authorization URL for a given platform
//   list_accounts   — lists connected accounts and syncs zernio_accounts in settings
//
// AUTH (S329): requireTenantAdmin — the caller must be an admin OF THE REQUESTED TENANT.
// verify_jwt stays FALSE at the gateway, matching post-to-social / places-reviews /
// ai-proxy: this function is its own auth point. Pinning that value in config.toml
// belongs to the separate config-pinning session — config.toml is a trigger path for
// .github/workflows/redeploy-edge-on-shared-change.yml.
//
// DEPLOY:
//   ./scripts/deploy-function.sh zernio-connect --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireTenantAdmin, AuthError } from '../_shared/auth/requireTenantUser.ts'
import { stripVaultSecrets } from '../_shared/secrets/stripVaultSecrets.ts'
import { PLATFORM_NAME } from '../../../shared/lib/platformBrand.ts'
import {
  isUsableProfileId,
  isPlaceholderProfileId,
  isDemoTenant,
  parseProfileId,
  buildAdminReturnUrl,
  ERR_NOT_SET_UP,
  ERR_DEMO_TENANT,
  ERR_UNAVAILABLE,
} from './connectLogic.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' },
  })

// Frontend platform key → vendor platform string
const TO_ZERNIO: Record<string, string> = {
  facebook:       'facebook',
  instagram:      'instagram',
  youtube:        'youtube',
  linkedin:       'linkedin',
  tiktok:         'tiktok',
  google_business:'googlebusiness',
}

// Vendor platform string → frontend platform key
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

  let body: { action: string; tenantId: string; platform?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }

  const { action, tenantId, platform } = body
  if (!action || !tenantId) {
    return json({ error: 'action and tenantId are required' }, 400)
  }

  // ── S329 ITEM 1 — THE AUTH GATE. NOTHING TOUCHES TENANT DATA ABOVE THIS LINE. ───────
  //
  // Before this existed the function had NO caller authentication of any kind: no JWT
  // check at the gateway (verify_jwt=false), no getUser, no internal-secret compare, no
  // origin check. It read `tenantId` straight out of the request body and queried with
  // the service-role key, so an anonymous POST reached a tenant-scoped settings row and
  // could enumerate that tenant's connected social accounts and mint authorization URLs
  // for it. Verified live against the deployed function.
  //
  // `tenantId` still comes from the body — that is fine and is the same shape
  // post-to-social uses. It names the tenant being REQUESTED; requireTenantAdmin then
  // proves the caller is an admin OF THAT TENANT against tenant_users, which is what
  // makes the body value safe to act on. The body is never authority by itself.
  //
  // POSITION IS LOAD-BEARING, and connectLogic.test.ts asserts it: the gate must run
  // before the settings read, before the demo lookup and before any vendor call — a
  // check that runs after the data is fetched has already leaked it.
  try {
    await requireTenantAdmin(req, tenantId)
  } catch (e) {
    if (e instanceof AuthError) return e.toResponse()
    throw e
  }

  const ZERNIO_API_KEY = Deno.env.get('ZERNIO_API_KEY')
  const SUPABASE_URL   = Deno.env.get('SUPABASE_URL') ?? ''
  const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  // integrations, demo_mode and business_info in ONE round trip: the demo guard needs
  // the second and the create branch names the profile from the third.
  const { data: settingRows } = await supabase
    .from('settings')
    .select('key, value')
    .eq('tenant_id', tenantId)
    .in('key', ['integrations', 'demo_mode', 'business_info'])

  const rows = (settingRows ?? []) as Array<{ key: string; value: Record<string, unknown> }>
  const integrations = rows.find((r) => r.key === 'integrations')?.value ?? {}
  const demoMode     = rows.find((r) => r.key === 'demo_mode')?.value ?? null
  const businessInfo = rows.find((r) => r.key === 'business_info')?.value ?? {}

  // ── THE MISSING-KEY BRANCH, MADE OBSERVABLE (S326 item 3's shape). ─────────────────
  // ALLOWLISTED FIELDS ONLY: reason, step, tenant_id. Never the key, never a fragment
  // of it, never an upstream body — S313, where a raw provider error echoed a
  // recipient's address into function logs.
  //
  // This check sits AFTER the auth gate on purpose. It used to be the first thing the
  // function did, which told an ANONYMOUS caller whether the platform credential was
  // configured. That is a small leak, but it is free to close.
  if (!ZERNIO_API_KEY) {
    console.warn('[zernio-connect] skipped — reason=not_configured step=create_profile tenant_id=' + tenantId)
    const { error: markErr } = await supabase
      .from('settings')
      .update({ value: { ...stripVaultSecrets(integrations), zernio_last_error: 'not_configured' } })
      .eq('tenant_id', tenantId).eq('key', 'integrations')
    if (markErr) console.error('[zernio-connect] failed to record not_configured marker:', markErr.message)
    return json({ error: ERR_UNAVAILABLE }, 503)
  }

  // Read ONCE, here: the create branch names the profile from it and get_connect_url
  // builds the return URL from it. custom_domain and subdomain are one extra column each
  // on a SELECT that had to run anyway.
  const { data: tenantRow } = await supabase
    .from('tenants').select('slug, subdomain, custom_domain').eq('id', tenantId).maybeSingle()
  const tenantSlug = (tenantRow?.slug as string) || tenantId

  let profileId = integrations.zernio_profile_id

  // ── S329 ITEM 2 — LAZY PROFILE CREATION. ───────────────────────────────────────────
  if (!isUsableProfileId(profileId)) {
    // DEMO TENANTS NEVER CONSUME EXTERNAL QUOTA (S289). Two independent reasons to
    // refuse, and both are needed:
    //   * the DEMO_FAKE_ placeholder — the five demo tenants carry one today; and
    //   * demo_mode.active === true — because a demo tenant provisioned from now on
    //     gets a REAL id or none at all, so the placeholder alone would stop catching
    //     them. The flag is the actual rule; the placeholder is the legacy marker.
    // Refusing LOCALLY is the point: the placeholder is truthy, so the old falsy check
    // sent it to the vendor and the client got a remote error about an id that never
    // existed.
    if (isPlaceholderProfileId(profileId) || isDemoTenant(demoMode)) {
      return json({ error: ERR_DEMO_TENANT }, 400)
    }

    // RE-READ IMMEDIATELY BEFORE CREATING. Two admins clicking Connect at once is
    // realistic, and the vendor's create endpoint has no idempotency key and no
    // conditional create — a double call bills for two profiles. This narrows the
    // window to the request itself; it does not close it (no advisory lock here), which
    // is the honest description.
    const { data: fresh } = await supabase
      .from('settings').select('value')
      .eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()
    const freshIntegrations = (fresh?.value ?? {}) as Record<string, unknown>
    if (isUsableProfileId(freshIntegrations.zernio_profile_id)) {
      profileId = freshIntegrations.zernio_profile_id
    } else {
      let created: string | undefined
      try {
        const res = await fetch('https://zernio.com/api/v1/profiles', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${ZERNIO_API_KEY}`, 'Content-Type': 'application/json' },
          // SAME SHAPE AS provision-tenant STEP 8, deliberately: a profile created here
          // and one created at provisioning must be indistinguishable in the vendor's
          // dashboard, or the operator cannot tell which tenant a profile belongs to.
          // PLATFORM_NAME, never a typed literal — S294 defines it in exactly one place.
          // (The business name lives in settings.business_info, NOT in integrations.)
          body: JSON.stringify({
            name: ((businessInfo as { name?: string }).name) || tenantSlug,
            description: `${PLATFORM_NAME} tenant: ${tenantSlug}`,
          }),
        })
        const data = await res.json().catch(() => null)
        created = res.ok ? parseProfileId(data) : undefined
        if (!created) {
          // status only — never the upstream body, which is unbounded third-party text.
          console.error('[zernio-connect] create_profile failed — status=' + res.status + ' tenant_id=' + tenantId)
        }
      } catch (err) {
        console.error('[zernio-connect] create_profile threw — tenant_id=' + tenantId +
                      ' name=' + (err as Error)?.name)
      }

      if (!created) {
        await supabase.from('settings')
          .update({ value: { ...stripVaultSecrets(freshIntegrations), zernio_last_error: 'create_failed' } })
          .eq('tenant_id', tenantId).eq('key', 'integrations')
        return json({ error: ERR_NOT_SET_UP }, 502)
      }

      // MERGE, NEVER REPLACE. dang holds 23 keys in this blob, including OAuth tokens;
      // a whole-blob write destroys them. Through stripVaultSecrets, exactly as the
      // zernio_accounts sync below already does. (provision-tenant:654 writes this same
      // key WITHOUT stripVaultSecrets — a recorded, out-of-scope defect. Not copied.)
      const { error: saveErr } = await supabase.from('settings')
        .update({ value: { ...stripVaultSecrets(freshIntegrations), zernio_profile_id: created, zernio_last_error: null } })
        .eq('tenant_id', tenantId).eq('key', 'integrations')
      if (saveErr) {
        console.error('[zernio-connect] failed to persist profile id — tenant_id=' + tenantId + ' err=' + saveErr.message)
        return json({ error: ERR_NOT_SET_UP }, 500)
      }
      console.log('[zernio-connect] created profile — step=create_profile tenant_id=' + tenantId)
      profileId = created
    }
  }

  // ── get_connect_url ─────────────────────────────────────────────────────────────────
  if (action === 'get_connect_url') {
    if (!platform) {
      return json({ error: 'platform is required for get_connect_url' }, 400)
    }
    const zernioPlatform = TO_ZERNIO[platform] ?? platform

    // Server-derived, from the tenant row read above and nothing else. See
    // buildAdminReturnUrl's comment: no part of this comes from request input, which is
    // what keeps it free of open-redirect risk.
    const redirectUrl = buildAdminReturnUrl({
      slug: tenantSlug,
      subdomain: (tenantRow?.subdomain as string | null) ?? null,
      custom_domain: (tenantRow?.custom_domain as string | null) ?? null,
    })

    const connectUrl = new URL(`https://zernio.com/api/v1/connect/${zernioPlatform}`)
    connectUrl.searchParams.set('profileId', profileId as string)
    connectUrl.searchParams.set('redirectUrl', redirectUrl)

    const res = await fetch(connectUrl.toString(), {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${ZERNIO_API_KEY}` },
    })
    const data = await res.json()

    if (!res.ok) {
      // The upstream error is LOGGED, not returned: it is unbounded third-party text
      // and has already been observed to name our internal provider to the client.
      console.error('[zernio-connect] get_connect_url upstream — status=' + res.status +
                    ' tenant_id=' + tenantId + ' body=' + JSON.stringify(data))
      return json({ error: ERR_NOT_SET_UP }, res.status)
    }
    return json({ authUrl: data.authUrl || data.url }, 200)
  }

  // ── list_accounts ────────────────────────────────────────────────────────────────────
  if (action === 'list_accounts') {
    const res = await fetch(`https://zernio.com/api/v1/accounts?profileId=${profileId}`, {
      headers: { 'Authorization': `Bearer ${ZERNIO_API_KEY}` },
    })
    const data = await res.json()

    if (!res.ok) {
      console.error('[zernio-connect] list_accounts upstream — status=' + res.status +
                    ' tenant_id=' + tenantId + ' body=' + JSON.stringify(data))
      return json({ error: ERR_NOT_SET_UP }, res.status)
    }

    // Storage uses the vendor's own platform keys, e.g. { facebook: 'acc_xxx' }.
    const zernioAccounts: Record<string, string> = {}
    for (const account of data.accounts ?? []) {
      zernioAccounts[account.platform] = account._id
    }

    // Re-read before the merge: the create branch above may have rewritten this blob.
    const { data: current } = await supabase
      .from('settings').select('value')
      .eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()

    await supabase.from('settings')
      // S255: strip Vault-managed secrets before the blob round-trip.
      .update({ value: { ...stripVaultSecrets((current?.value ?? {}) as Record<string, unknown>), zernio_accounts: zernioAccounts } })
      .eq('tenant_id', tenantId)
      .eq('key', 'integrations')

    const accounts = (data.accounts ?? []).map((a: { _id: string; platform: string; name: string }) => ({
      ...a,
      frontendKey: FROM_ZERNIO[a.platform] ?? a.platform,
    }))

    return json({ accounts }, 200)
  }

  return json({ error: 'Invalid action' }, 400)
})
