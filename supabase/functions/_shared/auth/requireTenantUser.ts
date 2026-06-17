import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export class AuthError extends Error {
  constructor(public status: number, public body: { error: string }) {
    super(body.error)
  }
  toResponse(): Response {
    return new Response(JSON.stringify(this.body), {
      status: this.status,
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }
}

/**
 * Validates Bearer JWT + tenant membership. Returns user, tenant_id, and role.
 * Use for surfaces where any tenant user (admin/manager/user) is acceptable.
 *
 * SSOT (S273): tenant membership + role are read from `tenant_users` — the single
 * source of truth — NOT `profiles.role` (retired). The membership lookup is keyed
 * to the REQUESTED tenant, so a caller who belongs to tenant A but asks for tenant
 * B finds no row → 403. That filter is the cross-tenant isolation boundary. The
 * lookup runs with the service-role key (RLS-bypassing) by design; the boundary is
 * the explicit (user_id, tenant_id) predicate against real rows, exercised under a
 * real caller JWT. `tenant_users` also supports multi-tenant membership, which the
 * old single-row `profiles.tenant_id` model could not represent.
 */
export async function requireTenantUser(
  req: Request,
  requestedTenantId: string,
): Promise<{ user: { id: string; email?: string }; tenantId: string; role: string | null }> {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || ''
  const token = authHeader.replace(/^[Bb]earer\s+/, '').trim()
  if (!token) throw new AuthError(401, { error: 'Unauthorized' })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) throw new AuthError(401, { error: 'Unauthorized' })

  const { data: membership, error: membershipError } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', requestedTenantId)
    .maybeSingle()
  if (membershipError || !membership) {
    console.warn('[requireTenantUser] no membership — user:', user.email,
                 'requested:', requestedTenantId, 'err:', membershipError?.message)
    throw new AuthError(403, { error: 'Forbidden' })
  }

  return { user: { id: user.id, email: user.email }, tenantId: requestedTenantId, role: membership.role }
}

/**
 * Validates Bearer JWT + tenant ownership + admin role.
 * Use for tenant-representing actions (billing, public posts, support escalations).
 */
export async function requireTenantAdmin(
  req: Request,
  requestedTenantId: string,
): Promise<{ user: { id: string; email?: string }; tenantId: string }> {
  const result = await requireTenantUser(req, requestedTenantId)
  if (result.role !== 'admin') {
    console.warn('[requireTenantAdmin] non-admin caller — user:', result.user.email,
                 'role:', result.role, 'tenant:', result.tenantId)
    throw new AuthError(403, { error: 'Forbidden' })
  }
  return { user: result.user, tenantId: result.tenantId }
}
