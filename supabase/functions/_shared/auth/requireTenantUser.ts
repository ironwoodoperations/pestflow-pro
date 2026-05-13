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
 * Validates Bearer JWT + tenant ownership. Returns user, tenant_id, and role.
 * Use for surfaces where any tenant user (admin or future non-admin roles) is acceptable.
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

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('tenant_id, role').eq('id', user.id).maybeSingle()
  if (profileError || !profile?.tenant_id) {
    throw new AuthError(403, { error: 'Forbidden' })
  }

  if (profile.tenant_id !== requestedTenantId) {
    console.warn('[requireTenantUser] tenant mismatch — user:', user.email,
                 'profile.tenant_id:', profile.tenant_id, 'requested:', requestedTenantId)
    throw new AuthError(403, { error: 'Forbidden' })
  }

  return { user: { id: user.id, email: user.email }, tenantId: profile.tenant_id, role: profile.role }
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
