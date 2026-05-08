// Supabase Edge Function: send-sms (v32 — s202 apikey gate)
// Sends SMS via Textbelt. Server-to-server only.
//
// Auth (s202): apikey header vs SEND_SMS_INTERNAL_SECRET, constant-time compare
// (node:crypto.timingSafeEqual + length pre-check). verify_jwt:false at the
// platform — this function is the auth point. Reject 401 before body parse.
// Trusted callers post-S202: notify-new-lead, api-quote. Browser forms route
// through api-quote, never call send-sms directly.
//
// s199 b19 quiet-hours: consumer SMS to FL/OK gated to 8am–8pm local; off-window
// rows queued in public.sms_queue, drained by process-sms-queue cron. Operator
// alerts in BYPASS_GATE_TYPES bypass the gate.
//
// Deploy: supabase functions deploy send-sms --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar
// Required secrets on this function: TEXTBELT_API_KEY, SEND_SMS_INTERNAL_SECRET.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { timingSafeEqual } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { classifyNumber } from '../_shared/area-code-states.ts'
import {
  isInQuietWindow,
  nextEightAm,
  QUIET_HOURS_STATES,
  BYPASS_GATE_TYPES,
} from '../_shared/quiet-hours.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const INTERNAL_SECRET = Deno.env.get('SEND_SMS_INTERNAL_SECRET') ?? ''

export function validateApikey(req: Request): boolean {
  if (!INTERNAL_SECRET) {
    console.error('[send-sms] SEND_SMS_INTERNAL_SECRET not configured — rejecting all calls')
    return false
  }
  const presented = req.headers.get('apikey') ?? ''
  if (presented.length !== INTERNAL_SECRET.length) return false
  try {
    return timingSafeEqual(Buffer.from(presented), Buffer.from(INTERNAL_SECRET))
  } catch {
    return false
  }
}

export type GateDecision =
  | { kind: 'invalid'; reason: 'toll-free' | 'non-geographic' | 'invalid' }
  | { kind: 'send-now'; phone: string }
  | { kind: 'queue'; phone: string; targetSendAt: Date; timezone: string }

// Pure decision function — no DB, no network. Mockable via injected `now`.
export function decideDispatch(
  to: string,
  type: string | undefined,
  now: Date = new Date(),
): GateDecision {
  const cls = classifyNumber(to)
  if (cls.kind === 'toll-free' || cls.kind === 'non-geographic' || cls.kind === 'invalid') {
    return { kind: 'invalid', reason: cls.kind }
  }

  // Re-normalize phone to E.164-ish (1 + 10 digits) for downstream.
  const digits = to.replace(/\D/g, '')
  const phone = digits.length === 11 && digits.startsWith('1')
    ? digits
    : digits.length === 10 ? `1${digits}` : digits

  // Operator-targeted types bypass the gate.
  const t = (type ?? '').trim()
  if ((BYPASS_GATE_TYPES as readonly string[]).includes(t)) {
    return { kind: 'send-now', phone }
  }

  // Consumer-targeted: only gate FL + OK per FTSA/OTPA scope.
  if (!(QUIET_HOURS_STATES as readonly string[]).includes(cls.state)) {
    return { kind: 'send-now', phone }
  }

  if (isInQuietWindow(cls.timezone, now)) {
    return { kind: 'queue', phone, targetSendAt: nextEightAm(cls.timezone, now), timezone: cls.timezone }
  }
  return { kind: 'send-now', phone }
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (!validateApikey(req)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  try {
    const body = await req.json() as {
      tenant_id?: string
      to: string
      message: string
      type?: string
    }
    const { tenant_id, to, message, type } = body

    const TEXTBELT_API_KEY = Deno.env.get('TEXTBELT_API_KEY')
    if (!TEXTBELT_API_KEY) {
      console.error('[send-sms] TEXTBELT_API_KEY secret is not set — SMS will not send.')
      return new Response(
        JSON.stringify({ success: false, error: 'SMS not configured — TEXTBELT_API_KEY missing' }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    const decision: GateDecision = decideDispatch(to, type)

    if (decision.kind === 'invalid') {
      console.warn(`[send-sms] rejected: ${decision.reason} number ${to.slice(0, 6)}…`)
      return new Response(
        JSON.stringify({ success: false, error: 'invalid SMS recipient', reason: decision.reason }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    // Fail-closed warning: log when an unrecognized type touches the consumer
    // gate path so operators can add new types to BYPASS_GATE_TYPES if needed.
    if (type && !(BYPASS_GATE_TYPES as readonly string[]).includes(type.trim())) {
      console.warn(`[send-sms] unrecognized type "${type}", engaging quiet-hours gate by default`)
    }

    if (decision.kind === 'queue') {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      if (!SUPABASE_URL || !serviceRoleKey || !tenant_id) {
        console.error('[send-sms] cannot queue — missing SUPABASE_URL/SERVICE_ROLE_KEY/tenant_id')
        return new Response(
          JSON.stringify({ success: false, error: 'queue write unavailable' }),
          { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
        )
      }
      const supabase = createClient(SUPABASE_URL, serviceRoleKey)
      const { data: queueRow, error: queueErr } = await supabase
        .from('sms_queue')
        .insert({
          tenant_id,
          to_phone: decision.phone,
          message,
          type: type ?? 'unknown',
          target_send_at: decision.targetSendAt.toISOString(),
          status: 'queued',
        })
        .select('id')
        .maybeSingle()

      if (queueErr) {
        console.error('[send-sms] sms_queue insert failed:', queueErr.message)
        return new Response(
          JSON.stringify({ success: false, error: `queue write failed: ${queueErr.message}` }),
          { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
        )
      }
      console.log(`[send-sms] queued ${type ?? 'sms'} to ${decision.phone.slice(0, 6)}… target=${decision.targetSendAt.toISOString()} tz=${decision.timezone}`)
      return new Response(
        JSON.stringify({ success: true, queued: true, target_send_at: decision.targetSendAt.toISOString(), queue_id: queueRow?.id }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    console.log(`[send-sms] Sending ${type || 'sms'} to ${decision.phone.slice(0, 6)}…`)
    const textbeltRes = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: decision.phone, message, key: TEXTBELT_API_KEY }),
    })
    const result = await textbeltRes.json()
    console.log('[send-sms] Textbelt response:', JSON.stringify(result))
    if (!result.success) {
      console.error('[send-sms] Textbelt error:', result.error, '| quota remaining:', result.quotaRemaining)
    }
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[send-sms] Exception:', String(err))
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }
}

if (import.meta.main) {
  Deno.serve(handler)
}
