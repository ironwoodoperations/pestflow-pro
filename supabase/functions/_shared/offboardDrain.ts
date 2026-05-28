// S245 — shared external-cleanup logic for the offboard outbox.
// Used by BOTH offboard-tenant (post-commit sync drain) and process-offboard-queue
// (cron backstop). The per-item delete logic is identical; the two callers differ
// only in selection/backoff orchestration.
//
// Idempotency: a 404 / "not found" is treated as success-equivalent — the target
// is already gone, which is the desired end state.

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
  status: 'done' | 'skipped_404' | 'failed' | 'pending'
  error?: string
}

// GoTrue hard delete. 404 / "not found" ⇒ already gone ⇒ done (idempotent).
export async function deleteAuthUser(admin: SupabaseClient, id: string): Promise<{ status: 'done' | 'failed'; error?: string }> {
  const { error } = await admin.auth.admin.deleteUser(id)
  if (!error) return { status: 'done' }
  const msg = (error.message || '').toLowerCase()
  // deno-lint-ignore no-explicit-any
  const status = (error as any).status
  if (status === 404 || msg.includes('not found')) return { status: 'done' }
  return { status: 'failed', error: error.message }
}

// Zernio profile delete. 404 ⇒ skipped_404; 2xx ⇒ done; else failed.
// NOTE: confirm the exact profile-delete path against Zernio docs — zernio-connect
// only exercises /api/v1/accounts. Best-effort + backstopped + manual_cleanup
// fallback, so a wrong path degrades to "left pending" (no data integrity risk).
export async function deleteZernioProfile(profileId: string): Promise<{ status: 'done' | 'skipped_404' | 'failed'; error?: string }> {
  if (!ZERNIO_API_KEY) return { status: 'failed', error: 'ZERNIO_API_KEY not set' }
  try {
    const res = await fetch(`https://zernio.com/api/v1/profiles/${encodeURIComponent(profileId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ZERNIO_API_KEY}` },
    })
    if (res.status === 404) return { status: 'skipped_404' }
    if (res.ok) return { status: 'done' }
    return { status: 'failed', error: `zernio_${res.status}` }
  } catch (e) {
    return { status: 'failed', error: (e as Error)?.message || 'network' }
  }
}

// Delete one target and advance its queue row via the SECURITY DEFINER setter.
// Failure ⇒ row left 'pending', attempts++ (sync drain + cron both retry).
export async function processQueueRow(admin: SupabaseClient, row: QueueRow): Promise<ItemResult> {
  const outcome = row.target_type === 'auth_user'
    ? await deleteAuthUser(admin, row.target_id)
    : await deleteZernioProfile(row.target_id)

  if (outcome.status === 'failed') {
    await admin.rpc('offboard_mark_queue_item', {
      p_id: row.id, p_status: 'pending', p_last_error: outcome.error ?? null, p_increment_attempts: true,
    })
    return { target_id: row.target_id, target_type: row.target_type, status: 'pending', error: outcome.error }
  }
  await admin.rpc('offboard_mark_queue_item', {
    p_id: row.id, p_status: outcome.status, p_last_error: null, p_increment_attempts: false,
  })
  return { target_id: row.target_id, target_type: row.target_type, status: outcome.status }
}

// Advance the audit row once every queue row for the request is terminal.
// Empty queue (no orphans/zernio) ⇒ cleanup_complete.
export async function finalizeAudit(admin: SupabaseClient, requestId: string): Promise<'cleanup_complete' | 'cleanup_partial'> {
  const { data } = await admin.from('tenant_offboard_queue').select('status').eq('request_id', requestId)
  const rows = (data ?? []) as { status: string }[]
  const allTerminal = rows.every((r) => r.status === 'done' || r.status === 'skipped_404')
  const state = allTerminal ? 'cleanup_complete' : 'cleanup_partial'
  await admin.rpc('offboard_set_audit_state', { p_request_id: requestId, p_final_state: state })
  return state
}
