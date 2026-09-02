// Supabase Edge Function: provision-tenant
// Reads onboarding_sessions for wizard data (name, colors, shell, etc.) when available.
// Falls back to direct body fields for legacy/manual calls.
// Creates auth user, seeds tenant_users, and provisions all 11 required settings keys.
// S164: service_areas seeded via normalizer; settings.seo.service_areas derived from table.
//
// Auth (S211a): verify_jwt:false at platform; in-source validation of
//   `x-pfp-internal-key` header against PROVISION_TENANT_INTERNAL_SECRET env var.
//   Header name deliberately differs from the platform `apikey` because the
//   ironwood-provision caller previously sent `apikey: SUPABASE_SERVICE_ROLE_KEY`
//   (legacy belt-and-suspenders, stripped in S220 D). Reusing `apikey` for our
//   gate would either silently lose the gate value to JS object-literal last-wins
//   on the source side, or cause WHATWG header-merge ", " join on the wire —
//   fail-closing every legitimate call. Distinct header name eliminates the trap.
//
// S220 changes:
//   B1 — state→IANA timezone helper + always-seed timezone in business_info JSONB
//   B2a — tenant-collision guard before mutating an existing user
//   B2b — password sync via updateUserById in the existing-user branch
//   B2c — lookup-fail hardening (was silently provisioning admin-less tenant)
//
// Deploy: supabase functions deploy provision-tenant --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateAuthorityPrompts, isDemoTenant, isOperatorTenant } from '../_shared/authorityPrompts.ts'
import {
  validateVertical, buildPageContentRows, buildSeoSettings, buildPageSeoMeta,
  buildServiceAreaHeroTitle, buildServiceAreaSeo, SEED_PLATFORM_SLUGS,
} from '../_shared/provisioningSeed.ts'
import { timingSafeEqual } from 'node:crypto'
import { normalizeAll, buildJsonbProjection } from '../_shared/service-areas.ts'
import { PLATFORM_NAME } from '../../../shared/lib/platformBrand.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─────────────────────────────────────────────────────────────────────
// S220 B1: State → IANA timezone resolution
//
// Seeds business_info.timezone defensively. The business_info_structured_shape
// CHECK requires timezone present whenever hours_structured is present, AND
// requires timezone to be a non-empty string whenever it's present at all.
// Without a seeded default, the customer's first admin save of the Business
// Info form (which submits the default 7-day hours_structured array) violates
// the constraint.
//
// Map covers all 50 US states + DC. Multi-TZ states assigned by
// business-center majority. Customer can override in dashboard.
//
// NOT in scope: international timezones, intra-state TZ boundaries
// (KY/TN/FL/MI/IN/ND/SD etc. all have minority TZ regions).
// Customer overrides via dashboard if the majority guess is wrong for them.
// ─────────────────────────────────────────────────────────────────────

const STATE_TZ_MAP: Record<string, string> = {
  // Central
  TX: 'America/Chicago', OK: 'America/Chicago', KS: 'America/Chicago',
  NE: 'America/Chicago', MN: 'America/Chicago', IA: 'America/Chicago',
  MO: 'America/Chicago', AR: 'America/Chicago', LA: 'America/Chicago',
  MS: 'America/Chicago', AL: 'America/Chicago', WI: 'America/Chicago',
  IL: 'America/Chicago', TN: 'America/Chicago', ND: 'America/Chicago',
  SD: 'America/Chicago',
  // Eastern
  FL: 'America/New_York', GA: 'America/New_York', SC: 'America/New_York',
  NC: 'America/New_York', VA: 'America/New_York', WV: 'America/New_York',
  OH: 'America/New_York', MI: 'America/New_York', IN: 'America/New_York',
  PA: 'America/New_York', NJ: 'America/New_York', NY: 'America/New_York',
  CT: 'America/New_York', RI: 'America/New_York', MA: 'America/New_York',
  NH: 'America/New_York', VT: 'America/New_York', ME: 'America/New_York',
  DE: 'America/New_York', MD: 'America/New_York', DC: 'America/New_York',
  KY: 'America/New_York',
  // Mountain
  CO: 'America/Denver', WY: 'America/Denver', MT: 'America/Denver',
  NM: 'America/Denver', UT: 'America/Denver', ID: 'America/Denver',
  // Pacific
  CA: 'America/Los_Angeles', WA: 'America/Los_Angeles',
  OR: 'America/Los_Angeles', NV: 'America/Los_Angeles',
  // Arizona (no DST)
  AZ: 'America/Phoenix',
  // Alaska & Hawaii
  AK: 'America/Anchorage', HI: 'Pacific/Honolulu',
}

const STATE_NAME_TO_CODE: Record<string, string> = {
  ALABAMA: 'AL', ALASKA: 'AK', ARIZONA: 'AZ', ARKANSAS: 'AR',
  CALIFORNIA: 'CA', COLORADO: 'CO', CONNECTICUT: 'CT', DELAWARE: 'DE',
  FLORIDA: 'FL', GEORGIA: 'GA', HAWAII: 'HI', IDAHO: 'ID',
  ILLINOIS: 'IL', INDIANA: 'IN', IOWA: 'IA', KANSAS: 'KS',
  KENTUCKY: 'KY', LOUISIANA: 'LA', MAINE: 'ME', MARYLAND: 'MD',
  MASSACHUSETTS: 'MA', MICHIGAN: 'MI', MINNESOTA: 'MN', MISSISSIPPI: 'MS',
  MISSOURI: 'MO', MONTANA: 'MT', NEBRASKA: 'NE', NEVADA: 'NV',
  'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM',
  'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND',
  OHIO: 'OH', OKLAHOMA: 'OK', OREGON: 'OR', PENNSYLVANIA: 'PA',
  'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC', 'SOUTH DAKOTA': 'SD',
  TENNESSEE: 'TN', TEXAS: 'TX', UTAH: 'UT', VERMONT: 'VT',
  VIRGINIA: 'VA', WASHINGTON: 'WA', 'WEST VIRGINIA': 'WV',
  WISCONSIN: 'WI', WYOMING: 'WY',
  'DISTRICT OF COLUMBIA': 'DC', 'WASHINGTON DC': 'DC', 'WASHINGTON D.C.': 'DC',
}

/**
 * Resolve a US state input (2-letter code, full name, or mixed-case)
 * to a canonical IANA timezone string. Always returns a non-empty
 * IANA string — never null/undefined/empty. Falls back to
 * America/Chicago for missing/unrecognized input.
 *
 * Accepts: 'TX', 'Texas', 'texas', '  TX  ', '', null, undefined, garbage.
 */
function resolveTimezoneFromState(state: string | null | undefined): string {
  if (!state || typeof state !== 'string') return 'America/Chicago'
  const normalized = state.trim().toUpperCase()
  if (!normalized) return 'America/Chicago'
  // Direct 2-letter code match
  if (STATE_TZ_MAP[normalized]) return STATE_TZ_MAP[normalized]
  // Full-name → code → IANA lookup
  const code = STATE_NAME_TO_CODE[normalized]
  if (code && STATE_TZ_MAP[code]) return STATE_TZ_MAP[code]
  // Unrecognized — fallback to Central (operator-overridable)
  return 'America/Chicago'
}

