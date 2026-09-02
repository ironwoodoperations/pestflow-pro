// Supabase Edge Function: password-reset-request
//
// Unauthenticated. Mints a recovery link via auth.admin.generateLink and delivers it in a
// branded Resend email — NOT GoTrue default mail. The link is a bearer credential, NEVER logged.
//
// verify_jwt: FALSE (config.toml) — the caller is unauthenticated by definition. The gateway
// toggle silently reverts to ON after a deploy — re-check it stays OFF after every deploy.
//
// Anti-enumeration (validator M3): the response body is IDENTICAL on every path ({status:'ok'},
// never any Supabase error text), and total response time is padded to a fixed minimum.
//
// THE FLOOR IS RISK REDUCTION, NOT PROOF OF TIMING INDISTINGUISHABILITY. Earlier wording here
// said a fast path "can't be timed as an oracle"; that overclaimed. A fixed floor bounds the
// fast path from below, which removes the obvious signal — it does not demonstrate that no
// residual distribution difference survives at p95/p99 under concurrency. Establishing that
// needs a load test, which is deliberately not in this change's scope. Do not restore the
// stronger claim without the measurement behind it.
//
// S313 — OBSERVABILITY. Errors used to be swallowed by three EMPTY catch blocks and a
// runDetached() that did `p.catch(() => {})`, so tenant-not-found, generateLink failure and a
// Resend rejection were indistinguishable from success TO US as well as to the caller. There
// were zero function_logs entries, which is why nobody could answer whether "Forgot password?"
// worked at all.
//
// THE CONFLATION THAT CAUSED IT: anti-enumeration requires the RESPONSE to be uniform. It does
// not require the SERVER to be blind. Every branch below now logs a distinct reason code, and
// NOTHING about the response changed — same bytes, same branches, same MIN_RESPONSE_MS floor.
//
// NEVER LOGGED, and this is the hard constraint: the email address in full, the hashed_token,
// or the constructed link. The token and link are bearer credentials — anyone reading them can
// take over the account.
//
// tenant is server-derived from the request Origin/Referer host — never from the body.
//
// Deploy: supabase functions deploy password-reset-request --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/sendEmail.ts'
import { recoveryEmail } from '../_shared/emailTemplates/authEmails.ts'

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const APP_BASE_DOMAIN           = Deno.env.get('APP_BASE_DOMAIN') || 'pestflowpro.ai'
const MIN_RESPONSE_MS           = 700

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const LOG_PREFIX = '[password-reset-request]'

// Correlates every line from ONE invocation while recording nothing about the caller.
const newRid = (): string => crypto.randomUUID().slice(0, 8)

// GATE ROUND 1, non-blocking, taken from BOTH models: there is NO email tag. An earlier
// revision logged a truncated SHA-256 of the address as a correlation key, with a comment
// admitting it was not a privacy guarantee — addresses are low-entropy, so log access plus a
// candidate list confirms a guess. Both models preferred removing it, and they are right:
// this DELETES the caveat rather than documenting it. `rid` above is a random per-request id
// and correlates lines within one invocation, which is all the correlation that is needed.
// Cross-request correlation by address is not a requirement — with two live tenants, slug +
// timestamp + outcome locates any request. Do NOT reintroduce a hash, and do NOT reach for a
// keyed HMAC either: that is a secret to manage for a need we do not have.

// Run a promise without blocking the response, so total response time never depends on
// email-send latency (a timing oracle). Uses EdgeRuntime.waitUntil to keep the worker alive
// past the response when available; falls back to a fire-and-forget catch otherwise.
//
// S313: the rejection is now LOGGED rather than discarded. It was the only signal that email
// delivery had failed, and `p.catch(() => {})` threw it away. Still detached, so the response
// timing is unchanged.
//
// CAVEAT: without EdgeRuntime.waitUntil the worker may be torn down before this catch runs, so
// an absent send_failed line is not proof the send succeeded. The `send_dispatched` line below
// is what proves the attempt was made.
function runDetached(p: Promise<unknown>, rid: string): void {
  const logged = p.catch((e) => {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`${LOG_PREFIX} rid=${rid} reason=send_failed detail=${msg}`)
  })
  const er = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime
  if (er?.waitUntil) er.waitUntil(logged)
}

function validEmail(e: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)
}

/** Extract the tenant slug from a request Origin/Referer host (`<slug>.pestflowpro.ai`). */
function slugFromRequest(req: Request): string | null {
  const src = req.headers.get('Origin') || req.headers.get('Referer') || ''
  if (!src) return null
  try {
    const host = new URL(src).hostname
    if (host === APP_BASE_DOMAIN) return null            // apex → no tenant
    if (host.endsWith(`.${APP_BASE_DOMAIN}`)) {
      const sub = host.slice(0, -1 * (APP_BASE_DOMAIN.length + 1))
      return sub.split('.').pop() || null                // left-most label is the slug
    }
    return null                                          // custom domain — out of scope
  } catch {
    return null
  }
}

