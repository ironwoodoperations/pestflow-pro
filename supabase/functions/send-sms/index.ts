// Supabase Edge Function: send-sms (v30 — s199 b19 quiet-hours gate)
// Sends SMS via Textbelt. Called server-side so the API key never touches the browser.
//
// s199 b19: For consumer-targeted SMS to FL or OK recipients, dispatch only
// during 8 AM–8 PM local time. Off-window messages are queued in public.sms_queue
// and drained by the process-sms-queue cron worker. Operator alerts (lead-
// notification etc.) bypass the gate.
//
// MANUAL STEP REQUIRED after deploy:
//   Set TEXTBELT_API_KEY in Supabase Dashboard → Settings → Edge Functions → Secrets
//   (Dashboard → Edge Functions → send-sms → Secrets tab)
//
// Deploy: supabase functions deploy send-sms --project-ref biezzykcgzkrwdgqpsar

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
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

export type GateDecision =
  | { kind: 'invalid'; reason: 'toll-free' | 'non-geographic' | 'invalid' }
  | { kind: 'send-now'; phone: string }
  | { kind: 'queue'; phone: string; targetSendAt: Date; timezone: string }

/**
 * Pure decision function — no DB, no network. Mockable via injected `now`.
 * Used by both this edge function and the test suite.
 */
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const body = await req.json() as {
      tenant_id?: string
      to: string
      message: string
      type?: string
      key?: string
      __bypass_gate?: boolean
    }
    const { tenant_id, to, message, type, key: callerKey, __bypass_gate } = body

    // __bypass_gate is honored only when caller presents the service-role JWT.
    // Used by process-sms-queue worker to dispatch already-gated rows. We accept
    // either Bearer <key> or the raw key in the Authorization header.
    const authHeader = req.headers.get('authorization') ?? ''
    const presentedToken = authHeader.replace(/^Bearer\s+/i, '').trim()
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const bypassAllowed = __bypass_gate === true && serviceRoleKey !== '' && presentedToken === serviceRoleKey

    const TEXTBELT_API_KEY = callerKey?.trim() || Deno.env.get('TEXTBELT_API_KEY')
    if (!TEXTBELT_API_KEY) {
      console.error('[send-sms] TEXTBELT_API_KEY secret is not set — SMS will not send.')
      return new Response(
        JSON.stringify({ success: false, error: 'SMS not configured — TEXTBELT_API_KEY missing' }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const decision: GateDecision = bypassAllowed
      ? { kind: 'send-now', phone: (() => {
          const d = to.replace(/\D/g, '')
          return d.length === 11 && d.startsWith('1') ? d : d.length === 10 ? `1${d}` : d
        })() }
      : decideDispatch(to, type)

    if (decision.kind === 'invalid') {
      console.warn(`[send-sms] rejected: ${decision.reason} number ${to.slice(0, 6)}…`)
      return new Response(
        JSON.stringify({ success: false, error: 'invalid SMS recipient', reason: decision.reason }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Fail-closed warning: log when an unrecognized type touches the consumer
    // gate path so operators can add new types to BYPASS_GATE_TYPES if needed.
    if (!bypassAllowed && type && !(BYPASS_GATE_TYPES as readonly string[]).includes(type.trim())) {
      console.warn(`[send-sms] unrecognized type "${type}", engaging quiet-hours gate by default`)
    }

    if (decision.kind === 'queue') {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
      if (!SUPABASE_URL || !serviceRoleKey || !tenant_id) {
        console.error('[send-sms] cannot queue — missing SUPABASE_URL/SERVICE_ROLE_KEY/tenant_id')
        return new Response(
          JSON.stringify({ success: false, error: 'queue write unavailable' }),
          { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
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
          { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        )
      }
      console.log(`[send-sms] queued ${type ?? 'sms'} to ${decision.phone.slice(0, 6)}… target=${decision.targetSendAt.toISOString()} tz=${decision.timezone}`)
      return new Response(
        JSON.stringify({ success: true, queued: true, target_send_at: decision.targetSendAt.toISOString(), queue_id: queueRow?.id }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
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
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
