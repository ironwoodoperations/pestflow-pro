// S242 — signed delegation envelopes for service-to-service auth (design §9).
//
// ai-proxy trusts SERVICES, not forwarded user JWTs. Internal callers
// (process-campaign-job, tag-image-vision) carry user/tenant context as DATA in
// a short-lived HMAC-signed envelope, never as authority. ai-proxy's /internal
// route verifies the signature + expiry + purpose allowlist here (pure, no DB),
// then does the DB-backed checks (jti replay, tenant exists, resource ownership,
// tier) itself.
//
// The HMAC is computed over the base64 envelope STRING (stable bytes) — signing
// and verifying never re-serialize JSON, so key-ordering can't break the check.
// All callers + ai-proxy share Deno env INTERNAL_DELEGATION_SECRET, whose value
// equals vault secret `internal_delegation_secret`.

import { createHmac, timingSafeEqual } from 'node:crypto'

export type DelegationPurpose = 'generate_social_batch' | 'reverse_selection' | 'image_tagging' | 'monthly_report_narration'
export type DelegationCaller = 'process-campaign-job' | 'tag-image-vision' | 'generate-monthly-report'

export interface DelegationEnvelope {
  purpose: DelegationPurpose
  caller: DelegationCaller
  acting_user: string | null
  acting_tenant: string
  resource: { campaign_id?: string; image_id?: string; max_posts?: number }
  iat: number
  exp: number
  jti: string
}

// §9 step 5 — which purposes each caller may request. Hard separation.
export const CALLER_PURPOSES: Record<DelegationCaller, ReadonlySet<DelegationPurpose>> = {
  'process-campaign-job': new Set<DelegationPurpose>(['generate_social_batch', 'reverse_selection']),
  'tag-image-vision': new Set<DelegationPurpose>(['image_tagging']),
  // S259 — monthly prescriptive report worker narrates findings via ai-proxy/internal.
  // ai-proxy/internal still applies its own Pro-tier gate (§12); sub-Pro tenants 403
  // and the worker falls back to templated narration (report still generates).
  'generate-monthly-report': new Set<DelegationPurpose>(['monthly_report_narration']),
}

export const ENVELOPE_HEADER = 'x-delegation-envelope'
export const SIGNATURE_HEADER = 'x-delegation-signature'

export class EnvelopeError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

function hmacHex(payloadB64: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadB64).digest('hex')
}

// Caller side: build a fresh envelope. Default TTL 60s; batch caption-gen passes
// a longer ttl (worker runs multi-second). Envelope contains only ASCII (uuids,
// ints, fixed enums) so btoa is safe.
export function buildEnvelope(args: {
  purpose: DelegationPurpose
  caller: DelegationCaller
  acting_tenant: string
  acting_user?: string | null
  resource?: DelegationEnvelope['resource']
  ttl_seconds?: number
}): DelegationEnvelope {
  const now = Math.floor(Date.now() / 1000)
  return {
    purpose: args.purpose,
    caller: args.caller,
    acting_user: args.acting_user ?? null,
    acting_tenant: args.acting_tenant,
    resource: args.resource ?? {},
    iat: now,
    exp: now + (args.ttl_seconds ?? 60),
    jti: crypto.randomUUID(),
  }
}

// Caller side: headers to attach to the POST to ai-proxy/internal.
export function signEnvelope(envelope: DelegationEnvelope, secret: string): Record<string, string> {
  const payloadB64 = btoa(JSON.stringify(envelope))
  return {
    'Content-Type': 'application/json',
    [ENVELOPE_HEADER]: payloadB64,
    [SIGNATURE_HEADER]: hmacHex(payloadB64, secret),
  }
}

// Verifier side (ai-proxy): signature + expiry + structure + purpose allowlist.
// Pure — no DB. Throws EnvelopeError(401) on any failure. DB-backed checks
// (jti replay, tenant exists, resource ownership, tier) are the caller's job.
export function verifyEnvelopeSignature(req: Request, secret: string): DelegationEnvelope {
  if (!secret) throw new EnvelopeError(500, 'INTERNAL_DELEGATION_SECRET not configured')
  const payloadB64 = req.headers.get(ENVELOPE_HEADER) || ''
  const presented = req.headers.get(SIGNATURE_HEADER) || ''
  if (!payloadB64 || !presented) throw new EnvelopeError(401, 'Missing delegation headers')

  // constant-time signature compare (length pre-check, per process-sms-queue)
  const enc = new TextEncoder()
  const a = enc.encode(hmacHex(payloadB64, secret))
  const b = enc.encode(presented)
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new EnvelopeError(401, 'Bad signature')

  let env: DelegationEnvelope
  try {
    env = JSON.parse(atob(payloadB64))
  } catch {
    throw new EnvelopeError(401, 'Malformed envelope')
  }

  const now = Math.floor(Date.now() / 1000)
  if (typeof env.exp !== 'number' || env.exp < now) throw new EnvelopeError(401, 'Envelope expired')
  if (typeof env.iat !== 'number' || env.iat > now + 60) throw new EnvelopeError(401, 'Envelope iat skewed')

  const allowed = CALLER_PURPOSES[env.caller]
  if (!allowed || !allowed.has(env.purpose)) throw new EnvelopeError(401, 'Purpose not allowed for caller')

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (typeof env.acting_tenant !== 'string' || !UUID_RE.test(env.acting_tenant)) {
    throw new EnvelopeError(401, 'Invalid acting_tenant')
  }
  if (typeof env.jti !== 'string' || !UUID_RE.test(env.jti)) throw new EnvelopeError(401, 'Invalid jti')

  return env
}
