// Supabase Edge Function: invite-team-member
//
// Adds a user to the CALLER's tenant. Admin-only. Mints a set-password link via
// auth.admin.generateLink and delivers it in a branded Resend email — NOT GoTrue
// default mail. The link is a bearer credential and is NEVER logged.
//
// verify_jwt: TRUE (config.toml). The gateway toggle silently reverts to ON after a
// deploy — re-check it stays ON after every deploy.
//
// Auth model (validator H1 — TWO clients):
//   (a) callerClient: anon key + the caller's Authorization in global.headers. Used for
//       getUser() (identity) and a FRESH get_my_tenant_role() (authz) ONLY. Never trusts
//       a JWT claim for role — re-read from the DB every call (stale after demotion).
//   (b) service: service-role key. generateLink REQUIRES the service role; a caller-JWT
//       client would 403. Used solely for generateLink + the membership upsert + lookups.
//
// tenant_id (S309): supplied by the CALLER in the body, then VERIFIED server-side.
//   profiles.tenant_id was never the authorization step -- it supplied a CANDIDATE
//   tenant, and get_my_tenant_role(...) = 'admin' against tenant_users is what
//   authorizes. S273 retired profiles as membership truth and S308 replaced it as the
//   RLS membership source; this consumer had not moved, so an admin with NO profiles
//   row got a 403 and could not invite anyone. Every INVITED admin is in that state,
//   because this very function writes only tenant_users.
//   The caller may name any tenant; naming one they are not an admin of returns the
//   same 403 it always did. Validator gate 2026-09-01: both models REJECTED the first
//   spec; this is the re-scoped form. See REVIEW_S309_TENANT_SOURCE.md.
//   ONE VARIABLE: the tenantId that is verified below is the same tenantId written to
//   tenant_users and used for every lookup. The body field is read exactly once.
//
// Deploy: supabase functions deploy invite-team-member --project-ref biezzykcgzkrwdgqpsar

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/sendEmail.ts'
import { inviteEmail, addedToTenantEmail } from '../_shared/emailTemplates/authEmails.ts'

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY         = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const APP_BASE_DOMAIN           = Deno.env.get('APP_BASE_DOMAIN') || 'pestflowpro.ai'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const ROLES = ['admin', 'manager', 'user'] as const
// Shape gate for the caller-supplied tenant_id (S309). Rejecting a non-uuid here
// keeps a malformed value a 400 rather than a 500 from Postgres.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

function validEmail(e: string): boolean {
  // must have a dot after the @ (CLAUDE.md rule 11 / createUser requirement)
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)
}
function isEmailExists(err: { status?: number; code?: string; message?: string } | null): boolean {
  if (!err) return false
  return err.status === 422 || err.code === 'email_exists' ||
         /already.*(registered|exists)/i.test(err.message || '')
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || ''
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    // (a) caller-authed client — identity + authz ONLY
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: { user }, error: userErr } = await callerClient.auth.getUser()
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401)

    // (b) service-role client — generateLink + DB writes/lookups
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const body = await req.json().catch(() => null)

    // tenant_id comes from the body and is REQUIRED. Read ONCE into a single
    // variable; nothing below re-reads body.tenant_id. Shape-checked before use so a
    // malformed value is a 400, not a database error.
    const rawTenantId = body?.tenant_id
    if (typeof rawTenantId !== 'string' || !UUID_RE.test(rawTenantId)) {
      return json({ error: 'A valid tenant_id is required.' }, 400)
    }
    const tenantId: string = rawTenantId

    // THE authorization step, unchanged: re-read fresh from the DB through the
    // CALLER's client, strict equality. A caller naming a tenant they do not admin
    // gets the same 403 as before. Never trusts a JWT claim (stale after demotion).
    const { data: callerRole } = await callerClient.rpc('get_my_tenant_role', { p_tenant_id: tenantId })
    if (callerRole !== 'admin') return json({ error: 'Forbidden' }, 403)

    const email = (body?.email || '').trim().toLowerCase()
    const role  = body?.role
    if (!validEmail(email))            return json({ error: 'A valid email is required.' }, 400)
    if (!ROLES.includes(role))         return json({ error: 'Invalid role.' }, 400)

    // tenant slug (for the subdomain URL) + business name (for branding)
    const [{ data: tenant }, { data: bizSetting }] = await Promise.all([
      service.from('tenants').select('slug').eq('id', tenantId).maybeSingle(),
      service.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
    ])
    const slug = tenant?.slug
    if (!slug) return json({ error: 'Tenant not found.' }, 404)
    // S317. The tenant's OWN name, or nothing. There is no default: the platform's
    // name is not a business name, and substituting it here is the category error
    // platformBrand.ts exists to fix (see its header). Copy below names the business
    // only when there is one.
    //
    // senderName is a DIFFERENT claim. A From display label is mandatory, and
    // "${PLATFORM_NAME} is sending this" is true; "your business is called
    // ${PLATFORM_NAME}" is the claim we refuse to make.
    const businessName: string = bizSetting?.value?.name || ''
    const senderName: string = businessName || PLATFORM_NAME
    const origin = `https://${slug}.${APP_BASE_DOMAIN}`
    const setPasswordBase = `${origin}/set-password`

    // Mint identity/link. New email → invite (creates user). Existing global email → branch.
    let userId: string
    let isNew: boolean
    let hashedToken: string | undefined
    const inv = await service.auth.admin.generateLink({
      type: 'invite', email, options: { redirectTo: setPasswordBase },
    })
    if (!inv.error && inv.data?.user) {
      userId = inv.data.user.id
      isNew = true
      hashedToken = inv.data.properties?.hashed_token
    } else if (isEmailExists(inv.error)) {
      // Email already exists globally (another tenant). Resolve the id WITHOUT re-creating
      // identity; the magiclink token is used only to read user.id and is never delivered.
      const mag = await service.auth.admin.generateLink({ type: 'magiclink', email })
      if (mag.error || !mag.data?.user) throw mag.error || new Error('Could not resolve existing user')
      userId = mag.data.user.id
      isNew = false
    } else {
      throw inv.error
    }

    // Membership upsert — re-invite updates role (D2). The last-admin trigger guards demotion.
    const { error: upsertErr } = await service
      .from('tenant_users')
      .upsert({ tenant_id: tenantId, user_id: userId, role }, { onConflict: 'tenant_id,user_id' })
    if (upsertErr) {
      if (upsertErr.code === '23514' || /last admin/i.test(upsertErr.message)) {
        return json({ error: 'Cannot change the role of the last admin.' }, 409)
      }
      throw upsertErr
    }

    // Branded email. NEVER log the link.
    if (isNew) {
      const link = `${setPasswordBase}?token_hash=${hashedToken}&type=invite`
      const { subject, html, text } = inviteEmail(businessName, link)
      await sendEmail({ to: email, subject, html, text, fromName: senderName })
    } else {
      const { subject, html, text } = addedToTenantEmail(businessName, `${origin}/admin/login`)
      await sendEmail({ to: email, subject, html, text, fromName: senderName })
    }

    return json({ status: isNew ? 'invited' : 'added' })
  } catch (err) {
    console.error('[invite-team-member] error:', err instanceof Error ? err.message : String(err))
    return json({ error: 'Invitation failed.' }, 500)
  }
}

if (import.meta.main) {
  Deno.serve(handler)
}
