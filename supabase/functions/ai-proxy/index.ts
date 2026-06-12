// Edge Function: ai-proxy — S243 (public route) + S242 (/internal route).
// Single server-side proxy for ALL Anthropic /v1/messages traffic.
//
// Public route  POST /ai-proxy           — user-JWT auth + per-feature tier gating
//   (S243; unchanged). Replaces the 10 browser-direct fetches.
// Internal route POST /ai-proxy/internal — signed delegation envelope auth (S242 §9).
//   For service callers (process-campaign-job, tag-image-vision). Never accepts
//   user JWTs. Verifies HMAC + expiry + purpose allowlist (shared helper), then
//   jti replay + tenant-exists + resource-ownership + Pro-tier + rate-limit
//   before forwarding to Anthropic. Logs the full actor chain (§11).
//
// DEPLOY (verify_jwt:true — do NOT pass --no-verify-jwt):
//   supabase functions deploy ai-proxy --project-ref biezzykcgzkrwdgqpsar
// Env: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//      INTERNAL_DELEGATION_SECRET (= vault internal_delegation_secret).
// Migrations: s243 (ai_proxy_log + check_and_record_rate_limit) + s242
//      (ai_proxy_log actor-chain cols + delegation_jti).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { AuthError } from '../_shared/auth/requireTenantUser.ts'
import { requireAiCaller, FEATURE_TIER, type AiFeature } from '../_shared/aiAuth.ts'
import { verifyEnvelopeSignature, EnvelopeError, type DelegationEnvelope } from '../_shared/delegationEnvelope.ts'
import { insertAiProxyLog, checkRateLimit } from '../_shared/aiProxyShared.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || ''
const INTERNAL_DELEGATION_SECRET = Deno.env.get('INTERNAL_DELEGATION_SECRET') || ''

const MODEL = 'claude-sonnet-4-6'        // pinned — CLAUDE.md #1 + R2 (ignore client model)
const MAX_TOKENS_CAP = 4096
const MAX_BODY_BYTES = 100 * 1024
const MAX_MESSAGES = 50
const PRO_TIER = 3                       // internal purposes are Pro+ (§12)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface LogRow {
  status: number
  feature?: string | null
  tenant_id?: string | null
  user_id?: string | null
  model?: string | null
  input_tokens?: number | null
  output_tokens?: number | null
  // S242 actor-chain columns (null on the public route)
  caller?: string | null
  acting_user?: string | null
  purpose?: string | null
  jti?: string | null
  batch_cardinality?: number | null
}

type JsonFn = (status: number, body: unknown) => Response
type LogFn = (row: LogRow) => Promise<void>

async function callAnthropic(payload: Record<string, unknown>) {
  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
  })
  const data = await upstream.json().catch(() => ({} as Record<string, unknown>))
  return { upstream, data }
}

