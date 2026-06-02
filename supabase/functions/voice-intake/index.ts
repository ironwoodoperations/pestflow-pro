// Edge Function: voice-intake v1 (S252)
// VAPI webhook handler for the Remi AI receptionist.
// Handles two VAPI server events:
//   - transfer-destination-request: returns the tenant's warm-transfer number (< 7.5s).
//   - end-of-call-report: extracts the remi_intake_v1 structured output and INSERTs a lead.
//
// Inserting the lead is sufficient to notify the owner: the on_lead_insert trigger fires
// trigger_notify_new_lead() -> notify-new-lead edge fn -> owner EMAIL + SMS. This function
// sends NO notifications itself.
//
// Deploy with --no-verify-jwt: VAPI does not send a Supabase JWT. Auth is enforced here by
// verifying the X-Vapi-Secret header against VAPI_WEBHOOK_SECRET.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-vapi-secret',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } })

  // --- Verify the request is from VAPI ---
  const expectedSecret = Deno.env.get('VAPI_WEBHOOK_SECRET') || ''
  const gotSecret = req.headers.get('x-vapi-secret') || req.headers.get('X-Vapi-Secret') || ''
  if (!expectedSecret || gotSecret !== expectedSecret) {
    console.error('[voice-intake] webhook secret mismatch — rejecting')
    return json({ error: 'Unauthorized' }, 401)
  }

  const supabaseUrl    = Deno.env.get('SUPABASE_URL') || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  // VAPI wraps the event under `message`. Support both shapes defensively.
  const msg = payload?.message ?? payload
  const eventType: string = msg?.type ?? ''

  try {
    // ─────────────────────────────────────────────────────────────────────
    // 1) transfer-destination-request — return the tenant's transfer number
    // ─────────────────────────────────────────────────────────────────────
    if (eventType === 'transfer-destination-request') {
      const assistantId = msg?.call?.assistantId ?? msg?.assistant?.id ?? null
      const phoneNumberId = msg?.call?.phoneNumberId ?? msg?.phoneNumber?.id ?? null

      const cfg = await resolveTenantConfig(supabase, assistantId, phoneNumberId)
      if (!cfg || !cfg.value?.enabled || !cfg.value?.transfer_number) {
        // No destination available — speak an error instead of transferring.
        return json({
          error: "I'm not able to connect you right now, but I've got your information and the team will call you right back.",
        })
      }

      return json({
        destination: {
          type: 'number',
          number: cfg.value.transfer_number,
          message: '', // empty = silent to the caller; warm summary is delivered to the owner leg by VAPI transferPlan
        },
      })
    }

    // ─────────────────────────────────────────────────────────────────────
    // 2) end-of-call-report — insert the captured lead
    // ─────────────────────────────────────────────────────────────────────
    if (eventType === 'end-of-call-report') {
      const callId: string = msg?.call?.id ?? msg?.callId ?? ''
      if (!callId) {
        console.warn('[voice-intake] end-of-call-report missing call id — skipping')
        return json({ received: true })
      }

      // Idempotency: dedupe on VAPI call id via processed_webhook_events
      const eventKey = `vapi_call_${callId}`
      const { data: seen } = await supabase
        .from('processed_webhook_events').select('event_id').eq('event_id', eventKey).maybeSingle()
      if (seen) {
        console.log(`[voice-intake] call ${callId} already processed — skipping`)
        return json({ received: true })
      }

      const assistantId = msg?.call?.assistantId ?? msg?.assistant?.id ?? null
      const phoneNumberId = msg?.call?.phoneNumberId ?? msg?.phoneNumber?.id ?? null
      const cfg = await resolveTenantConfig(supabase, assistantId, phoneNumberId)
      if (!cfg) {
        console.error(`[voice-intake] no tenant matched for call ${callId} (assistant ${assistantId}, number ${phoneNumberId})`)
        return json({ received: true })
      }
      const tenantId = cfg.tenant_id

      // Pull the structured output (schema: remi_intake_v1). VAPI exposes structured outputs in
      // a few possible locations depending on config; check them in order.
      const so =
        msg?.analysis?.structuredOutputs?.remi_intake_v1 ??
        msg?.analysis?.structuredData ??
        msg?.structuredOutputs?.remi_intake_v1 ??
        {}

      const callerName    = (so?.caller_name ?? '').toString().trim()
      const callbackPhone = (so?.callback_phone ?? '').toString().trim()
      const serviceCity   = (so?.service_city ?? '').toString().trim()
      const serviceAddr   = (so?.service_address ?? '').toString().trim()
      const pestType      = (so?.pest_type ?? '').toString().trim()
      const urgency       = (so?.urgency ?? '').toString().trim()
      const summary       = (so?.summary ?? '').toString().trim()

      // Build the message field: voice tag + summary + the fields that have no column of their own.
      const parts: string[] = ['[Voice — Remi]']
      if (summary) parts.push(summary)
      const meta: string[] = []
      if (serviceCity) meta.push(`City: ${serviceCity}`)
      if (serviceAddr) meta.push(`Address: ${serviceAddr}`)
      if (urgency)     meta.push(`Urgency: ${urgency}`)
      if (callId)      meta.push(`VAPI call: ${callId}`)
      if (meta.length) parts.push(meta.join(' | '))
      const message = parts.join('\n')

      const services = pestType ? [pestType] : null

      const { error: insErr } = await supabase.from('leads').insert({
        tenant_id: tenantId,
        name:      callerName || 'Voice caller',
        phone:     callbackPhone || null,
        services,
        message,
        status:    'new',
      })
      if (insErr) {
        // Return 500 so VAPI retries (transient DB error). Do NOT mark processed.
        console.error(`[voice-intake] lead insert failed for call ${callId}:`, insErr.message)
        return json({ error: 'insert failed' }, 500)
      }

      // Mark processed LAST (after successful insert) so a retry can't double-insert.
      await supabase.from('processed_webhook_events').insert({ event_id: eventKey, event_type: 'vapi_end_of_call' })

      console.log(`[voice-intake] lead inserted for tenant ${tenantId} from call ${callId}`)
      return json({ received: true })
    }

    // Any other VAPI event type: acknowledge and ignore.
    return json({ received: true })

  } catch (err: any) {
    console.error('[voice-intake] handler error:', err?.message)
    return json({ error: 'Internal server error' }, 500)
  }
})

// Resolve the tenant + voice_receptionist config by matching the call's assistant id or phone
// number id against stored vapi_assistant_id / vapi_phone_number_id in settings.
async function resolveTenantConfig(
  supabase: any,
  assistantId: string | null,
  phoneNumberId: string | null,
): Promise<{ tenant_id: string; value: any } | null> {
  const { data: rows, error } = await supabase
    .from('settings').select('tenant_id, value').eq('key', 'voice_receptionist')
  if (error) {
    console.error('[voice-intake] settings read failed:', error.message)
    return null
  }
  for (const r of (rows || [])) {
    const v = r.value || {}
    if (assistantId && v.vapi_assistant_id === assistantId) return { tenant_id: r.tenant_id, value: v }
    if (phoneNumberId && v.vapi_phone_number_id === phoneNumberId) return { tenant_id: r.tenant_id, value: v }
  }
  return null
}
