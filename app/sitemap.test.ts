import { describe, it, expect, vi, beforeEach } from 'vitest'

// Host is injected per-test so the selector and the emitted URLs can be checked together.
let currentHost = ''
vi.mock('next/headers', () => ({
  headers: async () => new Map([['host', currentHost]]),
}))

const tenantRow = {
  id: 'tenant-pls', slug: 'pls', subdomain: 'pls',
  custom_domain: 'precisionlawnsystems.com', noindex: false,
}
let tenant: Record<string, unknown> | null = { ...tenantRow }
vi.mock('../shared/lib/tenant/resolve', () => ({
  resolveTenantBySlug: async () => tenant,
}))
vi.mock('./tenant/[slug]/_lib/queries', () => ({
  getAllServicePages: async () => [{ page_slug: 'sprinkler-systems' }],
  getAllBlogPosts: async () => [{ slug: 'spring-tips', published_at: '2026-04-01T00:00:00Z' }],
}))
vi.mock('../domain-map.json', () => ({
  default: {
    'precisionlawnsystems.com': 'pls',
    'www.precisionlawnsystems.com': 'pls',
  },
}))

// Static import, not a top-level `await import`. Files under app/ ARE type-checked by the
// root tsconfig, and a top-level await there is TS1378 under this module target --
// middleware.test.ts gets away with it only because it sits outside the include. vi.mock is
// hoisted above imports by vitest, so the mocks above still apply.
import sitemap, { slugForHost } from './sitemap'

// S321 B5 -- the HOST SELECTOR is the security-critical half of the sitemap and is the part
// that can be tested without a database.
//
// The gate's finding: a Host header is attacker-controlled, and building sitemap <loc>
// values from it lets anyone publish poisoned URLs. The design answer is that the host only
// ever SELECTS a tenant from a known set -- an unknown host matches nothing -- and every
// emitted URL is then built by resolveSiteUrl() from the database and the static map.
// These tests pin the selector half: what it resolves, and what it refuses.
describe('slugForHost -- resolves a known tenant', () => {
  it('a verified custom domain, from the build-time projection', () => {
    expect(slugForHost('precisionlawnsystems.com')).toBe('pls')
  })

  it('the www alias of one', () => {
    expect(slugForHost('www.precisionlawnsystems.com')).toBe('pls')
  })

  it('a platform subdomain on either TLD', () => {
    expect(slugForHost('pls.pestflowpro.ai')).toBe('pls')
    expect(slugForHost('urban-strike.pestflowpro.ai')).toBe('urban-strike')
    expect(slugForHost('pls.pestflowpro.com')).toBe('pls')
  })

  it('is case- and port- and trailing-dot-insensitive', () => {
    expect(slugForHost('PLS.PestFlowPro.ai')).toBe('pls')
    expect(slugForHost('pls.pestflowpro.ai:443')).toBe('pls')
    expect(slugForHost('pls.pestflowpro.ai.')).toBe('pls')
  })
})

describe('slugForHost -- refuses everything else, so an unknown host gets an EMPTY sitemap', () => {
  it('an unknown host', () => {
    expect(slugForHost('evil.example')).toBeNull()
    expect(slugForHost('attacker-controlled.test')).toBeNull()
  })

  it('suffix confusion against the platform domains', () => {
    expect(slugForHost('pls.pestflowpro.ai.evil.example')).toBeNull()
    expect(slugForHost('evilpestflowpro.ai')).toBeNull()
  })

  it('multi-label subdomains, matching the middleware', () => {
    expect(slugForHost('a.b.pestflowpro.ai')).toBeNull()
  })

  it('the apex and www, which are not tenants', () => {
    expect(slugForHost('pestflowpro.ai')).toBeNull()
    expect(slugForHost('www.pestflowpro.ai')).toBeNull()
  })

  it('empty and malformed values, without throwing', () => {
    for (const bad of ['', ':', '...', '   ']) {
      expect(() => slugForHost(bad)).not.toThrow()
      expect(slugForHost(bad), `expected null for ${JSON.stringify(bad)}`).toBeNull()
    }
  })
})

