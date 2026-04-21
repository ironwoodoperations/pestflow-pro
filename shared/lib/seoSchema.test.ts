import { describe, it, expect } from 'vitest'
import { parseHours, parseAddress } from './seoSchema.parsers'
import {
  generateLocalBusinessSchema,
  generateServiceSchema,
  generateBlogPostingSchema,
} from './seoSchema'

// --- parseHours ---

describe('parseHours', () => {
  it('parses comma-separated segments with em-dash', () => {
    const r = parseHours('Mon–Fri 7am–7pm, Sat 8am–4pm')
    expect(r).toBeDefined()
    expect(r!.length).toBe(2)
    expect(r![0].dayOfWeek).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
    expect(r![0].opens).toBe('07:00')
    expect(r![0].closes).toBe('19:00')
    expect(r![1].dayOfWeek).toEqual(['Saturday'])
    expect(r![1].opens).toBe('08:00')
    expect(r![1].closes).toBe('16:00')
  })

  it('parses pipe-separated segments with hyphen', () => {
    const r = parseHours('Mon-Fri 7am-7pm | Sat 8am-2pm')
    expect(r).toBeDefined()
    expect(r!.length).toBe(2)
    expect(r![1].closes).toBe('14:00')
  })

  it('parses "through" day range with "to" time range', () => {
    const r = parseHours('Monday through Friday 8:00 AM to 5:00 PM')
    expect(r).toBeDefined()
    expect(r!.length).toBe(1)
    expect(r![0].dayOfWeek).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
    expect(r![0].opens).toBe('08:00')
    expect(r![0].closes).toBe('17:00')
  })

  it('parses single-day segment', () => {
    const r = parseHours('Sat 9am-12pm')
    expect(r).toBeDefined()
    expect(r!.length).toBe(1)
    expect(r![0].dayOfWeek).toEqual(['Saturday'])
  })

  it('returns undefined for appointment-only string', () => {
    expect(parseHours('by appointment only')).toBeUndefined()
  })

  it('returns undefined for empty string', () => {
    expect(parseHours('')).toBeUndefined()
  })
})

// --- parseAddress ---

describe('parseAddress', () => {
  it('parses 5-part comma-separated address', () => {
    const r = parseAddress('8350 N Central Expressway, Suite 1400, Dallas, TX, 75206')
    expect(r).toBeDefined()
    expect(r!.streetAddress).toBe('8350 N Central Expressway, Suite 1400')
    expect(r!.addressLocality).toBe('Dallas')
    expect(r!.addressRegion).toBe('TX')
    expect(r!.postalCode).toBe('75206')
  })

  it('parses state+zip in last part', () => {
    const r = parseAddress('1204 S. Main Street, Tyler, TX 75701')
    expect(r).toBeDefined()
    expect(r!.streetAddress).toBe('1204 S. Main Street')
    expect(r!.addressLocality).toBe('Tyler')
    expect(r!.addressRegion).toBe('TX')
    expect(r!.postalCode).toBe('75701')
  })

  it('parses PO Box address', () => {
    const r = parseAddress('PO Box 42, Jacksonville, TX 75766')
    expect(r).toBeDefined()
    expect(r!.streetAddress).toBe('PO Box 42')
    expect(r!.addressLocality).toBe('Jacksonville')
    expect(r!.postalCode).toBe('75766')
  })

  it('returns undefined for no-zip address', () => {
    expect(parseAddress('123 Main St, Dallas, TX')).toBeUndefined()
  })

  it('returns undefined for empty string', () => {
    expect(parseAddress('')).toBeUndefined()
  })

  it('returns undefined for single part', () => {
    expect(parseAddress('Dallas TX 75201')).toBeUndefined()
  })
})

// --- generateLocalBusinessSchema ---

