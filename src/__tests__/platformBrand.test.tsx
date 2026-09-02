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
import {
  recoveryEmail,
  inviteEmail,
  addedToTenantEmail,
} from '../../supabase/functions/_shared/emailTemplates/authEmails.ts'

// Word boundaries throughout. Substring over-match has produced five false
// positives in this codebase — 'pest' inside "PestFlow Pro" twice, 'free'
// inside "freeze", 'radius' inside "border-radius" (a hyphen IS a word
// boundary), and a guard tripping on its own comment. These two matchers are
// exact product names, so they are matched as whole phrases.
const RETIRED = new RegExp(`\\b${RETIRED_PLATFORM_NAME.replace(/ /g, '\\s')}\\b`, 'i')
const CURRENT = new RegExp(`\\b${PLATFORM_NAME.replace(/ /g, '\\s')}\\b`, 'i')

/** Comments out, code in — a comment naming what it replaced is not a claim. */
function codeOnly(body: string): string {
  return body
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^[ \t]*(\/\/|\*)/.test(line))
    .join('\n')
}

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

// ── S317: the EDGE FUNCTIONS ───────────────────────────────────────────────
//
// S294 migrated the admin SPA, app/set-password and generate-monthly-report and
// stopped there. The edge functions kept the pest brand, so the emails a tenant
// actually RECEIVES still carried it: confirmed live 2026-09-02, an irrigation
// client's password-reset footer read "Powered by PestFlow Pro" linked to
// pestflowpro.ai.
//
// SCOPE OF THIS LIST — the platform-copy edge functions, and only those.
// Deliberately EXCLUDED, each for a stated reason:
//   - provision-tenant/index.ts keeps "PestFlow Pro" in CODE on purpose. Those
//     are replaceAll SEARCH PATTERNS matched against seeded template rows that
//     literally contain the string. Swapping the needle breaks provisioning
//     silently. Guarded below by its own assertion instead.
//   - _shared/sendEmail.ts, _shared/authorityPrompts.ts and
//     lead-bridge-dispatch/index.ts name the brand only in COMMENTS and consume
//     no platform copy, so they have nothing to import and nothing to rename.
const EDGE_FILES = [
  '_shared/emailTemplates/authEmails.ts',
  'invite-team-member/index.ts',
  'notify-new-lead/index.ts',
  'notify-support-ticket/index.ts',
  'notify-upgrade/index.ts',
  'password-reset-request/index.ts',
  'send-credentials-email/index.ts',
  'send-intake-email/index.ts',
  'send-onboarding-email/index.ts',
  'send-reveal-ready/index.ts',
]

const edgeSrc = (rel: string) =>
  readFileSync(new URL(`../../supabase/functions/${rel}`, import.meta.url), 'utf8')

describe('S317: no edge function reintroduces the retired name', () => {
  for (const rel of EDGE_FILES) {
    it(`${rel} names no PestFlow Pro in code`, () => {
      expect(codeOnly(edgeSrc(rel)), `${rel} still names the retired brand`).not.toMatch(RETIRED)
    })
  }

  it('the edge list is NOT empty, and its length is asserted explicitly', () => {
    // Third list in this file, third explicit count. The other two record why:
    // an emptied list generates zero tests and every one of them passes. A list
    // without a count is a guard that cannot detect its own deletion.
    expect(EDGE_FILES.length).toBe(10)
    expect(new Set(EDGE_FILES).size).toBe(EDGE_FILES.length)
    // …and it is the email-sending set, not ten arbitrary paths.
    expect(EDGE_FILES).toContain('password-reset-request/index.ts')
    expect(EDGE_FILES).toContain('_shared/emailTemplates/authEmails.ts')
  })

  it('every listed function exists, is non-trivial, and imports the constant', () => {
    // A path typo would make the loop above scan nothing. So would a function
    // that stopped importing PLATFORM_NAME and hardcoded 'HomeFlow Pro' —
    // right string, second definition, exactly what S294 exists to prevent.
    for (const rel of EDGE_FILES) {
      const body = edgeSrc(rel)
      expect(body.length, `${rel} is empty`).toBeGreaterThan(200)
      expect(body, `${rel} does not import the shared constant`).toContain('platformBrand')
      expect(body, `${rel} does not use it`).toContain('PLATFORM_NAME')
      expect(codeOnly(body), `${rel} hardcodes the platform name`).not.toContain(`'${PLATFORM_NAME}'`)
    }
  })

  it('the guard can still fail — a planted offender in edge CODE is caught', () => {
    const body = edgeSrc('password-reset-request/index.ts')
    expect(codeOnly(`${body}\nconst leak = 'Powered by PestFlow Pro'\n`)).toMatch(RETIRED)
  })
})

