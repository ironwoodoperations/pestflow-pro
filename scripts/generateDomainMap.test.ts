import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildDomainMap } from './generate-domain-map.mjs'
import { canonicalizeHost, resolveCustomHost } from '../domain-normalize.mjs'

// ── S318 ───────────────────────────────────────────────────────────────────
//
// buildDomainMap() IS the emitted artifact: main() calls it and hands the result
// straight to JSON.stringify, so asserting on its return value asserts on the
// bytes written to domain-map.json. Nothing here needs credentials, which is
// why these guards run in CI where the real projection cannot.

/**
 * LIVE SHAPE, verified against the database 2026-09-02. dang is the dangerous
 * row and is reproduced exactly: render_model 'standalone', two domains, both
 * verified=false, and NO row for admin.dangpestcontrol.com — that hostname
 * exists only in tenants.custom_domain, which this projection never reads, and
 * it is NXDOMAIN besides.
 */
const LIVE_ROWS = [
  { custom_domain: 'dangpestcontrol.com', verified: false,
    tenants: { slug: 'dang', render_model: 'standalone' } },
  { custom_domain: 'www.dangpestcontrol.com', verified: false,
    tenants: { slug: 'dang', render_model: 'standalone' } },
]

describe('hostname canonicalization', () => {
  it('strips port, case, trailing dot and stray whitespace', () => {
    expect(canonicalizeHost('PrecisionLawnSystems.com')).toBe('precisionlawnsystems.com')
    expect(canonicalizeHost('precisionlawnsystems.com:443')).toBe('precisionlawnsystems.com')
    expect(canonicalizeHost('precisionlawnsystems.com.')).toBe('precisionlawnsystems.com')
    expect(canonicalizeHost('  precisionlawnsystems.com  ')).toBe('precisionlawnsystems.com')
  })

  it('does NOT strip www — apex and www are distinct keys', () => {
    // Both are projected precisely so resolution never depends on Vercel
    // dashboard redirect state, which is invisible from this repo.
    expect(canonicalizeHost('www.precisionlawnsystems.com')).toBe('www.precisionlawnsystems.com')
  })

  it('survives the degenerate inputs a hand-entered DB value can carry', () => {
    expect(canonicalizeHost('')).toBe('')
    expect(canonicalizeHost(null as unknown as string)).toBe('')
    expect(canonicalizeHost(undefined as unknown as string)).toBe('')
  })
})

describe('resolveCustomHost — a miss must be null, never a guess', () => {
  const map = { 'precisionlawnsystems.com': 'pls' }

  it('resolves a mapped host, port and case included', () => {
    expect(resolveCustomHost('precisionlawnsystems.com', map)).toBe('pls')
    expect(resolveCustomHost('PrecisionLawnSystems.com:443', map)).toBe('pls')
  })

  it('returns null for an unmapped host, an empty map, and a missing map', () => {
    expect(resolveCustomHost('example.com', map)).toBeNull()
    expect(resolveCustomHost('precisionlawnsystems.com', {})).toBeNull()
    expect(resolveCustomHost('precisionlawnsystems.com', undefined as never)).toBeNull()
    expect(resolveCustomHost('', map)).toBeNull()
  })

  it('refuses a non-string or empty slug rather than returning it', () => {
    expect(resolveCustomHost('a.com', { 'a.com': '' })).toBeNull()
    expect(resolveCustomHost('a.com', { 'a.com': 42 } as never)).toBeNull()
  })
})