describe('generateLocalBusinessSchema', () => {
  const biz = { name: 'Acme Pest', phone: '555-1234', email: 'a@acme.com', address: '100 Main St, Tyler, TX 75701', hours: 'Mon-Fri 8am-5pm' }
  const seo = { meta_description: 'desc', service_areas: ['Tyler', 'Longview'], certifications: [], founded_year: '2010', owner_name: 'Bob' }
  const cfg = { aggregate_rating: { value: 0, count: 0 }, service_radius_miles: 0 }
  const social = { facebook: 'https://fb.com/acme' }

  it('includes @id and HomeAndConstructionBusiness type', () => {
    const s = generateLocalBusinessSchema(biz, seo, cfg, social, 'https://acme.pestflowpro.com') as Record<string, unknown>
    expect(s['@id']).toBe('https://acme.pestflowpro.com/#organization')
    expect(s['@type']).toContain('HomeAndConstructionBusiness')
    expect(s['@type']).toContain('LocalBusiness')
  })

  it('includes parsed address', () => {
    const s = generateLocalBusinessSchema(biz, seo, cfg, social, 'https://acme.pestflowpro.com') as Record<string, unknown>
    const addr = s.address as Record<string, unknown>
    expect(addr.streetAddress).toBe('100 Main St')
    expect(addr.addressLocality).toBe('Tyler')
  })

  it('includes parsed hours', () => {
    const s = generateLocalBusinessSchema(biz, seo, cfg, social, 'https://acme.pestflowpro.com') as Record<string, unknown>
    expect(Array.isArray(s.openingHoursSpecification)).toBe(true)
  })

  it('omits address block on unparseable address', () => {
    const bad = { ...biz, address: 'somewhere vague' }
    const s = generateLocalBusinessSchema(bad, seo, cfg, social, 'https://acme.pestflowpro.com') as Record<string, unknown>
    expect(s.address).toBeUndefined()
  })

  it('omits hours on unparseable hours', () => {
    const bad = { ...biz, hours: 'call for hours' }
    const s = generateLocalBusinessSchema(bad, seo, cfg, social, 'https://acme.pestflowpro.com') as Record<string, unknown>
    expect(s.openingHoursSpecification).toBeUndefined()
    expect(s.openingHours).toBeUndefined()
  })

  it('does not emit aggregateRating', () => {
    const s = generateLocalBusinessSchema(biz, seo, cfg, social, 'https://acme.pestflowpro.com') as Record<string, unknown>
    expect(s.aggregateRating).toBeUndefined()
  })
})

// --- generateServiceSchema ---

describe('generateServiceSchema', () => {
  it('uses @id provider reference', () => {
    const s = generateServiceSchema('Ant Control', 'We kill ants', 'https://acme.pestflowpro.com/ant-control', 'https://acme.pestflowpro.com') as Record<string, unknown>
    const provider = s.provider as Record<string, unknown>
    expect(provider['@id']).toBe('https://acme.pestflowpro.com/#organization')
    expect(provider['@type']).toBeUndefined()
  })
})

// --- generateBlogPostingSchema ---

describe('generateBlogPostingSchema', () => {
  it('includes required fields', () => {
    const s = generateBlogPostingSchema({ title: 'Test Post', slug: 'test-post' }, 'https://acme.pestflowpro.com') as Record<string, unknown>
    expect(s['@type']).toBe('BlogPosting')
    expect(s.headline).toBe('Test Post')
    expect((s.publisher as Record<string, unknown>)['@id']).toBe('https://acme.pestflowpro.com/#organization')
  })

  it('includes optional fields when present', () => {
    const s = generateBlogPostingSchema({
      title: 'Test', slug: 'test', excerpt: 'An excerpt',
      published_at: '2026-01-01', author_name: 'Jane',
    }, 'https://x.pestflowpro.com') as Record<string, unknown>
    expect(s.description).toBe('An excerpt')
    expect(s.datePublished).toBe('2026-01-01')
    expect((s.author as Record<string, unknown>).name).toBe('Jane')
  })

  it('omits optional fields when absent', () => {
    const s = generateBlogPostingSchema({ title: 'T', slug: 's' }, 'https://x.pestflowpro.com') as Record<string, unknown>
    expect(s.description).toBeUndefined()
    expect(s.author).toBeUndefined()
  })
})
