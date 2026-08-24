import { describe, it, expect } from 'vitest'
import { parseHours, parseAddress } from './seoSchema.parsers'
import {
  generateLocalBusinessSchema,
  generateServiceSchema,
  generateBlogPostingSchema,
  PEST_CONTROL_VOCABULARY,
  IRRIGATION_VOCABULARY,
  getSchemaVocabulary,
  resolveSchemaVocabulary,
  DEFAULT_BUSINESS_TYPE,
  NEUTRAL_BUSINESS_TYPE,
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

  // S-PLS-1: vocabulary defaults preserve the exact historical pest values —
  // every caller that passes no vocabulary must emit byte-identical output.
  it('defaults knowsAbout to the historical pest-control list', () => {
    const s = generateLocalBusinessSchema(biz, seo, cfg, social, 'https://acme.pestflowpro.com') as Record<string, unknown>
    expect(s.knowsAbout).toEqual(['Pest Control', 'Termite Treatment', 'Mosquito Control', 'Rodent Control', 'Bed Bug Treatment', 'Ant Control'])
  })

  it('uses a passed vocabulary for knowsAbout', () => {
    const vocab = { knowsAbout: ['Irrigation', 'Drainage'], serviceType: 'Irrigation' }
    const s = generateLocalBusinessSchema(biz, seo, cfg, social, 'https://acme.pestflowpro.com', vocab) as Record<string, unknown>
    expect(s.knowsAbout).toEqual(['Irrigation', 'Drainage'])
  })

  // S-PLS-2 hardening: the default vocabulary is shared by reference across all
  // calls, so it must be deep-frozen — mutation attempts throw in strict mode
  // rather than corrupting every subsequent call's output.
  it('default vocabulary is deep-frozen', () => {
    expect(Object.isFrozen(PEST_CONTROL_VOCABULARY)).toBe(true)
    expect(Object.isFrozen(PEST_CONTROL_VOCABULARY.knowsAbout)).toBe(true)
    const s = generateLocalBusinessSchema(biz, seo, cfg, social, 'https://acme.pestflowpro.com') as Record<string, unknown>
    expect(() => { (s.knowsAbout as string[]).push('Corrupted') }).toThrow()
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

  // S-PLS-1: serviceType defaults to the historical value; overridable per vertical.
  it('defaults serviceType to Pest Control', () => {
    const s = generateServiceSchema('Ant Control', 'We kill ants', 'https://acme.pestflowpro.com/ant-control', 'https://acme.pestflowpro.com') as Record<string, unknown>
    expect(s.serviceType).toBe('Pest Control')
  })

  it('uses a passed vocabulary for serviceType', () => {
    const vocab = { knowsAbout: ['Irrigation', 'Drainage'], serviceType: 'Irrigation' }
    const s = generateServiceSchema('Drainage', 'French drains', 'https://x.pestflowpro.ai/drainage', 'https://x.pestflowpro.ai', vocab) as Record<string, unknown>
    expect(s.serviceType).toBe('Irrigation')
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

// --- PR A: vertical vocabulary wiring ---
//
// The invariant: every pest tenant's emitted JSON-LD must be byte-identical
// before and after this PR. Dang is live and must not move.

describe('PR A — schema vocabulary', () => {
  const business = { name: 'B', phone: 'p', email: 'e', address: 'a' }
  const seo = { meta_description: '', service_areas: [], certifications: [], founded_year: '', owner_name: '' }
  const schemaCfg = { aggregate_rating: { value: 0, count: 0 }, service_radius_miles: 0 }
  const gen = (vocab?: Parameters<typeof generateLocalBusinessSchema>[5]) =>
    generateLocalBusinessSchema(business, seo, schemaCfg, {}, 'https://x.test', vocab) as Record<string, unknown>

  it('REGRESSION LOCK: no vocabulary arg emits the exact historical 6-term pest list', () => {
    expect(gen().knowsAbout).toEqual([
      'Pest Control', 'Termite Treatment', 'Mosquito Control',
      'Rodent Control', 'Bed Bug Treatment', 'Ant Control',
    ])
  })

  it('explicit pest vocabulary deep-equals the no-arg output', () => {
    // This is what proves passing a resolved vocabulary cannot move a pest
    // tenant: for pest, passing it and passing nothing are the same schema.
    expect(gen(PEST_CONTROL_VOCABULARY)).toEqual(gen())
  })

  it('irrigation emits the 8 irrigation terms', () => {
    expect(gen(IRRIGATION_VOCABULARY).knowsAbout).toEqual([
      'Irrigation', 'Sprinkler System Installation', 'Sprinkler Repair',
      'Drainage Systems', 'French Drains', 'Pond and Lake Pump Systems',
      'Sod Installation', 'Grading',
    ])
    expect(IRRIGATION_VOCABULARY.serviceType).toBe('Irrigation')
  })

  it('irrigation schema contains ZERO pest terms anywhere in the serialized output', () => {
    expect(JSON.stringify(gen(IRRIGATION_VOCABULARY)))
      .not.toMatch(/pest|termite|mosquito|rodent|bed bug|ant control/i)
  })

  it('every vocabulary is frozen and rejects mutation in strict mode', () => {
    for (const vocab of [PEST_CONTROL_VOCABULARY, IRRIGATION_VOCABULARY]) {
      expect(Object.isFrozen(vocab)).toBe(true)
      expect(Object.isFrozen(vocab.knowsAbout)).toBe(true)
      expect(() => { (vocab.knowsAbout as string[]).push('Corrupted') }).toThrow()
      expect(() => { (vocab as { serviceType: string }).serviceType = 'Corrupted' }).toThrow()
    }
  })

  it('knowsAbout is emitted BY REFERENCE — the reason freezing is load-bearing', () => {
    // Documents the hazard: the emitted schema shares the frozen array, so
    // without Object.freeze a caller mutating an emitted schema would corrupt
    // the default for every later call process-wide.
    expect(gen(IRRIGATION_VOCABULARY).knowsAbout).toBe(IRRIGATION_VOCABULARY.knowsAbout)
    expect(() => { (gen().knowsAbout as string[]).push('Corrupted') }).toThrow()
    expect(gen().knowsAbout).toHaveLength(6)
  })
})

describe('PR A — getSchemaVocabulary', () => {
  it('resolves pest to the historical vocabulary', () => {
    expect(getSchemaVocabulary('pest')).toBe(PEST_CONTROL_VOCABULARY)
  })

  it('resolves irrigation to the irrigation vocabulary', () => {
    expect(getSchemaVocabulary('irrigation')).toBe(IRRIGATION_VOCABULARY)
  })

  it('THROWS for a registered vertical with no vocabulary — never emits pest for it', () => {
    for (const v of ['lawn', 'pool', 'hvac', 'roof', 'trailer'] as const) {
      expect(() => getSchemaVocabulary(v)).toThrow(new RegExp(v))
    }
  })

  it('the layout wiring is byte-identical for pest: resolved vocabulary === no-arg default', () => {
    // This is the invariant Dang depends on. layout.tsx now always passes a
    // vocabulary; for a pest tenant that must produce the same schema the
    // previous no-arg call produced.
    const business = { name: 'B', phone: 'p', email: 'e', address: 'a' }
    const seo = { meta_description: '', service_areas: [], certifications: [], founded_year: '', owner_name: '' }
    const cfg = { aggregate_rating: { value: 0, count: 0 }, service_radius_miles: 0 }
    const withResolved = generateLocalBusinessSchema(business, seo, cfg, {}, 'https://x.test', getSchemaVocabulary('pest'))
    const withNothing = generateLocalBusinessSchema(business, seo, cfg, {}, 'https://x.test')
    expect(withResolved).toEqual(withNothing)
    expect(JSON.stringify(withResolved)).toBe(JSON.stringify(withNothing))
  })
})

// ── S293 PR A — an UNRECORDED vertical claims nothing ────────────────────────
//
// Verified in production before this change:
//   pls.pestflowpro.ai       knowsAbout: Irrigation, Sprinkler System
//                            Installation, … — CORRECT
//   vita-glow.pestflowpro.ai knowsAbout: Pest Control, Termite Treatment,
//                            Mosquito Control, Rodent Control, Bed Bug
//                            Treatment, Ant Control — WRONG
//
// The resolver was never broken. resolveVertical ends `: 'pest'`, so a NULL
// vertical resolved to pest and getSchemaVocabulary faithfully returned the
// pest vocabulary for it.

describe('S293 — resolveSchemaVocabulary keys on the EXPLICIT vertical only', () => {
  it('resolves the two registered verticals to their own vocabularies', () => {
    expect(resolveSchemaVocabulary('pest')).toBe(PEST_CONTROL_VOCABULARY)
    expect(resolveSchemaVocabulary('irrigation')).toBe(IRRIGATION_VOCABULARY)
  })

  it('returns NULL for an unrecorded vertical — vita-glow, live', () => {
    for (const v of [null, undefined, '', '   ']) {
      expect(resolveSchemaVocabulary(v as string | null | undefined), `for ${JSON.stringify(v)}`).toBeNull()
    }
  })

  it('returns NULL for a registered vertical with no vocabulary, rather than throwing', () => {
    // Differs from getSchemaVocabulary DELIBERATELY: a render path must degrade
    // to claiming nothing, not take a live site down.
    for (const v of ['lawn', 'pool', 'hvac', 'roof', 'trailer']) {
      expect(resolveSchemaVocabulary(v), `for ${v}`).toBeNull()
      expect(() => getSchemaVocabulary(v as never)).toThrow()
    }
  })

  it('returns NULL for junk and for near-misses the CHECK constraint rejects', () => {
    for (const v of ['Pest', 'PEST', 'pest-control', 'Medical Aesthetics', 'hvac ']) {
      expect(resolveSchemaVocabulary(v), `for ${v}`).toBeNull()
    }
  })

  it('does NOT consult industry prose — the fallback resolveVertical uses', () => {
    // resolveVertical('') with industry 'irrigation and drainage' returns
    // 'irrigation'. A schema claim must not be decided by editable prose.
    expect(resolveSchemaVocabulary('irrigation and sprinkler system installation')).toBeNull()
    expect(resolveSchemaVocabulary('Medical Aesthetics')).toBeNull()
  })
})

describe('S293 — the emitted schema for an unrecorded vertical', () => {
  const business = { name: 'Vita Glow Wellness', phone: 'p', email: 'e', address: 'a' }
  const seo = { meta_description: '', service_areas: [], certifications: [], founded_year: '', owner_name: '' }
  const cfg = { aggregate_rating: { value: 0, count: 0 }, service_radius_miles: 0 }
  const neutral = generateLocalBusinessSchema(business, seo, cfg, {}, 'https://x.test', null) as Record<string, unknown>

  it('OMITS knowsAbout entirely — no key, not an empty array', () => {
    expect(Object.prototype.hasOwnProperty.call(neutral, 'knowsAbout')).toBe(false)
  })

  it('carries ZERO pest vocabulary anywhere in the serialized output', () => {
    expect(JSON.stringify(neutral))
      .not.toMatch(/\bpest\b|\btermite\b|\bmosquito\b|\brodent\b|bed ?bug|\bant control\b|\bexterminator\b/i)
  })

  it('carries no OTHER trade either — not irrigation, not a generic stand-in', () => {
    const json = JSON.stringify(neutral)
    expect(json).not.toMatch(/\birrigation\b|\bsprinkler\b|\bdrainage\b/i)
    expect(json).not.toMatch(/home services|general services/i)
  })

  it('types as LocalBusiness ALONE — HomeAndConstructionBusiness is a subtype CLAIM', () => {
    expect(neutral['@type']).toEqual(['LocalBusiness'])
    expect(neutral['@type']).not.toContain('HomeAndConstructionBusiness')
  })

  it('still emits everything that comes from the tenant\'s own record', () => {
    // The point is not a stripped-down node. Name, phone, email, url and @id are
    // tenant facts and must survive — only the CLAIMS are dropped.
    expect(neutral.name).toBe('Vita Glow Wellness')
    expect(neutral.telephone).toBe('p')
    expect(neutral.email).toBe('e')
    expect(neutral.url).toBe('https://x.test')
    expect(neutral['@id']).toBe('https://x.test/#organization')
    expect(Object.keys(neutral).length).toBeGreaterThan(8)
  })

  it('Service schema omits serviceType for an unrecorded trade', () => {
    const svc = generateServiceSchema('Injectables', 'd', 'https://x.test/injectables', 'https://x.test', null) as Record<string, unknown>
    expect(Object.prototype.hasOwnProperty.call(svc, 'serviceType')).toBe(false)
    expect(svc.name).toBe('Injectables')
    expect(svc.provider).toEqual({ '@id': 'https://x.test/#organization' })
    expect(JSON.stringify(svc)).not.toMatch(/pest/i)
  })
})

describe('S293 — recorded verticals stay BYTE-IDENTICAL', () => {
  const business = { name: 'B', phone: 'p', email: 'e', address: 'a' }
  const seo = { meta_description: '', service_areas: [], certifications: [], founded_year: '', owner_name: '' }
  const cfg = { aggregate_rating: { value: 0, count: 0 }, service_radius_miles: 0 }
  const gen = (vocab?: Parameters<typeof generateLocalBusinessSchema>[5]) =>
    generateLocalBusinessSchema(business, seo, cfg, {}, 'https://x.test', vocab)

  it('THE LOCK: pest via the new resolver === the historical no-arg output, byte for byte', () => {
    expect(JSON.stringify(gen(resolveSchemaVocabulary('pest')))).toBe(JSON.stringify(gen()))
  })

  it('pest keeps the two-element @type it has always emitted', () => {
    expect((gen() as Record<string, unknown>)['@type']).toEqual(['LocalBusiness', 'HomeAndConstructionBusiness'])
    expect(DEFAULT_BUSINESS_TYPE).toEqual(['LocalBusiness', 'HomeAndConstructionBusiness'])
  })

  it('irrigation via the new resolver === via getSchemaVocabulary', () => {
    expect(JSON.stringify(gen(resolveSchemaVocabulary('irrigation'))))
      .toBe(JSON.stringify(gen(getSchemaVocabulary('irrigation'))))
  })

  it('a vocabulary MAY override @type — the slot a non-construction trade needs', () => {
    const medical = { knowsAbout: Object.freeze(['Injectables']), serviceType: 'Medical Aesthetics', businessType: Object.freeze(['LocalBusiness', 'HealthAndBeautyBusiness']) }
    expect((gen(medical) as Record<string, unknown>)['@type']).toEqual(['LocalBusiness', 'HealthAndBeautyBusiness'])
  })

  it('the neutral and default type constants are frozen and distinct', () => {
    expect(Object.isFrozen(NEUTRAL_BUSINESS_TYPE)).toBe(true)
    expect(Object.isFrozen(DEFAULT_BUSINESS_TYPE)).toBe(true)
    expect(NEUTRAL_BUSINESS_TYPE).not.toEqual(DEFAULT_BUSINESS_TYPE)
  })
})
