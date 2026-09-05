// Edge Function: process-outbound-queue — S339.
//
// Drains public.outbound_integration_queue: the durable outbound work that
// provisioning enqueues INSIDE its transaction (the S334 gate's answer A2).
// A queue row is a promise the side effect will be ATTEMPTED, not that it
// succeeded.
//
// NOTHING ENQUEUES YET. provision-tenant is untouched by this PR and still does
// its Zernio/Outscraper work inline; wiring it is the next change. This worker
// is inert until then, which is the point of shipping it first — it is new code
// on a live provisioning path's future, not a change to the live path.
//
// ═══ THE LOOP, AND WHAT THE DATABASE ALREADY DID ═══
//
//   1. rpc outbound_queue_claim(p_limit)
//        The DB has ALREADY set status='processing', claimed_at=now() and
//        incremented attempts, under FOR UPDATE SKIP LOCKED. Do NOT re-do any
//        of that here. It returns prior_status so the worker can tell a fresh
//        job from a re-claimed one.
//   2. dispatch by kind.
//   3. rpc outbound_queue_complete(id, outcome, vendor_ref, error)
//        outcome is EXACTLY one of succeeded | retryable | unknown | terminal.
//        The DB owns backoff, attempt exhaustion and lease release.
//
// The decision logic — what a result MEANS — lives in dispatch.ts, which is
// pure and unit-tested. This file is the I/O around it.
//
// ═══ AUTH ═══
// Env secret + constant-time compare on `x-pfp-internal-key`, mirroring
// process-sms-queue's PROCESS_SMS_QUEUE_INTERNAL_SECRET. The offboard worker's
// vault-read pattern would be nicer, but it needs a SECURITY DEFINER getter in
// the database and this PR adds no DDL beyond recording what is already applied.
//
// DEPLOY verify_jwt:false (cron/internal caller, no user JWT).
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//      PROCESS_OUTBOUND_QUEUE_INTERNAL_SECRET, ZERNIO_API_KEY.
// Deploy with scripts/deploy-function.sh (S327 freshness guard).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { timingSafeEqual } from 'node:crypto'
import { stripVaultSecrets } from '../_shared/secrets/stripVaultSecrets.ts'
import {
  type ClaimedJob,
  type Outcome,
  type HandledResult,
  classifyResponse,
  classifyThrownError,
  resolveZernioCreate,
  buildZernioCreateHeaders,
  extractProfileIdByExactName,
  needsReconcileBeforeCreate,
  hasGoogleId,
  buildZernioIntegrationsValue,
  logLine,
} from './dispatch.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const BATCH = 5
const HTTP_TIMEOUT_MS = 20_000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-pfp-internal-key',
}

function constantTimeEq(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a)
  const eb = new TextEncoder().encode(b)
  return ea.length === eb.length && timingSafeEqual(ea, eb)
}

/** fetch with an abort timeout. A timeout here surfaces as an AbortError, which
 *  classifyThrownError maps to `unknown` for duplicate-sensitive kinds. */
async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), HTTP_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

// Shape lives in dispatch.ts with the function that produces it — one definition.
type Handled = HandledResult

