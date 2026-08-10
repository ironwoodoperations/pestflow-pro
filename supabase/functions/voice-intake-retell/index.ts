// Edge Function: voice-intake-retell v1
// Retell webhook handler for the Remi AI receptionist.
//
// This is a distinct handler from voice-intake (VAPI). It shares nothing with that
// function's auth, event model, or idempotency strategy — Retell differs on all three:
//   - Auth: HMAC-SHA256 over (rawBody + timestamp) via the x-retell-signature header,
//     NOT a shared-secret header.
//   - Events: flat { event, call } payloads (call_started / call_ended / call_analyzed),
//     NOT VAPI's nested { message: { type, call } }.
//   - Idempotency: the leads.retell_call_id UNIQUE constraint dedupes via a single upsert,
//     NOT a processed_webhook_events check-then-insert.
//
// Inserting/enriching the lead is sufficient to notify the owner: the on_lead_insert trigger
// fires trigger_notify_new_lead() -> notify-new-lead edge fn -> owner EMAIL + SMS. This
// function sends NO notifications itself.
//
// Deploy with --no-verify-jwt: Retell does not send a Supabase JWT. Auth is enforced here by
// verifying the x-retell-signature HMAC against RETELL_API_KEY.
//
// BUDGET: 10s (Retell times out at 10s, retries 3x). Request path is: verify, parse, one
// settings read, one upsert, respond. No heavy imports, no in-function retries.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } })

  try {
    // ── METHOD ──────────────────────────────────────────────────────────────
    // Server-to-server webhook: no CORS, no OPTIONS branch.
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

    // ── READ BODY ONCE ──────────────────────────────────────────────────────
    // Verify against this exact string, then JSON.parse it. Never req.json() and never
    // re-serialize before verifying — re-serialization changes whitespace/escapes/key order
    // and breaks the HMAC.
    const rawBody = await req.text()

    // ── AUTH: parse the x-retell-signature header ───────────────────────────
    // Format: v=<unix_MILLISECONDS>,d=<hex_digest>. NOTE: timestamp is MILLISECONDS.
    const sigHeader = req.headers.get('x-retell-signature') || ''
    const m = sigHeader.match(/^v=(\d+),d=([0-9a-fA-F]{64})$/)
    if (!m) {
      // Diagnostic: presence/length only — never the header value itself.
      console.error(`[voice-intake-retell] SIG REJECT bad-header present=${sigHeader.length > 0} len=${sigHeader.length}`)
      return json({ error: 'Unauthorized' }, 401)
    }
    const timestamp = m[1]
    const received = m[2].toLowerCase()

    // Replay window: reject if the timestamp is more than 5 minutes from now (either direction).
    if (Math.abs(Date.now() - Number(timestamp)) > 5 * 60 * 1000) {
      console.error(`[voice-intake-retell] SIG REJECT stale ts=${timestamp} skewMs=${Date.now() - Number(timestamp)}`)
      return json({ error: 'Unauthorized' }, 401)
    }

    // Compute HMAC-SHA256 over (rawBody + timestamp), keyed with RETELL_API_KEY. Web Crypto only.
    const apiKey = Deno.env.get('RETELL_API_KEY') || ''
    if (!apiKey) {
      // Permanent misconfiguration — 401 (not 500) so it doesn't consume Retell's 3-retry budget.
      console.error('[voice-intake-retell] RETELL_API_KEY is not set')
      return json({ error: 'Unauthorized' }, 401)
    }
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(apiKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    )
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody + timestamp))
    const computed = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, '0')).join('')

    // Constant-time hex comparison: equal-length check, then XOR-accumulate charCodeAt.
    if (!timingSafeEqualHex(received, computed)) {
      // Diagnostic ON MISMATCH ONLY: distinguishes a wrong API key from a wrong formula.
      // First 8 chars of each digest + whether the first x-forwarded-for entry is Retell's
      // known egress IP. NEVER log the full digest, the API key, or the body.
      const firstXff = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
      console.error(
        `[voice-intake-retell] SIG MISMATCH recv=${received.slice(0, 8)} calc=${computed.slice(0, 8)} retellIp=${firstXff === '100.20.5.228'}`,
      )
      return json({ error: 'Unauthorized' }, 401)
    }

    // ── PARSE (signature already verified against rawBody) ──────────────────
    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return json({ error: 'Invalid JSON' }, 400)
    }

    // Retell payload shape: { event, call } — flat, not VAPI's { message: { type, call } }.
    const event: string = payload?.event ?? ''
    const call: any = payload?.call ?? {}

    // call_started and any unknown event: acknowledge, no side effects.
    if (event !== 'call_ended' && event !== 'call_analyzed') {
      return json({ received: true })
    }

    const callId: string = call?.call_id ?? ''
    if (!callId) {
      console.warn(`[voice-intake-retell] ${event} missing call_id — skipping`)
      return json({ received: true })
    }

    const supabaseUrl    = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // ── TENANT RESOLUTION ───────────────────────────────────────────────────
    // Read all voice_receptionist rows and match in JavaScript. Never build a .or() filter from
    // payload values — that is an injection vector.
    const { data: rows, error: settingsErr } = await supabase
      .from('settings').select('tenant_id, value').eq('key', 'voice_receptionist')
    if (settingsErr) {
      // Transient DB read failure blocks processing entirely — 500 so Retell retries cleanly.
      console.error(`[voice-intake-retell] settings read failed for call ${callId}:`, settingsErr.message)
      return json({ error: 'settings read failed' }, 500)
    }

    const agentId: string = call?.agent_id ?? ''
    const toDigits = digitsOnly(call?.to_number ?? '')
    const matches: string[] = []
    for (const r of (rows || [])) {
      const v = r?.value || {}
      if (agentId && v.retell_agent_id === agentId) {
        matches.push(r.tenant_id)
      } else if (toDigits && digitsOnly(v.retell_phone_number ?? '') === toDigits) {
        matches.push(r.tenant_id)
      }
    }
    if (matches.length !== 1) {
      // Zero or ambiguous match: an unmapped call is not retryable, so 200 (never 500) and never
      // pick arbitrarily.
      console.error(
        `[voice-intake-retell] tenant match count=${matches.length} for call ${callId} (agent_id=${agentId}, to_number=${call?.to_number ?? ''})`,
      )
      return json({ received: true })
    }
    const tenantId = matches[0]

    // ── PAYLOAD CONSTRUCTION ────────────────────────────────────────────────
    // NEVER include `status` (DEFAULT 'new' covers insert; including it would reset a lead Kirk
    // already moved to 'contacted' when the call_analyzed enrichment lands). Only include an
    // optional key when its value is non-empty, so an empty analysis can't null out good data.
    // Never write to `email` — Remi does not collect it.
    const lead: Record<string, unknown> = { tenant_id: tenantId, retell_call_id: callId }

    if (event === 'call_ended') {
      // PHASE 1 — insert minimal lead.
      lead.name = 'Voice caller'
      if (call?.from_number) lead.phone = call.from_number
      lead.message = ['[Voice — Remi]', '[awaiting analysis]', `Retell call: ${callId}`].join('\n')
    } else {
      // PHASE 2 (call_analyzed) — enrich the same lead. Same upsert, order-independent.
      const cad = call?.call_analysis?.custom_analysis_data
      const hasCad = cad && typeof cad === 'object'

      const callerName    = str(cad?.caller_name)
      const callbackPhone = str(cad?.callback_phone)
      const serviceCity   = str(cad?.service_city)
      const serviceAddr   = str(cad?.service_address)
      const pestType      = str(cad?.pest_type)
      const urgency       = str(cad?.urgency)
      const summary       = str(cad?.summary)

      const allBlank = !callerName && !callbackPhone && !serviceCity && !serviceAddr &&
        !pestType && !urgency && !summary

      if (callerName) lead.name = callerName            // omit -> preserves 'Voice caller'
      const phone = callbackPhone || str(call?.from_number)
      if (phone) lead.phone = phone
      if (pestType) lead.services = [pestType]

      const lines: string[] = ['[Voice — Remi]']
      if (!hasCad || allBlank) {
        // Never drop a lead: still upsert, but flag the empty analysis and hand Kirk the
        // transcript (first 500 chars) so there's something actionable.
        lines.push('[analysis empty]')
        const transcript = str(call?.transcript)
        if (transcript) lines.push(transcript.slice(0, 500))
      } else {
        if (summary) lines.push(summary)
        const meta: string[] = []
        if (serviceCity) meta.push(`City: ${serviceCity}`)
        if (serviceAddr) meta.push(`Address: ${serviceAddr}`)
        if (urgency)     meta.push(`Urgency: ${urgency}`)
        meta.push(`Retell call: ${callId}`)
        lines.push(meta.join(' | '))
      }
      lead.message = lines.join('\n')
    }

    // ── IDEMPOTENCY: the UNIQUE constraint IS the dedupe ────────────────────
    // Single atomic upsert on retell_call_id. Race-safe under concurrent retries and crash-safe:
    // if it fails, nothing was written and a retry works cleanly. No processed_webhook_events, no
    // check-then-insert, no lock row.
    const { error: upErr } = await supabase
      .from('leads').upsert(lead, { onConflict: 'retell_call_id', ignoreDuplicates: false })
    if (upErr) {
      // ONLY a transient DB error on the upsert itself returns 500 (Retell retries).
      console.error(`[voice-intake-retell] upsert failed for call ${callId}:`, upErr.message)
      return json({ error: 'upsert failed' }, 500)
    }

    console.log(`[voice-intake-retell] ${event} upserted lead for tenant ${tenantId} from call ${callId}`)
    return json({ received: true })
  } catch (err: any) {
    // Unexpected throw — log clearly rather than failing opaquely.
    console.error('[voice-intake-retell] handler error:', err?.message)
    return json({ error: 'Internal server error' }, 500)
  }
})

// Coerce any value to a trimmed string ('' for null/undefined).
function str(v: unknown): string {
  return (v ?? '').toString().trim()
}

// Strip all non-digit characters (for phone-number comparison).
function digitsOnly(v: unknown): string {
  return (v ?? '').toString().replace(/\D/g, '')
}

// Constant-time hex-string comparison: equal-length check, then XOR-accumulate charCodeAt across
// the full string. Never use === on secrets.
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}
