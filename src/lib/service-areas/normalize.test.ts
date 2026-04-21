import { describe, it, expect } from 'vitest'
import {
  normalizeCity,
  normalizeAll,
  parseRawInput,
  buildJsonbProjection,
} from './normalize'

describe('normalizeCity', () => {
  const cases: Array<[string, { city: string; slug: string; isCounty?: boolean }]> = [
    ['Dallas',           { city: 'Dallas',          slug: 'dallas-tx' }],
    ['dallas',           { city: 'Dallas',          slug: 'dallas-tx' }],
    ['DALLAS',           { city: 'Dallas',          slug: 'dallas-tx' }],
    ['Dallas, TX',       { city: 'Dallas',          slug: 'dallas-tx' }],
    ['Dallas TX',        { city: 'Dallas',          slug: 'dallas-tx' }],
    ['Dallas Texas',     { city: 'Dallas',          slug: 'dallas-tx' }],
    ['Dallas 75201',     { city: 'Dallas',          slug: 'dallas-tx' }],
    ['Dallas 75201-1234',{ city: 'Dallas',          slug: 'dallas-tx' }],
    ['Mckinney',         { city: 'Mckinney',        slug: 'mckinney-tx' }],
    ['Ft. worth',        { city: 'Fort Worth',      slug: 'fort-worth-tx' }],
    ['ft worth',         { city: 'Fort Worth',      slug: 'fort-worth-tx' }],
    ['Fort Worth',       { city: 'Fort Worth',      slug: 'fort-worth-tx' }],
    ['St. Paul',         { city: 'Saint Paul',      slug: 'saint-paul-tx' }],
    ['St. Moritz',       { city: 'St. Moritz',      slug: 'st-moritz-tx' }],
    ['N. Dallas',        { city: 'North Dallas',    slug: 'north-dallas-tx' }],
    ['Smith County',     { city: 'Smith County',    slug: 'smith-county-tx', isCounty: true }],
    ['College Station',  { city: 'College Station', slug: 'college-station-tx' }],
    ['Corpus Christi',   { city: 'Corpus Christi',  slug: 'corpus-christi-tx' }],
    ['Del Rio',          { city: 'Del Rio',         slug: 'del-rio-tx' }],
  ]

  for (const [input, expected] of cases) {
    it(`normalizes "${input}"`, () => {
      const result = normalizeCity(input)
      expect('rejected' in result).toBe(false)
      if (!('rejected' in result)) {
        expect(result.city).toBe(expected.city)
        expect(result.slug).toBe(expected.slug)
        if (expected.isCounty !== undefined) {
          expect(result.isCounty).toBe(expected.isCounty)
        }
      }
    })
  }

  it('rejects empty string', () => {
    expect(normalizeCity('')).toEqual({ rejected: 'empty' })
  })

  it('rejects whitespace-only string', () => {
    expect(normalizeCity('   ')).toEqual({ rejected: 'empty' })
  })

  it('rejects purely numeric input', () => {
    expect(normalizeCity('12345')).toEqual({ rejected: 'numeric' })
  })

  it('rejects strings over 100 chars', () => {
    expect(normalizeCity('x'.repeat(101))).toEqual({ rejected: 'too_long' })
  })
})

describe('parseRawInput', () => {
  it('splits comma-separated string', () => {
    expect(parseRawInput('Dallas, Frisco')).toEqual(['Dallas', 'Frisco'])
  })

  it('filters empty tokens from comma string', () => {
    expect(parseRawInput('Dallas, , Frisco')).toEqual(['Dallas', 'Frisco'])
  })

  it('passes array through', () => {
    expect(parseRawInput(['Dallas', 'Frisco'])).toEqual(['Dallas', 'Frisco'])
  })

  it('returns [] for null', () => {
    expect(parseRawInput(null)).toEqual([])
  })

  it('returns [] for undefined', () => {
    expect(parseRawInput(undefined)).toEqual([])
  })

  it('returns [] for empty string', () => {
    expect(parseRawInput('')).toEqual([])
  })
})

describe('normalizeAll dedup', () => {
  it('deduplicates by slug (last-write-wins)', () => {
    const result = normalizeAll('Dallas, dallas')
    expect(result.accepted).toHaveLength(1)
    expect(result.accepted[0].city).toBe('Dallas')
  })

  it('deduplicates "Dallas, Dallas TX"', () => {
    const result = normalizeAll('Dallas, Dallas TX')
    expect(result.accepted).toHaveLength(1)
  })
})

describe('buildJsonbProjection', () => {
  it('returns sorted live cities', () => {
    expect(buildJsonbProjection([
      { city: 'Tyler', is_live: true },
      { city: 'Longview', is_live: true },
    ])).toEqual(['Longview', 'Tyler'])
  })

  it('filters out is_live=false', () => {
    expect(buildJsonbProjection([
      { city: 'Tyler', is_live: true },
      { city: 'Arp', is_live: false },
    ])).toEqual(['Tyler'])
  })

  it('returns [] for empty input', () => {
    expect(buildJsonbProjection([])).toEqual([])
  })
})
