import { describe, it, expect, vi } from 'vitest'

// src/lib/supabase builds a real client at import time from Vite env vars that
// do not exist under vitest, so any component whose tree transitively imports
// it fails to load. Stubbing the CLIENT keeps the components themselves real —
// nothing about their markup is faked. Same pattern as adminRenderedStrings.
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
    rpc: async () => ({ data: null, error: null }),
    auth: {
      getSession: async () => ({ data: { session: null } }),
      signInWithPassword: async () => ({ data: null, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  },
}))
vi.mock('react-router-dom', () => ({
  useNavigate: () => () => {},
  Link: ({ children }: { children?: unknown }) => children,
}))
vi.mock('../context/TenantBootProvider', () => ({ useTenant: () => ({ id: 'tenant-1' }) }))

import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { readFileSync } from 'node:fs'
import { PLATFORM_NAME, RETIRED_PLATFORM_NAME } from '../../shared/lib/platformBrand'
import Login from '../pages/admin/Login'

// Word boundaries throughout. Substring over-match has produced five false
// positives in this codebase — 'pest' inside "PestFlow Pro" twice, 'free'
// inside "freeze", 'radius' inside "border-radius" (a hyphen IS a word
// boundary), and a guard tripping on its own comment. These two matchers are
// exact product names, so they are matched as whole phrases.
const RETIRED = new RegExp(`\\b${RETIRED_PLATFORM_NAME.replace(/ /g, '\\s')}\\b`, 'i')
const CURRENT = new RegExp(`\\b${PLATFORM_NAME.replace(/ /g, '\\s')}\\b`, 'i')

describe('the constant is the only definition', () => {
  it('names the platform, and is not the retired vertical brand', () => {
    expect(PLATFORM_NAME).toBe('HomeFlow Pro')
    expect(RETIRED_PLATFORM_NAME).toBe('PestFlow Pro')
    expect(PLATFORM_NAME).not.toBe(RETIRED_PLATFORM_NAME)
  })

  it('the matchers fire on the strings they exist to catch, and not on each other', () => {
    expect(RETIRED.test('Powered by PestFlow Pro')).toBe(true)
    expect(CURRENT.test('Powered by HomeFlow Pro')).toBe(true)
    expect(RETIRED.test('Powered by HomeFlow Pro')).toBe(false)
    expect(CURRENT.test('Powered by PestFlow Pro')).toBe(false)
  })
})

describe('the LOGIN screen renders the platform, not the vertical', () => {
  const html = renderToStaticMarkup(createElement(Login))

  it('renders HomeFlow Pro', () => {
    expect(html).toMatch(CURRENT)
  })

  it('renders NO PestFlow Pro anywhere', () => {
    expect(html).not.toMatch(RETIRED)
  })

  it('the render is real — it produced the login form, not an empty string', () => {
    // Without this, both assertions above pass on `html === ''`.
    expect(html.length).toBeGreaterThan(300)
    expect(html).toContain('Powered by')
    expect(html.toLowerCase()).toContain('password')
  })

  it('shows NO business name until the tenant\'s own resolves', () => {
    // It used to seed the h1 with the platform's name, so an irrigation
    // client's login announced them as a pest-control product. Renaming the
    // seed would have swapped one wrong business name for another.
    const src = readFileSync(new URL('../pages/admin/Login.tsx', import.meta.url), 'utf8')
    expect(src).toContain("useState('')")
    expect(src).not.toMatch(/useState\('(Pest|Home)Flow Pro'\)/)
  })

  it('the "Powered by" is plain text, not a link to the vertical\'s domain', () => {
    expect(html).not.toMatch(/<a[^>]*pestflowpro/i)
  })
})

// ── SOURCE assertions, and they are labelled as such ───────────────────────
//
// These two are NOT renders, and are not presented as renders.
//   - Dashboard requires `window` at module scope; this suite runs in node, and
//     adding jsdom for one assertion is a bigger change than the one under test.
//   - generate-monthly-report/index.ts imports two https:// URLs, which vitest
//     cannot load at all — the reason narrationPrompt.ts was extracted in S283.
// A source assertion is weaker than a render and saying so is the point: S290
// established that a parse must not be reported as a test.
describe('SOURCE-level (not rendered): the sidebar and the report footer', () => {
  const dashboard = readFileSync(new URL('../pages/admin/Dashboard.tsx', import.meta.url), 'utf8')
  const reportFn = readFileSync(
    new URL('../../supabase/functions/generate-monthly-report/index.ts', import.meta.url), 'utf8')

  it('the sidebar h1 interpolates the constant rather than a literal', () => {
    expect(dashboard).toMatch(/<h1[^>]*>\{PLATFORM_NAME\}<\/h1>/)
    expect(dashboard).not.toMatch(/<h1[^>]*>PestFlow Pro<\/h1>/)
  })

  it('the second sidebar line — "Operations Platform" — is kept', () => {
    // The brief asked for it explicitly; a rename that dropped it would pass
    // every other assertion in this file.
    expect(dashboard).toMatch(/Operations Platform/)
  })

  it('the report footer interpolates the constant', () => {
    expect(reportFn).toContain('Generated by ${escapeHtml(PLATFORM_NAME)}')
    expect(reportFn).not.toContain('Generated by PestFlow Pro')
  })

  it('these two files are the real ones, and were actually read', () => {
    expect(dashboard.length).toBeGreaterThan(2000)
    expect(reportFn.length).toBeGreaterThan(2000)
    expect(dashboard).toContain('export default function Dashboard')
    expect(reportFn).toContain('renderReport')
    // …and both import the one constant rather than redefining it.
    expect(dashboard).toContain('platformBrand')
    expect(reportFn).toContain('platformBrand')
  })
})

