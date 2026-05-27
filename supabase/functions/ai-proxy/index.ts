// Edge Function: ai-proxy — S243.
// Single server-side proxy for ALL Anthropic /v1/messages traffic. Replaces 10
// browser-direct fetches that leaked VITE_ANTHROPIC_API_KEY into the SPA bundle.
//
// Pipeline (per Wave 2 addendum): CORS/OPTIONS → request bounds (R6) → auth +
// per-feature tier gating (A2.2) → two-layer atomic rate-limit (R4/R5) →
// upstream Anthropic (model pinned) → log every terminal outcome (R9).
//
// DEPLOY (verify_jwt:true by default — do NOT pass --no-verify-jwt):
//   supabase functions deploy ai-proxy --project-ref biezzykcgzkrwdgqpsar
// Requires: ANTHROPIC_API_KEY in Edge Function Secrets; migration in
// docs/audits/s243-migration.sql applied (ai_proxy_log + check_and_record_rate_limit).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { AuthError } from '../_shared/auth/requireTenantUser.ts'
import { requireAiCaller, FEATURE_TIER, type AiFeature } from '../_shared/aiAuth.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || ''

const MODEL = 'claude-sonnet-4-6'        // pinned — CLAUDE.md #1 + R2 (ignore client model)
const MAX_TOKENS_CAP = 4096
const MAX_BODY_BYTES = 100 * 1024
const MAX_MESSAGES = 50
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface LogRow {
  status: number
  feature?: string | null
  tenant_id?: string | null
  user_id?: string | null
  model?: string | null
  input_tokens?: number | null
  output_tokens?: number | null
}

serve(async (req) => {
  const cors = getCorsHeaders(req)
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json(405, { error: { message: 'Method not allowed' } })

  const svc: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const log = async (row: LogRow) => {
    try { await svc.from('ai_proxy_log').insert(row) }
    catch (e) { console.error('[ai-proxy] log insert failed:', (e as Error)?.message) }
  }

  // tracked across the request so the catch block can log with context
  let feature: string | null = null
  let tenantForLog: string | null = null
  let userId: string | null = null

  try {
    // ── R6: request bounds (pre-auth, cheap rejection) ──
    const raw = await req.text()
    if (raw.length > MAX_BODY_BYTES) {
      await log({ status: 400 }); return json(400, { error: { message: 'Request body too large' } })
    }
    let body: Record<string, unknown>
    try { body = JSON.parse(raw || '{}') }
    catch { await log({ status: 400 }); return json(400, { error: { message: 'Invalid JSON' } }) }

    feature = typeof body.feature === 'string' ? body.feature : null
    const rawTenant = typeof body.tenant_id === 'string' ? body.tenant_id : null
    tenantForLog = rawTenant
    const max_tokens = body.max_tokens
    const messages = body.messages
    const system = body.system
    const temperature = body.temperature

    if (!feature || !(feature in FEATURE_TIER)) {
      await log({ status: 400, feature: null, tenant_id: rawTenant })
      return json(400, { error: { message: 'Unknown or missing feature' } })
    }
    if (typeof max_tokens !== 'number' || !Number.isInteger(max_tokens) || max_tokens <= 0 || max_tokens > MAX_TOKENS_CAP) {
      await log({ status: 400, feature, tenant_id: rawTenant })
      return json(400, { error: { message: `max_tokens must be an integer in 1..${MAX_TOKENS_CAP}` } })
    }
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
      await log({ status: 400, feature, tenant_id: rawTenant })
      return json(400, { error: { message: `messages must be a non-empty array of <= ${MAX_MESSAGES}` } })
    }
    if (system !== undefined && typeof system !== 'string') {
      await log({ status: 400, feature, tenant_id: rawTenant })
      return json(400, { error: { message: 'system must be a string' } })
    }
    if (temperature !== undefined && typeof temperature !== 'number') {
      await log({ status: 400, feature, tenant_id: rawTenant })
      return json(400, { error: { message: 'temperature must be a number' } })
    }
    if (rawTenant !== null && !UUID_RE.test(rawTenant)) {
      await log({ status: 400, feature, tenant_id: null })
      return json(400, { error: { message: 'tenant_id must be a UUID' } })
    }

    // ── auth + per-feature tier gating (A2.2) ──
    const caller = await requireAiCaller(req, rawTenant, feature as AiFeature)
    userId = caller.user.id
    const callerTenant = caller.tenantId
    tenantForLog = callerTenant

    // ── two-layer atomic rate limit (R4/R5) — fail-open on RPC infra error ──
    const rl = async (key: string, max: number) => {
      const { data, error } = await svc.rpc('check_and_record_rate_limit', {
        p_key: key, p_window_seconds: 300, p_max_count: max,
      })
      if (error) { console.error('[ai-proxy] rate-limit rpc error (fail-open):', error.message); return true }
      return data === true
    }
    const userOk = await rl(`ai-proxy:${callerTenant ?? 'op'}:${userId}`, 20)
    const tenantOk = callerTenant ? await rl(`ai-proxy:${callerTenant}`, 60) : true
    if (!userOk || !tenantOk) {
      await log({ status: 429, feature, tenant_id: callerTenant, user_id: userId })
      return json(429, { error: { message: 'Too many AI requests. Please wait a minute and try again.' } })
    }

    // ── upstream Anthropic (model pinned; messages/system forwarded opaquely) ──
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens,
        messages,
        ...(system !== undefined ? { system } : {}),
        ...(temperature !== undefined ? { temperature } : {}),
      }),
    })
    const data = await upstream.json().catch(() => ({} as Record<string, unknown>))

    if (!upstream.ok) {
      const msg = (data as { error?: { message?: string } })?.error?.message || 'Anthropic API error'
      await log({ status: upstream.status, feature, tenant_id: callerTenant, user_id: userId, model: MODEL })
      console.warn(`[ai-proxy] upstream ${upstream.status} feature:${feature} tenant:${callerTenant}`)
      return json(upstream.status, {
        error: { message: msg, anthropic_status: upstream.status, request_id: upstream.headers.get('request-id') },
      })
    }

    const usage = (data as { usage?: { input_tokens?: number; output_tokens?: number } })?.usage
    await log({
      status: 200, feature, tenant_id: callerTenant, user_id: userId, model: MODEL,
      input_tokens: usage?.input_tokens ?? null, output_tokens: usage?.output_tokens ?? null,
    })
    console.log(`[ai-proxy] tenant:${callerTenant} user:${caller.user.email ?? '-'} feature:${feature} status:200 in:${usage?.input_tokens ?? '-'} out:${usage?.output_tokens ?? '-'}`)
    return json(200, data)

  } catch (err) {
    if (err instanceof AuthError) {
      const msg = typeof err.body?.error === 'string' ? err.body.error : 'Forbidden'
      await log({ status: err.status, feature, tenant_id: tenantForLog, user_id: userId })
      return json(err.status, { error: { message: msg } })
    }
    console.error('[ai-proxy] unexpected error:', (err as Error)?.message)
    await log({ status: 500, feature, tenant_id: tenantForLog, user_id: userId })
    return json(500, { error: { message: 'Internal error' } })
  }
})
