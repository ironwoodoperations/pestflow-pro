import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// S322 -- EVERY TENANT ROUTE MUST SELF-CANONICALIZE, AND THIS IS WHAT KEEPS IT TRUE.
//
// THE DEFECT THIS CLOSES. In the App Router a page with no generateMetadata inherits the
// parent LAYOUT's metadata. The tenant layout's canonical is the bare site URL, because it
// describes the SITE and not a page. So /about, /contact, /faq, /reviews and /service-area
// all told Google they were duplicates of the homepage. buildPageMetadata was correct the
// whole time; it was simply never called. S276 wired four route groups and the rest were
// missed, and nothing noticed for months.
//
// WHY ROUTE DISCOVERY IS DYNAMIC. A hardcoded list of routes cannot see the route added
// after the list was written -- which is precisely how this defect arrived. The tree is
// walked at TEST TIME, so a new page.tsx is in scope the moment it exists, with no step for
// anyone to remember.
//
// WHY THIS CHECKS MORE THAN "an export exists". Presence is the wrong predicate on its own:
// a route can export generateMetadata that never sets a canonical, or -- far likelier when
// six routes are wired by copy-paste -- one that sets the WRONG path. Both pass a presence
// check and both leave the defect in place. So each route is also required to name a
// pathname matching its own directory. That is the assertion with teeth.

const TENANT_ROOT = join(__dirname, '[slug]')

/**
 * Routes that legitimately do not self-canonicalize. Anything here needs a reason, and the
 * reason has to survive a reader asking "why not just wire it?".
 */
const ALLOWLIST: Record<string, string> = {
  '/consult':
    'Permanently noindex by design: it exports a STATIC `metadata` with ' +
    'robots {index:false, follow:false}, unconditionally and for every tenant — not the ' +
    'tenant.noindex pre-launch gate. A static export cannot resolve the tenant, so it cannot ' +
    'emit a canonical; and a canonical on a page that is never indexed buys nothing. Wiring ' +
    'it would also make it LOOK indexable to the next reader. If the permanent noindex is ' +
    'ever removed, delete this entry and wire the route.',
}

/** Every page.tsx under the tenant tree, as a route path. Walked, never listed. */
function discoverRoutes(dir: string, prefix = ''): Array<{ route: string; file: string }> {
  const out: Array<{ route: string; file: string }> = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      // _components, _lib, _shells are not routes.
      if (entry.startsWith('_')) continue
      out.push(...discoverRoutes(full, `${prefix}/${entry}`))
    } else if (entry === 'page.tsx') {
      out.push({ route: prefix === '' ? '/' : prefix, file: full })
    }
  }
  return out
}

const routes = discoverRoutes(TENANT_ROOT).sort((a, b) => a.route.localeCompare(b.route))

/** Strip comments so a pattern quoted in prose is never mistaken for live code. */
const codeOf = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '')
    .replace(/([^:])\/\/.*$/gm, '$1')

describe('S322 — tenant route discovery', () => {
  it('finds the tree, and finds enough of it to be meaningful', () => {
    // Anti-vacuity. Every assertion below is a for-loop over `routes`; an empty or truncated
    // list would make all of them pass while checking nothing. This is the S320 count=0
    // lesson: a guard that can pass by finding nothing is not a guard.
    expect(routes.length).toBeGreaterThanOrEqual(15)
    const paths = routes.map((r) => r.route)
    for (const known of ['/', '/about', '/contact', '/faq', '/reviews', '/service-area', '/[service]', '/blog', '/blog/[post]']) {
      expect(paths, `route discovery lost ${known}`).toContain(known)
    }
  })

  it('every allowlist entry names a route that still exists', () => {
    // An allowlist entry for a deleted route is dead weight that hides the next real one.
    for (const route of Object.keys(ALLOWLIST)) {
      expect(routes.map((r) => r.route), `allowlisted ${route} no longer exists`).toContain(route)
    }
  })
})

describe('S322 — every tenant route exports generateMetadata', () => {
  for (const { route, file } of routes) {
    const allowed = ALLOWLIST[route]
    it(`${route}${allowed ? ' (allowlisted)' : ''}`, () => {
      const code = codeOf(file)
      const hasIt = /export\s+(async\s+)?function\s+generateMetadata|export\s+const\s+generateMetadata/.test(code)
      if (allowed) {
        expect(hasIt, `${route} is allowlisted but now HAS generateMetadata — remove the allowlist entry`).toBe(false)
        return
      }
      expect(
        hasIt,
        `${route} has no generateMetadata, so it inherits the LAYOUT's canonical (the bare ` +
          `site URL) and tells Google it is a duplicate of the homepage.`,
      ).toBe(true)
    })
  }
})

describe('S322 — every route canonicalizes to ITS OWN path, not just to something', () => {
  for (const { route, file } of routes) {
    if (ALLOWLIST[route]) continue
    it(`${route} names a pathname matching its own directory`, () => {
      const code = codeOf(file)

      // A dynamic route's pathname is built from resolved params, never a literal, and never
      // from a request header (S321 PR B: Host is an untrusted selector, not a URL source).
      //
      // The expected template is DERIVED from the route rather than pattern-matched loosely:
      // /blog/[post] must be exactly `/blog/${params.post}`. A first attempt here only
      // required the template to interpolate params at all, which passed on any prefix and
      // any param name — it would have accepted `/${params.post}` for a route under /blog.
      // Deriving the expected string checks the literal prefix and the param name together.
      if (route.includes('[')) {
        const expected = '`' + route.replace(/\[([^\]]+)\]/g, '${params.$1}') + '`'
        expect(
          code,
          `${route} must pass pathname: ${expected} — built from resolved params, with the ` +
            `static prefix intact.`,
        ).toContain(`pathname: ${expected}`)
        expect(code, `${route} must not derive a URL from a request header`).not.toMatch(/headers\(\)/)
        return
      }

      // The home route canonicalizes to the bare site URL; buildPageMetadata maps both '/'
      // and an absent pathname to siteUrl, so either spelling is correct here.
      if (route === '/') {
        expect(/pathname:\s*'\/'/.test(code) || !/pathname:/.test(code)).toBe(true)
        return
      }

      expect(
        code,
        `${route} must pass pathname: '${route}'. A wrong literal here is the copy-paste ` +
          `failure a presence-only check cannot see.`,
      ).toContain(`pathname: '${route}'`)
    })
  }
})

describe('S322 — the noindex gate survives', () => {
  it('is emitted at the LAYOUT so it inherits into every route, wired or not', () => {
    // Verification requirement 4. Adding generateMetadata to a page could in principle have
    // shadowed the layout's robots key. It does not: robots is set on the layout and neither
    // helper overwrites it with anything weaker — buildPageMetadata emits the identical
    // value, tenantSeoMetadata has no robots key at all. Asserted rather than assumed.
    const layout = codeOf(join(TENANT_ROOT, 'layout.tsx'))
    expect(layout).toMatch(/tenant\.noindex === true \? \{ robots: \{ index: false, follow: false \} \}/)
  })

  it('no wired route weakens it to index:true', () => {
    for (const { route, file } of routes) {
      expect(codeOf(file), `${route} must not force indexing`).not.toMatch(/robots:\s*\{\s*index:\s*true/)
    }
  })
})
