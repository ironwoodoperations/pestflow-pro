// Edge Function: lead-bridge-dispatch — S257
//
// Ships a PestFlow Pro lead to the Platform lead receiver per the LOCKED
// contract. Invoked (fire-and-forget, via pg_net) by two DB callers with a
// queue row's IDs ONLY — never PII in the request body:
//   • public.trigger_lead_bridge_dispatch()   — on lead enqueue
//   • public.reconcile_lead_bridge_queue()     — retry/backoff sweep
// This function re-fetches the lead from the DB, POSTs it to the Platform, and
// updates the queue row's terminal/retry state.
//
// ── TWO SECRETS, TWO HOPS, NEVER CONFLATE ───────────────────────────────────
//   • lead_bridge_dispatch_internal_secret  → verifies the CALLER (trigger/
//     reconciler → this fn). Hop 1. Read from Vault (single source of truth).
//   • PESTFLOW_PRO_LEAD_BRIDGE_SECRET       → authenticates THIS fn → Platform
//     receiver. Hop 2. Edge secret.
//
// AUTH: verify_jwt:false at the platform gateway; hop-1 is enforced in-source by
//   a timing-safe compare of the `apikey` header against the Vault secret. Same
//   class as notify-new-lead's in-source secret check.
//
// PII / LOGGING: the lead payload (name/email/phone/message/body) is NEVER
//   logged and NEVER written to the queue row. Only IDs + status codes + short
//   generic error tokens are logged/stored.
//
// DEPLOY verify_jwt:false. Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   PLATFORM_LEAD_RECEIVER_URL, PESTFLOW_PRO_LEAD_BRIDGE_SECRET.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { timingSafeEqual } from 'node:crypto'
import { getCorsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const PLATFORM_LEAD_RECEIVER_URL = Deno.env.get('PLATFORM_LEAD_RECEIVER_URL') || ''
const PESTFLOW_PRO_LEAD_BRIDGE_SECRET = Deno.env.get('PESTFLOW_PRO_LEAD_BRIDGE_SECRET') || ''

// Outbound POST timeout — a hung receiver should be a retryable failure, not a
// hang. pg_net has its own timeout, but we don't want this fn to stall either.
const PLATFORM_POST_TIMEOUT_MS = 10_000

// node:crypto.timingSafeEqual is constant-time but THROWS on length mismatch,
// so the length-equality pre-check is required. (Web Crypto has no
// timingSafeEqual in the Supabase Edge Runtime.)
function secretsMatch(expected: string, presented: string): boolean {
  const enc = new TextEncoder()
  const a = enc.encode(expected)
  const b = enc.encode(presented)
  return a.length === b.length && timingSafeEqual(a, b)
}

serve(async (req) => {
  const cors = getCorsHeaders(req)
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // ── HOP 1: verify the caller (trigger/reconciler) ─────────────────────────
  // Single source of truth for the hop-1 secret is Vault — NOT an edge secret.
  // vault.decrypted_secrets is reachable here via the service-role client's
  // .schema('vault') accessor (same pattern as outscraper-reviews).
  const presentedKey = req.headers.get('apikey') || ''
  const { data: vaultRow, error: vaultErr } = await admin
    .schema('vault')
    .from('decrypted_secrets')
    .select('decrypted_secret')
    .eq('name', 'lead_bridge_dispatch_internal_secret')
    .maybeSingle()
  const expectedKey = vaultRow?.decrypted_secret ?? ''

  if (vaultErr || !expectedKey) {
    // Misconfigured server (Vault unreadable / secret absent) — never auth-pass.
    console.error('[lead-bridge-dispatch] hop-1 secret unavailable from Vault:', vaultErr?.message ?? 'not found')
    return json(500, { error: 'Server misconfigured' })
  }
  if (!presentedKey || !secretsMatch(expectedKey, presentedKey)) {
    console.warn('[lead-bridge-dispatch] hop-1 auth failed — apikey_present:', !!presentedKey)
    return json(401, { error: 'Unauthorized' })
  }

  // ── Parse body (IDs ONLY — never PII) ─────────────────────────────────────
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json(400, { error: 'Invalid JSON' }) }

  const queueId = typeof body.queue_id === 'string' ? body.queue_id.trim() : ''
  const proLeadId = typeof body.pro_lead_id === 'string' ? body.pro_lead_id.trim() : ''
  const tenantId = typeof body.tenant_id === 'string' ? body.tenant_id.trim() : ''
  if (!queueId || !proLeadId || !tenantId) {
    return json(400, { error: 'queue_id, pro_lead_id, tenant_id required' })
  }

  const logCtx = `queue=${queueId} pro_lead=${proLeadId} tenant=${tenantId}`

  // ── Load the queue row ────────────────────────────────────────────────────
  const { data: queueRow, error: queueErr } = await admin
    .from('lead_bridge_queue')
    .select('id, status')
    .eq('id', queueId)
    .maybeSingle()
  if (queueErr) {
    console.error('[lead-bridge-dispatch] queue read failed', logCtx, ':', queueErr.message)
    return json(500, { error: 'queue read failed' })
  }
  if (!queueRow) {
    console.warn('[lead-bridge-dispatch] queue row missing', logCtx)
    return json(200, { ok: false, status: 'queue_row_missing' })
  }
  if (queueRow.status === 'delivered') {
    // Idempotent: the reconciler may double-fire. Do nothing.
    console.log('[lead-bridge-dispatch] noop, already delivered', logCtx)
    return json(200, { ok: true, status: 'noop_already_delivered' })
  }

  // ── Re-fetch the lead (the ONLY place PII is read) ────────────────────────
  const { data: lead, error: leadErr } = await admin
    .from('leads')
    .select('id, name, email, phone, services, message, created_at')
    .eq('id', proLeadId)
    .maybeSingle()
  if (leadErr) {
    console.error('[lead-bridge-dispatch] lead read failed', logCtx, ':', leadErr.message)
    return json(500, { error: 'lead read failed' })
  }
  if (!lead) {
    // Permanent: the lead no longer exists. Mark dead — no PII in last_error.
    await admin.from('lead_bridge_queue')
      .update({ status: 'dead', last_error: 'lead_missing' })
      .eq('id', queueId)
    console.warn('[lead-bridge-dispatch] lead missing → dead', logCtx)
    return json(200, { ok: false, status: 'lead_missing' })
  }

  // ── Sanity read: platform company pointer. Null is non-fatal — Platform keys
  //    on pestflow_pro_tenant_id, not this pointer — so we proceed regardless.
  const { data: tenantRow } = await admin
    .from('tenants')
    .select('pestflow_platform_company_id')
    .eq('id', tenantId)
    .maybeSingle()
  if (!tenantRow?.pestflow_platform_company_id) {
    console.warn('[lead-bridge-dispatch] platform_company_id null (proceeding)', logCtx)
  }

  // ── Shape the LOCKED contract payload (exact shape — do not add/rename) ────
  const payload = {
    pestflow_pro_tenant_id: tenantId,
    pro_lead_id: lead.id,
    lead: {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      services: lead.services,   // text[] — pass as-is
      message: lead.message,
      source_url: null,          // no source_url column exists → null
      created_at: lead.created_at,
    },
  }

  // ── HOP 2: POST to the Platform receiver ──────────────────────────────────
  if (!PLATFORM_LEAD_RECEIVER_URL || !PESTFLOW_PRO_LEAD_BRIDGE_SECRET) {
    console.error('[lead-bridge-dispatch] hop-2 env missing', logCtx)
    return json(500, { error: 'Server misconfigured' })
  }

  const nowIso = () => new Date().toISOString()
  let status = 0
  let respBody: Record<string, unknown> = {}
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), PLATFORM_POST_TIMEOUT_MS)
    let resp: Response
    try {
      resp = await fetch(PLATFORM_LEAD_RECEIVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': PESTFLOW_PRO_LEAD_BRIDGE_SECRET },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      })
    } finally {
      clearTimeout(timer)
    }
    status = resp.status
    try { respBody = await resp.json() } catch { respBody = {} }
  } catch (e) {
    // Network error / timeout / abort → RETRYABLE. Reconciler owns backoff:
    // do NOT touch next_attempt_at or attempts.
    console.error('[lead-bridge-dispatch] platform POST network error', logCtx, ':', e instanceof Error ? e.name : 'error')
    await admin.from('lead_bridge_queue')
      .update({ status: 'failed', last_status_code: null, last_error: 'network_error' })
      .eq('id', queueId)
    return json(200, { ok: false, status: 'failed' })
  }

  // ── Map the response to a queue outcome ───────────────────────────────────
  if (status >= 200 && status < 300) {
    // Delivered. Platform may return { deduped:true } on a 200 — still delivered.
    const rawId = respBody.platform_lead_id ?? respBody.lead_id ?? null
    const platformLeadId = typeof rawId === 'string' ? rawId : null
    const deduped = respBody.deduped === true
    const { error: updErr } = await admin.from('lead_bridge_queue')
      .update({
        status: 'delivered',
        platform_lead_id: platformLeadId,
        delivered_at: nowIso(),
        last_status_code: 200,
        last_error: null,
      })
      .eq('id', queueId)
    if (updErr) {
      console.error('[lead-bridge-dispatch] delivered but queue update failed', logCtx, ':', updErr.message)
      return json(200, { ok: false, status: 'delivered_update_failed' })
    }
    console.log(`[lead-bridge-dispatch] delivered ${logCtx} deduped=${deduped} platform_lead_id_present=${!!platformLeadId}`)
    return json(200, { ok: true, status: deduped ? 'delivered_deduped' : 'delivered' })
  }

  if (status === 400 || status === 401 || status === 404) {
    // Permanent client error → dead. No retry. No PII in last_error.
    await admin.from('lead_bridge_queue')
      .update({ status: 'dead', last_status_code: status, last_error: `platform_${status}` })
      .eq('id', queueId)
    console.warn(`[lead-bridge-dispatch] platform ${status} → dead ${logCtx}`)
    return json(200, { ok: false, status: 'dead' })
  }

  // Everything else (5xx, other non-2xx) → RETRYABLE. Reconciler owns backoff:
  // do NOT touch next_attempt_at or attempts.
  await admin.from('lead_bridge_queue')
    .update({ status: 'failed', last_status_code: status, last_error: `platform_${status}` })
    .eq('id', queueId)
  console.warn(`[lead-bridge-dispatch] platform ${status} → failed ${logCtx}`)
  return json(200, { ok: false, status: 'failed' })
})