// ── zernio_profile ──────────────────────────────────────────────────────────
async function handleZernio(admin: any, job: ClaimedJob): Promise<Handled> {
  const key = Deno.env.get('ZERNIO_API_KEY') ?? ''
  if (!key) {
    // A permanent state until an operator sets the secret — not a retry.
    // ALLOWLISTED FIELDS ONLY (S313): no key, no fragment, no upstream body.
    return { outcome: 'terminal', reason: 'not_configured' }
  }

  // ── RECONCILE BEFORE CREATE ───────────────────────────────────────────────
  // Any path where a previous attempt might already have created a profile.
  if (needsReconcileBeforeCreate(job)) {
    const known = (job.vendor_ref ?? '').trim()
    if (known !== '') {
      // We already hold the id. There is nothing to create; record success and
      // write it through to settings.
      await writeZernioSettings(admin, job.tenant_id, known)
      return { outcome: 'succeeded', vendorRef: known, reason: 'reconciled_existing_ref' }
    }
    // Delivered-but-unobserved with NO id to reconcile against. The verified
    // Zernio fact set has POST /api/v1/profiles and GET /api/v1/accounts — no
    // documented profile lookup — so absence CANNOT be proven from here.
    // Creating anyway is precisely the duplicate this design exists to prevent,
    // so the job dead-ends as `unknown` for an operator. outbound_queue_requeue
    // already refuses to requeue it while vendor_ref is null, which is the
    // correct end state, not an oversight.
    return { outcome: 'unknown', reason: 'unobserved_prior_attempt_no_vendor_ref' }
  }

  const name = String(job.payload?.name ?? job.payload?.slug ?? '').trim()
  const description = String(job.payload?.description ?? '').trim()
  if (name === '') return { outcome: 'terminal', reason: 'missing_profile_name' }

  let res: Response
  try {
    res = await fetchWithTimeout('https://zernio.com/api/v1/profiles', {
      method: 'POST',
      // S345 — carries Idempotency-Key WHEN ONE IS AVAILABLE. It is not today:
      // outbound_queue_claim does not return the column. See
      // ClaimedJob.idempotency_key for why that is a stop, not a workaround.
      headers: buildZernioCreateHeaders(key, job.idempotency_key),
      body: JSON.stringify({ name, description }),
    })
  } catch (err) {
    // THE CASE THIS WHOLE FUNCTION IS BUILT AROUND. A timeout or aborted socket
    // is NOT retryable for Zernio: the POST may have created a profile.
    return { outcome: classifyThrownError(err, 'zernio_profile'), reason: 'network' }
  }

  let body: unknown = null
  try { body = await res.json() } catch { body = null }

  // Decide first (pure), then do only the I/O the decision implies.
  let planned = resolveZernioCreate(res.status, body, false)

  // ── S345: THE THIRD FALLBACK — resolve by exact name ──────────────────────
  //
  // Order, strongest first: idempotency key -> 409 body -> name lookup. This is
  // the last one, attempted ONLY when the first two have failed to produce an
  // id and the profile may nonetheless exist. `unknown` is what we are trying
  // to climb back out of, and it is the only outcome worth spending a request
  // on: succeeded already has an id, terminal cannot be helped, and retryable
  // will come round again.
  if (planned.outcome === 'unknown') {
    try {
      const lookup = await fetchWithTimeout(
        `https://zernio.com/api/v1/profiles?name=${encodeURIComponent(name)}`,
        { method: 'GET', headers: { Authorization: `Bearer ${key}` } },
      )
      if (lookup.ok) {
        let lookupBody: unknown = null
        try { lookupBody = await lookup.json() } catch { lookupBody = null }
        const found = extractProfileIdByExactName(lookupBody, name)
        if (found !== null) {
          console.log(logLine('recovered_by_name', job, 'succeeded', 'name_lookup'))
          planned = { outcome: 'succeeded', vendorRef: found, reason: 'recovered_by_name_lookup' }
        }
      }
    } catch {
      // The lookup is a BEST-EFFORT CLIMB OUT of `unknown`. If it fails, the
      // job stays exactly as it was — dead-ended for an operator, which is the
      // safe state. Never let a failed reconcile turn into a create.
      console.warn(logLine('name_lookup_failed', job, planned.outcome, 'lookup_error'))
    }
  }

  if (planned.outcome !== 'succeeded' || !planned.vendorRef) return planned

  // S340 — CARRY THE REF OUT EVEN WHEN THE SETTINGS WRITE FAILS.
  //
  // Zernio has already created the profile and we are holding the only copy of
  // its id. Letting this throw escape to the loop's catch returned `retryable`
  // with NO vendorRef, so outbound_queue_complete stored
  // vendor_ref = coalesce(null, null) = NULL. The next claim then saw
  // prior_status='retryable_failed' with a null vendor_ref, which
  // needsReconcileBeforeCreate answers FALSE — and the worker issued a SECOND
  // POST /api/v1/profiles. We knew the id, discarded it, and minted a duplicate.
  //
  // Returning the ref alongside the failure persists it (complete does
  // vendor_ref = coalesce(p_vendor_ref, q.vendor_ref)), so the retry takes the
  // reconcile path instead of creating again.
  try {
    await writeZernioSettings(admin, job.tenant_id, planned.vendorRef)
  } catch {
    // Same pure function, told the write failed — so the ref comes back out
    // WITH the retryable outcome instead of being dropped on the floor.
    return resolveZernioCreate(res.status, body, true)
  }
  return planned
}

/**
 * Write zernio_profile_id and CLEAR zernio_last_error.
 *
 * Read-then-spread, exactly like provision-tenant step 8: a MERGE so the other
 * keys survive (dang holds 23, OAuth tokens among them), through
 * stripVaultSecrets like every sibling writer, and a PLAIN SPREAD rather than
 * mergeSettingsValue because `zernio_last_error: null` is a DELIBERATE CLEAR
 * that a merge helper would treat as an empty overlay and drop.
 */
async function writeZernioSettings(admin: any, tenantId: string, profileId: string): Promise<void> {
  const { data: row, error: readErr } = await admin
    .from('settings').select('value')
    .eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()
  if (readErr) {
    // Do not build a merge on a failed read — that is a whole replacement
    // arrived at through the error path (the S330 lesson).
    console.error(`[process-outbound-queue] integrations read failed tenant_id=${tenantId}`)
    throw new Error('integrations_read_failed')
  }
  const next = buildZernioIntegrationsValue(row?.value, profileId, stripVaultSecrets)
  const { error: writeErr } = await admin
    .from('settings').update({ value: next })
    .eq('tenant_id', tenantId).eq('key', 'integrations')
  if (writeErr) {
    console.error(`[process-outbound-queue] integrations write failed tenant_id=${tenantId}`)
    throw new Error('integrations_write_failed')
  }
}

