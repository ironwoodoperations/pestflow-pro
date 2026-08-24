import { describe, it, expect } from 'vitest'
import { cityFromBusinessInfo } from './businessCity'

// The corpus is every tenant's REAL stored address, read from
// settings.business_info on 2026-08-24. A parser tested only against invented
// addresses is tested against the shape you assumed, not the one you have.
const LIVE: Array<{ slug: string; address: string | null; expected: string }> = [
  { slug: 'apex-protect', address: '2110 W 6th St, Austin, TX 78703', expected: 'Austin' },
  { slug: 'coastal-pest', address: '1240 Seawall Blvd, Galveston, TX 77550', expected: 'Galveston' },
  { slug: 'dang', address: '816 Riding Road, Tyler, TX 75703', expected: 'Tyler' },
  { slug: 'heartland-pest', address: '1820 S Glenstone Ave, Springfield, MO 65804', expected: 'Springfield' },
  { slug: 'metro-pest-concierge', address: '4400 Post Oak Pkwy, Houston, TX 77027', expected: 'Houston' },
  { slug: 'pestflow-pro', address: '1204 S. Main Street, Tyler, TX 75701', expected: 'Tyler' },
  { slug: 'pls', address: '805 W Broadway St, Big Sandy, TX 75755', expected: 'Big Sandy' },
  { slug: 'urban-strike', address: '3401 Commerce St, Dallas, TX 75226', expected: 'Dallas' },
  // vita-glow has NO address row value at all. '' is the answer, and '' means
  // the caller omits the clause.
  { slug: 'vita-glow', address: null, expected: '' },
]

describe('cityFromBusinessInfo — against every live address', () => {
  for (const t of LIVE) {
    it(`${t.slug}: ${t.address ?? 'no address'} → ${t.expected || '(nothing)'}`, () => {
      expect(cityFromBusinessInfo({ address: t.address })).toBe(t.expected)
    })
  }

  it('the corpus is the real one, not a stub', () => {
    expect(LIVE.length).toBe(9)
    // Eight of nine parse to a city; only vita-glow yields ''. If a change made
    // the parser return '' for everything, this is what catches it.
    expect(LIVE.filter((t) => cityFromBusinessInfo({ address: t.address }) !== '').length).toBe(8)
    // Multi-word cities are in the corpus — a \w+ parser would fail here.
    expect(LIVE.some((t) => t.expected.includes(' '))).toBe(true)
  })
})

describe('cityFromBusinessInfo — what it refuses to invent', () => {
  it('returns \'\' rather than a placeholder when there is nothing to read', () => {
    for (const input of [undefined, null, {}, { address: '' }, { address: null }, { city: '' }]) {
      expect(cityFromBusinessInfo(input)).toBe('')
    }
  })

  it('never emits the old literal placeholder', () => {
    expect(cityFromBusinessInfo({})).not.toBe('Unknown City')
    expect(cityFromBusinessInfo({ address: 'Unknown' })).toBe('')
  })

  it('does not return the whole address when it cannot find a city', () => {
    // No state code, so no confident locality. Returning the address here is
    // the exact bug: "805 W Broadway St" reaching a prompt as a city.
    const addr = '805 W Broadway Street'
    expect(cityFromBusinessInfo({ address: addr })).toBe('')
    expect(cityFromBusinessInfo({ address: addr })).not.toContain('Broadway')
  })

  it('an explicit city field wins over the address parse', () => {
    expect(cityFromBusinessInfo({ city: 'Hawkins', address: '805 W Broadway St, Big Sandy, TX 75755' }))
      .toBe('Hawkins')
    // …but only when it is a real value. Every tenant's city is NULL today, so
    // a blank must fall through to the address rather than blank the result.
    expect(cityFromBusinessInfo({ city: '   ', address: '805 W Broadway St, Big Sandy, TX 75755' }))
      .toBe('Big Sandy')
    expect(cityFromBusinessInfo({ city: null, address: '816 Riding Road, Tyler, TX 75703' })).toBe('Tyler')
  })

  it('ignores non-string values instead of stringifying them', () => {
    // An address stored as a JSONB array stringifies to "1 A St,Reno,NV 89501",
    // which the parser WOULD happily read a city out of. A String() coercion
    // therefore has to be observable here, or this assertion proves nothing.
    expect(cityFromBusinessInfo({ address: ['1 A St', 'Reno', 'NV 89501'] })).toBe('')
    expect(cityFromBusinessInfo({ city: 42, address: 99 })).toBe('')
    expect(cityFromBusinessInfo({ address: { line1: 'x' } })).toBe('')
  })

  it('trims, and does not keep the state code or the ZIP', () => {
    const got = cityFromBusinessInfo({ address: '1820 S Glenstone Ave, Springfield, MO 65804' })
    expect(got).toBe('Springfield')
    expect(got).not.toMatch(/MO|65804|,/)
  })
})
