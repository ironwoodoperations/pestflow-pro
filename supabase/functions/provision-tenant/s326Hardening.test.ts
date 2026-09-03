import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// S326 — THREE HARDENING GUARDS FOR provision-tenant.
//
// A SOURCE SCAN, AND SAYING SO IS THE POINT. index.ts imports from
// https://esm.sh, which Node's ESM loader rejects, so the handler cannot be
// executed under vitest — the same wall S313 and S321 hit. What can be asserted
// is STRUCTURE: that the destructive call sits inside the opt-in guard, that the
// prompt write names the new constraint, and that the unset-secret branch says
// something. Structure is exactly what a later well-meaning edit would break.
//
// NOT named index.test.ts. vitest.config.ts excludes
// `supabase/functions/*/index.test.ts`, so that name is SILENTLY SKIPPED —
// provision-tenant/index.ts already has one and it is collected by nothing.
//
// Every assertion runs against CODE, not the raw file: this file's own header and
// index.ts's own comments quote the patterns they forbid, and a raw scan flags
// the documentation as if it were live code. S313 hit that on its first run.

const SRC = readFileSync(join(__dirname, 'index.ts'), 'utf8')
const CODE = SRC
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '')
  .replace(/([^:])\/\/.*$/gm, '$1')

/** The lexical block opened by `if (<cond>) {`, brace-matched from the header. */
function blockAfter(code: string, header: string): string {
  const start = code.indexOf(header)
  if (start === -1) throw new Error(`header not found: ${header}`)
  let i = code.indexOf('{', start)
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

// ── ITEM 1 — the password reset ─────────────────────────────────────────────
describe('S326 item 1 — the password reset is opt-in', () => {
  const GUARD = 'if (body.reset_admin_password === true)'

  it('the request body declares the flag', () => {
    expect(CODE).toMatch(/reset_admin_password\?:\s*boolean/)
  })

  it('the guard tests for LITERAL true, not truthiness', () => {
    // `if (body.reset_admin_password)` would let any truthy junk through — a
    // string "false" from a form field being the obvious one.
    expect(CODE).toContain(GUARD)
    expect(CODE).not.toMatch(/if\s*\(\s*body\.reset_admin_password\s*\)/)
    expect(CODE).not.toMatch(/reset_admin_password\s*!==\s*false/)
  })

  it('THE ASSERTION WITH TEETH: updateUserById sits INSIDE that guard', () => {
    // Presence of the guard proves nothing on its own — it could sit anywhere.
    // This brace-matches the block and requires the destructive call to be in it.
    const guarded = blockAfter(CODE, GUARD)
    expect(guarded).toContain('auth.admin.updateUserById')
    // …and it is the ONLY updateUserById in the file, so there is no second,
    // ungated path to the same operation.
    expect(CODE.match(/auth\.admin\.updateUserById/g) ?? []).toHaveLength(1)
  })

  it('the NEW-tenant path is untouched — createUser is NOT inside the guard', () => {
    // Verification requirement 2. createUser sets the initial password at
    // creation; that is not a reset and must not start depending on the flag.
    const guarded = blockAfter(CODE, GUARD)
    expect(guarded).not.toContain('auth.admin.createUser')
    expect(CODE).toMatch(/auth\.admin\.createUser\(\{/)
    expect(CODE).toContain('email_confirm: true')
  })

  it('both branches are observable, and the skip is not silent', () => {
    expect(CODE).toMatch(/password_reset: requested/)
    expect(CODE).toMatch(/password_reset: skipped/)
  })

  it('the response reports whether credentials were touched', () => {
    expect(CODE).toContain('admin_password_reset: adminPasswordReset')
    expect(CODE).toMatch(/let adminPasswordReset = false/)
  })

  it('no log line carries the password itself', () => {
    // The value is in scope right there as resolvedAdminPassword.
    const logs = CODE.match(/console\.(log|warn|error)\([^)]*\)/g) ?? []
    for (const line of logs) {
      expect(line, `password in a log line: ${line}`).not.toContain('resolvedAdminPassword')
    }
    expect(logs.length, 'no log lines found — scan is broken').toBeGreaterThan(5)
  })
})

// ── ITEM 2 — the prompt upsert ──────────────────────────────────────────────
describe('S326 item 2 — ai_authority_prompts cannot duplicate', () => {
  // SCOPED TO THE PROMPT WRITE, not the whole file. The first version of this
  // block asserted CODE.toContain('ignoreDuplicates: true') globally, and passed
  // while the prompt upsert had lost that flag — because the service_areas
  // draft-cities upsert elsewhere in the file also sets it. A mutation dropping
  // ignoreDuplicates from the prompt write was invisible. That is the S319
  // failure mode, found by mutation-testing this very guard.
  const PROMPT_WRITE = (() => {
    const i = CODE.indexOf("from('ai_authority_prompts')")
    if (i === -1) throw new Error("ai_authority_prompts write not found")
    return CODE.slice(i, i + 400)
  })()

  it('writes with upsert naming the new unique key, not a plain insert', () => {
    expect(PROMPT_WRITE).toMatch(/^from\('ai_authority_prompts'\)\s*\n?\s*\.upsert\(/)
    expect(PROMPT_WRITE).toContain("onConflict: 'tenant_id,prompt_text'")
  })

  it('does NOT re-enable a prompt the operator disabled', () => {
    // ignoreDuplicates, not a merge: an existing row keeps its `active` value.
    // Without this a re-provision would flip every disabled prompt back on.
    expect(PROMPT_WRITE).toContain('ignoreDuplicates: true')
  })

  it('no plain .insert( remains on that table', () => {
    expect(PROMPT_WRITE).not.toMatch(/\.insert\(/)
  })

  it('the scope really is narrow — it excludes the service_areas upsert', () => {
    // Anti-vacuity for the scoping itself: if PROMPT_WRITE ever widened to
    // swallow the neighbouring writes, the assertions above go back to being
    // satisfiable by the wrong code.
    expect(PROMPT_WRITE).not.toContain("onConflict: 'tenant_id,slug'")
    expect(CODE, 'the file really does contain another ignoreDuplicates').toMatch(
      /onConflict: 'tenant_id,slug', ignoreDuplicates: true/,
    )
  })

  it('the migration and its rollback both exist, and both are untimestamped', () => {
    const dir = join(__dirname, '..', '..', 'migrations')
    for (const f of ['s326_ai_authority_prompts_unique.sql', 's326_ai_authority_prompts_unique_rollback.sql']) {
      const body = readFileSync(join(dir, f), 'utf8')
      expect(body.length, `${f} is empty`).toBeGreaterThan(200)
      // A <timestamp>_*.sql name is one the CLI APPLIES. These were applied via
      // apply_migration, which stamps schema_migrations without writing a file,
      // so a timestamped name here would apply the same DDL a second time.
      expect(/^\d{14}_/.test(f), `${f} is timestamped — the CLI would re-apply it`).toBe(false)
    }
    const fwd = readFileSync(join(dir, 's326_ai_authority_prompts_unique.sql'), 'utf8')
    expect(fwd).toMatch(/add constraint ai_authority_prompts_tenant_prompt_key unique \(tenant_id, prompt_text\)/)
    const back = readFileSync(join(dir, 's326_ai_authority_prompts_unique_rollback.sql'), 'utf8')
    expect(back).toMatch(/drop constraint if exists ai_authority_prompts_tenant_prompt_key/)
  })
})

// ── ITEM 3 — the silent Zernio skip ─────────────────────────────────────────
describe('S326 item 3 — an unset ZERNIO_API_KEY is observable', () => {
  const SKIP = blockAfter(CODE, 'if (!ZERNIO_API_KEY)')

  it('the unset branch exists and logs a structured, allowlisted reason', () => {
    expect(SKIP).toMatch(/zernio_profile: skipped/)
    expect(SKIP).toContain('reason=not_configured')
    expect(SKIP).toContain('step=create_profile')
  })

  it('NEVER logs the key, or any part of it', () => {
    // The whole point of the branch is that the key is absent — but a later edit
    // "helpfully" logging what it looked for is the S313 shape.
    expect(SKIP).not.toMatch(/\$\{ZERNIO_API_KEY\}/)
    expect(SKIP).not.toMatch(/console\.[a-z]+\([^)]*ZERNIO_API_KEY/)
  })

  it('records an operator-visible marker, and only an allowlisted literal', () => {
    expect(SKIP).toContain("zernio_last_error: 'not_configured'")
    // No upstream body, no error object, no template interpolation in the value.
    expect(SKIP).not.toMatch(/zernio_last_error:\s*`/)
    expect(SKIP).not.toMatch(/zernio_last_error:\s*JSON\.stringify/)
  })

  it('the NEW marker write runs through stripVaultSecrets', () => {
    // Not a fix for the pre-existing zernio_profile_id write, which is recorded
    // and out of scope — this is about not ADDING a second integrations writer
    // that could round-trip a Vault secret into anon-adjacent JSONB.
    expect(SKIP).toContain('stripVaultSecrets(')
    expect(CODE).toContain("from '../_shared/secrets/stripVaultSecrets.ts'")
  })

  it('a successful create CLEARS the marker, so it cannot go stale', () => {
    expect(CODE).toContain('zernio_last_error: null')
  })

  it('no raw upstream body reaches a log line', () => {
    // provision-tenant already logs `Zernio raw response` — pre-existing and
    // out of scope for this item, but it must not spread into the new branch.
    expect(SKIP).not.toContain('JSON.stringify(zernioData)')
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