export async function handler(req: Request): Promise<Response> {
  const started = Date.now()
  const rid = newRid()
  // Exactly one outcome line per invocation, logged just before returning. It starts as
  // `unset` so a fall-through cannot quietly read as success — an outcome nobody assigned
  // is itself the finding.
  let outcome = 'unset'
  const ok = async (): Promise<Response> => {
    const elapsed = Date.now() - started
    if (elapsed < MIN_RESPONSE_MS) await sleep(MIN_RESPONSE_MS - elapsed)
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  // GATE ROUND 1, BLOCKING 3 (the in-scope half). Non-POST returns WITHOUT logging. A GET or
  // HEAD on a public unauthenticated endpoint is a scanner, and letting a scanner drive
  // unbounded log writes is the amplification concern the gate raised. Preflight (OPTIONS)
  // already returns above without logging.
  if (req.method !== 'POST') return ok()

  // Logged for every POST, so an ABSENCE of logs is unambiguous: it means the function was
  // never called, not that it ran and stayed quiet. Deliberately placed AFTER the method
  // check (scanners do not log) and BEFORE email validation (distinguishing junk input from
  // real input is the point).
  console.log(`${LOG_PREFIX} rid=${rid} invoked`)

  try {
    const body = await req.json().catch(() => null)
    const email = (body?.email || '').trim().toLowerCase()
    const slug = slugFromRequest(req)

    if (validEmail(email) && slug) {
      const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { data: tenant } = await service
        .from('tenants').select('id, slug').eq('slug', slug).maybeSingle()
      if (tenant) {
        const { data: bizSetting } = await service
          .from('settings').select('value').eq('tenant_id', tenant.id).eq('key', 'business_info').maybeSingle()
        const businessName: string = bizSetting?.value?.name || 'PestFlow Pro'
        const setPasswordBase = `https://${slug}.${APP_BASE_DOMAIN}/set-password`

        // generateLink throws fast for a nonexistent email — swallow so timing/shape don't leak.
        try {
          const { data, error } = await service.auth.admin.generateLink({
            type: 'recovery', email, options: { redirectTo: setPasswordBase },
          })
          const hashed = data?.properties?.hashed_token
          if (!error && hashed) {
            const link = `${setPasswordBase}?token_hash=${hashed}&type=recovery`
            const { subject, html, text } = recoveryEmail(businessName, link)
            // Detached: the response must not wait on Resend, or send latency leaks as a
            // timing oracle distinguishing existing vs nonexistent emails (M3).
            runDetached(sendEmail({ to: email, subject, html, text, fromName: businessName }), rid)
            // The send is detached, so this records only that the attempt was DISPATCHED.
            // Delivery success is not knowable here; a send_failed line above is.
            outcome = 'send_dispatched'
          } else if (error) {
            // GATE ROUND 1, BLOCKING 1, BOTH MODELS. The brief originally asked for
            // error.message here; that instruction was the defect, and it was Scott's, not
            // the models'. An SDK error object carries more than its displayed message, and a
            // provider message is an unbounded upstream string that can contain the address,
            // a URL, or anything a future SDK version decides to put there.
            //
            // ONLY ALLOWLISTED, STRUCTURED FIELDS ARE LOGGED. Never the raw message, never the
            // error object. If a human-readable string is ever needed, map a KNOWN code to one
            // of OUR OWN fixed internal strings — do not sanitize-and-pass-through, because
            // that re-opens the same hole one upstream change later.
            //
            // The ordinary nonexistent-email case lands here too, so this is a warn, not an
            // error: expected, and the caller is told nothing either way.
            const e = error as { status?: number; code?: string; name?: string }
            console.warn(
              `${LOG_PREFIX} rid=${rid} reason=generate_link_failed ` +
              `status=${e.status ?? 'null'} code=${e.code ?? e.name ?? 'unknown'}`,
            )
            outcome = 'generate_link_failed'
          } else {
            // generateLink reported success but returned no token. Nothing to send, and
            // nothing previously distinguished this from a completed send.
            console.error(`${LOG_PREFIX} rid=${rid} reason=no_hashed_token`)
            outcome = 'no_hashed_token'
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          console.error(`${LOG_PREFIX} rid=${rid} reason=generate_link_threw detail=${msg}`)
          outcome = 'generate_link_threw'
        }
      } else {
        // The slug parsed but names no tenant. On `www.pestflowpro.ai` this fires with
        // slug=www — see the apex finding in the PR body.
        console.warn(`${LOG_PREFIX} rid=${rid} reason=tenant_not_found slug=${slug}`)
        outcome = 'tenant_not_found'
      }
    } else if (!slug) {
      // slugFromRequest returned null: the apex, a custom domain, or no Origin/Referer.
      // The function then does NOTHING and still answers 200 — structurally dead here.
      console.warn(`${LOG_PREFIX} rid=${rid} reason=no_slug`)
      outcome = 'no_slug'
    } else {
      console.warn(`${LOG_PREFIX} rid=${rid} reason=invalid_email`)
      outcome = 'invalid_email'
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`${LOG_PREFIX} rid=${rid} reason=unhandled detail=${msg}`)
    outcome = 'unhandled'
  }

  // One line per invocation, always. Pairs with the `invoked` line above so a request that
  // dies mid-flight is visible as an invocation with no outcome.
  console.log(`${LOG_PREFIX} rid=${rid} outcome=${outcome} ms=${Date.now() - started}`)
  return ok()
}

if (import.meta.main) {
  Deno.serve(handler)
}
