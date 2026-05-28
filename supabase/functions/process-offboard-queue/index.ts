// Edge Function: process-offboard-queue — S245 PR2.
// Cron backstop (mirrors process-sms-queue): drains tenant_offboard_queue rows
// the post-commit sync drain in offboard-tenant didn't finish. pg_cron POSTs
// every 5 min. Exponential backoff via attempts + updated_at (no extra column).
// Advances audit final_state when a request's rows are terminal.
//
// Auth: pg_cron sends the internal key on header `x-pfp-internal-key`; this fn
// reads the expected value from vault.decrypted_secrets AT CALL TIME via the
// SECURITY DEFINER getter `offboard_queue_internal_secret()` (service_role-only)
// and constant-time compares. No Deno.env secret, no Edge Function Secret.
// (Mirrors the trigger_notify_new_lead vault-read precedent.)
//
// DEPLOY verify_jwt:false. Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ZERNIO_API_KEY.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { timingSafeEqual } from 'node:crypto'
import { processQueueRow, finalizeAudit, type QueueRow } from '../_shared/offboardDrain.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const MAX_ATTEMPTS = 5
const BATCH = 50
// backoff per attempt count (ms): 0,5m,30m,2h,4h — gated against updated_at.
const BACKOFF_MS = [0, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 4 * 60 * 60_000]

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-pfp-internal-key',
}

function constantTimeEq(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a); const eb = new TextEncoder().encode(b)
  return ea.length === eb.length && timingSafeEqual(ea, eb)
}

serve(async (req) => {
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // ── auth: expected key read from vault at call time; compare to header ──
  const { data: expectedKey, error: keyErr } = await admin.rpc('offboard_queue_internal_secret')
  if (keyErr || !expectedKey) {
    console.error('[process-offboard-queue] vault key fetch failed:', keyErr?.message ?? 'empty')
    return json(500, { error: 'Server misconfigured' })
  }
  if (!constantTimeEq(String(expectedKey), req.headers.get('x-pfp-internal-key') || '')) {
    console.warn('[process-offboard-queue] auth failed')
    return json(401, { error: 'Unauthorized' })
  }

  try {
    const { data: rows, error } = await admin.from('tenant_offboard_queue')
      .select('id,request_id,target_type,target_id,attempts,updated_at')
      .eq('status', 'pending').lt('attempts', MAX_ATTEMPTS)
      .order('created_at', { ascending: true }).limit(BATCH)
    if (error) throw error

    const now = Date.now()
    const touched = new Set<string>()
    const summary = { scanned: rows?.length ?? 0, processed: 0, deferred: 0, done: 0, failed: 0, pending: 0 }

    for (const row of (rows ?? []) as QueueRow[]) {
      // exponential backoff: skip until enough time since the last attempt
      const wait = BACKOFF_MS[Math.min(row.attempts, BACKOFF_MS.length - 1)]
      if (row.updated_at && now - new Date(row.updated_at).getTime() < wait) { summary.deferred++; continue }

      const r = await processQueueRow(admin, row)
      summary.processed++
      if (r.status === 'done') summary.done++
      else if (r.status === 'failed') summary.failed++
      else summary.pending++
      touched.add(row.request_id)
    }

    // advance audit for any request touched this run
    for (const requestId of touched) await finalizeAudit(admin, requestId)

    console.log(`[process-offboard-queue] ${JSON.stringify(summary)}`)
    return json(200, summary)
  } catch (e) {
    console.error('[process-offboard-queue] error:', (e as Error)?.message)
    return json(500, { error: 'Internal error' })
  }
})