describe('THE PRIMARY TEST: dang is never in the emitted map', () => {
  it('excludes dang on the live rows — both guards agree today', () => {
    const map = buildDomainMap(LIVE_ROWS)
    expect(map).toEqual({})
    expect(Object.values(map)).not.toContain('dang')
  })

  it('STILL excludes dang if someone flips verified=true', () => {
    // Guard 1 (verified) alone excludes dang today. This is the whole reason
    // guard 2 (render_model) exists: dang's public site is a SEPARATE Vercel
    // project, so mapping its domain here would resolve a slug that middleware
    // then 404s via STANDALONE_SLUGS — breaking a paying client's public site.
    const flipped = LIVE_ROWS.map((r) => ({ ...r, verified: true }))
    const map = buildDomainMap(flipped)
    expect(map).toEqual({})
    expect(Object.keys(map)).not.toContain('dangpestcontrol.com')
    expect(Object.keys(map)).not.toContain('www.dangpestcontrol.com')
  })

  it('never emits admin.dangpestcontrol.com by any route', () => {
    // It lives only in tenants.custom_domain, which this projection does not
    // read, and it is NXDOMAIN (verified 2026-09-02). Asserted anyway: the
    // cost of being wrong is routing a paying client's admin host.
    for (const rows of [LIVE_ROWS, LIVE_ROWS.map((r) => ({ ...r, verified: true }))]) {
      expect(Object.keys(buildDomainMap(rows))).not.toContain('admin.dangpestcontrol.com')
    }
  })

  it('the fixture is the LIVE shape and is not empty', () => {
    // An emptied fixture makes every assertion above pass on nothing.
    expect(LIVE_ROWS.length).toBe(2)
    expect(LIVE_ROWS.every((r) => r.tenants.render_model === 'standalone')).toBe(true)
    expect(LIVE_ROWS.every((r) => r.verified === false)).toBe(true)
  })
})

describe('the guards admit what they should', () => {
  const plsRow = {
    custom_domain: 'precisionlawnsystems.com', verified: true,
    tenants: { slug: 'pls', render_model: 'standard' },
  }

  it('projects a verified, non-standalone domain as BOTH apex and www', () => {
    expect(buildDomainMap([plsRow])).toEqual({
      'precisionlawnsystems.com': 'pls',
      'www.precisionlawnsystems.com': 'pls',
    })
  })

  it('derives the apex when only the www row exists', () => {
    const wwwOnly = { ...plsRow, custom_domain: 'www.precisionlawnsystems.com' }
    expect(buildDomainMap([wwwOnly])).toEqual({
      'precisionlawnsystems.com': 'pls',
      'www.precisionlawnsystems.com': 'pls',
    })
  })

  it('excludes an unverified row even for a standard tenant', () => {
    expect(buildDomainMap([{ ...plsRow, verified: false }])).toEqual({})
    expect(buildDomainMap([{ ...plsRow, verified: null as never }])).toEqual({})
  })

  it('skips rows with no slug or no domain rather than emitting junk keys', () => {
    expect(buildDomainMap([{ ...plsRow, custom_domain: null as never }])).toEqual({})
    expect(buildDomainMap([{ ...plsRow, tenants: null as never }])).toEqual({})
  })

  it('keeps the first claim on a collision instead of silently overwriting', () => {
    const other = { ...plsRow, tenants: { slug: 'urban-strike', render_model: 'standard' } }
    const map = buildDomainMap([plsRow, other])
    expect(map['precisionlawnsystems.com']).toBe('pls')
  })

  it('emits keys in sorted order so the artifact diffs cleanly', () => {
    const rows = [
      { ...plsRow, custom_domain: 'zeta.com' },
      { ...plsRow, custom_domain: 'alpha.com' },
    ]
    const keys = Object.keys(buildDomainMap(rows))
    expect(keys).toEqual([...keys].sort())
  })

  it('the guard can FAIL — a standalone tenant with a verified row is the only difference', () => {
    // Proves the exclusion is doing work: same row, one field changed.
    const standalone = { ...plsRow, tenants: { slug: 'pls', render_model: 'standalone' } }
    expect(buildDomainMap([plsRow])).not.toEqual({})
    expect(buildDomainMap([standalone])).toEqual({})
  })
})

