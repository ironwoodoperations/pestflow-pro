import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

// S343 — six cleanups, all found by live verification.
//
// WHAT THIS FILE CAN AND CANNOT PROVE, stated plainly rather than implied:
//
//   items 1, 2, 3, 6  provable here. Items 1 and 3 are SOURCE SCANS — the edge
//                     function imports from esm.sh and vitest cannot load it —
//                     so they pin structure, and the live proof is the call
//                     after Scott deploys.
//   items 4, 5        MIGRATION FILES. Their real proof is applying them and
//                     actually deleting a tenant, which is Claude.ai's step.
//                     What is asserted here is that the files exist, are
//                     untimestamped, and say what they must.

const ROOT = join(__dirname, '..', '..', '..', '..')
const EDGE = readFileSync(join(ROOT, 'supabase', 'functions', 'ironwood-provision', 'index.ts'), 'utf8')

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

/** Comments out, code in: this file and that one both quote what they forbid. */
const codeOnly = (body: string) => body
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '')
  .replace(/([^:])\/\/.*$/gm, '$1')
const CODE = codeOnly(EDGE)

// ── ITEM 1 — the operator gate ──────────────────────────────────────────────
describe('S343.1 — the operator gate reads public.operators, not an email', () => {
  it('no hardcoded operator email survives in code', () => {
    expect(CODE, 'a hardcoded operator email is back').not.toContain('admin@pestflowpro.com')
    expect(CODE).not.toMatch(/user\.email\s*!==\s*'/)
    // Anti-vacuity: the stripper must still SEE such a line if reintroduced.
    expect(codeOnly("if (user.email !== 'admin@pestflowpro.com') {\n"))
      .toMatch(/user\.email\s*!==\s*'/)
  })

  it('operator status is looked up in the operators table by verified user id', () => {
    expect(CODE).toContain("from('operators')")
    // user.id comes from getUser(token) — the verified JWT subject, never a
    // value the caller supplies in the body.
    expect(CODE).toMatch(/\.eq\('user_id',\s*user\.id\)/)
  })

  it('does NOT call is_operator() — auth.uid() is NULL under a service-role client', () => {
    // is_operator() is `SELECT EXISTS (... WHERE o.user_id = auth.uid())`.
    // Called from this client it would deny everyone, which is the failure that
    // looks like working code.
    expect(CODE).not.toContain("rpc('is_operator'")
  })

  it('FAILS CLOSED — the lookup-error branch itself RETURNS 403', () => {
    // THIS ASSERTION WAS VACUOUS ON ITS FIRST WRITING, and mutation-testing
    // caught it: it sliced from `operatorErr` to a later landmark and matched
    // /403/ anywhere in that span — which the NEIGHBOURING `!operatorRow` branch
    // satisfies. Deleting the error branch's own `return` left it green. That is
    // the S319 scope-too-wide defect, in the one assertion where failing open
    // matters most. Brace-match the branch instead.
    const guarded = blockAfter(CODE, 'if (operatorErr)')
    expect(guarded, 'the operator-lookup error branch does not return').toMatch(/return\s+json\(/)
    expect(guarded, 'the operator-lookup error branch does not 403').toMatch(/403/)

    // A missing row is a denial too, and that branch must return on its own.
    const missing = blockAfter(CODE, 'if (!operatorRow)')
    expect(missing).toMatch(/return\s+json\(/)
    expect(missing).toMatch(/403/)

    // Anti-vacuity for the extractor: it must NOT swallow what follows.
    expect(guarded).not.toContain('provisioning_status')
    expect(guarded.length).toBeLessThan(400)
  })
})

// ── ITEM 2 — the verify_jwt pin ─────────────────────────────────────────────
describe('S343.2 — ironwood-provision is pinned verify_jwt = false', () => {
  const CONFIG = readFileSync(join(ROOT, 'supabase', 'config.toml'), 'utf8')

  it('the pin exists and is false', () => {
    const at = CONFIG.indexOf('[functions.ironwood-provision]')
    expect(at, 'no pin for ironwood-provision').toBeGreaterThan(-1)
    expect(CONFIG.slice(at, at + 200)).toMatch(/verify_jwt\s*=\s*false/)
  })

  it('the pin is what stops a plain deploy flipping it on', () => {
    // Without a block, a deploy with no --no-verify-jwt sets it TRUE. That
    // happened at v62 and was corrected at v63. Anti-vacuity: a pin for a
    // function that does not exist would satisfy a naive scan.
    expect(existsSync(join(ROOT, 'supabase', 'functions', 'ironwood-provision', 'index.ts'))).toBe(true)
  })
})

// ── ITEM 3 — absent vs empty ────────────────────────────────────────────────
describe('S343.3 — an empty services array must not collapse into absent', () => {
  it('the length check is gone', () => {
    // `services.length > 0` turned [] into absent, and those mean opposite
    // things: absent falls back to the WHOLE catalog, [] must 400.
    expect(CODE, 'the length check is back — [] would silently seed the whole catalog')
      .not.toMatch(/services\.length\s*>\s*0/)
  })

  it('an array — of any length — is forwarded', () => {
    expect(CODE).toContain('...(Array.isArray(services) ? { services } : {})')
  })

  it('a MISSING key still stays missing', () => {
    // The Array.isArray guard is load-bearing in the other direction: undefined
    // must not become an empty array, or every legacy caller starts 400ing.
    expect(CODE).toContain('Array.isArray(services)')
  })

  it('BEHAVIOURAL: the three cases produce three different payloads', () => {
    // The forwarding is one spread expression; this executes its exact shape so
    // the contract is tested, not just matched.
    const fwd = (services: unknown) => ({
      business_info: {},
      ...(Array.isArray(services) ? { services } : {}),
    })
    expect(fwd(undefined)).not.toHaveProperty('services')       // absent -> catalog
    expect(fwd([])).toHaveProperty('services')                  // [] -> a statement
    expect(fwd([]).services).toEqual([])
    expect(fwd(['weed-control']).services).toEqual(['weed-control'])
    // JSON round-trip: absent really does disappear, empty really does survive.
    expect(JSON.parse(JSON.stringify(fwd(undefined))).services).toBeUndefined()
    expect(JSON.parse(JSON.stringify(fwd([]))).services).toEqual([])
  })
})

// ── ITEMS 4 & 5 — migration FILES, not applied state ────────────────────────
describe('S343.4/5 — the migration files exist and are not applied by this PR', () => {
  const MIG = join(ROOT, 'supabase', 'migrations')
  const files = [
    's343_tenant_users_block_last_admin_cascade_aware.sql',
    's343_tenant_users_block_last_admin_cascade_aware_rollback.sql',
    's343_profiles_tenant_fk.sql',
    's343_profiles_tenant_fk_rollback.sql',
  ]

  it('all four exist and are UNTIMESTAMPED', () => {
    for (const f of files) {
      expect(existsSync(join(MIG, f)), `${f} missing`).toBe(true)
      expect(/^\d{14}_/.test(f), `${f} is timestamped — the CLI would re-apply it`).toBe(false)
      expect(readFileSync(join(MIG, f), 'utf8').length, `${f} is a stub`).toBeGreaterThan(300)
    }
  })

  it('ITEM 4 relaxes ONLY when the parent tenant is gone', () => {
    const sql = readFileSync(join(MIG, files[0]), 'utf8')
    expect(sql).toMatch(/not exists \(select 1 from public\.tenants t where t\.id = OLD\.tenant_id\)/)
    // The protection itself must survive: while the tenant exists, removing its
    // last admin still raises.
    expect(sql).toContain('Cannot demote or remove the last admin of tenant')
    expect(sql).toMatch(/errcode = 'check_violation'/)
  })

  it('ITEM 4 does not reach for a blunter instrument', () => {
    const sql = readFileSync(join(MIG, files[0]), 'utf8')
    // Disabling the trigger takes an ACCESS EXCLUSIVE lock and stays off if the
    // function errors midway; session_replication_role needs privileges we do
    // not have. Neither belongs in the sanctioned path.
    expect(sql).not.toMatch(/disable trigger/i)
    expect(sql).not.toMatch(/session_replication_role/i)
  })

  it('ITEM 5 is a CASCADE FK and carries no orphan DELETE', () => {
    const sql = readFileSync(join(MIG, files[2]), 'utf8')
    expect(sql).toMatch(/foreign key \(tenant_id\) references public\.tenants\(id\) on delete cascade/)
    // s338's rule: a blind orphan delete inside a migration is a data-loss
    // instrument aimed at whatever the next database holds.
    expect(codeOnlySql(sql)).not.toMatch(/delete\s+from/i)
  })

  it('both rollbacks actually reverse their forward file', () => {
    expect(readFileSync(join(MIG, files[3]), 'utf8')).toMatch(/drop constraint if exists profiles_tenant_id_fkey/)
    const back = readFileSync(join(MIG, files[1]), 'utf8')
    expect(back).toContain('create or replace function public.tenant_users_block_last_admin')
    // The rollback restores the PRE-S343 body, so it must NOT carry the guard.
    expect(back).not.toMatch(/not exists \(select 1 from public\.tenants/)
  })
})

/** SQL comment stripper — these files explain the DELETE they refuse to contain. */
function codeOnlySql(sql: string): string {
  return sql.replace(/^\s*--.*$/gm, '')
}

// ── ITEM 6 — supabase/.temp is untracked ────────────────────────────────────
describe('S343.6 — the churning CLI state file is no longer tracked', () => {
  const tracked = execFileSync('git', ['ls-files', 'supabase/.temp/'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter(Boolean)

  it('cli-latest is untracked — gitignore does not apply to tracked files', () => {
    // The CLI rewrites it on every version check, which dirtied the tree and
    // aborted a git pull twice, both times mid-deploy.
    expect(tracked, 'cli-latest is tracked again').not.toContain('supabase/.temp/cli-latest')
  })

  it('the ignore rule is present exactly once', () => {
    const lines = readFileSync(join(ROOT, '.gitignore'), 'utf8').split('\n')
    const hits = lines.filter((l) => l.trim() === 'supabase/.temp/')
    expect(hits, 'the ignore rule was duplicated').toHaveLength(1)
  })
})
