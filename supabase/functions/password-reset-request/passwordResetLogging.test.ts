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

  it('emits NO hash or derivative of the address either — the tag was removed', () => {
    // Gate round 1, non-blocking, taken from both models. An earlier revision logged a
    // truncated SHA-256 of the address as a correlation key. Removing it deletes the
    // privacy caveat rather than documenting it. A regression that reintroduces hashing
    // fails here, and so does a keyed HMAC — a secret to manage for a need we do not have.
    expect(CODE).not.toMatch(/crypto\.subtle\.digest/)
    expect(CODE).not.toMatch(/emailTag/)
    expect(CODE).not.toMatch(/\bHmac\b|importKey/)
    expect(CODE).not.toMatch(/tag=\$\{/)
  })

  it('correlates with a random per-request id instead', () => {
    expect(CODE).toMatch(/crypto\.randomUUID\(\)/)
    expect(CODE).toMatch(/rid=\$\{rid\}/)
  })

  it('BLOCKING 1: generate_link_failed logs allowlisted fields ONLY', () => {
    // The brief originally asked for error.message. That instruction was the defect. An SDK
    // error object carries more than its displayed message, and a provider message is an
    // unbounded upstream string that could contain the address or a URL.
    const glLine = logCalls.find((c) => c.includes('generate_link_failed'))
    expect(glLine).toBeDefined()
    expect(glLine).toMatch(/status=/)
    expect(glLine).toMatch(/code=/)
    expect(glLine).not.toMatch(/\.message/)
    expect(glLine).not.toMatch(/\$\{\s*error\s*\}/)
    expect(glLine).not.toMatch(/detail=/)
  })

  it('never interpolates a raw error object into any log line', () => {
    // `detail=${msg}` on the throw/unhandled paths is a String()/Error.message of OUR OWN
    // catch, not a provider payload — those stay. What must never appear is the error
    // object itself, whose shape is upstream-controlled.
    for (const c of logCalls) {
      expect(c).not.toMatch(/\$\{\s*(error|err|e)\s*\}/)
    }
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

  it('BLOCKING 3: a non-POST scanner produces NO log line at all', () => {
    // Letting an unauthenticated scanner drive unbounded log writes is the amplification
    // concern the gate raised. OPTIONS already returns before any logging; GET/HEAD must too.
    expect(CODE).toMatch(/if \(req\.method !== 'POST'\) return ok\(\)/)
    expect(CODE).not.toMatch(/reason=bad_method/)
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

  it('keeps the 700ms floor — risk reduction, NOT proof of indistinguishability', () => {
    // Gate round 1, Perplexity's framing, adopted. Earlier wording in the source claimed a
    // fast path "can't be timed as an oracle"; that overclaimed. The floor bounds the fast
    // path from below; it does not demonstrate no residual distribution difference survives
    // at p95/p99 under concurrency. This asserts the corrected language stays corrected.
    expect(SRC).toContain('RISK REDUCTION, NOT PROOF OF TIMING INDISTINGUISHABILITY')
    // The overclaim may appear EXACTLY ONCE — inside the correction that quotes it. A
    // restoration would make it appear twice, or once without the retraction beside it.
    // (A blanket `not.toMatch` fails on the correction's own quotation, which is how the
    // first run of this file failed: prose about a removed claim is not the claim.)
    const overclaim = SRC.match(/can't be timed as an oracle/g) ?? []
    expect(overclaim).toHaveLength(1)
    expect(SRC).toMatch(/can't be timed as an oracle"; that overclaimed/)
    // The OTHER "timing oracle" mentions concern detached SEND latency and are still true:
    // the send is detached, so its latency is not in the response path at all.
    expect(SRC).toMatch(/email-send latency \(a timing oracle\)/)
  })

  it('computes the floor immediately before output (BLOCKING 2, unchanged from main)', () => {
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
