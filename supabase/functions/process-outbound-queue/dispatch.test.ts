import { describe, it, expect } from 'vitest'
import {
  classifyStatus,
  classifyResponse,
  classifyThrownError,
  extractZernioProfileId,
  needsReconcileBeforeCreate,
  hasGoogleId,
  buildZernioIntegrationsValue,
  DUPLICATE_SENSITIVE,
  logLine,
} from './dispatch.ts'

// S339 — the worker's outcome mapping. The DB state machine is already tested
// (12 rolled-back cases); this covers the half that was untested: what the
// worker DECIDES a result means.
//
// The single most important assertion in this file is that a TIMEOUT maps to
// `unknown` and never to `retryable`. Everything else is supporting cast.

const strip = (v: Record<string, unknown>) => {
  const out = { ...v }
  for (const k of ['facebook_access_token', 'ga4_oauth_refresh_token', 'gsc_oauth_refresh_token', 'textbelt_api_key']) delete out[k]
  return out
}

describe('HTTP status mapping', () => {
  it('2xx is succeeded', () => {
    for (const s of [200, 201, 202, 204]) expect(classifyStatus(s)).toBe('succeeded')
  })

  it('429 and 5xx are retryable — the vendor told us to come back', () => {
    for (const s of [429, 500, 502, 503, 504]) expect(classifyStatus(s)).toBe('retryable')
  })

  it('4xx is terminal — it will not start working on its own', () => {
    for (const s of [400, 401, 403, 404, 409, 422]) expect(classifyStatus(s)).toBe('terminal')
  })

  it('anti-vacuity: the three classes are genuinely different', () => {
    expect(new Set([classifyStatus(200), classifyStatus(429), classifyStatus(403)]).size).toBe(3)
  })
})

describe('THE RULE: a timeout is `unknown`, never `retryable`', () => {
  // If this ever regresses, a timed-out POST that actually created a Zernio
  // profile gets retried and mints a duplicate. This is the assertion the
  // mutation test targets.
  const inFlightDeaths = [
    new DOMException('The signal has been aborted', 'AbortError'),
    new Error('operation timed out'),
    new Error('error sending request: connection reset by peer'),
    new Error('connection closed before message completed'),
    new TypeError('error sending request for url: unexpected eof'),
  ]

  for (const err of inFlightDeaths) {
    it(`zernio_profile: ${(err as Error).name}: ${(err as Error).message.slice(0, 40)} -> unknown`, () => {
      const out = classifyThrownError(err, 'zernio_profile')
      expect(out).toBe('unknown')
      expect(out).not.toBe('retryable')
    })
  }

  it('an UNRECOGNISED error is also unknown — not recognising it is the reason to be careful', () => {
    expect(classifyThrownError(new Error('something nobody has seen before'), 'zernio_profile')).toBe('unknown')
    expect(classifyThrownError('a bare string', 'zernio_profile')).toBe('unknown')
    expect(classifyThrownError(null, 'zernio_profile')).toBe('unknown')
  })

  it('ONLY a provably pre-dispatch error is retryable for zernio', () => {
    // These prove the request never left, so nothing can have been created.
    expect(classifyThrownError(new Error('dns error: failed to lookup address'), 'zernio_profile')).toBe('retryable')
    expect(classifyThrownError(new Error('tcp connect error: connection refused'), 'zernio_profile')).toBe('retryable')
  })

  it('anti-vacuity: classifyThrownError is not a constant for zernio', () => {
    // If it always returned 'unknown', the pre-dispatch cases above would be
    // the only thing distinguishing it — this pins that both answers occur.
    const answers = new Set([
      classifyThrownError(new Error('dns error'), 'zernio_profile'),
      classifyThrownError(new Error('timed out'), 'zernio_profile'),
    ])
    expect(answers).toEqual(new Set(['retryable', 'unknown']))
  })

  it('a NON duplicate-sensitive kind keeps transient errors retryable', () => {
    // Repeating an outscraper sync is harmless, so the asymmetry does not apply.
    expect(classifyThrownError(new Error('timed out'), 'outscraper_initial')).toBe('retryable')
    expect(classifyThrownError(new DOMException('aborted', 'AbortError'), 'outscraper_initial')).toBe('retryable')
  })

  it('the sensitivity set names zernio and NOT outscraper', () => {
    expect(DUPLICATE_SENSITIVE.has('zernio_profile')).toBe(true)
    expect(DUPLICATE_SENSITIVE.has('outscraper_initial')).toBe(false)
  })
})

describe('a 2xx with no usable id is NOT succeeded', () => {
  it('zernio: 200 without an id is unknown — the profile may exist and we cannot prove it', () => {
    expect(classifyResponse(200, false, 'zernio_profile')).toBe('unknown')
  })

  it('zernio: 200 WITH an id is succeeded', () => {
    expect(classifyResponse(200, true, 'zernio_profile')).toBe('succeeded')
  })

  it('a non-sensitive kind falls back to retryable rather than dead-ending', () => {
    expect(classifyResponse(200, false, 'outscraper_initial')).toBe('retryable')
  })

  it('the body-shape variants Zernio actually returns', () => {
    expect(extractZernioProfileId({ profile: { _id: 'a1' } })).toBe('a1')
    expect(extractZernioProfileId({ profile: { id: 'b2' } })).toBe('b2')
    expect(extractZernioProfileId({ id: 'c3' })).toBe('c3')
    expect(extractZernioProfileId({ _id: 'd4' })).toBe('d4')
  })

  it('absent / blank / non-string ids are NOT usable', () => {
    expect(extractZernioProfileId({})).toBeNull()
    expect(extractZernioProfileId({ profile: {} })).toBeNull()
    expect(extractZernioProfileId({ id: '' })).toBeNull()
    expect(extractZernioProfileId({ id: '   ' })).toBeNull()
    expect(extractZernioProfileId({ id: 12345 })).toBeNull()
    expect(extractZernioProfileId(null)).toBeNull()
  })
})

