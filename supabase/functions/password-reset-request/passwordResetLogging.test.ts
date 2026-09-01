import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// S313 — password-reset-request observability guard.
//
// This is a SOURCE SCAN, not a behavioural test. The handler imports from https://esm.sh,
// which Node's ESM loader rejects, so it cannot be executed under vitest — the same reason
// vitest.config.ts excludes `supabase/functions/*/index.test.ts`. This file is deliberately
// NOT named index.test.ts: that name is silently skipped, which the config header calls out
// as the dangerous direction.
//
// WHAT THIS COVERS: that the logging added by S313 cannot leak a bearer credential, that the
// reason codes exist, and that the response contract S313 promised not to touch is untouched.
// WHAT IT DOES NOT COVER: that the logs actually appear at runtime. Only a live invocation
// shows that, and it is step 4 of the deploy.

const SRC = readFileSync(join(__dirname, 'index.ts'), 'utf8')

// Structural assertions run against CODE, not SRC. The header COMMENTS quote the old
// `p.catch(() => {})` verbatim to explain what S313 removed, and a raw scan flags that
// documentation as if it were live code — which it did on the first run of this file.
// Prose about a removed pattern is not the pattern.
const CODE = SRC
  .replace(/\/\*[\s\S]*?\*\//g, '')   // block comments
  .replace(/^[ \t]*\/\/.*$/gm, '')     // whole-line comments
  .replace(/([^:])\/\/.*$/gm, '$1')     // trailing comments, sparing the // in https://

/** Every console.log/warn/error call in the executable source, as raw text. */
const logCalls = CODE.match(/console\.(log|warn|error)\([\s\S]*?\)\n/g) ?? []

describe('the hard constraint: no bearer credential or address reaches a log line', () => {
  it('finds console calls at all — otherwise every assertion below is vacuous', () => {
    // The S290 non-trivial-corpus lesson: a scan that finds nothing cannot detect its
    // own deletion. If someone strips the logging, this fails first and loudly.
    expect(logCalls.length).toBeGreaterThanOrEqual(8)
  })

  it.each([
    ['the email address', /\$\{\s*email\s*\}/],
    ['the hashed token', /\$\{\s*hashed\s*\}/],
    ['the recovery link', /\$\{\s*link\s*\}/],
    ['a token_hash query param', /token_hash=\$\{/],
    ['the whole request body', /\$\{\s*body\s*\}/],
    ['JSON.stringify of anything', /JSON\.stringify/],
  ])('never interpolates %s into a log line', (_label, pattern) => {
    const offenders = logCalls.filter((c) => pattern.test(c))
    expect(offenders).toEqual([])
  })

  it('logs an email only as a salted-free SHA-256 tag, never in full', () => {
    expect(SRC).toContain("crypto.subtle.digest('SHA-256'")
    // The tag is truncated — a full digest is still a stable identifier but needlessly long.
    expect(SRC).toMatch(/slice\(0,\s*4\)/)
    // And the caveat is recorded, because "hashed" invites false confidence: email
    // addresses are low-entropy, so a holder of logs plus a candidate list can confirm one.
    expect(SRC).toContain('NOT A PRIVACY GUARANTEE')
  })
})

describe('every silent branch now has a distinct, stable reason code', () => {
  it.each([
    'tenant_not_found',
    'no_slug',
    'generate_link_failed',
    'no_hashed_token',
    'send_failed',
  ])('emits reason=%s', (code) => {
    expect(SRC).toContain(`reason=${code}`)
  })

  it('prefixes every line so the function is greppable in function_logs', () => {
    const unprefixed = logCalls.filter((c) => !c.includes('LOG_PREFIX'))
    expect(unprefixed).toEqual([])
    expect(SRC).toContain("const LOG_PREFIX = '[password-reset-request]'")
  })

  it('logs invocation AND outcome, so an absence of logs is unambiguous', () => {
    // Without both, "no logs" cannot be told apart from "called and fine" — the exact
    // ambiguity S313 exists to remove.
    expect(SRC).toMatch(/rid=\$\{rid\} invoked/)
    expect(SRC).toMatch(/outcome=\$\{outcome\}/)
    // An outcome nobody assigned must not read as success.
    expect(SRC).toMatch(/let outcome = 'unset'/)
  })

  it('runDetached logs its rejection instead of discarding it', () => {
    expect(CODE).not.toMatch(/\.catch\(\(\)\s*=>\s*\{\s*\}\)/)
    expect(CODE).toMatch(/p\.catch\(\(e\)\s*=>/)
  })

  it('leaves no empty catch block anywhere in the file', () => {
    // `catch { return null }` in slugFromRequest is a RETURN, not an empty handler,
    // and is deliberately untouched — this looks only for handlers with no body.
    expect(CODE).not.toMatch(/catch\s*\(\s*_?e?\s*\)\s*\{\s*\}/)
  })
})

describe('the response contract S313 promised not to touch', () => {
  it('still answers 200 {"status":"ok"} — byte-identical', () => {
    expect(SRC).toContain("JSON.stringify({ status: 'ok' })")
    expect(SRC).toContain("status: 200, headers: { 'Content-Type': 'application/json', ...CORS },")
  })

  it('keeps the 700ms floor that defeats the timing oracle', () => {
    expect(SRC).toContain('const MIN_RESPONSE_MS           = 700')
    expect(SRC).toContain('if (elapsed < MIN_RESPONSE_MS) await sleep(MIN_RESPONSE_MS - elapsed)')
  })

  it('keeps slugFromRequest returning null on the apex, unchanged', () => {
    // S313 REPORTS that this makes "Forgot password?" dead on the apex; it does not fix it.
    expect(SRC).toContain('if (host === APP_BASE_DOMAIN) return null')
  })

  it('never sends an error body to the caller', () => {
    const responses = CODE.match(/new Response\([\s\S]*?\)/g) ?? []
    expect(responses.length).toBeGreaterThanOrEqual(2)
    for (const r of responses) {
      expect(r).not.toMatch(/error|message|detail|reason/i)
    }
  })
})
