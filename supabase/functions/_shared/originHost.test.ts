import { describe, it, expect } from 'vitest'
import { normalizeOriginHost, normalizeRefererHost, isPlatformHost, PLATFORM_HOSTS } from './originHost'

// S321 PR A. A REAL BEHAVIOURAL TEST, and that is the point of the file's existence.
//
// The handler in api-quote/index.ts CANNOT be tested here: it imports from https://esm.sh,
// which Node's ESM loader rejects, which is why vitest.config.ts excludes
// `supabase/functions/*/index.test.ts` -- and why `api-quote/index.test.ts` is collected by
// NOTHING today (verified with `npx vitest list`: zero matches). S313 hit the same wall and
// settled for a source scan. Extracting the parser into a module with no https imports is
// what lets the security-critical half be executed rather than grepped.
//
// This file is NOT named index.test.ts. That name is silently skipped inside a function
// directory, which vitest.config.ts's own header calls the dangerous direction.

describe('normalizeOriginHost -- accepts', () => {
  it('a bare https origin', () => {
    expect(normalizeOriginHost('https://precisionlawnsystems.com')).toBe('precisionlawnsystems.com')
  })
  it('a trailing slash, which is the canonical Origin serialization', () => {
    expect(normalizeOriginHost('https://precisionlawnsystems.com/')).toBe('precisionlawnsystems.com')
  })
  it('mixed case, lowercased', () => {
    expect(normalizeOriginHost('https://PrecisionLawnSystems.COM')).toBe('precisionlawnsystems.com')
  })
  it('a subdomain', () => {
    expect(normalizeOriginHost('https://pls.pestflowpro.ai')).toBe('pls.pestflowpro.ai')
  })
})

describe('normalizeOriginHost -- rejects', () => {
  // THE CASE THAT MOTIVATES URL PARSING. The old raw-prefix regex matched this string and
  // admitted it; the request is from evil.example. URL.hostname resolves it correctly.
  it('userinfo smuggling -- the reason raw-regex matching is unsafe', () => {
    expect(normalizeOriginHost('https://pestflowpro.ai@evil.example')).toBeNull()
    expect(normalizeOriginHost('https://pestflowpro.ai:x@evil.example/')).toBeNull()
  })

  it('a suffix-confusion host that a naive endsWith would admit', () => {
    // Parses fine; it is isPlatformHost's job to refuse it. Asserted in both places.
    expect(normalizeOriginHost('https://trusted.example.evil.example')).toBe('trusted.example.evil.example')
    expect(isPlatformHost('trusted.example.evil.example')).toBe(false)
  })

  it('http', () => {
    expect(normalizeOriginHost('http://precisionlawnsystems.com')).toBeNull()
  })

  it('an explicit port', () => {
    expect(normalizeOriginHost('https://precisionlawnsystems.com:8443')).toBeNull()
  })

  it('a path, query or fragment -- an Origin carries none', () => {
    expect(normalizeOriginHost('https://precisionlawnsystems.com/quote')).toBeNull()
    expect(normalizeOriginHost('https://precisionlawnsystems.com/?a=1')).toBeNull()
    expect(normalizeOriginHost('https://precisionlawnsystems.com/#x')).toBeNull()
  })

  it('strips a trailing dot rather than rejecting, so the FQDN form still matches', () => {
    expect(normalizeOriginHost('https://pestflowpro.ai.')).toBe('pestflowpro.ai')
  })

  // DECODE-THEN-CHECK IS THE SAFE ORDER, and this asserts it rather than assuming it.
  // WHATWG URL percent-decodes the hostname while parsing, so `%2e` is already a literal dot
  // by the time normalizeOriginHost sees it -- the `includes('%')` guard cannot fire on these
  // and is a backstop for sequences that survive parsing, not the primary control.
  //
  // That is CORRECT, not a bypass: the decoded value IS the host the browser used, and it is
  // that value the allowlist then tests. Rejecting every `%` instead would refuse legitimate
  // encodings while changing nothing about safety. Do not "harden" this into a null return.
  it('percent-decodes the host, then checks the decoded value', () => {
    expect(normalizeOriginHost('https://pestflowpro%2eai')).toBe('pestflowpro.ai')
    expect(normalizeOriginHost('https://ev%69l.example')).toBe('evil.example')
    // ...and a decoded host that is not ours is still refused downstream.
    expect(isPlatformHost('evil.example')).toBe(false)
    // A decoded trailing dot is stripped, so the FQDN form matches its allowlist entry.
    expect(normalizeOriginHost('https://pestflowpro.ai%2e')).toBe('pestflowpro.ai')
    expect(isPlatformHost(normalizeOriginHost('https://pestflowpro.ai%2e')!)).toBe(true)
    // A host that decodes to nonsense parses ('..'), has its trailing dot stripped to '.',
    // and is then refused by the allowlist. Asserting the post-strip value on purpose: the
    // allowlist only ever sees normalizeOriginHost's OUTPUT, so that is what must be safe.
    expect(normalizeOriginHost('https://%2e%2e')).toBe('.')
    expect(isPlatformHost('.')).toBe(false)
  })

  it('returns null when the encoded host will not parse at all', () => {
    expect(normalizeOriginHost('https://a%00b.example')).toBeNull()
  })

  it('malformed and empty values', () => {
    for (const bad of ['', 'null', 'not a url', '//pestflowpro.ai', 'javascript:alert(1)', 'https://']) {
      expect(normalizeOriginHost(bad), `expected null for ${JSON.stringify(bad)}`).toBeNull()
    }
  })

  it('never throws -- a raising predicate would 500 the endpoint, not deny it', () => {
    for (const bad of ['', '%', 'https://%', ' ', 'https://[', 'https://a b']) {
      expect(() => normalizeOriginHost(bad)).not.toThrow()
    }
  })
})

