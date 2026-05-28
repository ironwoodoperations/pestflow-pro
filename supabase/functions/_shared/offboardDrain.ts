// S245 — shared external-cleanup logic for the offboard outbox.
// Used by BOTH offboard-tenant (post-commit sync drain) and process-offboard-queue
// (cron backstop). The per-item delete logic is identical; the two callers differ
// only in selection/backoff orchestration.
//
// Outcome classification (per S245 PR2 correction):
//   done   — terminal success (2xx, or 404 = already gone / idempotent)
//   failed — TERMINAL failure, NO retry → surfaces in manual_cleanup
//            (Zernio 4xx "profile has connected accounts" — operator must
//            disconnect accounts in the Zernio dashboard, one manual action)
//   retry  — transient (5xx / 429 / network) → row left 'pending', attempts++

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const OPERATOR_ID = '5181b30a-265f-4a70-a323-bf6e3c53641b'
export const OPERATOR_EMAIL = 'admin@pestflowpro.com'

const ZERNIO_API_KEY = Deno.env.get('ZERNIO_API_KEY') || ''

export interface QueueRow {
  id: string
  request_id: string
  target_type: 'auth_user' | 'zernio'
  target_id: string
  attempts: number
  updated_at?: string
}
export interface ItemResult {
  target_id: string
  target_type: 'auth_user' | 'zernio'
  status: 'done' | 'failed' | 'pending'
  error?: string
}

type Outcome = { kind: 'done' | 'failed' | 'retry'; error?: string }

// GoTrue hard delete. 404 / "not found" ⇒ already gone ⇒ done (idempotent).
// Other GoTrue errors are treated as transient (retry).
async function deleteAuthUser(admin: SupabaseClient, id: string): Promise<Outcome> {
  const { error } = await admin.auth.admin.deleteUser(id)
  if (!error) return { kind: 'done' }
  const msg = (error.message || '').toLowerCase()
  // deno-lint-ignore no-explicit-any
  const status = (error as any).status
  if (status === 404 || msg.includes('not found')) return { kind: 'done' }
  return { kind: 'retry', error: error.message }
}

// Zernio profile delete: DELETE /api/v1/profiles/{id}, Bearer ZERNIO_API_KEY.
//   2xx                                  → done
//   404 (already gone)                   → done (idempotent)
//   409 / 412 / other 4xx (has accounts) → failed TERMINAL → manual_cleanup (no retry)
//   5xx / 429 / network                  → retry
// We do NOT auto-disconnect accounts on the destructive path; profiles-with-
// accounts intentionally route to manual_cleanup (one Zernio-dashboard action).
async function deleteZernioProfile(profileId: string): Promise<Outcome> {
  if (!ZERNIO_API_KEY) return { kind: 'retry', error: 'ZERNIO_API_KEY not set' }
  try {
    const res = await fetch(`https://zernio.com/api/v1/profiles/${encodeURIComponent(profileId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ZERNIO_API_KEY}` },
    })
    if (res.ok) return { kind: 'done' }
    const s = res.status
    if (s === 404) return { kind: 'done' }                       // already gone
    if (s === 429 || s >= 500) return { kind: 'retry', error: `zernio_${s}` }
    if (s >= 400) return { kind: 'failed', error: `zernio_${s}_profile_has_connected_accounts_or_4xx` }
    return { kind: 'retry', error: `zernio_${s}` }               // unexpected 3xx
  } catch (e) {
    return { kind: 'retry', error: (e as Error)?.message || 'network' }
  }
}

// Delete one target and advance its queue row via the SECURITY DEFINER setter.
//   done   → status 'done'
//   failed → status 'failed' (terminal; no attempts bump; manual_cleanup)
//   retry  → status 'pending' + attempts++ (sync drain + cron both retry)
export async function processQueueRow(admin: SupabaseClient, row: QueueRow): Promise<ItemResult> {
  const outcome = row.target_type === 'auth_user'
    ? await deleteAuthUser(admin, row.target_id)
    : await deleteZernioProfile(row.target_id)

  if (outcome.kind === 'done') {
    await admin.rpc('offboard_mark_queue_item', { p_id: row.id, p_status: 'done', p_last_error: null, p_increment_attempts: false })
    return { target_id: row.target_id, target_type: row.target_type, status: 'done' }
  }
  if (outcome.kind === 'failed') {
    await admin.rpc('offboard_mark_queue_item', { p_id: row.id, p_status: 'failed', p_last_error: outcome.error ?? null, p_increment_attempts: false })
    return { target_id: row.target_id, target_type: row.target_type, status: 'failed', error: outcome.error }
  }
  // retry (transient)
  await admin.rpc('offboard_mark_queue_item', { p_id: row.id, p_status: 'pending', p_last_error: outcome.error ?? null, p_increment_attempts: true })
  return { target_id: row.target_id, target_type: row.target_type, status: 'pending', error: outcome.error }
}

// Advance the audit row once every queue row for the request is terminal-success.
// Any 'failed' (manual needed) or remaining 'pending' (retrying) ⇒ cleanup_partial.
// Empty queue (no orphans/zernio) ⇒ cleanup_complete.
export async function finalizeAudit(admin: SupabaseClient, requestId: string): Promise<'cleanup_complete' | 'cleanup_partial'> {
  const { data } = await admin.from('tenant_offboard_queue').select('status').eq('request_id', requestId)
  const rows = (data ?? []) as { status: string }[]
  const allSucceeded = rows.every((r) => r.status === 'done' || r.status === 'skipped_404')
  const state = allSucceeded ? 'cleanup_complete' : 'cleanup_partial'
  await admin.rpc('offboard_set_audit_state', { p_request_id: requestId, p_final_state: state })
  return state
}
