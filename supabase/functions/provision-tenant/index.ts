// Supabase Edge Function: provision-tenant
//
// ═══ S340 — REWRITTEN ONTO public.provision_tenant_atomic ═══
//
// THE LIVE PATH: this function creates every tenant. It used to be ~1300 lines
// of sequential, individually-committing writes across eleven tables, most of
// them wrapped in `catch { log and continue }` — so a half-provisioned tenant
// returned HTTP 200 and nobody knew. Two of those swallowed failures had been
// live for months: a write to page_content.meta_title/meta_description (COLUMNS
// THAT DO NOT EXIST, so per-page SEO had never been seeded for anyone), and a
// RAISE from the zip-prefix draft cities that silently skipped the seo
// projection, the authority prompts, the prospect stage AND the four legal pages.
//
// The order below is the S334 gate's, not a preference:
//   1. authenticate the caller (x-pfp-internal-key — UNCHANGED)
//   2. build and validate the payload   <- BEFORE the user exists, so a doomed
//                                          payload cannot mint an orphan
//   3. create the gotrue user           <- OUTSIDE the transaction, forced by
//                                          the FK chain (profiles.id IS the
//                                          auth user id)
//   4. ONE rpc('provision_tenant_atomic')
//   5. post-commit: nothing. The queue rows committed with everything else.
//   6. return the RPC's counts
//
// THE RPC GENERATES NOTHING (gate answer C2 — projecting the service catalog
// into Postgres was rejected), so every seed row is built in buildPayload.ts,
// which is pure and unit-tested. This file is the I/O around it.
//
// Reads onboarding_sessions for wizard data when available; falls back to direct
// body fields for legacy/manual calls.
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
// Deploy: ./scripts/deploy-function.sh provision-tenant --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { isDemoTenant, isOperatorTenant } from '../_shared/authorityPrompts.ts'
import { validateVertical } from '../_shared/provisioningSeed.ts'
import { timingSafeEqual } from 'node:crypto'
import { buildProvisionPayload } from './buildPayload.ts'

/** CLAUDE.md constant. The legal page templates are read from this tenant. */
const DEMO_TENANT_ID = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'
const LEGAL_SLUGS = ['terms', 'privacy', 'sms-terms', 'accessibility']

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
  /**
   * S340 — THE RETRY HANDLE. When the RPC fails after the gotrue user was
   * created, the response carries the new auth_user_id. Passing it back on a
   * retry makes provisioning REUSE that user instead of calling createUser
   * again, which would dead-end on "email already registered".
   */
  auth_user_id?: string
  slug?: string
  admin_email?: string
  admin_password?: string
  /**
   * S326 ITEM 1 — OPT IN TO RESETTING AN EXISTING ADMIN'S PASSWORD.
   *
   * Absent or false, a re-provision LEAVES THE EXISTING PASSWORD ALONE.
   *
   * This was unconditional. Any re-provision of a tenant whose admin email
   * already had an auth user called updateUserById, which changes the password
   * and — gotrue >=2.149 — kills that user's live sessions. It fired before any
   * seed write, so it happened even on runs that then failed. Meanwhile
   * BundleSocialSetup told the operator to re-provision a client to generate a
   * Zernio profile: following that instruction logged a paying customer out and
   * changed their password, as a side effect of a social-media task.
   *
   * DEFAULT FALSE, not "false unless it looks intentional". The caller has to
   * say so. There is no inference from other fields — admin_password is still
   * required to CREATE a user and must not double as consent to overwrite one.
   *
   * The NEW-tenant path is untouched: createUser sets the initial password at
   * creation, which is not a reset and does not consult this flag.
   */
  reset_admin_password?: boolean
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