describe('sitemap() -- B-g and B-h, the two the brief asks to be shown', () => {
  beforeEach(() => {
    currentHost = 'precisionlawnsystems.com'
    tenant = { ...tenantRow }
  })

  it('B-g: every URL is on the custom domain, and none on the platform subdomain', async () => {
    const entries = await sitemap()
    expect(entries.length).toBeGreaterThan(0)
    for (const e of entries) {
      expect(e.url.startsWith('https://precisionlawnsystems.com'), e.url).toBe(true)
      expect(e.url).not.toContain('pestflowpro.ai')
    }
  })

  it('B-g: it lists the SAME pages the routes render -- services and posts, not a second list', async () => {
    const urls = (await sitemap()).map((e) => e.url)
    expect(urls).toContain('https://precisionlawnsystems.com/sprinkler-systems')
    expect(urls).toContain('https://precisionlawnsystems.com/blog/spring-tips')
  })

  it('B-g: the sitemap host matches the canonical host -- disagreement is worse than no sitemap', async () => {
    const { resolveSiteUrl } = await import('../shared/lib/resolveSiteUrl')
    const canonical = resolveSiteUrl(tenantRow)
    for (const e of await sitemap()) expect(e.url.startsWith(canonical)).toBe(true)
  })

  it('B-h: a noindex=true tenant publishes NO crawlable sitemap', async () => {
    tenant = { ...tenantRow, noindex: true }
    expect(await sitemap()).toEqual([])
  })

  // THE TEST THAT ACTUALLY PINS THE HOST-INJECTION DEFENCE, and it exists because a
  // mutation exposed that the others did not. Every case above requests the canonical host,
  // so Host-derived URLs and resolveSiteUrl-derived URLs are IDENTICAL and swapping one for
  // the other passed all fifteen. Here the request arrives on the platform subdomain -- a
  // legitimate selector -- while the canonical is the custom domain, so the two DISAGREE and
  // only the correct source produces the right answer.
  it('B-g: URLs come from resolved config, NOT the request Host, even when they differ', async () => {
    currentHost = 'pls.pestflowpro.ai'
    const entries = await sitemap()
    expect(entries.length).toBeGreaterThan(0)
    for (const e of entries) {
      expect(e.url.startsWith('https://precisionlawnsystems.com'), e.url).toBe(true)
      expect(e.url, 'a Host-derived URL would leak the request host into <loc>')
        .not.toContain('pestflowpro.ai')
    }
  })

  it('an unknown host publishes nothing -- the host-injection surface', async () => {
    currentHost = 'evil.example'
    expect(await sitemap()).toEqual([])
  })

  it('a host that resolves to no tenant publishes nothing', async () => {
    tenant = null
    expect(await sitemap()).toEqual([])
  })
})

// S322 STEP 4 — every <loc> must BYTE-MATCH that page's rendered rel=canonical.
//
// Compared against the REAL buildPageMetadata rather than a re-implementation of its rule.
// A test that re-states the rule drifts the moment the helper changes and then agrees with
// itself forever; running the actual helper cannot.
describe('S322 — sitemap <loc> matches the page canonical exactly', () => {
  beforeEach(() => {
    currentHost = 'precisionlawnsystems.com'
    tenant = { ...tenantRow }
  })

  it('every entry equals buildPageMetadata(...).alternates.canonical for its own path', async () => {
    const { buildPageMetadata } = await import('../shared/lib/buildPageMetadata')
    const { resolveSiteUrl } = await import('../shared/lib/resolveSiteUrl')
    const siteUrl = resolveSiteUrl(tenantRow)

    const entries = await sitemap()
    expect(entries.length).toBeGreaterThan(0)

    for (const e of entries) {
      // Derive the pathname the page route would receive, then ask the real helper.
      const pathname = e.url.slice(siteUrl.length) || '/'
      const meta = buildPageMetadata(tenantRow as never, {
        pathname,
        seoMeta: null,
        fallback: { title: 't', description: 'd' },
      })
      expect(
        meta.alternates?.canonical,
        `sitemap <loc> ${e.url} disagrees with the canonical for ${pathname}`,
      ).toBe(e.url)
    }
  })

  it('the homepage entry carries NO trailing slash, matching its canonical', () => {
    // The specific one-byte disagreement S322 found: `${siteUrl}${'/'}` produced
    // https://host/ while the canonical is https://host.
    return sitemap().then((entries) => {
      const root = entries.find((e) => !e.url.slice('https://precisionlawnsystems.com'.length))
      expect(root?.url).toBe('https://precisionlawnsystems.com')
      expect(entries.map((e) => e.url)).not.toContain('https://precisionlawnsystems.com/')
    })
  })

  it('lists every route S322 wired', async () => {
    const urls = (await sitemap()).map((e) => e.url)
    for (const p of ['/about', '/contact', '/faq', '/quote', '/reviews', '/service-area']) {
      expect(urls, `sitemap omits ${p}, which now self-canonicalizes`)
        .toContain(`https://precisionlawnsystems.com${p}`)
    }
  })
})
