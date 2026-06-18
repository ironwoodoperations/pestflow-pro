// Supabase Edge Function: password-reset-request
//
// Unauthenticated. Mints a recovery link via auth.admin.generateLink and delivers it in a
// branded Resend email — NOT GoTrue default mail. The link is a bearer credential, NEVER logged.
//
// verify_jwt: FALSE (config.toml) — the caller is unauthenticated by definition. The gateway
// toggle silently reverts to ON after a deploy — re-check it stays OFF after every deploy.
//
// Anti-enumeration (validator M3): the response body is IDENTICAL on every path ({status:'ok'},
// never any Supabase error text), all internal errors are swallowed, and total response time is
// padded to a fixed minimum so a nonexistent-email fast path can't be timed as an oracle.
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
  const ok = async (): Promise<Response> => {
    const elapsed = Date.now() - started
    if (elapsed < MIN_RESPONSE_MS) await sleep(MIN_RESPONSE_MS - elapsed)
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return ok()

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
            await sendEmail({ to: email, subject, html, text, fromName: businessName })
          }
        } catch (_e) {
          // swallowed — never surfaced to the caller
        }
      }
    }
  } catch (_e) {
    // swallowed — identical response on every path
  }

  return ok()
}

if (import.meta.main) {
  Deno.serve(handler)
}
