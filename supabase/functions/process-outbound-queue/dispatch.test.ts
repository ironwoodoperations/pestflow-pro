import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  classifyStatus,
  classifyResponse,
  classifyThrownError,
  extractZernioProfileId,
  needsReconcileBeforeCreate,
  resolveZernioCreate,
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


// ════════════════════════════════════════════════════════════════════════════
// S340 — THE DUPLICATE-CREATE PATH THAT WAS LIVE IN THE DEPLOYED WORKER.
//
// Zernio create succeeds, our own settings write then throws. The throw used to
// escape to the loop's catch, which returned `retryable` with NO vendorRef. The
// id we already held was discarded, vendor_ref stayed NULL, and the next claim
// created a SECOND profile.
//
// These tests walk the whole chain, not just the return value: decision ->
// what outbound_queue_complete persists -> what the next claim then decides.
// ════════════════════════════════════════════════════════════════════════════

/**
 * Mirrors `outbound_queue_complete`'s vendor_ref write. Kept in the test rather
 * than in dispatch.ts because production has no use for it — the DB does this.
 * The SQL it mirrors is pinned by a test below, so this cannot drift silently.
 */
const persistVendorRef = (existing: string | null, incoming?: string) => incoming ?? existing

describe('S340: a failed settings write must not lose the vendor ref', () => {
  const ok = { id: 'prof_abc123' }

  it('carries the ref out WITH the retryable outcome', () => {
    const r = resolveZernioCreate(201, ok, true)
    expect(r.outcome).toBe('retryable')
    expect(r.vendorRef).toBe('prof_abc123')
    expect(r.reason).toBe('settings_write_failed')
  })

  it('is retryable, NOT unknown — the vendor state is not in doubt here', () => {
    // The POST completed and we read its body. Nothing is unobserved, so this
    // must not dead-end the job the way a timeout does.
    expect(resolveZernioCreate(201, ok, true).outcome).toBe('retryable')
  })

  it('the happy path is unchanged', () => {
    const r = resolveZernioCreate(201, ok, false)
    expect(r.outcome).toBe('succeeded')
    expect(r.vendorRef).toBe('prof_abc123')
    expect(r.reason).toBeUndefined()
  })

  it('THE CHAIN: settings-write failure leaves vendor_ref SET, so the next claim reconciles instead of creating', () => {
    const failed = resolveZernioCreate(201, ok, true)

    // What the DB stores: vendor_ref = coalesce(p_vendor_ref, q.vendor_ref).
    const stored = persistVendorRef(null, failed.vendorRef)
    expect(stored).toBe('prof_abc123')

    // What the next claim decides, given that stored ref.
    expect(needsReconcileBeforeCreate({
      kind: 'zernio_profile',
      vendor_ref: stored,
      prior_status: 'retryable_failed',
    })).toBe(true)
  })

  it('DROPPING THE REF IS THE BUG: without it the next claim creates a duplicate', () => {
    // This is the pre-S340 behaviour, asserted explicitly so the failure mode is
    // documented rather than merely avoided.
    const stored = persistVendorRef(null, undefined)
    expect(stored).toBeNull()
    expect(needsReconcileBeforeCreate({
      kind: 'zernio_profile',
      vendor_ref: stored,
      prior_status: 'retryable_failed',
    })).toBe(false) // <- FALSE means "go create one", i.e. a second POST
  })

  it('a non-2xx is unaffected by the settings-write flag', () => {
    // The flag only matters on the path where a profile actually exists.
    for (const flag of [true, false]) {
      expect(resolveZernioCreate(500, null, flag).outcome).toBe('retryable')
      expect(resolveZernioCreate(400, null, flag).outcome).toBe('terminal')
      expect(resolveZernioCreate(200, {}, flag).outcome).toBe('unknown')
      expect(resolveZernioCreate(500, null, flag).vendorRef).toBeUndefined()
    }
  })
})

// ── The two things the pure tests above CANNOT catch ────────────────────────
//
// resolveZernioCreate is pure and testable, but reverting the S340 fix happens in
// index.ts (drop the try/catch) and in the SQL (drop the coalesce). Neither would
// fail a single assertion above. index.ts imports from esm.sh so vitest cannot
// execute it — these are SOURCE SCANS, and calling them that is deliberate.

const INDEX_SRC = readFileSync(join(__dirname, 'index.ts'), 'utf8')
const COMPLETE_SQL = readFileSync(
  join(__dirname, '..', '..', 'migrations', 's338_outbound_queue_state_machine.sql'), 'utf8')

describe('S340 wiring guard (source scan — index.ts cannot be executed here)', () => {
  it('the settings write is inside a try/catch that re-resolves with the failure flag', () => {
    // The exact mutation this exists to catch: reverting to a bare
    // `await writeZernioSettings(...)` whose throw escapes to the loop.
    expect(INDEX_SRC).toMatch(/try\s*\{\s*\n\s*await writeZernioSettings\(/)
    expect(INDEX_SRC).toContain('return resolveZernioCreate(res.status, body, true)')
  })

  it('handleZernio routes its create decision through the pure function', () => {
    expect(INDEX_SRC).toContain('resolveZernioCreate(res.status, body, false)')
  })

  it('exactly two call sites, and the create-path one is the protected one', () => {
    const calls = INDEX_SRC.match(/await writeZernioSettings\(/g) ?? []
    expect(calls).toHaveLength(2)

    // The reconcile call is deliberately UNPROTECTED: its ref came from the DB
    // (job.vendor_ref) and is already durable, so a throw there cannot lose an
    // id. Only the create path, which holds the sole copy, needs the catch.
    expect(INDEX_SRC).toContain('await writeZernioSettings(admin, job.tenant_id, known)')
    expect(INDEX_SRC).toMatch(
      /try \{\s*\n\s*await writeZernioSettings\(admin, job\.tenant_id, planned\.vendorRef\)/)
  })
})

describe('S340 depends on the DB never unsetting a known ref', () => {
  it('outbound_queue_complete still coalesces vendor_ref', () => {
    // If this ever becomes a plain assignment, carrying the ref out of a failed
    // settings write stops working and the duplicate path reopens.
    expect(COMPLETE_SQL).toContain('coalesce(p_vendor_ref, q.vendor_ref)')
  })
})