// ── S242 internal route: envelope-authed service-to-service (design §9) ──────
async function handleInternal(req: Request, svc: SupabaseClient, json: JsonFn, log: LogFn): Promise<Response> {
  let env: DelegationEnvelope | null = null
  let batchCardinality = 1
  const logI = (status: number, inTok?: number | null, outTok?: number | null, calledUpstream = false) =>
    log({
      status,
      feature: env?.purpose ?? null,
      tenant_id: env?.acting_tenant ?? null,
      user_id: env?.acting_user ?? null,
      model: calledUpstream ? MODEL : null,
      input_tokens: inTok ?? null,
      output_tokens: outTok ?? null,
      caller: env?.caller ?? null,
      acting_user: env?.acting_user ?? null,
      purpose: env?.purpose ?? null,
      jti: env?.jti ?? null,
      batch_cardinality: batchCardinality,
    })

  try {
    const raw = await req.text()
    if (raw.length > MAX_BODY_BYTES) { await logI(400); return json(400, { error: { message: 'Request body too large' } }) }
    let body: Record<string, unknown>
    try { body = JSON.parse(raw || '{}') } catch { await logI(400); return json(400, { error: { message: 'Invalid JSON' } }) }

    // (1-3, 5) signature + expiry + structure + purpose allowlist — pure, throws EnvelopeError
    env = verifyEnvelopeSignature(req, INTERNAL_DELEGATION_SECRET)

    const max_tokens = body.max_tokens
    const messages = body.messages
    const system = body.system
    const temperature = body.temperature
    batchCardinality = typeof body.batch_cardinality === 'number' ? body.batch_cardinality : 1
    if (typeof max_tokens !== 'number' || !Number.isInteger(max_tokens) || max_tokens <= 0 || max_tokens > MAX_TOKENS_CAP) {
      await logI(400); return json(400, { error: { message: `max_tokens must be an integer in 1..${MAX_TOKENS_CAP}` } })
    }
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
      await logI(400); return json(400, { error: { message: `messages must be a non-empty array of <= ${MAX_MESSAGES}` } })
    }
    if (system !== undefined && typeof system !== 'string') { await logI(400); return json(400, { error: { message: 'system must be a string' } }) }
    if (temperature !== undefined && typeof temperature !== 'number') { await logI(400); return json(400, { error: { message: 'temperature must be a number' } }) }

    // (4) jti replay protection — unique PK insert; conflict ⇒ replay
    const { error: jtiErr } = await svc.from('delegation_jti').insert({ jti: env.jti, purpose: env.purpose, caller: env.caller })
    if (jtiErr) {
      if (jtiErr.code === '23505') { await logI(409); return json(409, { error: { message: 'Replay detected' } }) }
      console.error('[ai-proxy/internal] jti insert error:', jtiErr.message)
      await logI(500); return json(500, { error: { message: 'Internal error' } })
    }

    // (6) acting_tenant must be a real tenant
    const { data: tRow, error: tErr } = await svc.from('tenants').select('id').eq('id', env.acting_tenant).maybeSingle()
    if (tErr || !tRow) { await logI(401); return json(401, { error: { message: 'Unknown acting_tenant' } }) }

    // (7) resource ownership — image_id / campaign_id must belong to acting_tenant
    if (env.resource?.image_id) {
      if (!UUID_RE.test(env.resource.image_id)) { await logI(401); return json(401, { error: { message: 'Bad image_id' } }) }
      const { data, error } = await svc.from('image_library').select('id').eq('id', env.resource.image_id).eq('tenant_id', env.acting_tenant).maybeSingle()
      if (error || !data) { await logI(401); return json(401, { error: { message: 'image_id not in acting_tenant' } }) }
    }
    if (env.resource?.campaign_id) {
      if (!UUID_RE.test(env.resource.campaign_id)) { await logI(401); return json(401, { error: { message: 'Bad campaign_id' } }) }
      const { data, error } = await svc.from('social_campaigns').select('id').eq('id', env.resource.campaign_id).eq('tenant_id', env.acting_tenant).maybeSingle()
      if (error || !data) { await logI(401); return json(401, { error: { message: 'campaign_id not in acting_tenant' } }) }
    }

    // (8) tier re-check from the claimed tenant (never trust caller) — Pro+ only.
    // S262 — via the single authoritative RPC (tenants.entitlement), fail-closed.
    const { data: allowed, error: gateErr } = await svc.rpc('check_tenant_access', {
      p_tenant_id: env.acting_tenant,
      p_required_tier: PRO_TIER,
    })
    if (gateErr || allowed !== true) { await logI(403); return json(403, { error: { message: 'Pro tier required' } }) }

    // per-tenant rate limit (§12), fail-open on infra error (shared helper)
    const rlOk = await checkRateLimit(svc, `ai-proxy-internal:${env.acting_tenant}`, 300, 120)
    if (!rlOk) { await logI(429); return json(429, { error: { message: 'Too many AI requests. Please wait a minute and try again.' } }) }

    // (9) upstream Anthropic — model pinned
    const { upstream, data } = await callAnthropic({
      model: MODEL,
      max_tokens,
      messages,
      ...(system !== undefined ? { system } : {}),
      ...(temperature !== undefined ? { temperature } : {}),
    })
    if (!upstream.ok) {
      const msg = (data as { error?: { message?: string } })?.error?.message || 'Anthropic API error'
      await logI(upstream.status, null, null, true)
      console.warn(`[ai-proxy/internal] upstream ${upstream.status} caller:${env.caller} purpose:${env.purpose} tenant:${env.acting_tenant}`)
      return json(upstream.status, { error: { message: msg, anthropic_status: upstream.status, request_id: upstream.headers.get('request-id') } })
    }
    const usage = (data as { usage?: { input_tokens?: number; output_tokens?: number } })?.usage
    await logI(200, usage?.input_tokens ?? null, usage?.output_tokens ?? null, true)
    console.log(`[ai-proxy/internal] caller:${env.caller} tenant:${env.acting_tenant} purpose:${env.purpose} jti:${env.jti} status:200 cardinality:${batchCardinality}`)
    return json(200, data)

  } catch (err) {
    if (err instanceof EnvelopeError) {
      await logI(err.status)
      return json(err.status, { error: { message: err.message } })
    }
    console.error('[ai-proxy/internal] unexpected error:', (err as Error)?.message)
    await logI(500)
    return json(500, { error: { message: 'Internal error' } })
  }
}

serve(async (req) => {
  const cors = getCorsHeaders(req)
  const json: JsonFn = (status, body) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json(405, { error: { message: 'Method not allowed' } })

  const svc: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  // S253/A1 — logging extracted to _shared/aiProxyShared.ts (shared with the
  // per-engine AI-Authority proxies). Behavior identical: best-effort, never throws.
  const log: LogFn = (row) => insertAiProxyLog(svc, row)

  // S242 — route internal service-to-service calls to the envelope-authed handler.
  if (new URL(req.url).pathname.replace(/\/+$/, '').endsWith('/internal')) {
    return await handleInternal(req, svc, json, log)
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
    // (shared helper — same RPC, same fail-open semantics)
    const userOk = await checkRateLimit(svc, `ai-proxy:${callerTenant ?? 'op'}:${userId}`, 300, 20)
    const tenantOk = callerTenant ? await checkRateLimit(svc, `ai-proxy:${callerTenant}`, 300, 60) : true
    if (!userOk || !tenantOk) {
      await log({ status: 429, feature, tenant_id: callerTenant, user_id: userId })
      return json(429, { error: { message: 'Too many AI requests. Please wait a minute and try again.' } })
    }

    // ── upstream Anthropic (model pinned; messages/system forwarded opaquely) ──
    const { upstream, data } = await callAnthropic({
      model: MODEL,
      max_tokens,
      messages,
      ...(system !== undefined ? { system } : {}),
      ...(temperature !== undefined ? { temperature } : {}),
    })

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
