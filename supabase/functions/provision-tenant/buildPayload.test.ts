import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  buildProvisionPayload,
  validateServiceSlugs,
  validateServiceAreaCap,
  capForEntitlement,
  PAYLOAD_VERSION,
  type BuildPayloadInput,
} from './buildPayload.ts'
import { CATALOG_SLUGS } from '../../../shared/lib/serviceCatalog.ts'

// S340 — the provisioning payload builder.
//
// This is the half of provision-tenant that CAN be executed in CI. index.ts
// imports from https://esm.sh and vitest cannot load it, so the decisions live
// in buildPayload.ts and the I/O shell is covered by source scans at the bottom
// plus a real committed create after deploy — which is Scott's step, not CI's.

const FIXED_NOW = new Date('2026-09-04T12:00:00.000Z')

function mk(over: Partial<BuildPayloadInput> = {}): BuildPayloadInput {
  return {
    mode: 'create',
    slug: 'acme-pest',
    tenantId: null,
    authUserId: '11111111-1111-1111-1111-111111111111',
    entitlement: 2,
    vertical: 'pest',
    wizard: { business_info: { name: 'Acme Pest' } },
    body: {},
    adminEmail: 'admin@acmepest.com',
    resolvedTimezone: 'America/Chicago',
    intake: { business: { city: 'Tyler', state: 'TX', phone: '9035551234' } },
    scrapedContent: null,
    rawServiceAreas: 'Tyler, Longview',
    legalTemplates: [],
    prospectId: null,
    onboardingSessionId: null,
    queueZernio: true,
    queueOutscraper: false,
    now: FIXED_NOW,
    ...over,
  }
}

const ok = (r: ReturnType<typeof buildProvisionPayload>) => {
  if (!r.ok) throw new Error(`expected ok, got ${r.code}: ${r.error}`)
  return r
}

// ── the RPC contract ────────────────────────────────────────────────────────
describe('the payload matches provision_tenant_atomic\'s contract', () => {
  it('declares payload_version 1 — the RPC rejects anything else', () => {
    expect(ok(buildProvisionPayload(mk())).payload.payload_version).toBe(PAYLOAD_VERSION)
    expect(PAYLOAD_VERSION).toBe('1')
  })

  it('carries business_info.name at the TOP LEVEL, not only in settings', () => {
    // THE CONTRACT GOTCHA. The RPC reads `p_payload#>>'{business_info,name}'`
    // for tenants.name — NOT settings.business_info.name. Omit it and every
    // tenant is silently named after its slug.
    const p = ok(buildProvisionPayload(mk())).payload
    expect(p.business_info.name).toBe('Acme Pest')
    expect((p.settings.business_info as any).name).toBe('Acme Pest')
  })

  it('sends the keys the RPC reads, and no service_areas in settings', () => {
    const p = ok(buildProvisionPayload(mk())).payload
    for (const k of ['mode', 'slug', 'auth_user_id', 'entitlement', 'vertical', 'services',
      'settings', 'page_content', 'seo_meta', 'service_areas', 'authority_prompts',
      'blog_posts', 'queue_zernio', 'queue_outscraper']) {
      expect(p, `missing payload key ${k}`).toHaveProperty(k)
    }
    // The RPC projects seo.service_areas from the rows it PERSISTED, never from
    // the payload. Sending one would be a second, divergent source.
    expect((p.settings.seo as any).service_areas).toBeUndefined()
  })
})

// ── edge validation ─────────────────────────────────────────────────────────
describe('service slugs are validated against the canonical catalog', () => {
  // The builder derives `services` from the catalog, so its own call cannot
  // currently fail — validateServiceSlugs is therefore exercised DIRECTLY here.
  // Nothing in the database enforces catalog membership (tenant_services carries
  // only a slug-shape CHECK and the RPC checks shape and duplicates), so this
  // function is the only catalog gate that exists.
  it('the seeded selection IS the catalog for the vertical', () => {
    const p = ok(buildProvisionPayload(mk({ vertical: 'pest' }))).payload
    expect(p.services).toEqual([...CATALOG_SLUGS.pest])
    expect(p.services.length).toBe(12)
  })

  it('rejects a slug that is not in the catalog', () => {
    const r = validateServiceSlugs('pest', ['termite-control', 'unicorn-removal'])
    expect(r).not.toBeNull()
    expect(r!.status).toBe(400)
    expect(r!.code).toBe('service_not_in_catalog')
    expect(r!.error).toContain('unicorn-removal')
  })

  it('rejects a slug from the WRONG vertical — shape alone is not enough', () => {
    // 'termite-control' is a perfectly well-formed slug and passes both the
    // tenant_services CHECK and the RPC's regex. Only the catalog knows it does
    // not belong to irrigation.
    const r = validateServiceSlugs('irrigation', ['termite-control'])
    expect(r).not.toBeNull()
    expect(r!.code).toBe('service_not_in_catalog')
  })

  it('an unrecorded vertical seeds no services at all', () => {
    const p = ok(buildProvisionPayload(mk({ vertical: null }))).payload
    expect(p.services).toEqual([])
    expect(p.vertical).toBeNull()
  })
})

