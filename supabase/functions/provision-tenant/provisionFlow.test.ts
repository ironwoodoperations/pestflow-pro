import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// S340 — THE I/O SHELL'S STRUCTURE.
//
// A SOURCE SCAN, and saying so is the point. index.ts imports from
// https://esm.sh, which Node's ESM loader rejects, so the handler cannot be
// executed under vitest. The decisions are tested for real in
// buildPayload.test.ts; what is asserted here is the ORDER and the ABSENCE of
// things — exactly what a later well-meaning edit would put back.
//
// NOT named index.test.ts: vitest.config.ts excludes
// `supabase/functions/*/index.test.ts`, so that name is SILENTLY SKIPPED.
//
// WHAT THIS CANNOT PROVE, stated plainly rather than implied: that a failed RPC
// leaves no rows across all eleven tables. That is a database property. What is
// provable here is its PRECONDITION — that provisioning performs no write of its
// own outside the one transactional call — and that is what these assertions
// pin. The live proof is a committed create against a throwaway tenant after
// deploy, which is Scott's and Claude.ai's step.

const SRC = readFileSync(join(__dirname, 'index.ts'), 'utf8')
const CODE = SRC
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '')
  .replace(/([^:])\/\/.*$/gm, '$1')

describe('ONE transaction: no write happens outside the RPC', () => {
  it('calls provision_tenant_atomic exactly once', () => {
    expect(CODE.match(/rpc\('provision_tenant_atomic'/g) ?? []).toHaveLength(1)
  })

  it('performs NO PostgREST write of its own — the precondition for atomicity', () => {
    // THE ASSERTION WITH TEETH. Every seed write belongs to the RPC. A stray
    // .insert/.upsert/.update/.delete here is a row that survives a rolled-back
    // provision — which is precisely the defect this rewrite removes.
    for (const op of ['.insert(', '.upsert(', '.delete(']) {
      expect(CODE, `index.ts performs a direct ${op} write`).not.toContain(op)
    }
    // .update( would also match auth.admin.updateUserById; scope to PostgREST.
    expect(CODE, 'index.ts performs a direct table update').not.toMatch(/from\('[a-z_]+'\)\s*\n?\s*\.update\(/)
  })

  it('every table it touches before the RPC is a READ', () => {
    const beforeRpc = CODE.slice(0, CODE.indexOf("rpc('provision_tenant_atomic'"))
    const froms = beforeRpc.match(/\.from\('[a-z_]+'\)[\s\S]{0,40}/g) ?? []
    expect(froms.length, 'no table access found — scan is broken').toBeGreaterThan(2)
    for (const f of froms) {
      expect(f, `non-read table access before the RPC: ${f}`).toMatch(/\.select\(/)
    }
  })

  it('the auth user is created BEFORE the RPC, and that is documented', () => {
    // Forced by the FK chain: profiles.id IS the auth user id, so the row cannot
    // exist until the user does. This ordering is the reason the orphan contract
    // exists at all.
    const userAt = CODE.indexOf('resolveAuthUser(')
    const rpcAt = CODE.indexOf("rpc('provision_tenant_atomic'")
    expect(userAt).toBeGreaterThan(-1)
    expect(userAt).toBeLessThan(rpcAt)
  })

  it('the payload is BUILT AND VALIDATED before the auth user exists', () => {
    // Order is the gate's, not a preference: a payload that will be rejected
    // must be rejected before createUser mints an orphan.
    const buildAt = CODE.indexOf('buildProvisionPayload(')
    const userAt = CODE.indexOf('resolveAuthUser(')
    expect(buildAt).toBeGreaterThan(-1)
    expect(buildAt).toBeLessThan(userAt)
    expect(CODE.indexOf('if (!built.ok)')).toBeLessThan(userAt)
  })
})

describe('the orphan contract', () => {
  it('an RPC failure returns non-2xx carrying the auth_user_id', () => {
    const block = CODE.slice(CODE.indexOf('if (rpcErr)'), CODE.indexOf('if (rpcErr)') + 900)
    expect(block).toContain('auth_user_id: userId')
    expect(block).toContain("'provision_rpc_failed'")
    // A stable, machine-readable code — not a message a caller has to regex.
    expect(block).toMatch(/retry_hint/)
  })

  it('a retry can reuse the user instead of calling createUser again', () => {
    expect(CODE).toContain('opts.suppliedUserId')
    const reuse = CODE.slice(CODE.indexOf('if (opts.suppliedUserId)'))
    // The supplied-id branch must return WITHOUT reaching createUser.
    const createAt = reuse.indexOf('auth.admin.createUser')
    const returnAt = reuse.indexOf('return { userId: opts.suppliedUserId')
    expect(returnAt).toBeGreaterThan(-1)
    expect(returnAt).toBeLessThan(createAt)
  })

  it('a supplied id is verified to exist AND to match the email', () => {
    expect(CODE).toContain('auth_user_id_not_found')
    expect(CODE).toContain('auth_user_email_mismatch')
  })
})

describe('every catch-and-continue is gone', () => {
  it('the only catch is the handler\'s own, and it returns non-2xx', () => {
    // The whole point is that a failure returns non-2xx. The old function had
    // eight `catch { log and continue }` blocks — one of which swallowed a RAISE
    // and silently skipped the seo projection, the prompts, the prospect stage
    // and four legal pages.
    const catches = CODE.match(/catch\s*(\([^)]*\))?\s*\{/g) ?? []
    expect(catches).toHaveLength(1)
    const tail = CODE.slice(CODE.lastIndexOf('} catch'))
    expect(tail).toContain('500')
  })

  it('no warnings-in-a-success-payload', () => {
    const success = CODE.slice(CODE.indexOf('success: true'))
    expect(success).not.toMatch(/warnings/)
  })

  it('the non-fatal vocabulary is gone from the source entirely', () => {
    expect(SRC).not.toMatch(/non-fatal/)
    expect(SRC).not.toMatch(/intake seeding failed/)
  })
})

describe('the response returns the RPC\'s counts, not a boolean', () => {
  it('counts and queued are surfaced verbatim', () => {
    const success = CODE.slice(CODE.indexOf('success: true'), CODE.indexOf('success: true') + 700)
    expect(success).toContain('counts: result.counts')
    expect(success).toContain('queued: result.queued')
    expect(success).toContain('created: result.created')
  })

  it('the RPC result is not reduced to a boolean anywhere', () => {
    expect(CODE).not.toMatch(/success:\s*!!/)
  })
})

describe('post-commit work belongs to the worker now', () => {
  it('no inline Zernio call and no Outscraper fire-and-forget survive', () => {
    expect(CODE).not.toContain('zernio.com')
    expect(CODE).not.toContain('outscraper-reviews')
    expect(CODE).not.toContain('functions/v1/')
  })

  it('the queue flags are set in the payload instead', () => {
    expect(CODE).toContain('queueZernio:')
    expect(CODE).toContain('queueOutscraper:')
  })
})
