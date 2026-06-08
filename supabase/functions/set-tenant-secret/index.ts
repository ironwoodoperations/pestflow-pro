// Edge Function: set-tenant-secret — S255 (secret WRITE path → Vault).
//
// Companion to the S254 read path (_shared/secrets/getTenantSecret.ts →
// get_tenant_secret RPC). Admin/onboarding code calls this to SET or CLEAR one
// of the 4 per-tenant integration secrets in Postgres Vault, so those values
// never land in the anon-adjacent settings.integrations JSONB again.
//
// SECURITY MODEL (S255 validator gate — REQUIRED CHANGE 1):
//   The authoritative tenant-ownership check lives INSIDE the set_tenant_secret
//   RPC, re-derived from auth.uid(). For that to work the RPC MUST be called
//   with the USER'S JWT — a Supabase client whose Authorization header carries
//   the caller's bearer token — NOT the service-role key. If it were called
//   with service_role, auth.uid() would resolve to NULL inside the RPC and the
//   ownership check would fail OPEN (an IDOR letting tenant A write tenant B).
//   This function therefore:
//     1. verifies the JWT and resolves the user (early 401),
//     2. does an early membership pre-check (good API hygiene / early 403),
//     3. calls the RPC through a user-JWT client — the RPC re-checks auth.uid().
//   The service-role client is used ONLY for the read-only pre-check, never to
//   invoke the RPC.
//
// CLEAR/DISCONNECT (REQUIRED CHANGE 3): action 'clear' (or an empty value)
//   deletes the Vault secret so the read path stops fetching a stale token.
//
// NO PLAINTEXT IN LOGS: the secret value and the raw request body are never
// logged, and never placed in an error response.
//
// DEPLOY verify_jwt:true. Env: SUPABASE_URL, SUPABASE_ANON_KEY,
//   SUPABASE_SERVICE_ROLE_KEY.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Mirror of the RPC + read-path allowlist. Anything else is rejected.
const ALLOWED_SECRET_NAMES = new Set([
  'facebook_access_token',
  'ga4_oauth_refresh_token',
  'gsc_oauth_refresh_token',
  'textbelt_api_key',
])

serve(async (req) => {
  const cors = getCorsHeaders(req)
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  // ── 1. Authenticate the caller (early rejection) ──────────────────────
  const token = (req.headers.get('Authorization') || '').replace(/^[Bb]earer\s+/, '').trim()
  if (!token) return json(401, { error: 'Unauthorized' })

  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data: { user }, error: authErr } = await anon.auth.getUser(token)
  if (authErr || !user) return json(401, { error: 'Unauthorized' })

  // ── 2. Parse + validate input (never log the body / value) ────────────
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json(400, { error: 'Invalid JSON' }) }

  const tenantId = typeof body.tenant_id === 'string' ? body.tenant_id.trim() : ''
  const secretName = typeof body.secret_name === 'string' ? body.secret_name.trim() : ''
  const action = body.action === 'clear' ? 'clear' : 'set'
  const rawValue = typeof body.secret_value === 'string' ? body.secret_value : ''
  // 'clear' (or an empty value) → null → RPC deletes the Vault secret.
  const secretValue = action === 'clear' || rawValue.trim() === '' ? null : rawValue

  if (!tenantId) return json(400, { error: 'tenant_id required' })
  if (!secretName) return json(400, { error: 'secret_name required' })
  if (!ALLOWED_SECRET_NAMES.has(secretName)) return json(400, { error: 'secret_name not allowed' })

  // ── 3. Membership pre-check (early 403; RPC is the authoritative guard) ─
  // Read-only use of the service-role client — NOT used to call the RPC.
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: membership, error: memErr } = await admin
    .from('tenant_users')
    .select('user_id')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()
  if (memErr) {
    console.error('[set-tenant-secret] membership pre-check failed:', memErr.message)
    return json(500, { error: 'authorization check failed' })
  }
  if (!membership) {
    console.warn('[set-tenant-secret] non-admin denied — user:', user.id, 'tenant:', tenantId)
    return json(403, { error: 'Forbidden' })
  }

  // ── 4. Authoritative write via the USER-JWT client (auth.uid() inside) ─
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: result, error: rpcErr } = await userClient.rpc('set_tenant_secret', {
    p_tenant_id: tenantId,
    p_secret_name: secretName,
    p_secret_value: secretValue,
  })
  if (rpcErr) {
    // rpcErr.message may surface 'not an admin of tenant' etc. — it never
    // contains the secret value (we never pass the value into a message).
    console.error('[set-tenant-secret] rpc error for tenant', tenantId, 'secret', secretName, ':', rpcErr.message)
    // Key the 403 off the PostgreSQL error CODE, not the message text. The RPC's
    // ownership-denial RAISEs with ERRCODE '42501' (insufficient_privilege),
    // surfaced by supabase-js as error.code. This only fires on a TOCTOU race
    // where admin is revoked between the pre-check above and the RPC — the
    // pre-check is the primary 403 path. A bare message regex (/unauthorized/i)
    // missed the RPC's "not an admin" wording and mis-mapped denials to 500.
    if (rpcErr.code === '42501') return json(403, { error: 'Forbidden' })
    return json(500, { error: 'write failed' })
  }

  return json(200, { ok: true, action: result ?? (secretValue === null ? 'cleared' : 'saved') })
})
