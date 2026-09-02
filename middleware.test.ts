import { describe, it, expect, vi } from 'vitest'

// ── S318 ───────────────────────────────────────────────────────────────────
//
// The REAL middleware, executed. next/server is stubbed to plain objects and the
// build-time artifacts are replaced with populated fixtures — nothing about the
// routing logic itself is faked, which is what lets this answer "do the pls
// redirects still fire on the custom domain?" instead of reasoning about it.

vi.mock('next/server', () => {
  class NextResponse {
    status: number
    headers: Map<string, string>
    kind: string
    target?: string
    constructor(_body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      this.status = init?.status ?? 200
      this.headers = new Map(Object.entries(init?.headers ?? {}))
      this.kind = 'response'
    }
    static rewrite(url: URL | string) {
      const r = new NextResponse(null)
      r.kind = 'rewrite'
      r.target = String(url)
      return r
    }
    static redirect(url: URL | string, init?: { status?: number }) {
      const r = new NextResponse(null, { status: init?.status ?? 307 })
      r.kind = 'redirect'
      r.target = String(url)
      return r
    }
    static next() {
      const r = new NextResponse(null)
      r.kind = 'next'
      return r
    }
  }
  return { NextResponse, NextRequest: class {} }
})

// pls is verified + standard, so the projector emits apex AND www.
vi.mock('../domain-map.json', () => ({ default: {} }))
vi.mock('./domain-map.json', () => ({
  default: {
    'precisionlawnsystems.com': 'pls',
    'www.precisionlawnsystems.com': 'pls',
  },
}))

// The four rows staged for the cutover, exactly as they sit in tenant_redirects.
vi.mock('./redirects-map.json', () => ({
  default: {
    pls: {
      '/services': { to: '/', status: 301 },
      '/photo-gallery': { to: '/', status: 301 },
      '/testimonials': { to: '/', status: 301 },
      '/retaining-walls': { to: '/', status: 301 },
    },
  },
}))

// STANDALONE_SLUGS is built ONCE at module scope (correct for the Edge: it is a
// cold-start read), so the env var must be set BEFORE the import, not in a
// beforeEach. Setting it after produced an empty Set and a green-looking 200.
process.env.STANDALONE_TENANT_SLUGS = 'dang'
const { middleware } = await import('./middleware')

function req(host: string, pathname: string, search = '') {
  const url = new URL(`https://${host}${pathname}${search}`)
  return {
    headers: { get: (k: string) => (k.toLowerCase() === 'host' ? host : null) },
    nextUrl: {
      pathname,
      search,
      clone: () => new URL(url.toString()),
    },
    url: url.toString(),
  } as never
}

describe('ADDENDUM 1: the pls redirects fire on the custom domain', () => {
  it.each(['/services', '/photo-gallery', '/testimonials', '/retaining-walls'])(
    '%s on precisionlawnsystems.com → 301 to /',
    (path) => {
      const res = middleware(req('precisionlawnsystems.com', path))
      expect(res.kind).toBe('redirect')
      expect(res.status).toBe(301)
      expect(new URL(res.target!).pathname).toBe('/')
    },
  )

  it('fires identically on the www host', () => {
    const res = middleware(req('www.precisionlawnsystems.com', '/services'))
    expect(res.kind).toBe('redirect')
    expect(res.status).toBe(301)
  })

  it('still fires on the subdomain — the custom domain ADDS a route, it does not move one', () => {
    const res = middleware(req('pls.pestflowpro.ai', '/services'))
    expect(res.kind).toBe('redirect')
    expect(res.status).toBe(301)
  })

  it('preserves the query string so UTM survives the cutover', () => {
    const res = middleware(req('precisionlawnsystems.com', '/services', '?utm_source=gbp'))
    expect(res.target).toContain('utm_source=gbp')
  })
})

describe('the custom domain reaches the tenant shell and the admin SPA', () => {
  it('/ rewrites to the pls public shell', () => {
    const res = middleware(req('precisionlawnsystems.com', '/'))
    expect(res.kind).toBe('rewrite')
    expect(new URL(res.target!).pathname).toBe('/tenant/pls')
  })

  it('a non-redirected page rewrites under the shell', () => {
    const res = middleware(req('precisionlawnsystems.com', '/contact'))
    expect(new URL(res.target!).pathname).toBe('/tenant/pls/contact')
  })

  it('ADDENDUM 2: /admin rewrites to the Vite SPA, as on a subdomain', () => {
    // Middleware side only. The SPA then does its OWN tenant_domains lookup —
    // see the PR body: that needs the verified row, which is data, not code.
    const res = middleware(req('precisionlawnsystems.com', '/admin'))
    expect(res.kind).toBe('rewrite')
    expect(new URL(res.target!).pathname).toBe('/_admin/index.html')
  })

  it('/set-password is served by the Next route with its security headers', () => {
    const res = middleware(req('precisionlawnsystems.com', '/set-password'))
    expect(res.kind).toBe('next')
    expect(res.headers.get('Referrer-Policy')).toBe('no-referrer')
  })
})