describe('normalizeRefererHost', () => {
  it('accepts a path, which an Origin may not -- the two grammars differ', () => {
    expect(normalizeRefererHost('https://precisionlawnsystems.com/quote?src=ad')).toBe('precisionlawnsystems.com')
    expect(normalizeOriginHost('https://precisionlawnsystems.com/quote?src=ad')).toBeNull()
  })

  it('still refuses userinfo, http and ports', () => {
    expect(normalizeRefererHost('https://pestflowpro.ai@evil.example/x')).toBeNull()
    expect(normalizeRefererHost('http://precisionlawnsystems.com/x')).toBeNull()
    expect(normalizeRefererHost('https://precisionlawnsystems.com:8443/x')).toBeNull()
  })
})

describe('isPlatformHost', () => {
  it('accepts each platform apex', () => {
    for (const h of PLATFORM_HOSTS) expect(isPlatformHost(h), h).toBe(true)
  })

  // THE DEPLOY HAZARD, MADE EXECUTABLE. Deployed v36 allowed pestflowpro\.(com|ai); the repo
  // file allowed .com only. Shipping the repo version would have 403'd every .ai tenant and
  // killed lead capture platform-wide with the function still reading ACTIVE. If .ai is ever
  // dropped again, this test fails.
  it('accepts .ai tenant subdomains -- dropping this kills lead capture platform-wide', () => {
    expect(isPlatformHost('pestflowpro.ai')).toBe(true)
    expect(isPlatformHost('pls.pestflowpro.ai')).toBe(true)
    expect(isPlatformHost('urban-strike.pestflowpro.ai')).toBe(true)
  })

  it('accepts .com during the migration window', () => {
    expect(isPlatformHost('pls.pestflowpro.com')).toBe(true)
  })

  it('admits ONE label only, matching the regex it replaces', () => {
    expect(isPlatformHost('a.b.pestflowpro.ai')).toBe(false)
    expect(isPlatformHost('.pestflowpro.ai')).toBe(false)
  })

  it('refuses suffix confusion', () => {
    expect(isPlatformHost('evilpestflowpro.ai')).toBe(false)
    expect(isPlatformHost('pestflowpro.ai.evil.example')).toBe(false)
    expect(isPlatformHost('notdangpestcontrol.com')).toBe(false)
  })

  it('refuses a custom domain -- it must go through the verified lookup, not the static list', () => {
    expect(isPlatformHost('precisionlawnsystems.com')).toBe(false)
  })
})
