import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// S326 — THREE HARDENING GUARDS, REPOINTED IN S340.
//
// S340 rewrote provision-tenant onto provision_tenant_atomic. All three S326
// protections still hold, but TWO OF THEM MOVED HOUSE, so this file follows
// them rather than being deleted — a deleted guard is a lapsed protection:
//
//   item 1  password reset opt-in    STILL provision-tenant, new shape
//                                    (an early-return guard in resolveAuthUser
//                                    rather than an `if` wrapping the call).
//   item 2  prompt de-duplication    MOVED TO THE RPC. provision-tenant no
//                                    longer writes ai_authority_prompts at all;
//                                    provision_tenant_atomic does, with
//                                    ON CONFLICT DO NOTHING. The unique
//                                    constraint S326 added is what makes that
//                                    conflict target exist, so it is still
//                                    load-bearing and still pinned.
//   item 3  unset ZERNIO_API_KEY     MOVED TO THE WORKER. The inline Zernio call
//                                    is deleted; process-outbound-queue owns it.
//
// ONE BEHAVIOUR GENUINELY CHANGED, and it is asserted in its new form rather
// than papered over: the operator-visible marker for a missing key was
// settings.integrations.zernio_last_error = 'not_configured', written inline.
// The worker instead completes the job `terminal` with that reason recorded on
// the queue row. Durable, queryable and per-attempt — but it is NOT the same
// write, so the old assertion is replaced, not retargeted.
//
// A SOURCE SCAN, AND SAYING SO IS THE POINT. Both index.ts files import from
// https://esm.sh, which Node's ESM loader rejects, so neither handler can be
// executed under vitest. What can be asserted is STRUCTURE — exactly what a
// later well-meaning edit would break.
//
// NOT named index.test.ts. vitest.config.ts excludes
// `supabase/functions/*/index.test.ts`, so that name is SILENTLY SKIPPED —
// provision-tenant/index.ts already has one and it is collected by nothing.
//
// Every assertion runs against CODE, not the raw file: this file's own header
// and the sources' own comments quote the patterns they forbid, and a raw scan
// flags documentation as if it were live code. S313 hit that on its first run.

const strip = (src: string) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '')
  .replace(/([^:])\/\/.*$/gm, '$1')

const SRC = readFileSync(join(__dirname, 'index.ts'), 'utf8')
const CODE = strip(SRC)

const WORKER_SRC = readFileSync(
  join(__dirname, '..', 'process-outbound-queue', 'index.ts'), 'utf8')
const WORKER = strip(WORKER_SRC)

const MIGRATIONS = join(__dirname, '..', '..', 'migrations')
const RPC_SQL = readFileSync(join(MIGRATIONS, 's338_provision_tenant_atomic.sql'), 'utf8')

/** The lexical block opened by `<header> {`, brace-matched from the header. */
function blockAfter(code: string, header: string): string {
  const start = code.indexOf(header)
  if (start === -1) throw new Error(`header not found: ${header}`)
  const i = code.indexOf('{', start)
  if (i === -1) throw new Error(`no block opens after: ${header}`)
  let depth = 0
  for (let j = i; j < code.length; j++) {
    if (code[j] === '{') depth++
    else if (code[j] === '}') {
      depth--
      if (depth === 0) return code.slice(i, j + 1)
    }
  }
  throw new Error(`unbalanced block after: ${header}`)
}

