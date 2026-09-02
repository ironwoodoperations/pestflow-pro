import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// S321 PR A -- ORDER-OF-OPERATIONS GUARD for the api-quote origin gate.
//
// THIS IS A SOURCE SCAN, NOT A BEHAVIOURAL TEST, and saying so is the point.
// index.ts imports from https://esm.sh, which Node's ESM loader rejects, so the handler
// cannot be executed under vitest. The brief asked for a runnable test importing the
// handler; that is not achievable, and pretending otherwise would be the coverage theatre
// it warned against. What IS behavioural lives in _shared/originHost.test.ts, which
// executes the parsing and allowlist logic for real -- the security-critical half.
//
// This file covers the half that cannot be executed: the ORDER of the steps. The gate's
// blocking finding was that a database call in front of the rate limiter is an
// unauthenticated L7 DoS, so the ordering is the thing most worth defending against a
// later well-meaning edit.
//
// NOT named index.test.ts: vitest.config.ts excludes `supabase/functions/*/index.test.ts`,
// so that name is SILENTLY SKIPPED. api-quote/index.test.ts already exists and is collected
// by nothing -- verified with `npx vitest list`. Its own config header calls this the
// dangerous direction.

const SRC = readFileSync(join(__dirname, 'index.ts'), 'utf8')

// Assertions run against CODE, not SRC. This file's own header quotes the patterns it
// forbids, and a raw scan would flag the documentation as if it were live code -- the exact
// failure S313 hit on its first run.
const CODE = SRC
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '')
  .replace(/([^:])\/\/.*$/gm, '$1')

/** Index of the first occurrence, or -1. Used to assert relative order. */
const at = (needle: string) => CODE.indexOf(needle)

describe('api-quote origin gate -- structure', () => {
  it('parses the header with URL(), never a regex over the raw value', () => {
    expect(CODE).toMatch(/normalizeOriginHost|normalizeRefererHost/)
    // The pre-S321 gate. If this string returns, raw-prefix matching came back with it,
    // and userinfo smuggling (https://pestflowpro.ai@evil.example) is admitted again.
    expect(CODE).not.toContain('allowedOriginPattern')
    expect(CODE).not.toMatch(/\^https\?:\\\/\\\//)
  })

  it('parses Origin and Referer independently, not `origin ?? referer`', () => {
    expect(CODE).not.toMatch(/headers\.get\('origin'\)\s*\?\?\s*req\.headers\.get\('referer'\)/)
    expect(at("headers.get('origin')")).toBeGreaterThan(-1)
    expect(at("headers.get('referer')")).toBeGreaterThan(-1)
  })
})

describe('api-quote origin gate -- ORDER (the gate blocking finding)', () => {
  // Scoped to the HANDLER BODY on purpose. Comparing raw file offsets would compare the
  // helper's DEFINITION (hoisted above the handler) against a call site, which says nothing
  // about runtime order -- a guard that checks the wrong thing is worse than no guard, and
  // the first version of this test did exactly that before it failed and was corrected.
  const HANDLER = CODE.slice(at('export async function handler'))
  const inHandler = (needle: string) => HANDLER.indexOf(needle)

  it('checks the platform allowlist BEFORE calling the tenant_domains lookup', () => {
    const platform = inHandler('isPlatformHost(')
    const lookup = inHandler('isVerifiedTenantHost(')
    expect(platform).toBeGreaterThan(-1)
    expect(lookup).toBeGreaterThan(-1)
    expect(platform).toBeLessThan(lookup)
  })

  it('issues no tenant_domains read from the handler body itself', () => {
    // The only read is inside the helper, reached solely via the !isPlatformHost branch.
    expect(HANDLER).not.toContain("from('tenant_domains')")
  })

  it('gates the lookup behind !isPlatformHost, so a platform origin issues ZERO queries', () => {
    // A5: the assertion, not the assumption. The only tenant_domains read in the file sits
    // inside isVerifiedTenantHost, which is called only from the !isPlatformHost branch.
    expect(CODE).toMatch(/if\s*\(\s*!isPlatformHost\(/)
    expect(CODE.match(/from\('tenant_domains'\)/g) ?? []).toHaveLength(1)
    const callSites = CODE.match(/isVerifiedTenantHost\(/g) ?? []
    // one definition + exactly one call site
    expect(callSites).toHaveLength(2)
  })

  it('throttles an unknown origin BEFORE the database call -- reversing this is the DoS', () => {
    const throttle = at('allowUnknownOriginProbe(originHost)')
    const lookup = at('isVerifiedTenantHost(originHost)')
    expect(throttle).toBeGreaterThan(-1)
    expect(lookup).toBeGreaterThan(-1)
    expect(throttle).toBeLessThan(lookup)
  })

  it('still runs the existing per-IP lead rate limiter before insertion', () => {
    const limiter = at("from('rate_limit_events')")
    const insert = at("from('leads').insert(")
    expect(limiter).toBeGreaterThan(-1)
    expect(insert).toBeGreaterThan(-1)
    expect(limiter).toBeLessThan(insert)
  })

  it('rejects an unknown origin before reaching the rate limiter, so no row is written', () => {
    // A3: a 403 must not leave a rate_limit_events row behind.
    expect(at("from('tenant_domains')")).toBeGreaterThan(-1)
    const gateEnd = at('S321 ORIGIN ADMISSION') === -1 ? at('hadOriginSignal') : at('hadOriginSignal')
    expect(gateEnd).toBeLessThan(at("from('rate_limit_events')"))
  })
})

describe('api-quote origin gate -- the lookup shape', () => {
  it('is an indexed exact match, never a scan or pattern match', () => {
    expect(CODE).toContain(".eq('custom_domain', host)")
    expect(CODE).toContain(".eq('verified', true)")
    expect(CODE).toContain('maybeSingle()')
    for (const banned of ['.ilike(', '.like(', '.filter(', '.textSearch(']) {
      expect(CODE, `${banned} would turn the lookup into a scan`).not.toContain(banned)
    }
  })

  it('fails CLOSED -- an error or throw returns false, never true', () => {
    const fn = CODE.slice(at('async function isVerifiedTenantHost'), at('export async function handler'))
    expect(fn).toMatch(/if\s*\(error\)[\s\S]*?return false/)
    expect(fn).toMatch(/catch[\s\S]*?return false/)
    expect(fn).not.toMatch(/catch[\s\S]*?return true/)
  })

  it('bounds both module-scope maps and gives each an explicit TTL', () => {
    expect(CODE).toContain('PROBE_MAX_KEYS')
    expect(CODE).toContain('VERIFIED_MAX_KEYS')
    expect(CODE).toContain('PROBE_WINDOW_MS')
    expect(CODE).toContain('VERIFIED_TTL_MS')
  })
})

describe('api-quote -- the deploy hazard', () => {
  // Deployed v36 allowed pestflowpro\.(com|ai); the repo file allowed .com only, because the
  // 2026-08-23 bulk import wrote a pre-S213a.1 copy over it. Shipping that would have 403'd
  // every .ai tenant and stopped lead capture platform-wide with the function ACTIVE.
  it('reaches the allowlist that carries .ai', () => {
    expect(CODE).toContain("from '../_shared/originHost.ts'")
    const shared = readFileSync(join(__dirname, '..', '_shared', 'originHost.ts'), 'utf8')
    expect(shared).toContain("'pestflowpro.ai'")
    expect(shared).toContain("'pestflowpro.com'")
  })

  it('documents that verify_jwt stays false', () => {
    expect(SRC).toMatch(/--no-verify-jwt|verify_jwt/i)
  })
})