// ── the gotrue orphan contract (S340) ───────────────────────────────────────
//
// createUser runs OUTSIDE the transaction — it must, because profiles.id IS the
// auth user id and both reference auth.users, so the row cannot exist until the
// user does. If createUser succeeds and the RPC then fails, THE AUTH USER IS
// LEFT BEHIND. That orphan is intentional: it is the cheapest failure to detect
// (a sweep for auth users with no tenant_users row currently returns zero) and
// the response carries the id and a stable code so a retry can reuse it.
//
// ON RETRY, NEVER BLINDLY CALL createUser AGAIN — that turns a data failure into
// an "email already registered" dead end. Either the caller passes back the
// auth_user_id we returned, or we look the user up by normalised email and reuse
// it when it is unbound.
interface AuthResolution {
  userId: string
  created: boolean
  passwordReset: boolean
}

const norm = (e: string) => e.trim().toLowerCase()

function fail(status: number, code: string, error: string, extra: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ success: false, code, error, ...extra }), {
    status, headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  // ── 1. AUTH (must run before anything else) — UNCHANGED (S211a) ───────────
  const expectedSecret = Deno.env.get('PROVISION_TENANT_INTERNAL_SECRET') || ''
  const presentedSecret = req.headers.get('x-pfp-internal-key') || ''

  if (!expectedSecret) {
    console.error('[provision-tenant] PROVISION_TENANT_INTERNAL_SECRET env var not set; rejecting all requests')
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }

  // node:crypto.timingSafeEqual — constant-time compare. Throws on length
  // mismatch, so the length-equality pre-check is required.
  const enc = new TextEncoder()
  const a = enc.encode(expectedSecret)
  const b = enc.encode(presentedSecret)
  const authOk = a.length === b.length && timingSafeEqual(a, b)

  if (!authOk) {
    console.warn('[provision-tenant] auth failed — x_pfp_internal_key_present:', !!presentedSecret,
      'x_pfp_internal_key_length_match:', a.length === b.length)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }

  try {
    const body: RequestBody = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const suppliedTenantId = body.tenant_id?.trim() || ''
    const mode: 'create' | 'reprovision' = suppliedTenantId ? 'reprovision' : 'create'

    // ── wizard data (preferred) with body fallback ──────────────────────────
    let wd: Record<string, any> | null = null
    if (body.onboarding_session_id) {
      const { data: sessionRow } = await supabase
        .from('onboarding_sessions')
        .select('wizard_data')
        .eq('id', body.onboarding_session_id)
        .eq('consumed', false)
        .maybeSingle()
      if (sessionRow?.wizard_data) {
        wd = sessionRow.wizard_data
        console.log(`[provision-tenant] loaded wizard data from onboarding_session ${body.onboarding_session_id}`)
      } else {
        console.warn(`[provision-tenant] onboarding_session ${body.onboarding_session_id} not found or already consumed — falling back to body fields`)
      }
    }
    const wbi = wd?.business_info || {}
    const wsub = wd?.subscription || {}

    // S262 — entitlement is set EXPLICITLY. The column has no default; absence
    // must fail loud rather than silently default to Starter. Derived from the
    // SOLD plan, never from a payment record.
    const entToNum = (raw: string | number | undefined | null): number => {
      if (typeof raw === 'number') return raw >= 1 && raw <= 4 ? raw : 1
      const sl = typeof raw === 'string' ? raw.toLowerCase().trim() : ''
      return sl === 'elite' ? 4 : sl === 'pro' ? 3 : (sl === 'growth' || sl === 'grow') ? 2 : 1
    }
    const entitlement = entToNum(
      wsub.tier ?? body.subscription?.tier ?? wsub.plan_name ?? body.subscription?.plan_name ?? body.plan,
    )

    // S290 — the vertical is resolved ONCE, before a single row is built.
    // Deliberately NOT from intake_data: that overlay used to run after
    // page_content was written, so honouring a vertical there seeded one trade's
    // pages and recorded another's name.
    const verticalCheck = validateVertical(wbi.vertical ?? (body.business_info as { vertical?: unknown })?.vertical)
    if (verticalCheck.error) {
      console.error('[provision-tenant] REJECTED —', verticalCheck.error)
      return fail(400, 'vertical_invalid', verticalCheck.error)
    }
    const resolvedVertical = verticalCheck.vertical
    console.log(`[provision-tenant] vertical: ${resolvedVertical ?? 'NOT RECORDED (neutral seed)'}`)

    // ── slug ────────────────────────────────────────────────────────────────
    const resolvedSlug = (wd?.slug || body.slug
      || (body.business_info?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)).trim()
    if (!resolvedSlug) {
      return fail(400, 'slug_required', 'slug or business_info.name is required')
    }

    const resolvedAdminEmail = (wd ? (wbi.email || body.admin_email) : body.admin_email) || ''
    const resolvedAdminPassword = (wd ? (wd.admin_password || body.admin_password) : body.admin_password) || ''

    // Admin email must contain a dot after @ before createUser is called.
    if (resolvedAdminEmail) {
      const atIdx = resolvedAdminEmail.indexOf('@')
      const afterAt = atIdx >= 0 ? resolvedAdminEmail.slice(atIdx + 1) : ''
      if (atIdx < 0 || !afterAt.includes('.')) {
        return fail(400, 'admin_email_invalid',
          'Admin email must be a valid address (e.g. admin@company.com)')
      }
    }
    if (!resolvedAdminEmail || !resolvedAdminPassword) {
      // The RPC requires an auth_user_id, so this is no longer a "warn and seed
      // an admin-less tenant" path — it is a rejection.
      return fail(400, 'admin_credentials_required',
        'admin_email and admin_password are required — provisioning creates the tenant admin')
    }

    // Cheap slug pre-check so a duplicate does not cost an orphaned auth user.
    // The RPC re-checks under the transaction and remains the authority.
    if (mode === 'create') {
      const { data: existingTenant } = await supabase
        .from('tenants').select('id').eq('slug', resolvedSlug).maybeSingle()
      if (existingTenant) {
        console.warn(`[provision-tenant] BLOCKED — slug "${resolvedSlug}" already exists (tenant ${existingTenant.id})`)
        return fail(409, 'slug_exists', 'Tenant slug already exists', {
          existingSlug: resolvedSlug, suggestion: resolvedSlug + '2',
        })
      }
    }

    // ── prospect-derived inputs, read BEFORE the payload is built ───────────
    let intake: Record<string, any> | null = null
    let scrapedContent: Record<string, any> | null = null
    let rawServiceAreas: string | null = null
    if (body.prospect_id) {
      const { data: prosp, error: prospErr } = await supabase
        .from('prospects')
        .select('intake_data, scraped_content, service_areas')
        .eq('id', body.prospect_id)
        .maybeSingle()
      if (prospErr) {
        // NOT a catch-and-continue. Seeding from a half-read prospect writes a
        // tenant that silently lacks its intake data.
        return fail(500, 'prospect_read_failed', `prospect read failed: ${prospErr.message}`)
      }
      intake = (prosp?.intake_data ?? null) as Record<string, any> | null
      scrapedContent = (prosp?.scraped_content ?? null) as Record<string, any> | null
      rawServiceAreas = ((prosp as any)?.service_areas ?? null) as string | null
    }

    // Legal page templates from the demo tenant. Missing templates are a real
    // failure now: the old code warned and carried on, which is how four legal
    // pages could silently not exist.
    const { data: legalRows, error: legalErr } = await supabase
      .from('page_content')
      .select('page_slug, title, intro')
      .eq('tenant_id', DEMO_TENANT_ID)
      .in('page_slug', LEGAL_SLUGS)
    if (legalErr) {
      return fail(500, 'legal_template_read_failed', `legal template read failed: ${legalErr.message}`)
    }

    // ── AI Authority prompt gates (S289/S290), preserved ────────────────────
    //
    // DEMO TENANTS ARE SKIPPED: they are invented businesses with no domain, so
    // AI Authority pays engines to search the live web for a company that does
    // not exist and writes confirmed-zero rows that skew any cross-tenant
    // average. Provisioning creates demo tenants too, so the gate has to live
    // here rather than in a one-off cleanup.
    //
    // THE OPERATOR TENANT IS SKIPPED: it is the PestFlow Pro product itself.
    // The id is NOT hardcoded — public.operator_tenant_id() is the platform's
    // single declared answer, so a future change of operator tenant is a
    // one-place change and this follows.
    //
    // Only reachable in reprovision mode: a create has no tenant yet, its
    // demo_mode is seeded { active: false }, and a brand-new id cannot be the
    // operator tenant.
    let skipAuthorityPrompts = false
    if (mode === 'reprovision' && suppliedTenantId) {
      const { data: demoRow } = await supabase.from('settings').select('value')
        .eq('tenant_id', suppliedTenantId).eq('key', 'demo_mode').maybeSingle()
      // `isDemoTenant`, not `=== false`: one live tenant's demo_mode row has
      // active = NULL, and testing for false would skip a REAL tenant silently.
      if (isDemoTenant(demoRow?.value)) skipAuthorityPrompts = true

      const { data: operatorId } = await supabase.rpc('operator_tenant_id')
      if (isOperatorTenant(suppliedTenantId, operatorId)) skipAuthorityPrompts = true

      if (skipAuthorityPrompts) {
        console.log('[provision-tenant] ai_authority_prompts: skipped (demo or operator tenant)')
      }
    }

    const resolvedTimezone = (typeof wbi.timezone === 'string' && wbi.timezone.trim())
      ? wbi.timezone.trim()
      : resolveTimezoneFromState(wbi.address_region || (body.business_info as any)?.address_region)

    // ── 2. BUILD AND VALIDATE THE PAYLOAD — BEFORE the auth user exists ─────
    //
    // Order matters and it is the gate's, not a preference: a payload that is
    // going to be rejected must be rejected BEFORE createUser mints an orphan.
    // auth_user_id is filled in after, which is why it is passed as '' here and
    // the built payload is re-stamped below.
    const built = buildProvisionPayload({
      mode,
      slug: resolvedSlug,
      tenantId: suppliedTenantId || null,
      authUserId: '',
      entitlement,
      vertical: resolvedVertical,
      wizard: {
        business_info: wd?.business_info, branding: wd?.branding,
        customization: wd?.customization, social_links: wd?.social_links,
        subscription: wd?.subscription,
      },
      body: {
        business_info: body.business_info, branding: body.branding,
        customization: body.customization, social_links: body.social_links,
        integrations: body.integrations, subscription: body.subscription,
        plan: body.plan,
        social_facebook: (body as any).social_facebook,
        social_instagram: (body as any).social_instagram,
        social_google: (body as any).social_google,
        social_youtube: (body as any).social_youtube,
      },
      adminEmail: resolvedAdminEmail,
      resolvedTimezone,
      intake,
      scrapedContent,
      rawServiceAreas,
      legalTemplates: (legalRows ?? []) as Array<{ page_slug: string; title: string; intro: string }>,
      prospectId: body.prospect_id ?? null,
      onboardingSessionId: body.onboarding_session_id ?? null,
      skipAuthorityPrompts,
      queueZernio: true,
      // Mirrors old step 10's precondition: outscraper-reviews needs a Google
      // identifier to sync against. google_place_id is the only one provisioning
      // seeds; cid/fid arrive later via the admin.
      queueOutscraper: String(body.integrations?.google_place_id ?? '').trim() !== '',
    })

    if (!built.ok) {
      console.error(`[provision-tenant] REJECTED — ${built.code}: ${built.error}`)
      return fail(built.status, built.code, built.error)
    }
    if (built.rejectedAreaTokens.length > 0) {
      console.warn('[provision-tenant] rejected service_areas tokens:', JSON.stringify(built.rejectedAreaTokens))
    }

    // ── 3. CREATE THE GOTRUE USER — outside the transaction, forced by the FK ─
    const authRes = await resolveAuthUser(supabase, {
      email: resolvedAdminEmail,
      password: resolvedAdminPassword,
      suppliedUserId: body.auth_user_id?.trim() || '',
      resetPassword: body.reset_admin_password === true,
      mode,
      tenantId: suppliedTenantId || null,
    })
    if ('response' in authRes) return authRes.response
    const { userId, passwordReset } = authRes

    // ── 4. ONE RPC. The transaction is the database's, not ours. ────────────
    const payload = { ...built.payload, auth_user_id: userId }
    const { data: rpcData, error: rpcErr } = await supabase.rpc('provision_tenant_atomic', {
      p_payload: payload,
    })

    if (rpcErr) {
      // THE ORPHAN CONTRACT. Non-2xx, carrying the auth_user_id we created and a
      // stable code, so a retry reuses the user instead of dead-ending on
      // "email already registered". NOTHING was written: the RPC is one
      // transaction and it rolled back.
      const pgCode = (rpcErr as any).code ?? ''
      const status = pgCode === '23505' ? 409 : pgCode === '22023' ? 400 : 500
      console.error(`[provision-tenant] RPC FAILED (${pgCode || 'no code'}) — tenant NOT provisioned:`, rpcErr.message)
      return fail(status, 'provision_rpc_failed', rpcErr.message, {
        auth_user_id: userId,
        auth_user_orphaned: authRes.created,
        pg_code: pgCode,
        retry_hint: 'Pass auth_user_id back on retry — do not let createUser run again.',
      })
    }

    // ── 5. POST-COMMIT ──────────────────────────────────────────────────────
    // Nothing external runs before the RPC returns, and nothing needs to run
    // after it: the queue rows are already durable, committed in the same
    // transaction. process-outbound-queue (*/15) owns Zernio and Outscraper now.
    // The inline Zernio call and the Outscraper fire-and-forget are DELETED.
    const result = (rpcData ?? {}) as Record<string, unknown>
    const tenantId = String(result.tenant_id ?? '')
    console.log(`[provision-tenant] provisioned tenant=${tenantId} slug=${resolvedSlug} `
      + `counts=${JSON.stringify(result.counts ?? {})} queued=${JSON.stringify(result.queued ?? [])}`)

    // ── 6. RETURN THE RPC'S COUNTS — not a boolean ─────────────────────────
    return new Response(JSON.stringify({
      success: true,
      tenant_id: tenantId,
      slug: resolvedSlug,
      url: `https://${resolvedSlug}.pestflowpro.com`,
      created: result.created ?? false,
      counts: result.counts ?? {},
      queued: result.queued ?? [],
      admin_password_reset: passwordReset,
      ...(built.rejectedAreaTokens.length > 0
        ? { rejected_service_area_tokens: built.rejectedAreaTokens }
        : {}),
    }), { headers: { 'Content-Type': 'application/json', ...CORS } })
  } catch (err: any) {
    console.error('[provision-tenant] error:', err?.message)
    return fail(500, 'unhandled', err?.message || 'Internal server error')
  }
}