// ── Scoped regression guard ────────────────────────────────────────────────
//
// SCOPE, STATED IN THE GUARD: exactly the PLATFORM-COPY files S294 changed.
// It is deliberately NOT repo-wide. A repo-wide scan would trip on the PestFlow
// Pro MARKETING site (src/pages/marketing/**), the legal documents, the
// Ironwood operator CRM, Dang's own shell, sales-deck.html and the committed
// build artefacts under public/_admin/ — all of which name the pest vertical
// legitimately and must keep doing so.
describe('no platform-copy file reintroduces the retired name', () => {
  const FILES = [
    'pages/admin/Dashboard.tsx',
    'pages/admin/Login.tsx',
    'components/admin/SupportTab.tsx',
    'components/admin/BillingTab.tsx',
    'components/common/FeatureGate.tsx',
    'lib/planCardContent.ts',
    'context/TenantBootProvider.tsx',
    'pages/admin/Onboarding.tsx',
    'pages/admin/OnboardingLive.tsx',
  ]

  /** Outside src/, so it is read by an explicit relative path. */
  const NEXT_FILES = ['../app/set-password/page.tsx']

  /** Comments out, code in — a comment naming what it replaced is not a claim. */
  function codeOnly(body: string): string {
    return body
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((line) => !/^[ \t]*(\/\/|\*)/.test(line))
      .join('\n')
  }

  for (const rel of FILES) {
    it(`${rel} names no PestFlow Pro in code`, () => {
      const body = readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8')
      expect(codeOnly(body), `${rel} still names the retired brand`).not.toMatch(RETIRED)
    })
  }

  it('the scoped list is NOT empty — an emptied list generates zero tests and passes', () => {
    // Found by mutation: deleting the entries made the per-file loop produce no
    // tests at all, and the existence check below iterate nothing. Both went
    // green on a guard that was scanning literally nothing.
    expect(FILES.length).toBe(9)
    // NEXT_FILES is a SECOND list, and it needs its own count for the same
    // reason. Adding it without this line reproduced the identical vacuity one
    // mutation later — the guard's scope stopped matching its claim inside the
    // very test written to stop that happening.
    expect(NEXT_FILES.length).toBe(1)
    // …and it really is the platform-copy set, not seven arbitrary paths.
    expect(FILES).toContain('pages/admin/Dashboard.tsx')
    expect(FILES).toContain('pages/admin/Login.tsx')
    expect(new Set(FILES).size).toBe(FILES.length)
  })

  for (const rel of NEXT_FILES) {
    it(`${rel} names no PestFlow Pro in code`, () => {
      const body = readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8')
      expect(codeOnly(body), `${rel} still names the retired brand`).not.toMatch(RETIRED)
    })
  }

  it('every listed file exists, is non-trivial, and imports the constant', () => {
    // A path typo would silently make the guard above scan nothing. So would a
    // file that stopped using PLATFORM_NAME and hardcoded the string instead.
    for (const rel of [...FILES, ...NEXT_FILES]) {
      const body = readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8')
      expect(body.length, `${rel} is empty`).toBeGreaterThan(200)
      expect(body, `${rel} does not import the shared constant`).toContain('platformBrand')
      expect(body, `${rel} does not use it`).toContain('PLATFORM_NAME')
    }
  })

  it('the comment stripper does not gut the file, and the guard can still fail', () => {
    const body = readFileSync(new URL('../pages/admin/Login.tsx', import.meta.url), 'utf8')
    // The Login comment names the retired brand deliberately; code does not.
    expect(body).toMatch(/pest-control product/)
    expect(codeOnly(body).length).toBeGreaterThan(body.length / 3)
    // …and a planted offender in CODE is caught.
    expect(codeOnly(`${body}\nconst leak = 'Powered by PestFlow Pro'\n`)).toMatch(RETIRED)
  })
})