// ── outscraper_initial ──────────────────────────────────────────────────────
async function handleOutscraper(admin: any, job: ClaimedJob): Promise<Handled> {
  const { data: row } = await admin
    .from('settings').select('value')
    .eq('tenant_id', job.tenant_id).eq('key', 'integrations').maybeSingle()
  if (!hasGoogleId(row?.value)) {
    // Permanent until someone adds a Google id — a retry cannot fix it.
    return { outcome: 'terminal', reason: 'no_google_id' }
  }

  const { data: vaultRow } = await admin.schema('vault').from('decrypted_secrets')
    .select('decrypted_secret').eq('name', 'outscraper_cron_internal_secret').maybeSingle()
  const cronSecret = (vaultRow as any)?.decrypted_secret
  if (!cronSecret) return { outcome: 'terminal', reason: 'not_configured' }

  let res: Response
  try {
    // AWAITED, unlike provision-tenant step 10's fire-and-forget: the whole
    // point of the queue is that the outcome is observed and recorded.
    res = await fetchWithTimeout(`${SUPABASE_URL}/functions/v1/outscraper-reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: cronSecret },
      body: JSON.stringify({ tenant_id: job.tenant_id, mode: 'initial' }),
    })
  } catch (err) {
    return { outcome: classifyThrownError(err, 'outscraper_initial'), reason: 'network' }
  }
  return { outcome: classifyResponse(res.status, true, 'outscraper_initial'), reason: `http_${res.status}` }
}

serve(async (req) => {
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  const expected = Deno.env.get('PROCESS_OUTBOUND_QUEUE_INTERNAL_SECRET') ?? ''
  if (!expected) {
    console.error('[process-outbound-queue] misconfigured: internal secret unset')
    return json(500, { error: 'Server misconfigured' })
  }
  if (!constantTimeEq(expected, req.headers.get('x-pfp-internal-key') ?? '')) {
    console.warn('[process-outbound-queue] auth failed')
    return json(401, { error: 'Unauthorized' })
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    const { data: jobs, error: claimErr } = await admin.rpc('outbound_queue_claim', { p_limit: BATCH })
    if (claimErr) throw claimErr

    const summary = { claimed: (jobs ?? []).length, succeeded: 0, retryable: 0, unknown: 0, terminal: 0 }

    for (const job of (jobs ?? []) as ClaimedJob[]) {
      let handled: Handled
      try {
        handled = job.kind === 'zernio_profile'
          ? await handleZernio(admin, job)
          : job.kind === 'outscraper_initial'
            ? await handleOutscraper(admin, job)
            : { outcome: 'terminal', reason: 'unsupported_kind' }
      } catch (err) {
        // A throw from OUR OWN code, not from the vendor call — those are caught
        // inside the handlers and classified there.
        //
        // `retryable` is only safe here because a handler that has ALREADY made a
        // duplicate-sensitive vendor call must not reach this catch holding an
        // unsaved ref: handleZernio catches its own settings-write failure and
        // returns the ref with it (S340). Do not weaken that — a bare throw after
        // a successful POST lands here, loses the id, and the retry creates a
        // second profile.
        handled = { outcome: 'retryable', reason: 'worker_error' }
        console.error(logLine('worker_error', job, 'retryable', (err as Error)?.message?.slice(0, 200)))
      }

      const { error: completeErr } = await admin.rpc('outbound_queue_complete', {
        p_id: job.id,
        p_outcome: handled.outcome,
        p_vendor_ref: handled.vendorRef ?? null,
        p_error: handled.reason ?? null,
      })
      if (completeErr) {
        // The lease stays held and expires on its own; the DB re-claims it later
        // with prior_status='processing', which forces the reconcile path.
        console.error(logLine('complete_failed', job, handled.outcome, completeErr.message?.slice(0, 200)))
      }

      summary[handled.outcome === 'succeeded' ? 'succeeded'
        : handled.outcome === 'retryable' ? 'retryable'
          : handled.outcome === 'unknown' ? 'unknown' : 'terminal'] += 1
      console.log(logLine('handled', job, handled.outcome, handled.reason))
    }

    console.log(`[process-outbound-queue] ${JSON.stringify(summary)}`)
    return json(200, summary)
  } catch (e) {
    console.error('[process-outbound-queue] error:', (e as Error)?.message?.slice(0, 200))
    return json(500, { error: 'Internal error' })
  }
})