/**
 * Resolve the tenant admin's auth user, creating one only when necessary.
 *
 * Returns either the resolved user or a ready-to-send error Response — the
 * collision and lookup failures are hard stops, not warnings.
 */
async function resolveAuthUser(
  supabase: any,
  opts: {
    email: string; password: string; suppliedUserId: string
    resetPassword: boolean; mode: 'create' | 'reprovision'; tenantId: string | null
  },
): Promise<AuthResolution | { response: Response }> {
  // (a) An id handed back to us by a previous failed attempt. Reuse it and do
  // NOT call createUser — that is the retry dead-end this exists to avoid.
  if (opts.suppliedUserId) {
    const { data: got, error } = await supabase.auth.admin.getUserById(opts.suppliedUserId)
    if (error || !got?.user) {
      return { response: fail(400, 'auth_user_id_not_found',
        `auth_user_id ${opts.suppliedUserId} was supplied but no such auth user exists.`) }
    }
    if (norm(got.user.email ?? '') !== norm(opts.email)) {
      return { response: fail(409, 'auth_user_email_mismatch',
        `auth_user_id ${opts.suppliedUserId} belongs to a different email than ${opts.email}.`) }
    }
    const guard = await collisionGuard(supabase, opts.suppliedUserId, opts)
    if (guard) return { response: guard }
    console.log('[provision-tenant] reusing supplied auth_user_id — createUser not called')
    return { userId: opts.suppliedUserId, created: false, passwordReset: false }
  }

  const { data: authData, error: createErr } = await supabase.auth.admin.createUser({
    email: opts.email, password: opts.password, email_confirm: true,
  })

  if (!createErr) {
    return { userId: authData!.user!.id, created: true, passwordReset: false }
  }

  const alreadyExists = createErr.message?.includes('already been registered')
    || createErr.message?.includes('already exists')
  if (!alreadyExists) {
    console.error('[provision-tenant] createUser failed:', createErr.message)
    return { response: fail(500, 'create_user_failed',
      `Failed to create admin user: ${createErr.message}`) }
  }

  // (b) Look the user up by NORMALISED email and reuse it if it is unbound.
  //
  // TODO(S220-backlog): replace listUsers() with a SECURITY DEFINER RPC
  // (find_auth_user_id_by_email) when user count exceeds ~100. O(n), kept
  // deliberately — widening it is not this change's job.
  console.warn('[provision-tenant] auth user already exists for', opts.email, '— looking up existing id')
  const { data: listed } = await supabase.auth.admin.listUsers()
  const existing = (listed?.users ?? []).find((u: any) => norm(u.email ?? '') === norm(opts.email))
  if (!existing?.id) {
    // S220 B2c: gotrue said the user exists but the lookup found nothing.
    return { response: fail(500, 'auth_state_inconsistent',
      `Email ${opts.email} reported as already registered, but lookup returned no user record. `
      + 'Inconsistent auth state — investigate manually before retrying.') }
  }

  const guard = await collisionGuard(supabase, existing.id, opts)
  if (guard) return { response: guard }

  // S326 ITEM 1 — password reset is OPT-IN and stays exactly as it was.
  // gotrue >=2.149 kills the user's live sessions on a password change, so
  // absent or false must leave an existing password and its sessions alone.
  if (!opts.resetPassword) {
    console.log('[provision-tenant] password_reset: skipped (reset_admin_password not true) — existing password and sessions preserved')
    return { userId: existing.id, created: false, passwordReset: false }
  }

  console.log('[provision-tenant] password_reset: requested, applying to existing user')
  const { error: pwErr } = await supabase.auth.admin.updateUserById(existing.id, { password: opts.password })
  if (pwErr) {
    const status = (pwErr as any).status || 500
    const isTransient = status >= 500
    console.error('[provision-tenant] password sync failed for', opts.email, '| status:', status,
      '| transient:', isTransient)
    return { response: fail(500, 'password_sync_failed',
      `Password sync failed for existing user: ${pwErr.message}`,
      { transient: isTransient, retry_safe: isTransient }) }
  }
  return { userId: existing.id, created: false, passwordReset: true }
}