// ── ITEM 1 — the password reset, still here ─────────────────────────────────
describe('S326 item 1 — the password reset is opt-in', () => {
  // NOT blockAfter(): the first `{` after the signature opens the `opts:` object
  // TYPE in the parameter list, not the body. Slice between declarations instead.
  const RESOLVER = (() => {
    const a = CODE.indexOf('async function resolveAuthUser(')
    const b = CODE.indexOf('async function collisionGuard(')
    if (a === -1 || b === -1 || b <= a) throw new Error('resolveAuthUser not found')
    return CODE.slice(a, b)
  })()

  it('the request body declares the flag', () => {
    expect(CODE).toMatch(/reset_admin_password\?:\s*boolean/)
  })

  it('the flag is read as LITERAL true, not truthiness', () => {
    // `body.reset_admin_password` alone would let any truthy junk through — a
    // string "false" from a form field being the obvious one. S325's falsy bug.
    expect(CODE).toContain('body.reset_admin_password === true')
    expect(CODE).not.toMatch(/if\s*\(\s*body\.reset_admin_password\s*\)/)
    expect(CODE).not.toMatch(/reset_admin_password\s*!==\s*false/)
  })

  it('THE ASSERTION WITH TEETH: the skip guard RETURNS before updateUserById', () => {
    // The shape changed from `if (flag) { destructive }` to an early return, so
    // "inside the block" no longer expresses it. What must hold is the ordering:
    // the not-requested branch has to exit before the destructive call is
    // reachable. Deleting the guard, or moving updateUserById above it, fails.
    const guardAt = RESOLVER.indexOf('if (!opts.resetPassword)')
    const callAt = RESOLVER.indexOf('auth.admin.updateUserById')
    expect(guardAt, 'skip guard missing from resolveAuthUser').toBeGreaterThan(-1)
    expect(callAt, 'updateUserById missing from resolveAuthUser').toBeGreaterThan(-1)
    expect(guardAt).toBeLessThan(callAt)
    expect(blockAfter(RESOLVER, 'if (!opts.resetPassword)')).toContain('return')

    // …and it is the ONLY updateUserById anywhere in the file, so there is no
    // second, ungated path to the same operation.
    expect(CODE.match(/auth\.admin\.updateUserById/g) ?? []).toHaveLength(1)
  })

  it('the NEW-tenant path is untouched — createUser does not consult the flag', () => {
    // createUser sets the initial password at creation; that is not a reset and
    // must not start depending on the flag.
    const createAt = RESOLVER.indexOf('auth.admin.createUser')
    const guardAt = RESOLVER.indexOf('if (!opts.resetPassword)')
    expect(createAt).toBeGreaterThan(-1)
    expect(createAt).toBeLessThan(guardAt)
    expect(CODE).toContain('email_confirm: true')
  })

  it('both branches are observable, and the skip is not silent', () => {
    expect(CODE).toMatch(/password_reset: requested/)
    expect(CODE).toMatch(/password_reset: skipped/)
  })

  it('the response reports whether credentials were touched', () => {
    expect(CODE).toContain('admin_password_reset: passwordReset')
  })

  it('no log line carries the password itself', () => {
    const logs = CODE.match(/console\.(log|warn|error)\([^)]*\)/g) ?? []
    for (const line of logs) {
      expect(line, `password in a log line: ${line}`).not.toContain('resolvedAdminPassword')
      expect(line, `password in a log line: ${line}`).not.toContain('opts.password')
    }
    expect(logs.length, 'no log lines found — scan is broken').toBeGreaterThan(5)
  })
})