describe('reconcile BEFORE create', () => {
  const base = { kind: 'zernio_profile' as const, vendor_ref: null, prior_status: 'pending' }

  it('a fresh job does NOT reconcile — that would be a wasted lookup', () => {
    expect(needsReconcileBeforeCreate(base)).toBe(false)
    expect(needsReconcileBeforeCreate({ ...base, prior_status: 'retryable_failed' })).toBe(false)
  })

  it('a non-null vendor_ref forces reconcile', () => {
    expect(needsReconcileBeforeCreate({ ...base, vendor_ref: 'zp_123' })).toBe(true)
  })

  it('a blank vendor_ref is NOT a ref', () => {
    expect(needsReconcileBeforeCreate({ ...base, vendor_ref: '   ' })).toBe(false)
  })

  it("prior_status 'unknown' forces reconcile", () => {
    expect(needsReconcileBeforeCreate({ ...base, prior_status: 'unknown' })).toBe(true)
  })

  it("prior_status 'processing' — AN ABANDONED LEASE — forces reconcile", () => {
    // Not named in the brief but reachable today: outbound_queue_claim
    // re-claims a 'processing' row once its lease expires and returns
    // prior_status='processing'. The previous worker may have sent the POST
    // before it died. Treating that as a fresh create mints a duplicate.
    expect(needsReconcileBeforeCreate({ ...base, prior_status: 'processing' })).toBe(true)
  })

  it('outscraper never reconciles — repeating a sync is harmless', () => {
    expect(needsReconcileBeforeCreate({ kind: 'outscraper_initial', vendor_ref: 'x', prior_status: 'unknown' })).toBe(false)
  })
})

describe('the integrations write merges and keeps the deliberate null clear', () => {
  it('every unrelated key survives — dang holds 23 here', () => {
    const current = {
      facebook_page_id: 'fb1', google_cid: 'cid1', zernio_accounts: { facebook: 'a' },
      google_business_token: 'tok', some_future_key: 'keep me',
    }
    const out = buildZernioIntegrationsValue(current, 'zp_new', strip)
    expect(out.facebook_page_id).toBe('fb1')
    expect(out.google_cid).toBe('cid1')
    expect(out.zernio_accounts).toStrictEqual({ facebook: 'a' })
    expect(out.some_future_key).toBe('keep me')
  })

  it('zernio_last_error is set to NULL — a deliberate clear, not a dropped empty', () => {
    // mergeSettingsValue would treat null as an empty overlay and REFUSE to let
    // it overwrite a non-empty existing error. That is the trap provision-tenant
    // step 8 documents; this write must not route through it.
    const out = buildZernioIntegrationsValue({ zernio_last_error: 'not_configured' }, 'zp_new', strip)
    expect('zernio_last_error' in out).toBe(true)
    expect(out.zernio_last_error).toBeNull()
    expect(out.zernio_last_error).not.toBe('not_configured')
  })

  it('the profile id is written', () => {
    expect(buildZernioIntegrationsValue({}, 'zp_new', strip).zernio_profile_id).toBe('zp_new')
  })

  it('it goes THROUGH stripVaultSecrets', () => {
    const out = buildZernioIntegrationsValue(
      { facebook_access_token: 'SECRET', ga4_oauth_refresh_token: 'SECRET', keep: 'yes' },
      'zp_new', strip,
    )
    expect('facebook_access_token' in out).toBe(false)
    expect('ga4_oauth_refresh_token' in out).toBe(false)
    expect(out.keep).toBe('yes')
  })

  it('a first provision (no existing value) still works', () => {
    expect(buildZernioIntegrationsValue(null, 'zp_new', strip))
      .toStrictEqual({ zernio_profile_id: 'zp_new', zernio_last_error: null })
  })

  it('anti-vacuity: it is NOT a whole replacement', () => {
    const out = buildZernioIntegrationsValue({ other: 'x' }, 'zp', strip)
    expect(Object.keys(out).sort()).toStrictEqual(['other', 'zernio_last_error', 'zernio_profile_id'])
  })
})

describe('outscraper precondition', () => {
  it('any one of the three google ids satisfies it', () => {
    expect(hasGoogleId({ google_cid: '123' })).toBe(true)
    expect(hasGoogleId({ google_fid: '0x1:0x2' })).toBe(true)
    expect(hasGoogleId({ google_place_id: 'ChIJ' })).toBe(true)
  })

  it('none / blank / absent means no_google_id — a permanent state', () => {
    expect(hasGoogleId({})).toBe(false)
    expect(hasGoogleId(null)).toBe(false)
    expect(hasGoogleId({ google_cid: '', google_fid: '   ', google_place_id: null })).toBe(false)
    expect(hasGoogleId({ facebook_page_id: 'fb' })).toBe(false)
  })
})

describe('logging is allowlisted (S313)', () => {
  const job = { id: 'j1', tenant_id: 't1', kind: 'zernio_profile' as const, attempts: 2 }

  it('carries the operational fields', () => {
    const line = logLine('handled', job, 'unknown', 'network')
    expect(line).toContain('job=j1')
    expect(line).toContain('tenant_id=t1')
    expect(line).toContain('kind=zernio_profile')
    expect(line).toContain('attempts=2')
    expect(line).toContain('outcome=unknown')
  })

  it('has no field through which a key or upstream body could travel', () => {
    // Only the named parameters can reach the line; a caller cannot smuggle a
    // body in because there is nowhere to put one.
    const line = logLine('handled', job, 'succeeded')
    expect(line).not.toMatch(/Bearer|api[_-]?key|token/i)
  })
})