describe('the service-area cap produces a readable message', () => {
  it('caps are 3 / 5 / 10 / unlimited', () => {
    expect(capForEntitlement(1)).toBe(3)
    expect(capForEntitlement(2)).toBe(5)
    expect(capForEntitlement(3)).toBe(10)
    expect(capForEntitlement(4)).toBeNull()
  })

  it('"7 cities selected, Growth allows 5" — not a constraint name', () => {
    const r = validateServiceAreaCap(2, 7)
    expect(r).not.toBeNull()
    expect(r!.error).toBe('7 cities selected, Growth allows 5')
    expect(r!.status).toBe(400)
  })

  it('Elite is uncapped', () => {
    expect(validateServiceAreaCap(4, 500)).toBeNull()
  })

  it('exactly at the cap is allowed', () => {
    expect(validateServiceAreaCap(1, 3)).toBeNull()
    expect(validateServiceAreaCap(1, 4)).not.toBeNull()
  })

  it('the builder rejects an over-cap CRM list before anything is created', () => {
    const r = buildProvisionPayload(mk({
      entitlement: 1,
      rawServiceAreas: 'Tyler, Longview, Jacksonville, Lindale, Bullard',
    }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('service_area_cap_exceeded')
  })
})

// ── the zip-prefix draft cities, deleted ────────────────────────────────────
describe('the zip-prefix draft cities are GONE', () => {
  it('only cities the CRM actually recorded are seeded', () => {
    const p = ok(buildProvisionPayload(mk({
      rawServiceAreas: 'Tyler',
      intake: { business: { city: 'Tyler', state: 'TX', zip: '75701' } },
    }))).payload
    // A 757 zip prefix used to add Longview, Jacksonville, Lindale, Bullard and
    // Whitehouse as unconfirmed drafts. One recorded city means one row.
    expect(p.service_areas.map((a) => a.city)).toEqual(['Tyler'])
  })

  it('no zip map survives in either source file', () => {
    for (const f of ['buildPayload.ts', 'index.ts']) {
      const src = readFileSync(join(__dirname, f), 'utf8')
      expect(src, `${f} still has a zip map`).not.toMatch(/ZIP_CITIES/)
      // Zip-specific: `slice(0, 3)` alone false-positives on the legal-page
      // phone formatter, which is unrelated and legitimate.
      expect(src, `${f} still derives cities from a zip`).not.toMatch(/zip[A-Za-z]*\.slice/)
      expect(src, `${f} still reads a zip prefix`).not.toMatch(/zipPrefix/)
    }
  })

  it('every seeded area is live and confirmed — no is_live flag to carry', () => {
    const p = ok(buildProvisionPayload(mk())).payload
    expect(p.service_areas.length).toBe(2)
    for (const a of p.service_areas) expect(a).not.toHaveProperty('is_live')
  })
})

// ── seo_meta scope ──────────────────────────────────────────────────────────
describe('seo_meta covers ONLY the URLs provisioning creates', () => {
  const p = ok(buildProvisionPayload(mk())).payload
  const slugs = p.seo_meta.map((m) => m.page_slug)

  it('seeded pages and service-area pages, and both are present', () => {
    expect(slugs).toContain('home')
    expect(slugs).toContain('termite-control')
    expect(slugs).toContain('tyler-tx')
  })

  it('NOT platform routes with no page_content row', () => {
    // Verified live: 256 seo_meta rows, 136 with no page_content at all.
    // Provisioning does not create /pricing, /reviews, /blog or /service-area,
    // so it invents no meta for them.
    for (const s of ['pricing', 'reviews', 'blog', 'service-area']) {
      expect(slugs, `invented meta for /${s}`).not.toContain(s)
    }
  })

  it('NOT blog posts, even the ones this same payload seeds', () => {
    for (const b of p.blog_posts) expect(slugs).not.toContain(b.slug)
  })

  it('no invented focus keyword for a seeded page', () => {
    // buildPageSeoMeta produces a keyword per AREA, not per page. Guessing one
    // is the kind of assertion this seed exists to avoid.
    const home = p.seo_meta.find((m) => m.page_slug === 'home')!
    expect(home.focus_keyword).toBe('')
    const area = p.seo_meta.find((m) => m.page_slug === 'tyler-tx')!
    expect(area.focus_keyword).not.toBe('')
  })
})

// ── page_content ────────────────────────────────────────────────────────────
describe('page_content is insert-missing-only, so overlays fold in HERE', () => {
  it('scraped content is MERGED INTO the seeded row, not appended as a second', () => {
    // The RPC inserts page_content ON CONFLICT DO NOTHING. A second row for the
    // same slug would simply be dropped and the scrape silently lost.
    const p = ok(buildProvisionPayload(mk({
      scrapedContent: { home: { title: 'Scraped Home Title', intro: 'Real intro.' } },
    }))).payload
    const homes = p.page_content.filter((r) => r.page_slug === 'home')
    expect(homes).toHaveLength(1)
    expect(homes[0].title).toBe('Scraped Home Title')
    expect(homes[0].intro).toBe('Real intro.')
  })

  it('a scrape with neither title nor intro leaves the seeded row alone', () => {
    const base = ok(buildProvisionPayload(mk())).payload
      .page_content.find((r) => r.page_slug === 'home')!
    const p = ok(buildProvisionPayload(mk({
      scrapedContent: { home: { subtitle: 'only a subtitle' } },
    }))).payload
    expect(p.page_content.find((r) => r.page_slug === 'home')).toEqual(base)
  })

  it('legal pages are templated from the demo tenant rows', () => {
    const p = ok(buildProvisionPayload(mk({
      legalTemplates: [{
        page_slug: 'terms', title: 'Terms',
        intro: 'PestFlow Pro, LLC at pestflowpro.com, call (430) 367-5601.',
      }],
      intake: { business: { city: 'Tyler', state: 'TX', phone: '9035551234' } },
    }))).payload
    const terms = p.page_content.find((r) => r.page_slug === 'terms')!
    expect(terms.intro).toContain('Acme Pest, LLC')
    expect(terms.intro).toContain('acme-pest.pestflowpro.com')
    expect(terms.intro).toContain('(903) 555-1234')
    expect(terms.intro).not.toContain('PestFlow Pro')
  })

  it('no duplicate page_slug anywhere in the payload', () => {
    const p = ok(buildProvisionPayload(mk({
      legalTemplates: [{ page_slug: 'terms', title: 'Terms', intro: 'x' }],
    }))).payload
    const seen = p.page_content.map((r) => r.page_slug)
    expect(new Set(seen).size).toBe(seen.length)
  })
})

// ── blog posts and prompts ──────────────────────────────────────────────────
describe('blog posts are pest-only, and that is the honest state', () => {
  it('pest gets three starter posts', () => {
    expect(ok(buildProvisionPayload(mk({ vertical: 'pest' }))).payload.blog_posts).toHaveLength(3)
  })
  it('irrigation gets an empty blog, not someone else\'s', () => {
    expect(ok(buildProvisionPayload(mk({ vertical: 'irrigation' }))).payload.blog_posts).toHaveLength(0)
  })
  it('an unrecorded vertical gets none either', () => {
    expect(ok(buildProvisionPayload(mk({ vertical: null }))).payload.blog_posts).toHaveLength(0)
  })
})

describe('authority prompts', () => {
  it('are generated for an ordinary tenant', () => {
    expect(ok(buildProvisionPayload(mk())).payload.authority_prompts.length).toBeGreaterThan(0)
  })
  it('are EMPTY for a demo or operator tenant', () => {
    // Demo tenants are invented businesses with no domain; the operator tenant
    // is the product itself. Paying engines to search for either is the defect.
    expect(ok(buildProvisionPayload(mk({ skipAuthorityPrompts: true })))
      .payload.authority_prompts).toEqual([])
  })
})

// ── determinism and rejected tokens ─────────────────────────────────────────
describe('the builder is deterministic and surfaces what it dropped', () => {
  it('same input, same payload', () => {
    expect(JSON.stringify(ok(buildProvisionPayload(mk())).payload))
      .toBe(JSON.stringify(ok(buildProvisionPayload(mk())).payload))
  })

  it('rejected CRM tokens are reported, not silently dropped', () => {
    // normalizeCity rejects 'empty', 'numeric' and 'too_long'. A stray zip in
    // the CRM's city field is the realistic one.
    const r = ok(buildProvisionPayload(mk({ rawServiceAreas: 'Tyler, 75701, Longview' })))
    expect(r.rejectedAreaTokens).toEqual([{ raw: '75701', reason: 'numeric' }])
    expect(r.payload.service_areas.map((a) => a.city)).toEqual(['Tyler', 'Longview'])
  })
})