describe('PURELY ADDITIVE: every host that resolved before resolves the same', () => {
  it('the apex still lands in the apex branch', () => {
    const res = middleware(req('pestflowpro.ai', '/'))
    expect(res.kind).toBe('rewrite')
    expect(new URL(res.target!).pathname).toBe('/_admin/index.html')
  })

  it('the apex still 404s a non-allowlisted path', () => {
    expect(middleware(req('pestflowpro.ai', '/services')).status).toBe(404)
  })

  it('a .com subdomain still 308s to .ai before anything else', () => {
    const res = middleware(req('pls.pestflowpro.com', '/services'))
    expect(res.kind).toBe('redirect')
    expect(res.status).toBe(308)
    expect(res.target).toContain('pls.pestflowpro.ai')
  })

  it('a standalone tenant still 404s its public paths', () => {
    const res = middleware(req('dang.pestflowpro.ai', '/'))
    expect(res.status).toBe(404)
    expect(res.headers.get('x-pfp-routing-decision')).toBe('standalone-admin-only-404')
  })

  it("dang's real public domain is NOT in the map and falls through unchanged", () => {
    // It resolves to a separate Vercel project in reality; if it ever reached
    // this app it must behave exactly as an unmapped host did before S318.
    const res = middleware(req('dangpestcontrol.com', '/'))
    expect(res.kind).toBe('rewrite')
    expect(new URL(res.target!).pathname).toBe('/_admin/index.html')
  })
})

describe('an unmapped host — CURRENT behaviour, recorded not endorsed', () => {
  it('still falls through to the apex branch and renders the marketing SPA', () => {
    // This is the fail-OPEN the S318 Wave 1 report flagged. It is NOT fixed here:
    // closing it means restricting which hosts may render the marketing SPA,
    // which cannot be done additively and ships as its own PR with its own tests.
    // This assertion exists so that change has a baseline to move deliberately.
    const res = middleware(req('some-unmapped-host.com', '/'))
    expect(res.kind).toBe('rewrite')
    expect(new URL(res.target!).pathname).toBe('/_admin/index.html')
  })

  it('and still 404s everything else on that host', () => {
    expect(middleware(req('some-unmapped-host.com', '/services')).status).toBe(404)
  })
})

// ── S321 B4 — old-subdomain 301 ────────────────────────────────────────────────
describe('S321 B4 — pls.pestflowpro.ai 301s to the custom domain', () => {
  it('B-e: root', () => {
    const r = middleware(req('pls.pestflowpro.ai', '/'))
    expect(r.status).toBe(301)
    expect(r.target).toBe('https://precisionlawnsystems.com/')
  })

  it('B-e: a deep path is PRESERVED, not flattened to /', () => {
    const r = middleware(req('pls.pestflowpro.ai', '/services/sprinkler-systems'))
    expect(r.status).toBe(301)
    expect(r.target).toBe('https://precisionlawnsystems.com/services/sprinkler-systems')
  })

  it('B-e: the query string survives — UTM parameters are the reason this matters', () => {
    const r = middleware(req('pls.pestflowpro.ai', '/contact', '?utm_source=google&utm_medium=cpc'))
    expect(r.status).toBe(301)
    expect(r.target)
      .toBe('https://precisionlawnsystems.com/contact?utm_source=google&utm_medium=cpc')
  })

  it('B-e: a trailing-slash variant keeps its shape', () => {
    const r = middleware(req('pls.pestflowpro.ai', '/about/'))
    expect(r.status).toBe(301)
    expect(r.target).toBe('https://precisionlawnsystems.com/about/')
  })

  it('B-e: SINGLE HOP — the redirect fires before the per-tenant redirect map', () => {
    // /services carries a tenant_redirects row (/services -> /). If that ran first the
    // client would hop subdomain->subdomain then subdomain->apex: a chain, which bleeds
    // link equity. One hop, to the custom domain, which then applies its own rule.
    const r = middleware(req('pls.pestflowpro.ai', '/services'))
    expect(r.status).toBe(301)
    expect(r.target).toBe('https://precisionlawnsystems.com/services')
  })

  it('B-e: NO LOOP — a request already on the custom domain rewrites, never redirects', () => {
    // The distinction is the whole test: a rewrite serves the page, a redirect would bounce
    // the client back and forth between the two hosts. `.target` is populated for BOTH, so
    // asserting it is absent would be asserting the wrong thing — `kind` is what separates
    // them.
    const r = middleware(req('precisionlawnsystems.com', '/'))
    expect(r.kind).toBe('rewrite')
    expect(r.status).not.toBe(301)
    expect(r.target).toBe('https://precisionlawnsystems.com/tenant/pls')
  })

  it('B-e: NO LOOP — www is left to the Vercel apex/www rule, not duplicated here', () => {
    // Vercel already 301s www -> apex. Emitting a second, competing redirect here is how
    // loops get built, so this asserts the middleware stays out of it.
    const r = middleware(req('www.precisionlawnsystems.com', '/'))
    expect(r.kind).not.toBe('redirect')
    expect(r.status).not.toBe(301)
  })

  it('B-f: a tenant with NO custom domain is completely unaffected', () => {
    const r = middleware(req('urban-strike.pestflowpro.ai', '/services'))
    expect(r.status).not.toBe(301)
  })
})