/**
 * S220 B2a — refuse to move an admin off a tenant they already belong to.
 *
 * Re-provisioning would yank them from their current tenant, invalidate their
 * sessions and change their password without consent. In `create` mode there is
 * no tenant yet, so ANY existing binding is a collision.
 */
async function collisionGuard(
  supabase: any,
  userId: string,
  opts: { mode: 'create' | 'reprovision'; tenantId: string | null; email: string },
): Promise<Response | null> {
  const { data: profile, error } = await supabase
    .from('profiles').select('tenant_id').eq('id', userId).maybeSingle()
  if (error) {
    console.error('[provision-tenant] profile lookup failed during collision check:', error.message)
    return fail(500, 'profile_lookup_failed',
      `Profile lookup failed during collision check: ${error.message}`)
  }
  const boundTo = profile?.tenant_id ?? null
  if (!boundTo) return null
  if (opts.mode === 'reprovision' && boundTo === opts.tenantId) return null

  console.error('[provision-tenant] BLOCKED — tenant collision on existing user:', opts.email,
    'current_tenant:', boundTo, 'requested_tenant:', opts.tenantId ?? '(new)')
  return fail(409, 'tenant_collision',
    `Email ${opts.email} is already admin on a different tenant (${boundTo}). `
    + `Cannot provision to ${opts.tenantId ?? 'a new tenant'}. `
    + 'Use a different admin email, or detach the user from their current tenant first.',
    { existing_tenant_id: boundTo, requested_tenant_id: opts.tenantId })
}

if (import.meta.main) {
  Deno.serve(handler)
}