// ── ITEM 2 — the prompt write, now the RPC's ────────────────────────────────
describe('S326 item 2 — ai_authority_prompts cannot duplicate', () => {
  it('provision-tenant no longer writes the table at all', () => {
    // The whole point of S340: one RPC owns every seed write. A direct write
    // reappearing here would be outside the transaction AND outside the
    // conflict handling below.
    expect(CODE).not.toContain("from('ai_authority_prompts')")
  })

  it('the RPC inserts if-missing and cannot duplicate', () => {
    const stmt = RPC_SQL.slice(RPC_SQL.indexOf('INSERT INTO public.ai_authority_prompts'))
    expect(stmt.slice(0, 500)).toMatch(/ON CONFLICT \(tenant_id, prompt_text\) DO NOTHING/)
  })

  it('does NOT re-enable a prompt the operator disabled', () => {
    // DO NOTHING, not DO UPDATE: an existing row keeps its `active` value.
    // Without this a re-provision would flip every disabled prompt back on.
    const stmt = RPC_SQL.slice(RPC_SQL.indexOf('INSERT INTO public.ai_authority_prompts'), )
    expect(stmt.slice(0, 500)).not.toMatch(/DO UPDATE/)
  })

  it('the unique constraint the conflict target needs still exists', () => {
    // ON CONFLICT (tenant_id, prompt_text) is only legal because S326 added
    // this constraint. Drop it and the RPC starts erroring at runtime.
    const dir = MIGRATIONS
    for (const f of ['s326_ai_authority_prompts_unique.sql', 's326_ai_authority_prompts_unique_rollback.sql']) {
      const body = readFileSync(join(dir, f), 'utf8')
      expect(body.length, `${f} is empty`).toBeGreaterThan(200)
      // A <timestamp>_*.sql name is one the CLI APPLIES. These were applied via
      // apply_migration, which stamps schema_migrations without writing a file.
      expect(/^\d{14}_/.test(f), `${f} is timestamped — the CLI would re-apply it`).toBe(false)
    }
    const fwd = readFileSync(join(dir, 's326_ai_authority_prompts_unique.sql'), 'utf8')
    expect(fwd).toMatch(/add constraint ai_authority_prompts_tenant_prompt_key unique \(tenant_id, prompt_text\)/)
    const back = readFileSync(join(dir, 's326_ai_authority_prompts_unique_rollback.sql'), 'utf8')
    expect(back).toMatch(/drop constraint if exists ai_authority_prompts_tenant_prompt_key/)
  })
})

// ── ITEM 3 — the silent Zernio skip, now the worker's ───────────────────────
describe('S326 item 3 — an unset ZERNIO_API_KEY is observable', () => {
  it('provision-tenant no longer calls Zernio at all', () => {
    expect(CODE).not.toContain('ZERNIO_API_KEY')
    expect(CODE).not.toContain('zernio.com')
  })

  const SKIP = blockAfter(WORKER, 'if (!key)')

  it('the unset branch is TERMINAL, not a retry', () => {
    // Retrying a missing secret every 15 minutes forever is the failure mode
    // this branch exists to avoid. It is a permanent state until an operator
    // acts, and the queue row says so.
    expect(SKIP).toContain("outcome: 'terminal'")
    expect(SKIP).toContain("reason: 'not_configured'")
  })

  it('NEVER logs the key, or any part of it', () => {
    expect(SKIP).not.toMatch(/\$\{key\}/)
    expect(SKIP).not.toMatch(/console\.[a-z]+\([^)]*\bkey\b/)
  })

  it('the reason reaches the queue row, so it is operator-visible', () => {
    // This REPLACES the old settings.integrations.zernio_last_error marker: the
    // worker records the reason on the job via outbound_queue_complete's p_error.
    expect(WORKER).toContain('p_error: handled.reason ?? null')
  })

  it('a successful create still CLEARS the stale error marker', () => {
    expect(readFileSync(join(__dirname, '..', 'process-outbound-queue', 'dispatch.ts'), 'utf8'))
      .toContain('zernio_last_error: null')
  })

  it('no raw upstream body reaches a log line (S313)', () => {
    expect(WORKER).not.toMatch(/console\.[a-z]+\([^)]*\bbody\b/)
  })
})

// ── The deploy contract ─────────────────────────────────────────────────────
describe('S326 — the deploy contract is unchanged', () => {
  it('verify_jwt stays FALSE, and the file still says so', () => {
    // It defaults to TRUE in the tooling. provision-tenant is called by
    // ironwood-provision with a shared secret header, not a user JWT.
    expect(SRC).toMatch(/--no-verify-jwt/)
  })

  it('the in-source shared-secret gate is untouched', () => {
    expect(CODE).toContain("req.headers.get('x-pfp-internal-key')")
    expect(CODE).toContain('timingSafeEqual')
  })
})