// ── SOURCE-level (not executed): the middleware wiring ─────────────────────
//
// middleware.ts cannot be imported here — it pulls next/server. These are source
// assertions and are labelled as such; S290 established that a parse must not be
// reported as a test.
describe('SOURCE-level: middleware consults the map, and consults it LAST', () => {
  const src = readFileSync(new URL('../middleware.ts', import.meta.url), 'utf8')

  it('imports the artifact and the zero-dep resolver', () => {
    expect(src).toContain("import domainMapJson from './domain-map.json'")
    expect(src).toContain("import { resolveCustomHost } from './domain-normalize.mjs'")
  })

  it('resolves custom hosts only where it used to return null', () => {
    expect(src).toContain('return resolveCustomHost(host, domainMap)')
    // The bare `return null` at the end of extractSubdomain is GONE — replaced,
    // not supplemented. If both existed the map would be unreachable.
    expect(src).not.toMatch(/\n {2}return null;\n}/)
  })

  it('the apex and *.pestflowpro.* branches still return FIRST', () => {
    const fn = src.slice(src.indexOf('function extractSubdomain'))
    const body = fn.slice(0, fn.indexOf('\n}\n'))
    expect(body.indexOf('APEX_HOSTS.has(hostname)')).toBeGreaterThan(-1)
    expect(body.indexOf('APEX_HOSTS.has(hostname)'))
      .toBeLessThan(body.indexOf('resolveCustomHost'))
    expect(body.indexOf('PFP_SUFFIXES'))
      .toBeLessThan(body.indexOf('resolveCustomHost'))
    expect(body.indexOf(".endsWith('.localhost')"))
      .toBeLessThan(body.indexOf('resolveCustomHost'))
  })

  it('the file really was read', () => {
    expect(src.length).toBeGreaterThan(2000)
    expect(src).toContain('export function middleware')
  })
})

describe('the build wiring', () => {
  const root = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

  it('prebuild runs the projector, after the redirects one', () => {
    const pkg = JSON.parse(root('package.json'))
    const prebuild: string = pkg.scripts.prebuild
    expect(prebuild).toContain('generate-domain-map.mjs')
    expect(prebuild.indexOf('generate-redirects-map.mjs'))
      .toBeLessThan(prebuild.indexOf('generate-domain-map.mjs'))
  })

  it('the committed artifact is an empty object — it is regenerated at build', () => {
    // Committing a populated map would ship stale routing that nothing revalidates.
    expect(JSON.parse(root('domain-map.json'))).toEqual({})
  })
})

// ── REQUIRE_DOMAIN_MAP — the cutover safety catch ──────────────────────────
//
// Executes the real script as a child process, because the behaviour under test
// IS the exit code. Default OFF, so every assertion here is about a flag nobody
// has set yet.
describe('REQUIRE_DOMAIN_MAP arms the build against a silently empty map', () => {
  const run = async (env: Record<string, string>) => {
    const { execFile } = await import('node:child_process')
    const { promisify } = await import('node:util')
    const script = new URL('./generate-domain-map.mjs', import.meta.url).pathname
    try {
      const { stdout, stderr } = await promisify(execFile)('node', [script], {
        env: { ...process.env, SUPABASE_URL: '', VITE_SUPABASE_URL: '',
               SUPABASE_SERVICE_ROLE_KEY: '', ...env },
      })
      return { code: 0, out: stdout + stderr }
    } catch (e) {
      const err = e as { code?: number; stdout?: string; stderr?: string }
      return { code: err.code ?? 1, out: (err.stdout ?? '') + (err.stderr ?? '') }
    }
  }

  it('exits 0 and emits {} when unset — a normal build must never fail for this', async () => {
    const { code, out } = await run({})
    expect(code).toBe(0)
    expect(out).toContain('emitting empty domain-map.json')
  })

  it('exits 1 when armed and the projection would be empty', async () => {
    const { code, out } = await run({ REQUIRE_DOMAIN_MAP: '1' })
    expect(code).toBe(1)
    expect(out).toContain('REQUIRE_DOMAIN_MAP=1')
  })

  it('only "1" arms it — a stray truthy string must not fail a normal build', async () => {
    expect((await run({ REQUIRE_DOMAIN_MAP: 'true' })).code).toBe(0)
    expect((await run({ REQUIRE_DOMAIN_MAP: '0' })).code).toBe(0)
  })
})
