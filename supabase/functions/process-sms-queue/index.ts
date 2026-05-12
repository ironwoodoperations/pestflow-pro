// Supabase Edge Function: process-sms-queue
// Drains public.sms_queue every 5 minutes via pg_cron. Sends due SMS via
// Textbelt directly (does NOT recurse through send-sms — avoids the
// __bypass_gate dance). Mirrors the publish-scheduled-posts atomic-claim
// pattern from S197 PR #47 (b65 cron race fix).
//
// DEPLOY:
//   supabase functions deploy process-sms-queue --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar
//
// pg_cron schedule lives in supabase/migrations/<ts+1>_schedule_sms_queue_cron.sql.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { timingSafeEqual } from 'node:crypto'
import { classifyNumber } from '../_shared/area-code-states.ts'
import { isInQuietWindow } from '../_shared/quiet-hours.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QueueRow {
  id: string
  tenant_id: string
  to_phone: string
  message: string
  type: string
  attempts: number
}

interface IntegrationSettings {
  textbelt_api_key?: string
}

const BACKOFF_MS = [
  5 * 60 * 1000,        // 5 minutes after attempt 1
  30 * 60 * 1000,       // 30 minutes after attempt 2
  4 * 60 * 60 * 1000,   // 4 hours after attempt 3 (only used if max attempts raised later)
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // ── C3 AUTH — apikey header, timing-safe compare ─────────────────────
  const expectedSecret = Deno.env.get('PROCESS_SMS_QUEUE_INTERNAL_SECRET') || ''
  const presentedSecret = req.headers.get('apikey') || ''

  if (!expectedSecret) {
    console.error('[process-sms-queue] PROCESS_SMS_QUEUE_INTERNAL_SECRET env var not set; rejecting all requests')
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const enc = new TextEncoder()
  const a = enc.encode(expectedSecret)
  const b = enc.encode(presentedSecret)
  const authOk = a.length === b.length && timingSafeEqual(a, b)

  if (!authOk) {
    console.warn('[process-sms-queue] auth failed — apikey_present:', !!presentedSecret, 'apikey_length_match:', a.length === b.length)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  // ────────────────────────────────────────────────────────────────────

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const envTextbeltKey = Deno.env.get('TEXTBELT_API_KEY') ?? ''
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Atomic claim: flip status='queued' → 'sending' for due rows. Postgres
  // row-level locks make overlapping cron invocations mutually exclusive.
  const { data: claimed, error: claimErr } = await supabase
    .from('sms_queue')
    .update({ status: 'sending', updated_at: new Date().toISOString() })
    .eq('status', 'queued')
    .lte('target_send_at', new Date().toISOString())
    .select('id, tenant_id, to_phone, message, type, attempts')
    .limit(50)

  if (claimErr) {
    console.error('[process-sms-queue] claim error:', claimErr.message)
    return new Response(JSON.stringify({ error: claimErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const rows = (claimed ?? []) as QueueRow[]
  let sent = 0, requeued = 0, failed = 0

  for (const row of rows) {
    // Defensive re-check: if cron fired slightly before 08:00:00 local for the
    // recipient, leave the row queued (revert status, leave target_send_at).
    // Prevents micro-DST race where the candidate target_send_at landed during
    // a spring-forward gap.
    const cls = classifyNumber(row.to_phone)
    if (cls.kind === 'us-geographic' && isInQuietWindow(cls.timezone, new Date())) {
      await supabase.from('sms_queue').update({
        status: 'queued', updated_at: new Date().toISOString(),
      }).eq('id', row.id)
      requeued++
      console.log(`[process-sms-queue] ${row.id} re-queued (quiet window edge race, tz=${cls.timezone})`)
      continue
    }

    // Resolve Textbelt key: tenant integrations first, env fallback.
    const { data: settingsData } = await supabase
      .from('settings').select('value')
      .eq('tenant_id', row.tenant_id).eq('key', 'integrations').maybeSingle()
    const intg = (settingsData?.value ?? {}) as IntegrationSettings
    const textbeltKey = intg.textbelt_api_key?.trim() || envTextbeltKey
    if (!textbeltKey) {
      await supabase.from('sms_queue').update({
        status: 'failed',
        last_error: 'TEXTBELT_API_KEY missing for tenant + env',
        updated_at: new Date().toISOString(),
      }).eq('id', row.id)
      failed++
      console.error(`[process-sms-queue] ${row.id} failed: no Textbelt key`)
      continue
    }

    const newAttempts = (row.attempts ?? 0) + 1
    try {
      const res = await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: row.to_phone, message: row.message, key: textbeltKey }),
      })
      const result = await res.json()
      const keyPreview = textbeltKey.slice(0, 8) + '…'

      if (result?.success) {
        await supabase.from('sms_queue').update({
          status: 'sent',
          textbelt_response: result,
          textbelt_key_used: keyPreview,
          last_error: null,
          attempts: newAttempts,
          updated_at: new Date().toISOString(),
        }).eq('id', row.id)
        sent++
        console.log(`[process-sms-queue] ${row.id} sent (${row.to_phone.slice(0, 6)}…)`)
      } else {
        const errMsg = result?.error || `Textbelt HTTP ${res.status}`
        if (newAttempts < 3) {
          const delay = BACKOFF_MS[Math.min(newAttempts - 1, BACKOFF_MS.length - 1)]
          await supabase.from('sms_queue').update({
            status: 'queued',
            last_error: errMsg,
            textbelt_response: result,
            attempts: newAttempts,
            target_send_at: new Date(Date.now() + delay).toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('id', row.id)
          requeued++
        } else {
          await supabase.from('sms_queue').update({
            status: 'failed',
            last_error: errMsg,
            textbelt_response: result,
            attempts: newAttempts,
            updated_at: new Date().toISOString(),
          }).eq('id', row.id)
          failed++
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error'
      if (newAttempts < 3) {
        const delay = BACKOFF_MS[Math.min(newAttempts - 1, BACKOFF_MS.length - 1)]
        await supabase.from('sms_queue').update({
          status: 'queued',
          last_error: msg,
          attempts: newAttempts,
          target_send_at: new Date(Date.now() + delay).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', row.id)
        requeued++
      } else {
        await supabase.from('sms_queue').update({
          status: 'failed',
          last_error: msg,
          attempts: newAttempts,
          updated_at: new Date().toISOString(),
        }).eq('id', row.id)
        failed++
      }
      console.error(`[process-sms-queue] ${row.id} exception:`, msg)
    }
  }

  const summary = { processed: rows.length, sent, requeued, failed }
  console.log(`[process-sms-queue] done — ${JSON.stringify(summary)}`)
  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