interface RequestBody {
  tenant_id?: string
  slug?: string
  admin_email?: string
  admin_password?: string
  prospect_id?: string
  onboarding_session_id?: string
  business_info: {
    name: string; phone: string; email: string; address: string; tagline: string; industry: string
    /**
     * S290 — the TRADE, and the only field anything can key on. `industry` is
     * free text from an onboarding input (pls's live value is a 154-character
     * paragraph), which is why no preset has ever been able to look at it.
     * 'pest' | 'irrigation' | omitted. See settings_business_info_vertical_valid.
     */
    vertical?: string
  }
  branding: { logo_url: string; primary_color: string; template: string }
  customization?: {
    hero_headline?: string
    show_license?: boolean
    show_years?: boolean
    show_technicians?: boolean
    show_certifications?: boolean
  }
  social_links: { facebook: string; instagram: string; google: string; youtube: string }
  integrations: { google_place_id: string; ga4_id: string }
  plan: string
  subscription: { tier: number; plan_name: string; monthly_price: number }
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  // ── AUTH (must run before anything else) ────────────────────────────
  const expectedSecret = Deno.env.get('PROVISION_TENANT_INTERNAL_SECRET') || ''
  const presentedSecret = req.headers.get('x-pfp-internal-key') || ''

  if (!expectedSecret) {
    console.error('[provision-tenant] PROVISION_TENANT_INTERNAL_SECRET env var not set; rejecting all requests')
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }

  // node:crypto.timingSafeEqual — constant-time compare. Throws on length mismatch,
  // so length-equality pre-check is required. (crypto.subtle has no timingSafeEqual
  // in Deno/Web Crypto; node:crypto is the supported primitive in Supabase Edge Runtime.)
  const enc = new TextEncoder()
  const a = enc.encode(expectedSecret)
  const b = enc.encode(presentedSecret)
  const authOk = a.length === b.length && timingSafeEqual(a, b)

  if (!authOk) {
    console.warn('[provision-tenant] auth failed — x_pfp_internal_key_present:', !!presentedSecret, 'x_pfp_internal_key_length_match:', a.length === b.length)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }

  try {
    const body: RequestBody = await req.json()
    const { slug, admin_email, admin_password, prospect_id, onboarding_session_id,
            business_info: bi, branding, customization: bodyCustomization,
            social_links: social, integrations, subscription } = body

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // --- Fetch onboarding session wizard data (preferred path) ---
    let wd: Record<string, any> | null = null
    if (onboarding_session_id) {
      const { data: sessionRow } = await supabase
        .from('onboarding_sessions')
        .select('wizard_data')
        .eq('id', onboarding_session_id)
        .eq('consumed', false)
        .maybeSingle()
      if (sessionRow?.wizard_data) {
        wd = sessionRow.wizard_data
        console.log(`Loaded wizard data from onboarding_session ${onboarding_session_id}`)
      } else {
        console.warn(`onboarding_session ${onboarding_session_id} not found or already consumed — falling back to body fields`)
      }
    }

    // Helper: prefer wizard data field, fall back to direct body field
    const wbi  = wd?.business_info  || {}
    const wbr  = wd?.branding       || {}
    const wcu  = wd?.customization  || {}
    const wsl  = wd?.social_links   || {}
    const wsub = wd?.subscription   || {}

    // S262 — numeric access entitlement (1=Starter…4=Elite) for tenants.entitlement,
    // set EXPLICITLY at provisioning. The column has NO database default; absence
    // must fail loud, never silently default to Starter. Derived from the SOLD plan,
    // never from a payment record (entitlement ≠ price is a permanent business rule).
    const _entToNum = (raw: string | number | undefined | null): number => {
      if (typeof raw === 'number') return raw >= 1 && raw <= 4 ? raw : 1
      const sl = typeof raw === 'string' ? raw.toLowerCase().trim() : ''
      return sl === 'elite' ? 4 : sl === 'pro' ? 3 : (sl === 'growth' || sl === 'grow') ? 2 : 1
    }
    const entitlement = _entToNum(
      wsub.tier ?? subscription?.tier ?? wsub.plan_name ?? subscription?.plan_name ?? body.plan,
    )

    // S290 — RESOLVE THE VERTICAL ONCE, HERE, before a single row is seeded.
    //
    // One source: the wizard (where a human picks it from a selector) or the
    // request body. Deliberately NOT intake_data — that overlay runs after
    // page_content is already written, so honouring a vertical there would seed
    // one trade's pages and record another's name.
    //
    // FAIL LOUDLY. settings_business_info_vertical_valid takes the two literals
    // or NULL; anything else is rejected with 23514 inside a settings upsert
    // that logs the error and carries on, leaving a tenant provisioned with no
    // vertical and no one aware. A 400 here is the whole point.
    const _verticalCheck = validateVertical(wbi.vertical ?? (bi as { vertical?: unknown })?.vertical)
    if (_verticalCheck.error) {
      console.error('[provision-tenant] REJECTED —', _verticalCheck.error)
      return new Response(JSON.stringify({ success: false, error: _verticalCheck.error }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }
    const resolvedVertical = _verticalCheck.vertical
    console.log(`[provision-tenant] vertical: ${resolvedVertical ?? 'NOT RECORDED (neutral seed)'}`)

    // Resolve slug
    const resolvedSlug = (wd?.slug || slug || bi.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)).trim()
    if (!resolvedSlug) {
      return new Response(JSON.stringify({ error: 'slug or business_info.name is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    // Resolve admin credentials — wizard data takes priority
    const resolvedAdminEmail    = (wd ? (wbi.email || admin_email) : admin_email) || ''
    const resolvedAdminPassword = (wd ? (wd.admin_password || admin_password) : admin_password) || ''

    // BUG C: Validate admin email has a dot after @
    if (resolvedAdminEmail) {
      const atIdx = resolvedAdminEmail.indexOf('@')
      const afterAt = atIdx >= 0 ? resolvedAdminEmail.slice(atIdx + 1) : ''
      if (atIdx < 0 || !afterAt.includes('.')) {
        return new Response(JSON.stringify({ success: false, error: 'Admin email must be a valid address (e.g. admin@company.com)' }), {
          status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
        })
      }
    }

    // Step 1: Resolve or create tenant row
    let tenantId = body.tenant_id?.trim() || ''
    if (!tenantId) {
      // SAFEGUARD: Refuse to provision if slug already exists — never overwrite an existing tenant
      const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', resolvedSlug)
        .maybeSingle()
      if (existing) {
        console.warn(`[provision-tenant] BLOCKED — slug "${resolvedSlug}" already exists (tenant ${existing.id})`)
        return new Response(JSON.stringify({
          error: 'Tenant slug already exists',
          existingSlug: resolvedSlug,
          suggestion: resolvedSlug + '2',
        }), { status: 409, headers: { 'Content-Type': 'application/json', ...CORS } })
      } else {
        const name = wbi.name || bi.name || resolvedSlug
        const { data: newTenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({ slug: resolvedSlug, name, entitlement })
          .select('id')
          .single()
        if (tenantError || !newTenant) {
          return new Response(JSON.stringify({ error: 'Failed to create tenant: ' + (tenantError?.message || 'unknown') }), {
            status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
          })
        }
        tenantId = newTenant.id
      }
    } else {
      const name = wbi.name || bi.name || resolvedSlug
      await supabase.from('tenants').update({ slug: resolvedSlug, name, entitlement }).eq('id', tenantId)
    }

    // Step 2: Create auth user
    if (resolvedAdminEmail && resolvedAdminPassword) {
      const { data: authData, error: createUserError } = await supabase.auth.admin.createUser({
        email:         resolvedAdminEmail,
        password:      resolvedAdminPassword,
        email_confirm: true,
      })

      // Resolve the user ID — from fresh creation or existing user lookup
      let resolvedUserId: string | null = authData?.user?.id || null
      if (createUserError) {
        if (createUserError.message?.includes('already been registered') || createUserError.message?.includes('already exists')) {
          console.warn('[provision-tenant] Auth user already exists for email:', resolvedAdminEmail, '— looking up existing user ID')
          // TODO(S220-backlog): Replace listUsers() with a SECURITY DEFINER RPC
          // (find_auth_user_id_by_email) when user count exceeds ~100. Current
          // implementation is O(n). At current scale (<50 users) acceptable.
          const { data: { users } } = await supabase.auth.admin.listUsers()
          const existing = users.find((u: any) => u.email === resolvedAdminEmail)
          resolvedUserId = existing?.id || null

          // S220 B2c: lookup-failed hardening. Previously this only console.error'd
          // and fell through to provision a tenant with no admin user — silently broken.
          if (!resolvedUserId) {
            console.error('[provision-tenant] BLOCKED — gotrue reported user exists but lookup returned no record. Inconsistent auth state.')
            return new Response(JSON.stringify({
              success: false,
              error: `Email ${resolvedAdminEmail} reported as already registered, but lookup returned no user record. Inconsistent auth state — investigate manually before retrying.`,
            }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } })
          }

          // S220 B2a: Tenant-collision guard. Before mutating an existing user, confirm
          // they aren't currently admin on a DIFFERENT tenant. If they are, refuse.
          // Re-provisioning would yank them from their current tenant, invalidate their
          // active sessions, and change their password without consent — a hijacking
          // failure mode the validator gate flagged as the highest risk on this fix.
          const { data: existingProfile, error: profileLookupErr } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', resolvedUserId)
            .maybeSingle()

          if (profileLookupErr) {
            console.error('[provision-tenant] Profile lookup failed during collision check:', profileLookupErr.message)
            return new Response(JSON.stringify({
              success: false,
              error: `Profile lookup failed during collision check: ${profileLookupErr.message}`,
            }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } })
          }

          if (existingProfile?.tenant_id && existingProfile.tenant_id !== tenantId) {
            console.error(
              '[provision-tenant] BLOCKED — tenant collision on existing user:',
              resolvedAdminEmail,
              'current_tenant:', existingProfile.tenant_id,
              'requested_tenant:', tenantId,
            )
            return new Response(JSON.stringify({
              success: false,
              error: `Email ${resolvedAdminEmail} is already admin on a different tenant (${existingProfile.tenant_id}). Cannot re-provision to ${tenantId}. Use a different admin email, or detach the user from their current tenant first.`,
              existing_tenant_id: existingProfile.tenant_id,
              requested_tenant_id: tenantId,
            }), { status: 409, headers: { 'Content-Type': 'application/json', ...CORS } })
          }

          // S220 B2b: Password sync. updateUserById writes the credentials-email
          // password into auth.users. Without this, the customer receives credentials
          // they can't use. gotrue v2.149+ kills active sessions on password change —
          // desired behavior here (customer just got new credentials, fresh login is
          // the goal). Admin route bypasses gotrue confirmation emails.
          const { error: pwSyncErr } = await supabase.auth.admin.updateUserById(
            resolvedUserId,
            { password: resolvedAdminPassword }
          )
          if (pwSyncErr) {
            // Differentiate transient (gotrue 5xx) from logic (4xx) errors so
            // operator knows whether retry is safe. Avoids the retry-loop trap.
            const status = (pwSyncErr as any).status || 500
            const isTransient = status >= 500
            console.error(
              '[provision-tenant] Password sync failed for existing user:',
              resolvedAdminEmail,
              '| status:', status,
              '| msg:', pwSyncErr.message,
              '| transient:', isTransient,
            )
            return new Response(JSON.stringify({
              success: false,
              error: `Password sync failed for existing user: ${pwSyncErr.message}`,
              transient: isTransient,
              retry_safe: isTransient,
            }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } })
          }
          console.log('[provision-tenant] Password synced for existing user:', resolvedAdminEmail)
        } else {
          console.error('[provision-tenant] createUser failed:', createUserError.message)
          return new Response(JSON.stringify({
            success: false,
            error: `Failed to create admin user: ${createUserError.message}`,
          }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } })
        }
      }

      if (resolvedUserId) {
        const companyName = wbi.name || bi?.name || resolvedSlug
        // tenant_users — the SSOT for tenant membership + role (S273).
        const { error: tuError } = await supabase
          .from('tenant_users')
          .insert({ tenant_id: tenantId, user_id: resolvedUserId, role: 'admin' })
        if (tuError && tuError.code !== '23505') {
          console.error('Failed to insert tenant_users:', tuError.message)
        }
        // profiles — display/full_name only. S273: `role` removed (retired column,
        // dropped in the S273 migration); privilege lives solely in tenant_users.role.
        // The `user_roles` write is also gone (dead table dropped in S273).
        const { error: profError } = await supabase
          .from('profiles')
          .upsert({ id: resolvedUserId, tenant_id: tenantId, full_name: companyName + ' Admin' }, { onConflict: 'id' })
        if (profError) console.error('Failed to upsert profiles:', profError.message)
      }
    } else {
      console.warn('Skipping auth user creation — missing email or password')
    }

    // Step 3: Seed all 11 required settings keys using wizard data where available
    const email = wbi.email || bi.email || ''

    // Resolve subscription tier — store as lowercase string: starter|growth|pro|elite
    const _toTierStr = (raw: string | number | undefined): string => {
      if (typeof raw === 'number') {
        return raw === 4 ? 'elite' : raw === 3 ? 'pro' : raw === 2 ? 'growth' : 'starter'
      }
      if (typeof raw === 'string' && raw) {
        const sl = raw.toLowerCase().trim()
        if (sl === 'elite') return 'elite'
        if (sl === 'pro') return 'pro'
        if (sl === 'growth' || sl === 'grow') return 'growth'
        if (sl === 'starter') return 'starter'
      }
      return 'starter'
    }
    const _rawTier = wsub.tier ?? subscription?.tier
    const _planStr  = wsub.plan_name || subscription?.plan_name || body.plan || ''
    const tierStr: string = _rawTier != null ? _toTierStr(_rawTier) : (_planStr ? _toTierStr(_planStr) : 'starter')
    const _tierPrices: Record<string, number> = { starter: 149, growth: 249, pro: 349, elite: 499 }
    const resolvedPlanName  = tierStr.charAt(0).toUpperCase() + tierStr.slice(1)
    const resolvedMonthlyPrice = wsub.monthly_price || subscription?.monthly_price || _tierPrices[tierStr] || 149

    // S168.3.2: atomicity helpers — mirror CHECK constraints in settings.business_info
    const _addrFilled = [wbi.street_address, wbi.address_locality, wbi.address_region, wbi.postal_code]
      .filter((v: unknown) => v && String(v).trim()).length
    const _bizAddrKeys = _addrFilled === 4
      ? { street_address: wbi.street_address, address_locality: wbi.address_locality, address_region: wbi.address_region, postal_code: wbi.postal_code }
      : {}
    const _bizGeoKeys = (typeof wbi.latitude === 'number' && typeof wbi.longitude === 'number')
      ? { latitude: wbi.latitude, longitude: wbi.longitude }
      : {}

    // S220 B1: Always seed a non-empty timezone. CHECK constraint requires it
    // whenever hours_structured is later added by customer's admin save.
    // Resolution priority: explicit wizard tz → wizard/body state → Chicago fallback.
    const _explicitTz = wbi.timezone
    const resolvedTimezone: string =
      (typeof _explicitTz === 'string' && _explicitTz.trim().length > 0)
        ? _explicitTz.trim()
        : resolveTimezoneFromState(wbi.address_region || (bi as any).address_region)

    const _bizHoursKeys: Record<string, unknown> =
      (Array.isArray(wbi.hours_structured) && wbi.hours_structured.length > 0)
        ? { hours_structured: wbi.hours_structured, timezone: resolvedTimezone }
        : { timezone: resolvedTimezone }

    const settingsRows = [
      { tenant_id: tenantId, key: 'business_info', value: {
        name:            wbi.name            || bi.name    || '',
        phone:           wbi.phone           || bi.phone   || '',
        email,
        address:         wbi.address         || bi.address || '',
        hours:           wbi.hours           || '',
        tagline:         wbi.tagline         || bi.tagline || '',
        // Free text, and it stays free text — but it no longer DEFAULTS to a
        // trade. An unrecorded industry is '', not 'Pest Control'.
        industry:          wbi.industry                    || '',
        // Omitted entirely when not recorded, so the row matches the existing
        // tenants whose vertical is a real NULL rather than a JSON null.
        ...(resolvedVertical ? { vertical: resolvedVertical } : {}),
        license:           wbi.license                    || '',
        certifications:    wbi.certifications             || '',
        founded_year:      wbi.founded_year || wbi.year_founded || '',
        num_technicians:   wbi.num_technicians            || '',
        owner_name:        wbi.owner_name || bi?.owner_name || '',
        after_hours_phone: wbi.after_hours_phone          || '',
        ..._bizAddrKeys,
        ...(wbi.address_country ? { address_country: wbi.address_country } : {}),
        ..._bizGeoKeys,
        ...(wbi.geocode_source ? { geocode_source: wbi.geocode_source } : {}),
        ..._bizHoursKeys,
      }},
      { tenant_id: tenantId, key: 'branding', value: {
        logo_url:      wbr.logo_url      || branding?.logo_url      || '',
        favicon_url:   wbr.favicon_url   || branding?.favicon_url   || '',
        primary_color: wbr.primary_color || branding?.primary_color || '#E87800',
        accent_color:  wbr.accent_color  || branding?.accent_color  || '#1a1a1a',
        theme:         wbr.template      || branding?.template      || 'modern-pro',
        cta_text:      wbr.cta_text      || branding?.cta_text      || 'Get a Free Quote',
      }},
      { tenant_id: tenantId, key: 'customization', value: {
        hero_headline:        wcu.hero_headline        ?? bodyCustomization?.hero_headline ?? (wbi.tagline || bi?.tagline || ''),
        show_license:         wcu.show_license         ?? bodyCustomization?.show_license         ?? true,
        show_years:           wcu.show_years           ?? bodyCustomization?.show_years           ?? true,
        show_technicians:     wcu.show_technicians     ?? bodyCustomization?.show_technicians     ?? true,
        show_certifications:  wcu.show_certifications  ?? bodyCustomization?.show_certifications  ?? true,
      }},
      { tenant_id: tenantId, key: 'social_links', value: {
        facebook:  wsl.facebook  || social?.facebook  || (body as any).social_facebook  || '',
        instagram: wsl.instagram || social?.instagram || (body as any).social_instagram || '',
        google:    wsl.google    || social?.google    || (body as any).social_google    || '',
        youtube:   wsl.youtube   || social?.youtube   || (body as any).social_youtube   || '',
      }},
      // S255: facebook_access_token and textbelt_api_key are Vault secrets — no
      // longer seeded as empty placeholders here. Until set via set-tenant-secret
      // they simply don't exist in Vault; the read-path helper raises
      // VaultSecretMissingError, handled per function as "not configured".
      // google_maps_api_key is a client-side browser key and intentionally stays
      // in settings (out of scope for the Vault migration).
      { tenant_id: tenantId, key: 'integrations', value: {
        google_place_id:     integrations?.google_place_id || '',
        google_analytics_id: integrations?.ga4_id          || '',
        google_maps_api_key: '',
        owner_sms_number:    (wbi.phone || bi.phone || '').replace(/\D/g, ''),
        facebook_page_id:    '',
      }},
      { tenant_id: tenantId, key: 'onboarding_complete', value: { complete: false } },
      { tenant_id: tenantId, key: 'hero_media',           value: { master_hero_image_url: '', image_url: '', mode: 'image', url: '', thumbnail_url: '', video_url: '', youtube_id: '' } },
      { tenant_id: tenantId, key: 'holiday_mode',         value: { enabled: false, holiday: '', message: '', auto_schedule: '' } },
      { tenant_id: tenantId, key: 'notifications',        value: { cc_email: '', lead_email: resolvedAdminEmail || email } },
      { tenant_id: tenantId, key: 'demo_mode',            value: { active: false, seeded_at: '' } },
      { tenant_id: tenantId, key: 'subscription', value: {
        tier:          tierStr,
        plan:          tierStr,
        plan_name:     resolvedPlanName,
        monthly_price: resolvedMonthlyPrice,
        status:        'active',
      }},
    ]

    for (const row of settingsRows) {
      const { error } = await supabase.from('settings').upsert(row, { onConflict: 'tenant_id,key' })
      if (error) console.error(`Failed to upsert ${row.key}:`, error.message)
    }

    // Step 4: Seed page_content rows — FROM THE VERTICAL, not from a pest block.
    //
    // This used to write a home title of "{name} — Professional Pest Control"
    // and twelve pest service pages for every tenant on the platform, plus
    // subtitles asserting things nobody had said: "Licensed & insured
    // professionals", "Locally owned and operated", "Fast, effective results",
    // "Comprehensive pest management solutions". All deleted, not reworded —
    // see supabase/functions/_shared/provisioningSeed.ts.
    //
    // An unrecorded vertical seeds the five platform pages and NO service
    // pages. That is the correct output, and it is what makes an unknown trade
    // yield nothing rather than yield pest.
    const businessName = wbi.name || bi?.name || resolvedSlug
    const heroHeadline = wcu.hero_headline || bodyCustomization?.hero_headline || businessName
    const pageContentRows = buildPageContentRows({
      vertical: resolvedVertical,
      businessName,
      heroHeadline,
    }).map((row) => ({ tenant_id: tenantId, ...row }))
    for (const row of pageContentRows) {
      const { error: pcErr } = await supabase.from('page_content').upsert(row, { onConflict: 'tenant_id,page_slug' })
      if (pcErr) console.error(`Failed to upsert page_content ${row.page_slug}:`, pcErr.message)
    }
    console.log(`[provision-tenant] page_content seeded: ${pageContentRows.length} rows (vertical: ${resolvedVertical ?? 'none'})`)

    // Step 5: Overlay page_content with real scraped data (if available on the prospect)
    if (prospect_id) {
      try {
        const { data: prospect } = await supabase
          .from('prospects')
          .select('scraped_content')
          .eq('id', prospect_id)
          .maybeSingle()

        const sc = prospect?.scraped_content as Record<string, { title?: string; subtitle?: string; intro?: string }> | null
        if (sc && Object.keys(sc).length > 0) {
          for (const [slug, pc] of Object.entries(sc)) {
            if (!pc.title && !pc.intro) continue
            const { error: scErr } = await supabase.from('page_content').upsert({
              tenant_id: tenantId,
              page_slug: slug,
              title:    pc.title    || undefined,
              subtitle: pc.subtitle || undefined,
              intro:    pc.intro    || undefined,
            }, { onConflict: 'tenant_id,page_slug' })
            if (scErr) console.error(`scraped page_content upsert failed for ${slug}:`, scErr.message)
          }
          console.log(`Seeded ${Object.keys(sc).length} page_content rows from scraped_content`)
        }
      } catch (scrapedErr: any) {
        console.error('scraped_content seeding failed (non-fatal):', scrapedErr?.message)
      }
    }

    // Step 7: Mark onboarding session as consumed
    if (onboarding_session_id && wd) {
      await supabase
        .from('onboarding_sessions')
        .update({ consumed: true })
        .eq('id', onboarding_session_id)
    }

    // Step 8: Create Zernio profile for social media posting (non-fatal)
    try {
      const ZERNIO_API_KEY = Deno.env.get('ZERNIO_API_KEY')
      if (ZERNIO_API_KEY) {
        const zernioRes = await fetch('https://zernio.com/api/v1/profiles', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${ZERNIO_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: businessName || resolvedSlug,
            description: `${PLATFORM_NAME} tenant: ${resolvedSlug}`,
          }),
        })
        const zernioData = await zernioRes.json()
        console.log('[provision-tenant] Zernio raw response:', JSON.stringify(zernioData))
        // Zernio may return profile._id, profile.id, or id at root
        const zernioProfileId: string | undefined =
          zernioData?.profile?._id || zernioData?.profile?.id || zernioData?.id || zernioData?._id

        if (zernioProfileId) {
          console.log(`[provision-tenant] Zernio profile created: ${zernioProfileId}`)
          const { data: existingIntg } = await supabase
            .from('settings')
            .select('value')
            .eq('tenant_id', tenantId)
            .eq('key', 'integrations')
            .maybeSingle()
          const currentIntg = existingIntg?.value ?? {}
          const { error: zernioSaveErr } = await supabase
            .from('settings')
            .update({ value: { ...currentIntg, zernio_profile_id: zernioProfileId } })
            .eq('tenant_id', tenantId)
            .eq('key', 'integrations')
          if (zernioSaveErr) console.error('[provision-tenant] Failed to save zernio_profile_id:', zernioSaveErr.message)
        } else {
          console.warn('[provision-tenant] Zernio profile creation returned no ID:', JSON.stringify(zernioData))
        }
      }
    } catch (zernioErr: any) {
      console.error('Zernio profile creation failed (non-fatal):', zernioErr?.message)
    }

    // Step 9: Seed from intake_data (non-fatal)
    if (prospect_id) {
      try {
        const { data: prosp } = await supabase
          .from('prospects')
          .select('intake_data, company_name, service_areas')
          .eq('id', prospect_id)
          .maybeSingle()

        const intake = prosp?.intake_data as Record<string, any> | null
        const ib = intake?.business || {}
        const city  = (ib.city  || '').trim()
        const state = (ib.state || '').trim()
        const bizForSeo = ib.business_name || businessName

        // 9a: Overlay business_info with intake data
        // S168.3.2 note: 10 structured keys flow through via ...currentBi spread.
        // No explicit mapping needed here — primary seed at ~line 208 handles them.
        if (city || state || ib.zip || ib.address || ib.business_name || ib.phone || ib.email || ib.hours || ib.tagline || ib.owner_name || ib.founded_year || ib.license_number || ib.num_technicians) {
          const { data: existingBiRow } = await supabase.from('settings').select('value')
            .eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
          const currentBi = existingBiRow?.value ?? {}
          const fullAddress = [ib.address, city, state, ib.zip].filter(Boolean).join(', ')
          await supabase.from('settings').update({
            value: {
              ...currentBi,
              ...(ib.business_name    ? { name:            ib.business_name }    : {}),
              ...(ib.phone            ? { phone:           ib.phone }            : {}),
              ...(ib.email            ? { email:           ib.email }            : {}),
              ...(fullAddress         ? { address:         fullAddress }         : {}),
              ...(ib.hours            ? { hours:           ib.hours }            : {}),
              ...(ib.tagline          ? { tagline:         ib.tagline }          : {}),
              ...(ib.owner_name       ? { owner_name:      ib.owner_name }       : {}),
              ...(ib.founded_year     ? { founded_year:    ib.founded_year }     : {}),
              ...(ib.license_number   ? { license:         ib.license_number }   : {}),
              ...(ib.num_technicians  ? { num_technicians: ib.num_technicians }  : {}),
            }
          }).eq('tenant_id', tenantId).eq('key', 'business_info')
          console.log('[provision-tenant] business_info overlaid from intake_data')
        }

        // 9a-br: Overlay branding with intake_data.branding (logo, colors, template)
        const ib_br = (intake?.branding || {}) as Record<string, any>
        if (ib_br.logo_url || ib_br.primary_color || ib_br.accent_color || ib_br.template || ib_br.cta_text) {
          const { data: existingBrRow } = await supabase.from('settings').select('value')
            .eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle()
          const currentBr = existingBrRow?.value ?? {}
          await supabase.from('settings').update({
            value: {
              ...currentBr,
              ...(ib_br.logo_url      ? { logo_url:      ib_br.logo_url }      : {}),
              ...(ib_br.primary_color ? { primary_color: ib_br.primary_color } : {}),
              ...(ib_br.accent_color  ? { accent_color:  ib_br.accent_color }  : {}),
              ...(ib_br.template      ? { theme:         ib_br.template }      : {}),
              ...(ib_br.cta_text      ? { cta_text:      ib_br.cta_text }      : {}),
            }
          }).eq('tenant_id', tenantId).eq('key', 'branding')
          console.log('[provision-tenant] branding overlaid from intake_data')
        }

        // 9b: Seed SEO settings key — service_areas written as [] placeholder;
        // will be overwritten by the projection step (9f) after table rows are seeded.
        //
        // The old fallback read "Professional pest control services by X.
        // Serving {area} and surrounding areas." — a trade nobody recorded and
        // a coverage claim nobody made. Both are now derived or omitted.
        const seoSeed = buildSeoSettings({
          vertical: resolvedVertical,
          businessName: bizForSeo,
          city, state,
          tagline: ib.tagline ?? '',
        })
        await supabase.from('settings').upsert(
          { tenant_id: tenantId, key: 'seo', value: {
            meta_description: seoSeed.meta_description,
            service_areas: [],
            focus_keyword: seoSeed.focus_keyword,
          }},
          { onConflict: 'tenant_id,key' }
        )

        // 9b-seo: Per-page SEO meta on page_content rows.
        //
        // Every string this used to write asserted something invented:
        // "Licensed technicians, fast response, guaranteed results. Call for a
        // free quote.", "Family-owned, fully licensed and insured.", "Fast,
        // effective, guaranteed.", "Free inspections available." Gone.
        const pageSeoMap = buildPageSeoMeta({
          vertical: resolvedVertical,
          businessName: bizForSeo,
          city, state,
          phone: ib.phone || '',
        })
        for (const pageSlug of Object.keys(pageSeoMap)) {
          const seo = pageSeoMap[pageSlug]
          await supabase.from('page_content').update({ meta_title: seo.meta_title, meta_description: seo.meta_description })
            .eq('tenant_id', tenantId).eq('page_slug', pageSlug)
        }
        console.log(`[provision-tenant] per-page SEO meta seeded: ${Object.keys(pageSeoMap).length} pages`)

        // 9c: Seed service_areas from normalized prospect.service_areas (is_live=true),
        // then supplement with zip-prefix nearby cities (is_live=false).

        // 9c-sa: Normalize the CRM service_areas field and upsert accepted rows as live
        const rawServiceAreas = (prosp as any)?.service_areas as string | null ?? null
        const { accepted: saAccepted, rejected: saRejected } = normalizeAll(rawServiceAreas)
        if (saRejected.length > 0) {
          console.warn('[provision-tenant] rejected service_areas tokens:', JSON.stringify(saRejected))
        }
        for (const norm of saAccepted) {
          const { error: saErr } = await supabase.from('service_areas').upsert({
            tenant_id:  tenantId,
            city:       norm.city,
            slug:       norm.slug,
            state:      norm.state,
            hero_title: buildServiceAreaHeroTitle(resolvedVertical, norm.city),
            is_live:    true,
          }, { onConflict: 'tenant_id,slug' })
          if (saErr) console.error(`[provision-tenant] service_areas upsert failed (${norm.city}):`, saErr.message)
        }
        console.log(`[provision-tenant] service_areas seeded: ${saAccepted.length} live cities from CRM field`)

        // 9c-zip: Supplement with zip-prefix nearby cities (is_live=false) so the
        // client has draft pages ready to activate after reveal call.
        if (city) {
          const ZIP_CITIES: Record<string, string[]> = {
            '787': ['Austin', 'Round Rock', 'Cedar Park', 'Georgetown', 'Pflugerville', 'Kyle', 'Buda'],
            '786': ['Austin', 'Round Rock', 'Cedar Park', 'Georgetown', 'Pflugerville', 'Kyle', 'Buda'],
            '756': ['Tyler', 'Longview', 'Jacksonville', 'Lindale', 'Bullard', 'Whitehouse'],
            '757': ['Tyler', 'Longview', 'Jacksonville', 'Lindale', 'Bullard', 'Whitehouse'],
            '770': ['Houston', 'Sugar Land', 'Pearland', 'Pasadena', 'League City', 'Friendswood', 'Missouri City'],
            '771': ['Houston', 'Sugar Land', 'Pearland', 'Pasadena', 'League City', 'Friendswood', 'Missouri City'],
            '752': ['Dallas', 'Plano', 'Richardson', 'Garland', 'Irving', 'Mesquite', 'Arlington'],
            '750': ['Dallas', 'Plano', 'Richardson', 'Garland', 'Irving', 'Mesquite', 'Arlington'],
            '760': ['Fort Worth', 'Arlington', 'Hurst', 'Euless', 'Bedford', 'Keller', 'Grapevine'],
            '761': ['Fort Worth', 'Arlington', 'Hurst', 'Euless', 'Bedford', 'Keller', 'Grapevine'],
            '782': ['San Antonio', 'Schertz', 'Seguin', 'New Braunfels', 'Boerne', 'Converse', 'Universal City'],
            '783': ['San Antonio', 'Schertz', 'Seguin', 'New Braunfels', 'Boerne', 'Converse', 'Universal City'],
            '850': ['Phoenix', 'Scottsdale', 'Tempe', 'Mesa', 'Chandler', 'Gilbert', 'Glendale'],
            '852': ['Phoenix', 'Scottsdale', 'Tempe', 'Mesa', 'Chandler', 'Gilbert', 'Glendale'],
          }
          const zipRaw = (ib.zip || '').toString().trim()
          const zipPrefix = zipRaw.length >= 3 ? zipRaw.slice(0, 3) : ''
          const citiesForArea: string[] = zipPrefix && ZIP_CITIES[zipPrefix]
            ? ZIP_CITIES[zipPrefix]
            : [city]
          const allZipCities = citiesForArea.includes(city) ? citiesForArea : [city, ...citiesForArea]

          // Draft cities carried the worst of it: "Professional pest control
          // services in {c}. Licensed, insured, and locally trusted." — a trade,
          // a licence, insurance and a reputation, for a city the tenant has not
          // even confirmed they serve. All three now come from the vertical, and
          // an unrecorded vertical yields the city name alone.
          for (const c of allZipCities) {
            const cSlug = c.toLowerCase().replace(/[^a-z0-9]+/g, '-') + (state ? '-' + state.toLowerCase() : '-tx')
            const cState = (state || 'TX').toUpperCase()
            const cSeo = buildServiceAreaSeo(resolvedVertical, c, cState, bizForSeo)
            await supabase.from('service_areas').upsert({
              tenant_id:        tenantId,
              city:             c,
              slug:             cSlug,
              state:            cState,
              hero_title:       buildServiceAreaHeroTitle(resolvedVertical, c),
              is_live:          false,
              meta_title:       cSeo.meta_title,
              meta_description: cSeo.meta_description,
              focus_keyword:    cSeo.focus_keyword,
            }, { onConflict: 'tenant_id,slug', ignoreDuplicates: true })
          }
          console.log(`[provision-tenant] zip-prefix draft cities seeded: ${allZipCities.length} (zip prefix: ${zipPrefix || 'none'})`)
        }

        // 9d–9f: Derive JSONB projection from all live rows and update settings.seo.service_areas
        const { data: allSaRows } = await supabase
          .from('service_areas')
          .select('city, is_live')
          .eq('tenant_id', tenantId)
        const saProjection = buildJsonbProjection(allSaRows ?? [])
        const { data: seoRow } = await supabase.from('settings').select('value')
          .eq('tenant_id', tenantId).eq('key', 'seo').maybeSingle()
        const currentSeoValue = (seoRow?.value ?? {}) as Record<string, unknown>
        const { error: seoUpdateErr } = await supabase.from('settings').update({
          value: { ...currentSeoValue, service_areas: saProjection },
        }).eq('tenant_id', tenantId).eq('key', 'seo')
        if (seoUpdateErr) {
          console.error('[provision-tenant] CRITICAL: seo.service_areas update failed:', seoUpdateErr.message)
          return new Response(JSON.stringify({ success: false, error: `seo.service_areas update failed: ${seoUpdateErr.message}` }), {
            status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
          })
        }
        console.log(`[provision-tenant] seo.service_areas JSONB updated: ${saProjection.length} cities`)

        // ── 9g: AI Authority prompts (S289) ──────────────────────────────────
        // ai_authority_prompts had rows for ONE tenant. Nothing ever created
        // them, so every other tenant's AI Authority ran and produced nothing.
        //
        // UN-GATED IN S290. This was written behind `if (vertical)` because
        // provisioning could not be trusted to know the trade: it wrote no
        // vertical at all and seeded pest page_content for everyone, so
        // deriving service phrases from those rows would have handed an
        // irrigation tenant a set of pest search queries. Both halves are now
        // fixed above — the vertical is recorded at Step 3 and page_content is
        // seeded from it — so the derivation is sound and the branch is live
        // rather than permanently false.
        //
        // The vertical check REMAINS, and still does real work: an unrecorded
        // vertical seeds no service pages, so there is nothing to derive from
        // and the branded query is the whole correct output.
        //
        // Failure here NEVER fails provisioning: a tenant without prompts is the
        // status quo for all nine existing tenants.
        try {
          // DEMO TENANTS ARE SKIPPED. Five of the nine live tenants are invented
          // businesses with no domain; AI Authority for them pays engines to
          // search the live web for a company that does not exist, and writes
          // confirmed-zero snapshot rows that would skew any cross-tenant
          // average. Provisioning creates demo tenants too, so without this gate
          // the next demo set recreates the problem.
          //
          // `!== true`, NOT `=== false`: one live tenant's demo_mode row has
          // active = NULL. Testing for false would skip a REAL tenant silently —
          // the same NULL trap as `vertical`.
          const { data: demoRow } = await supabase.from('settings').select('value')
            .eq('tenant_id', tenantId).eq('key', 'demo_mode').maybeSingle()
          const isDemo = isDemoTenant(demoRow?.value)

          // OPERATOR GATE. This function is reachable with an existing
          // body.tenant_id (Step 1's else-branch updates rather than creates),
          // so re-provisioning the operator tenant is a real path, not a
          // hypothetical one. The operator tenant is the PestFlow Pro product
          // itself; its page_content is pest demo scaffolding, so seeding from
          // it would have the platform tracking whether a SaaS product is the
          // best pest control company in Tyler.
          //
          // The id is NOT hardcoded here. public.operator_tenant_id() (S273) is
          // the platform's single declared answer, already gating
          // provisioning_status RLS; deferring to it means a future change of
          // operator tenant is a one-place change and this follows.
          const { data: opId, error: opErr } = await supabase.rpc('operator_tenant_id')
          const operatorTenantId = typeof opId === 'string' ? opId : null
          const isOperator = isOperatorTenant(tenantId, operatorTenantId)

          if (opErr || !operatorTenantId) {
            // Unknown operator => cannot prove this tenant is not it. Skipping
            // leaves the tenant in the state it is already in (no prompts);
            // seeding anyway could write trade queries for the product itself.
            console.error('[provision-tenant] ai_authority_prompts: SKIPPED — operator_tenant_id() unresolved:', opErr?.message ?? 'null')
          } else if (isDemo) {
            console.log('[provision-tenant] ai_authority_prompts: skipped (demo tenant)')
          } else if (isOperator) {
            console.log('[provision-tenant] ai_authority_prompts: skipped (operator tenant)')
          } else {

          const { data: biForPrompts } = await supabase.from('settings').select('value')
            .eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
          const biVal = (biForPrompts?.value ?? {}) as Record<string, unknown>
          const vertical = typeof biVal.vertical === 'string' ? biVal.vertical : null
          const addr = typeof biVal.address === 'string' ? biVal.address : ''
          const cityMatch = addr.match(/,\s*([^,]+),?\s*([A-Z]{2})\b/)

          // Service slugs come from the tenant's OWN page_content rows, not from
          // a hardcoded list — but only once a vertical says those rows are the
          // right ones. Empty vertical => empty slugs => branded query only.
          let serviceSlugs: string[] = []
          if (vertical) {
            const { data: pcRows } = await supabase.from('page_content')
              .select('page_slug').eq('tenant_id', tenantId)
            // SEED_PLATFORM_SLUGS, not a fourth local copy of the same list.
            // Step 4 seeds from that module, so what counts as a service page
            // here cannot drift from what was actually written.
            serviceSlugs = (pcRows ?? []).map((r: { page_slug: string }) => r.page_slug)
              .filter((sl: string) => SEED_PLATFORM_SLUGS.indexOf(sl) === -1)
          }

          // LIVE ROWS ONLY, and in a stable order.
          //
          // is_live: 9c-zip above seeds up to seven DRAFT cities (is_live=false)
          // guessed from the zip prefix — a Tyler tenant gets Longview,
          // Jacksonville, Lindale, Bullard and Whitehouse whether or not it
          // works there. They exist so the client has pages ready to activate
          // after the reveal call; they are not confirmed service areas, and
          // paying live engines to track a tenant's ranking in a city it may
          // not serve is the same defect as drawing the wrong cities for pls.
          //
          // order: PostgREST returns rows in no guaranteed order without one, so
          // without this the generator's determinism (which the tests pin) would
          // hold for its inputs while the inputs themselves varied per run.
          const { data: saForPrompts } = await supabase.from('service_areas')
            .select('city, state').eq('tenant_id', tenantId).eq('is_live', true)
            .order('city', { ascending: true })

          const prompts = generateAuthorityPrompts({
            businessName: businessName || '',
            city: cityMatch ? cityMatch[1].trim() : '',
            state: cityMatch ? cityMatch[2].trim() : '',
            serviceAreas: (saForPrompts ?? []) as Array<{ city: string; state: string | null }>,
            serviceSlugs,
          })

          if (prompts.length > 0) {
            const { error: apErr } = await supabase.from('ai_authority_prompts')
              .insert(prompts.map((prompt_text) => ({ tenant_id: tenantId, prompt_text, active: true })))
            if (apErr) console.error('[provision-tenant] ai_authority_prompts seed failed (non-fatal):', apErr.message)
            else console.log(`[provision-tenant] ai_authority_prompts seeded: ${prompts.length} (vertical: ${vertical ?? 'unrecorded'})`)
          } else {
            console.log('[provision-tenant] ai_authority_prompts: nothing to seed (no name, no vertical, no locations)')
          }

          } // end gates: operator resolved, not demo, not operator
        } catch (e) {
          console.error('[provision-tenant] ai_authority_prompts seed threw (non-fatal):', (e as Error)?.message)
        }

        // 9d: Seed 3 starter blog posts — PEST ONLY.
        //
        // The fifth pest block in this function, and the one that cannot be
        // fixed by a preset: these are authored articles, not labels. "Top 5
        // Signs You Have a Pest Problem" published under a pool company's byline
        // is the same defect as the pest page titles, but writing irrigation
        // equivalents means writing content, which is a brief of its own.
        //
        // So they are gated on the trade they are actually about. A tenant of
        // any other vertical gets NO starter posts, which is the honest state —
        // an empty blog, not someone else's blog. Reported in the PR.
        if (resolvedVertical === 'pest') {
        const postNow = new Date().toISOString()
        const day7ago = new Date(Date.now() - 7  * 86400000).toISOString()
        const day14ago= new Date(Date.now() - 14 * 86400000).toISOString()
        const starterPosts = [
          { tenant_id: tenantId, title: 'Top 5 Signs You Have a Pest Problem', slug: 'top-5-signs-pest-problem',
            excerpt: 'Early detection is the key to stopping a pest problem before it becomes a full infestation.',
            content: '<p>Early detection is the key to stopping a pest problem before it becomes a full infestation. Here are the top signs to watch for in your home...</p>',
            published_at: postNow },
          { tenant_id: tenantId, title: 'How to Prevent Pests This Season', slug: 'seasonal-pest-prevention-tips',
            excerpt: 'Seasonal changes bring new pest activity. These simple steps can keep your home protected year-round.',
            content: '<p>Every season brings different pest pressures. Here\'s how to stay ahead of them with simple preventive measures around your home...</p>',
            published_at: day7ago },
          { tenant_id: tenantId, title: 'Why Professional Pest Control Beats DIY', slug: 'professional-vs-diy-pest-control',
            excerpt: 'DIY products can reduce pest activity temporarily — but rarely eliminate the root cause.',
            content: '<p>Store-bought sprays and traps can temporarily reduce pest activity, but they rarely eliminate the root cause. Professional pest control delivers better, longer-lasting results...</p>',
            published_at: day14ago },
        ]
        for (const post of starterPosts) {
          const { error: blogErr } = await supabase.from('blog_posts').upsert(post, { onConflict: 'tenant_id,slug' })
          if (blogErr) console.error(`[provision-tenant] blog_posts upsert failed (${post.slug}):`, blogErr.message)
        }
        console.log('[provision-tenant] 3 starter blog posts seeded (pest)')
        } else {
          console.log(`[provision-tenant] starter blog posts skipped — no articles exist for vertical '${resolvedVertical ?? 'unrecorded'}'`)
        }

        // 9e: Advance prospect stage to it_in_progress
        await supabase.from('prospects').update({ pipeline_stage: 'it_in_progress' }).eq('id', prospect_id)
        console.log('[provision-tenant] prospect stage → it_in_progress')

        // Step 9g — Seed legal page_content from master template (non-blocking)
        try {
          const MASTER_TENANT_ID = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'
          const LEGAL_SLUGS = ['terms', 'privacy', 'sms-terms', 'accessibility']
          const { data: templates, error: templateErr } = await supabase
            .from('page_content')
            .select('page_slug, title, intro')
            .eq('tenant_id', MASTER_TENANT_ID)
            .in('page_slug', LEGAL_SLUGS)

          if (templateErr || !templates || templates.length === 0) {
            console.warn('[provision-tenant] Step 9g: master legal templates missing, skipping legal seed')
          } else {
            const newDomain = `${resolvedSlug}.pestflowpro.com`
            const newName = ib.business_name || 'Your Business'
            const newNameUpper = newName.toUpperCase()
            const newEmail = ib.email || `info@${newDomain}`
            const phoneDigits = (ib.phone || '').replace(/\D/g, '')
            const newPhone = phoneDigits.length === 10
              ? `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`
              : (ib.phone || '')

            const seedRows = templates.map((t: { page_slug: string; title: string; intro: string }) => ({
              tenant_id: tenantId,
              page_slug: t.page_slug,
              title: t.title,
              // S317 — DO NOT REPLACE THESE WITH PLATFORM_NAME. These are not
              // copy; they are SEARCH PATTERNS matched against the seeded
              // template rows, which literally contain "PestFlow Pro", the .com
              // address and the old phone number. Swapping the needle for
              // HomeFlow Pro stops it matching, and every newly provisioned
              // tenant silently keeps the demo text. The sibling lines matching
              // pestflowpro.com and (430) 367-5601 are the same kind of thing.
              intro: t.intro
                .replaceAll('PestFlow Pro, LLC', `${newName}, LLC`)
                .replaceAll('PESTFLOW PRO, LLC', `${newNameUpper}, LLC`)
                .replaceAll('PestFlow Pro', newName)
                .replaceAll('PESTFLOW PRO', newNameUpper)
                .replaceAll('sales@pestflowpro.com', newEmail)
                .replaceAll('https://pestflowpro.com/', `https://${newDomain}/`)
                .replaceAll('https://pestflowpro.com', `https://${newDomain}`)
                .replaceAll('pestflowpro.com', newDomain)
                .replaceAll('(430) 367-5601', newPhone),
            }))

            const { error: insertErr } = await supabase
              .from('page_content')
              .upsert(seedRows, { onConflict: 'tenant_id,page_slug' })

            if (insertErr) {
              console.warn('[provision-tenant] Step 9g: legal seed insert failed:', insertErr.message)
            } else {
              console.log(`[provision-tenant] Step 9g: ${seedRows.length} legal page_content rows seeded`)
            }
          }
        } catch (err: any) {
          console.warn('[provision-tenant] Step 9g: unexpected error during legal seed:', err?.message)
        }

      } catch (intakeErr: any) {
        console.error('[provision-tenant] intake seeding failed (non-fatal):', intakeErr?.message)
      }
    }

    const liveUrl = `https://${resolvedSlug}.pestflowpro.com`
    // Step 10: Fire-and-forget initial Outscraper sync (non-blocking)
    try {
      const { data: intgRow } = await supabase
        .from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()
      const intg = intgRow?.value ?? {}
      const hasGoogleId = !!(
        (intg.google_cid      && String(intg.google_cid).trim())      ||
        (intg.google_fid      && String(intg.google_fid).trim())      ||
        (intg.google_place_id && String(intg.google_place_id).trim())
      )
      if (hasGoogleId) {
        const { data: vaultRow } = await supabase.schema('vault').from('decrypted_secrets')
          .select('decrypted_secret').eq('name', 'outscraper_cron_internal_secret').maybeSingle()
        const cronSecret = (vaultRow as any)?.decrypted_secret
        if (cronSecret) {
          fetch(`${SUPABASE_URL}/functions/v1/outscraper-reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': cronSecret },
            body: JSON.stringify({ tenant_id: tenantId, mode: 'initial' }),
          }).catch((err: Error) =>
            console.warn('[provision-tenant] Outscraper fire-and-forget failed (non-fatal):', err?.message),
          )
          console.log('[provision-tenant] Outscraper initial sync fired for tenant:', tenantId)
        }
      }
    } catch (outscraperFireErr: any) {
      console.warn('[provision-tenant] Outscraper fire-and-forget setup failed (non-fatal):', outscraperFireErr?.message)
    }
    return new Response(JSON.stringify({ success: true, tenant_id: tenantId, slug: resolvedSlug, url: liveUrl }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  } catch (err: any) {
    console.error('provision-tenant error:', err?.message)
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Internal server error' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }
}

if (import.meta.main) {
  Deno.serve(handler)
}
