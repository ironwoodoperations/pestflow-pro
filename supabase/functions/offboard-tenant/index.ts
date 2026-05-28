// Edge Function: offboard-tenant — S245 PR2.
// Operator-only destructive teardown. Dry-run returns the blast-radius preview;
// confirm calls the audited RPC (atomic delete + audit + outbox) then best-effort
// drains external cleanup (GoTrue users, then Zernio profiles) synchronously.
// process-offboard-queue is the cron backstop for anything dropped here.
//
// DEPLOY verify_jwt:true. Env: SUPABASE_URL, SUPABASE_ANON_KEY,
//   SUPABASE_SERVICE_ROLE_KEY, ZERNIO_API_KEY.
// Caller must refreshSession() (not getSession()) and send Authorization Bearer
// + apikey. We re-verify the operator in code — never trust a dashboard toggle.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { processQueueRow, finalizeAudit, OPERATOR_ID, OPERATOR_EMAIL, type QueueRow, type ItemResult } from '../_shared/offboardDrain.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  const cors = getCorsHeaders(req)
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  // ── operator gate (verified in code, not via the dashboard verify_jwt toggle) ──
  const token = (req.headers.get('Authorization') || '').replace(/^[Bb]earer\s+/, '').trim()
  if (!token) return json(401, { error: 'Unauthorized' })
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data: { user }, error: authErr } = await anon.auth.getUser(token)
  if (authErr || !user) return json(401, { error: 'Unauthorized' })
  if (user.id !== OPERATOR_ID || user.email !== OPERATOR_EMAIL) {
    console.warn('[offboard-tenant] non-operator denied:', user.email)
    return json(403, { error: 'Forbidden' })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json(400, { error: 'Invalid JSON' }) }
  const tenantId = typeof body.tenant_id === 'string' ? body.tenant_id : ''
  if (!tenantId) return json(400, { error: 'tenant_id required' })
  const confirm = body.confirm === true

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // ── dry-run: preview only ──
  if (!confirm) {
    const { data, error } = await admin.rpc('admin_delete_tenant', { p_tenant_id: tenantId, p_confirm: false })
    if (error) { console.error('[offboard-tenant] dry-run rpc error:', error.message); return json(500, { error: 'preview failed' }) }
    return json(200, data)
  }

  // ── confirm: atomic delete + audit + outbox via the RPC ──
  const requestId = typeof body.request_id === 'string' && body.request_id ? body.request_id : crypto.randomUUID()
  const slugConfirmation = typeof body.slug_confirmation === 'string' ? body.slug_confirmation : null

  const { data: rpc, error: rpcErr } = await admin.rpc('admin_delete_tenant', {
    p_tenant_id: tenantId, p_confirm: true, p_slug_confirmation: slugConfirmation,
    p_request_id: requestId, p_operator_id: user.id, p_operator_email: user.email,
  })
  // RPC error here is pre-commit (nothing deleted) — safe to surface.
  if (rpcErr) { console.error('[offboard-tenant] confirm rpc error:', rpcErr.message); return json(500, { error: 'offboard rpc failed' }) }
  // Guard rejections (protected / slug_mismatch / offboard_in_progress): stop, no drain.
  if (rpc?.ok === false) return json(200, rpc)

  // ── committed. Post-commit best-effort drain. NEVER throw past this point. ──
  const report: Record<string, unknown> = {
    request_id: rpc?.request_id ?? requestId,
    deleted: true,
    deleted_counts: rpc?.deleted_counts ?? null,
    auth_results: [] as ItemResult[],
    zernio_results: [] as ItemResult[],
    manual_cleanup: [] as string[],
  }
  try {
    const { data: rows } = await admin.from('tenant_offboard_queue')
      .select('id,request_id,target_type,target_id,attempts')
      .eq('request_id', report.request_id).eq('status', 'pending')
    // auth_user FIRST, then zernio
    const ordered = ((rows ?? []) as QueueRow[]).sort(
      (a, b) => (a.target_type === 'auth_user' ? 0 : 1) - (b.target_type === 'auth_user' ? 0 : 1))
    for (const row of ordered) {
      const r = await processQueueRow(admin, row)
      ;(report[row.target_type === 'auth_user' ? 'auth_results' : 'zernio_results'] as ItemResult[]).push(r)
      // Only TERMINAL failures need a human (e.g. Zernio profile with connected
      // accounts). 'pending' is transient — the cron backstop retries it.
      if (r.status === 'failed') (report.manual_cleanup as string[]).push(`${row.target_type}:${row.target_id}`)
    }
    report.final_state = await finalizeAudit(admin, report.request_id as string)
  } catch (e) {
    // Outbox + cron backstop will finish; surface, do not fail the request.
    console.error('[offboard-tenant] post-commit drain error:', (e as Error)?.message)
    report.drain_error = 'cleanup deferred to cron backstop'
  }
  return json(200, report)
})