// ── RENDERED, not scanned ──────────────────────────────────────────────────
//
// authEmails.ts imports nothing but the shared constant, so unlike
// generate-monthly-report it loads under vitest and these are REAL renders of
// the exact strings a tenant receives. Labelled as such because the block above
// is only a source scan, and S290 established the difference must be stated.
describe('RENDERED: the auth emails a tenant actually receives', () => {
  const link = 'https://acme.pestflowpro.ai/set-password?token_hash=x&type=recovery'

  it('the footer names the platform, and is FLAT TEXT with no anchor', () => {
    // The live defect: "Powered by PestFlow Pro" linked to pestflowpro.ai in an
    // irrigation client's inbox. The link is gone on purpose — until the
    // per-vertical landing pages exist there is no correct URL for a lawn or
    // irrigation client, and the pest one is affirmatively wrong.
    const html = recoveryEmail('Acme Irrigation', link).html
    expect(html).toMatch(CURRENT)
    expect(html).not.toMatch(RETIRED)
    expect(html).toContain(`Powered by ${PLATFORM_NAME}`)
    expect(html).not.toMatch(/Powered by\s*<a/i)

    // Scoped to the FOOTER, deliberately. A repo-wide "no pestflowpro anchor"
    // assertion fails on the set-password CTA, whose href is the tenant's own
    // subdomain — that link is the entire point of the email and is correct.
    const footer = html.slice(html.indexOf('Powered by'))
    expect(footer).not.toMatch(/<a\b/i)
    expect(footer.length, 'the footer slice is empty — the assertion is vacuous')
      .toBeGreaterThan(20)
  })

  it('names the TENANT when it has a name', () => {
    expect(recoveryEmail('Acme Irrigation', link).subject).toBe('Reset your Acme Irrigation password')
    expect(inviteEmail('Acme Irrigation', link).subject).toBe("You've been invited to Acme Irrigation")
  })

  it('names NO business when the tenant has none — not the platform', () => {
    // platformBrand.ts's header: the constant is NOT a tenant's business name,
    // and substituting it where the tenant's own belongs is the same category
    // error it exists to fix. So the copy drops the name rather than defaulting.
    for (const parts of [recoveryEmail('', link), inviteEmail('', link), addedToTenantEmail('', link)]) {
      expect(parts.subject).not.toMatch(RETIRED)
      expect(parts.subject).not.toMatch(CURRENT)
      expect(parts.text).not.toMatch(RETIRED)
      expect(parts.subject.trim()).toBe(parts.subject)
      expect(parts.subject).not.toMatch(/\s{2,}/)
    }
    expect(recoveryEmail('', link).subject).toBe('Reset your password')
    expect(inviteEmail('', link).subject).toBe("You've been invited")
    expect(addedToTenantEmail('', link).subject).toBe("You've been added")
  })

  it('the renders are real — not empty strings passing every assertion above', () => {
    const parts = recoveryEmail('Acme Irrigation', link)
    expect(parts.html.length).toBeGreaterThan(500)
    expect(parts.html).toContain(link)
    expect(parts.text).toContain(link)
    expect(parts.subject.length).toBeGreaterThan(10)
  })
})

// ── The four call sites that used to default to the pest brand ─────────────
describe('SOURCE-level: no edge function defaults a BUSINESS name to a PLATFORM name', () => {
  const CALL_SITES = [
    'notify-new-lead/index.ts',
    'invite-team-member/index.ts',
    'password-reset-request/index.ts',
  ]

  it('the call-site list is NOT empty', () => {
    expect(CALL_SITES.length).toBe(3)
  })

  for (const rel of CALL_SITES) {
    it(`${rel} reads the tenant's name with no platform fallback`, () => {
      const code = codeOnly(edgeSrc(rel))
      // Verified live 2026-09-02: all nine tenants have a non-empty
      // business_info.name, so this path is unreachable in production today.
      // That is why it was cheap to fix now and would have been expensive the
      // first time a tenant was provisioned without one.
      expect(code).toMatch(/const businessName: string = [^\n]*\|\| ''/)
      expect(code, `${rel} defaults a business name to a platform name`)
        .not.toMatch(/const businessName: string = [^\n]*\|\|\s*(PLATFORM_NAME|'(Pest|Home)Flow Pro')/)
      // The From label is the one place a platform name is a TRUE claim.
      expect(code).toContain('const senderName: string = businessName || PLATFORM_NAME')
      expect(code, `${rel} still passes the raw business name as the sender`)
        .not.toMatch(/fromName: businessName\b/)
    })
  }

  it('send-intake-email drops the name from the subject rather than defaulting', () => {
    const code = codeOnly(edgeSrc('send-intake-email/index.ts'))
    expect(code).toContain("'Your website setup link is ready'")
    expect(code).not.toMatch(/businessName \|\| '(Pest|Home)Flow Pro'/)
  })
})

// ── provision-tenant: the string that must NOT be renamed ──────────────────
describe('SOURCE-level: provision-tenant keeps its seed-data search patterns', () => {
  const src = edgeSrc('provision-tenant/index.ts')

  it('the replaceAll NEEDLES still say PestFlow Pro', () => {
    // These are not copy. They are matched against seeded template rows whose
    // text literally contains "PestFlow Pro". Renaming the needle to
    // PLATFORM_NAME stops it matching and every newly provisioned tenant
    // silently keeps the demo company's text — a failure with no error.
    expect(src).toContain(".replaceAll('PestFlow Pro, LLC'")
    expect(src).toContain(".replaceAll('PestFlow Pro', newName)")
    expect(src).toContain(".replaceAll('PESTFLOW PRO', newNameUpper)")
  })

  it('its user-visible copy DID move to the constant', () => {
    // The exclusion above is scoped to the matchers, not a blanket pass.
    expect(src).toContain('platformBrand')
    expect(src).toContain('${PLATFORM_NAME} tenant:')
    expect(src).not.toContain('`PestFlow Pro tenant:')
  })
})
