import { describe, it, expect } from 'vitest'
import {
  mappableAreas, buildStaticMapPath, serviceAreaRevision, buildMapAlt, cityLabel,
  resolveServiceAreaMap, MAP_LABELS, MAX_MARKERS, MAP_DEFAULTS,
  type ServiceAreaRow,
} from './serviceAreaMap'
import { signStaticMapUrl, STATIC_MAPS_HOST, encodeUrlSafeBase64, decodeUrlSafeBase64 } from './signStaticMapUrl'

// ── Fixtures from the live table (2026-08-24) ───────────────────────────────
//
// pls's five real cities. Coordinates are city centroids; they are fixture
// values here, and nothing in this suite geocodes anything.
const PLS: ServiceAreaRow[] = [
  { city: 'Hawkins', slug: 'hawkins', state: 'TX', is_live: true, latitude: 32.5876, longitude: -95.2033 },
  { city: 'Holly Lake Ranch', slug: 'holly-lake-ranch', state: 'TX', is_live: true, latitude: 32.7115, longitude: -95.1913 },
  { city: 'Lindale', slug: 'lindale', state: 'TX', is_live: true, latitude: 32.5185, longitude: -95.4097 },
  { city: 'Longview', slug: 'longview', state: 'TX', is_live: true, latitude: 32.5007, longitude: -94.7405 },
  { city: 'Tyler', slug: 'tyler', state: 'TX', is_live: true, latitude: 32.3513, longitude: -95.3011 },
]

const one = (over: Partial<ServiceAreaRow> = {}): ServiceAreaRow => ({
  city: 'Hawkins', slug: 'hawkins', state: 'TX', is_live: true, latitude: 32.5876, longitude: -95.2033, ...over,
})

/** N synthetic cities, spread so no two share a coordinate. */
function many(n: number): ServiceAreaRow[] {
  return Array.from({ length: n }, (_, i) => one({
    city: `City ${i + 1}`, slug: `city-${i + 1}`,
    latitude: 32 + i * 0.05, longitude: -95 - i * 0.05,
  }))
}

describe('the fixture is real (these guards cannot pass vacuously)', () => {
  it('pls has five live cities with distinct coordinates', () => {
    expect(PLS.length).toBe(5)
    expect(mappableAreas(PLS).length).toBe(PLS.length)
    expect(new Set(PLS.map((c) => `${c.latitude},${c.longitude}`)).size).toBe(5)
    expect(PLS.every((c) => c.is_live === true)).toBe(true)
  })

  it('mappableAreas actually returns them — the suite is not asserting against []', () => {
    expect(mappableAreas(PLS).map((c) => c.city))
      .toEqual(['Hawkins', 'Holly Lake Ranch', 'Lindale', 'Longview', 'Tyler'])
  })
})

describe('marker URL construction for 0, 1, 5 and 20 cities', () => {
  it('0 cities: there is no URL, callers must render nothing', () => {
    expect(mappableAreas([])).toEqual([])
    expect(() => buildStaticMapPath([])).toThrow(/render nothing/)
  })

  it('1 city: exactly one marker', () => {
    const path = buildStaticMapPath(mappableAreas([one()]))
    expect(path.match(/markers=/g)).toHaveLength(1)
    expect(decodeURIComponent(path)).toContain('32.5876,-95.2033')
  })

  it('5 cities: five markers, labelled 1-5, each city\'s own coordinates', () => {
    const path = buildStaticMapPath(mappableAreas(PLS))
    expect(path.match(/markers=/g)).toHaveLength(5)
    const decoded = decodeURIComponent(path)
    PLS.forEach((c, i) => {
      expect(decoded).toContain(`label:${i + 1}|${c.latitude},${c.longitude}`)
    })
  })

  it('20 cities: twenty markers, labels stay unique', () => {
    const cities = mappableAreas(many(20))
    expect(cities).toHaveLength(20)
    const path = buildStaticMapPath(cities)
    expect(path.match(/markers=/g)).toHaveLength(20)
    expect(new Set(cities.map((c) => c.label)).size).toBe(20)
  })

  it('past 9 the labels are letters, because a Static Maps label is ONE character', () => {
    const cities = mappableAreas(many(12))
    expect(cities.map((c) => c.label).join('')).toBe('123456789ABC')
    for (const c of cities) expect(c.label).toHaveLength(1)
  })

  it('dang\'s 18 live cities all get a distinct label', () => {
    const cities = mappableAreas(many(18))
    expect(cities).toHaveLength(18)
    expect(new Set(cities.map((c) => c.label)).size).toBe(18)
  })

  it('past 35 the markers go UNLABELLED rather than repeating a label', () => {
    const cities = mappableAreas(many(40))
    expect(cities).toHaveLength(MAX_MARKERS)
    expect(MAP_LABELS).toHaveLength(MAX_MARKERS)
    const path = buildStaticMapPath([...cities, { ...cities[0], label: '1' }])
    expect(path).not.toContain('label%3A')
    expect(decodeURIComponent(path)).not.toContain('label:')
  })

  it('the viewport is AUTO-FIT: no center and no zoom are ever emitted', () => {
    for (const n of [1, 5, 20]) {
      const path = buildStaticMapPath(mappableAreas(many(n)))
      expect(path, `${n} cities emitted a center`).not.toMatch(/[?&]center=/)
      expect(path, `${n} cities emitted a zoom`).not.toMatch(/[?&]zoom=/)
    }
  })
})

describe('THE REJECTED DESIGN CANNOT CREEP BACK IN', () => {
  // A ring is a coverage COMMITMENT to every point inside it. Static Maps has no
  // radius parameter, so a circle would arrive as a many-segment `path=`. These
  // assertions exist so that reappears as a red test and not as a live claim.
  const FORBIDDEN: Array<[string, RegExp]> = [
    ['radius', /radius/i],
    ['circle', /circle/i],
    ['path (how a ring would have to be drawn)', /[?&]path=/],
    ['visible (silently widens the viewport)', /[?&]visible=/],
    ['center', /[?&]center=/],
    ['zoom', /[?&]zoom=/],
  ]

  for (const [name, re] of FORBIDDEN) {
    it(`no generated URL contains ${name}`, () => {
      for (const n of [1, 5, 18, 20, 35]) {
        const path = buildStaticMapPath(mappableAreas(many(n)))
        expect(path, `${n} cities`).not.toMatch(re)
        expect(decodeURIComponent(path), `${n} cities (decoded)`).not.toMatch(re)
      }
    })
  }

  it('the forbidden matchers are live — each fires on a URL that does contain it', () => {
    // Without this, all six assertions above would keep passing if the regexes
    // were broken. Twelve occurrences of that failure in this arc.
    const planted = '/maps/api/staticmap?size=640x400&center=32,-95&zoom=9&path=circle:radius&visible=32,-95'
    for (const [name, re] of FORBIDDEN) {
      expect(re.test(planted), `${name} matcher is dead`).toBe(true)
    }
  })
})

describe('a city we could not place is omitted, never approximated', () => {
  it('NULL coordinates drop the city', () => {
    expect(mappableAreas([one({ latitude: null }), one({ longitude: null })])).toEqual([])
    expect(mappableAreas([one({ latitude: undefined, longitude: undefined })])).toEqual([])
  })

  it('a tenant whose cities ALL lack coordinates maps nothing at all', () => {
    const ungeocoded = PLS.map((c) => ({ ...c, latitude: null, longitude: null }))
    expect(mappableAreas(ungeocoded)).toEqual([])
    expect(resolveServiceAreaMap({
      areas: ungeocoded, stored: { url: 'https://x/y.png', revision: 'abc' }, businessName: 'PLS',
    })).toBeNull()
  })

  it('a mixed tenant maps only the cities that have coordinates', () => {
    const mixed = [PLS[0], { ...PLS[1], latitude: null }, PLS[2]]
    expect(mappableAreas(mixed).map((c) => c.city)).toEqual(['Hawkins', 'Lindale'])
  })

  it('labels renumber over the SURVIVORS — no gap where a dropped city was', () => {
    const mixed = [PLS[0], { ...PLS[1], latitude: null }, PLS[2]]
    expect(mappableAreas(mixed).map((c) => c.label)).toEqual(['1', '2'])
  })

  it('0,0 is Null Island, not a Texas town', () => {
    expect(mappableAreas([one({ latitude: 0, longitude: 0 })])).toEqual([])
    // …but a real 0 on one axis alone is a legitimate coordinate.
    expect(mappableAreas([one({ latitude: 0, longitude: -95.2 })])).toHaveLength(1)
  })

  it('out-of-range and unparseable coordinates are dropped, not clamped', () => {
    for (const bad of [{ latitude: 91 }, { latitude: -91 }, { longitude: 181 }, { longitude: -181 },
      { latitude: NaN }, { latitude: 'not a number' }, { latitude: '' }, { latitude: {} as never }]) {
      expect(mappableAreas([one(bad)]), JSON.stringify(bad)).toEqual([])
    }
  })

  it('numeric columns arriving as STRINGS still map — PostgREST sends numeric as text', () => {
    const asText = mappableAreas([one({ latitude: '32.5876', longitude: '-95.2033' })])
    expect(asText).toHaveLength(1)
    expect(asText[0].latitude).toBe(32.5876)
  })
})

describe('is_live = false never appears', () => {
  it('a draft city is not marked', () => {
    expect(mappableAreas([one({ is_live: false })])).toEqual([])
    expect(mappableAreas([one({ is_live: null })])).toEqual([])
    expect(mappableAreas([one({ is_live: undefined })])).toEqual([])
  })

  it('drafts are dropped from a mixed set and do not consume a label', () => {
    const mixed = [PLS[0], { ...PLS[1], is_live: false }, PLS[2]]
    const got = mappableAreas(mixed)
    expect(got.map((c) => c.city)).toEqual(['Hawkins', 'Lindale'])
    expect(got.map((c) => c.label)).toEqual(['1', '2'])
  })

  it('a draft city\'s coordinates reach no URL', () => {
    const draft = one({ city: 'Gladewater', is_live: false, latitude: 32.5465, longitude: -94.9438 })
    const path = buildStaticMapPath(mappableAreas([...PLS, draft]))
    expect(decodeURIComponent(path)).not.toContain('32.5465')
    expect(decodeURIComponent(path)).not.toContain('-94.9438')
    expect(path.match(/markers=/g)).toHaveLength(5)
  })
})

describe('the signed URL is well-formed and the secret never leaks', () => {
  // A real-shaped test secret. Not a live credential.
  const SECRET = 'aGVsbG8td29ybGQtdGVzdC1zZWNyZXQ='.replace(/=/g, '')
  const KEY = 'AIzaSyTEST-not-a-real-key'

  it('signs to an absolute Google URL carrying key and signature', async () => {
    const path = buildStaticMapPath(mappableAreas(PLS))
    const signed = await signStaticMapUrl(path, KEY, SECRET)
    expect(signed.startsWith(`${STATIC_MAPS_HOST}/maps/api/staticmap?`)).toBe(true)
    expect(new URL(signed).searchParams.get('key')).toBe(KEY)
    // A SHA-1 digest is 20 bytes, so the base64 is exactly 27 characters plus a
    // single '=' pad — and Google's URL-safe alphabet keeps that pad. Asserting
    // the exact shape means a truncated or double-encoded digest fails here.
    const sig = new URL(signed).searchParams.get('signature') ?? ''
    expect(sig).toMatch(/^[A-Za-z0-9_-]{27}=$/)
    expect(sig).not.toMatch(/[+/]/)
  })

  it('emits Google\'s URL-SAFE alphabet, never standard base64', () => {
    // 0xFF 0xFE 0xFD is "//79" under standard base64 and "__79" URL-safe; 0x03
    // 0xEF 0xFF gives "A+//" → "A-__". Both '+' and '/' are covered, so a
    // plain btoa() cannot pass this.
    expect(encodeUrlSafeBase64(new Uint8Array([0xff, 0xfe, 0xfd]).buffer)).toBe('__79')
    expect(encodeUrlSafeBase64(new Uint8Array([0x03, 0xef, 0xff]).buffer)).toBe('A-__')
    expect(encodeUrlSafeBase64(new Uint8Array([0xff, 0xfe, 0xfd]).buffer)).not.toMatch(/[+/]/)
  })

  it('decodes the URL-safe alphabet back, padding or not', () => {
    expect(Array.from(decodeUrlSafeBase64('__79'))).toEqual([0xff, 0xfe, 0xfd])
    expect(Array.from(decodeUrlSafeBase64('A-__'))).toEqual([0x03, 0xef, 0xff])
    // Google issues secrets unpadded; atob would reject that without the pad.
    expect(Array.from(decodeUrlSafeBase64('QQ'))).toEqual([0x41])
  })

  it('the SECRET itself appears nowhere in the output', async () => {
    const signed = await signStaticMapUrl(buildStaticMapPath(mappableAreas(PLS)), KEY, SECRET)
    expect(signed).not.toContain(SECRET)
    expect(signed).not.toContain(decodeURIComponent(SECRET))
  })

  it('is deterministic, and changes when the markers change', async () => {
    const a = await signStaticMapUrl(buildStaticMapPath(mappableAreas(PLS)), KEY, SECRET)
    const b = await signStaticMapUrl(buildStaticMapPath(mappableAreas(PLS)), KEY, SECRET)
    const c = await signStaticMapUrl(buildStaticMapPath(mappableAreas(PLS.slice(0, 3))), KEY, SECRET)
    expect(a).toBe(b)
    expect(c).not.toBe(a)
  })

  it('a different secret produces a different signature — the secret is really used', async () => {
    const path = buildStaticMapPath(mappableAreas(PLS))
    const one_ = await signStaticMapUrl(path, KEY, SECRET)
    const two = await signStaticMapUrl(path, KEY, 'ZGlmZmVyZW50LXNlY3JldA')
    expect(new URL(one_).searchParams.get('signature'))
      .not.toBe(new URL(two).searchParams.get('signature'))
  })

  it('the key is inside the signed material — signing after appending, not before', async () => {
    const path = buildStaticMapPath(mappableAreas(PLS))
    const a = await signStaticMapUrl(path, KEY, SECRET)
    const b = await signStaticMapUrl(path, 'AIzaSyTEST-a-different-key', SECRET)
    expect(new URL(a).searchParams.get('signature'))
      .not.toBe(new URL(b).searchParams.get('signature'))
  })

  it('refuses to sign nonsense', async () => {
    await expect(signStaticMapUrl('https://evil.example/maps/x', KEY, SECRET)).rejects.toThrow()
    await expect(signStaticMapUrl('/maps/api/staticmap?a=1', '', SECRET)).rejects.toThrow(/API key/)
    await expect(signStaticMapUrl('/maps/api/staticmap?a=1', KEY, '')).rejects.toThrow(/signing secret/)
  })
})

describe('alt text names the real cities', () => {
  it('names every one of pls\'s five towns', () => {
    const alt = buildMapAlt(mappableAreas(PLS), 'Precision Lawn Systems LLC')
    for (const c of PLS) expect(alt).toContain(c.city)
    expect(alt).toContain('Precision Lawn Systems LLC')
    expect(alt).not.toBe('Map')
  })

  it('states are included when recorded', () => {
    expect(buildMapAlt(mappableAreas(PLS), 'PLS')).toContain('Hawkins, TX')
    expect(cityLabel({ city: 'Arp' })).toBe('Arp')
    expect(cityLabel({ city: 'Arp', state: 'TX' })).toBe('Arp, TX')
  })

  it('a long list is summarised rather than unreadable', () => {
    const alt = buildMapAlt(mappableAreas(many(18)), 'Dang')
    expect(alt).toContain('and 10 more')
    expect(alt).toContain('City 1')
    expect(alt).not.toContain('City 18')
  })

  it('an unnamed business still yields sensible alt, not "undefined\'s"', () => {
    const alt = buildMapAlt(mappableAreas(PLS), '')
    expect(alt).not.toMatch(/undefined|null/)
    expect(alt).toContain('Hawkins')
  })
})

describe('resolveServiceAreaMap — the render path\'s one decision', () => {
  const cities = mappableAreas(PLS)
  const REV = serviceAreaRevision(cities)
  const stored = { url: 'https://cdn.example/maps/pls/abc.png', revision: REV, width: 1280, height: 800 }

  it('returns a map when coordinates, an image and a matching revision all exist', () => {
    const got = resolveServiceAreaMap({ areas: PLS, stored, businessName: 'PLS' })
    expect(got).not.toBeNull()
    expect(got!.url).toBe(stored.url)
    expect(got!.cities).toHaveLength(5)
    expect(got!.alt).toContain('Hawkins')
  })

  it('zero cities is refused on its OWN merits, not via the revision check', () => {
    // With a stored revision that MATCHES the empty set, the staleness branch
    // cannot be what rejects this. Only the emptiness check can.
    const emptyRev = serviceAreaRevision([])
    expect(resolveServiceAreaMap({
      areas: [], stored: { url: 'https://x/y.png', revision: emptyRev }, businessName: 'PLS',
    })).toBeNull()
  })

  it('RENDERS NOTHING when there are no live service areas', () => {
    expect(resolveServiceAreaMap({ areas: [], stored, businessName: 'PLS' })).toBeNull()
    expect(resolveServiceAreaMap({ areas: null, stored, businessName: 'PLS' })).toBeNull()
    // vita-glow: zero service_areas rows in the live table.
    expect(resolveServiceAreaMap({ areas: undefined, stored, businessName: 'Vita Glow Wellness' })).toBeNull()
  })

  it('a missing image URL is refused on its OWN merits, not via the revision check', () => {
    // With a MATCHING revision, only the url check can reject these.
    for (const bad of [{}, { url: '' }, { url: '   ' }, { url: 42 }, { url: null }]) {
      expect(resolveServiceAreaMap({
        areas: PLS, stored: { ...bad, revision: REV }, businessName: 'PLS',
      }), JSON.stringify(bad)).toBeNull()
    }
    // …and the same stored object WITH a url resolves, so the guard above is
    // not simply rejecting everything.
    expect(resolveServiceAreaMap({
      areas: PLS, stored: { url: 'https://x/y.png', revision: REV }, businessName: 'PLS',
    })).not.toBeNull()
  })

  it('RENDERS NOTHING when no image has been generated yet', () => {
    for (const s of [null, undefined, {}, { url: '' }, { url: '   ' }, { url: 'x' }, { url: 'x', revision: '' }]) {
      expect(resolveServiceAreaMap({ areas: PLS, stored: s, businessName: 'PLS' }), JSON.stringify(s)).toBeNull()
    }
  })

  it('RENDERS NOTHING when the stored image depicts a different set of cities', () => {
    // A stale map is a wrong coverage claim. Withhold it, do not show it.
    expect(resolveServiceAreaMap({
      areas: [...PLS, one({ city: 'Gladewater', slug: 'gladewater', latitude: 32.5465, longitude: -94.9438 })],
      stored, businessName: 'PLS',
    })).toBeNull()
    expect(resolveServiceAreaMap({ areas: PLS.slice(0, 4), stored, businessName: 'PLS' })).toBeNull()
  })

  it('a renamed city invalidates the image', () => {
    const renamed = [{ ...PLS[0], city: 'Big Sandy' }, ...PLS.slice(1)]
    expect(resolveServiceAreaMap({ areas: renamed, stored, businessName: 'PLS' })).toBeNull()
  })

  it('a re-geocoded city invalidates the image', () => {
    const moved = [{ ...PLS[0], latitude: 32.9999 }, ...PLS.slice(1)]
    expect(resolveServiceAreaMap({ areas: moved, stored, businessName: 'PLS' })).toBeNull()
  })

  it('falls back to the rendered pixel size when the stored dimensions are junk', () => {
    const got = resolveServiceAreaMap({ areas: PLS, stored: { url: 'https://x/y.png', revision: REV }, businessName: 'PLS' })
    expect(got!.width).toBe(MAP_DEFAULTS.width * MAP_DEFAULTS.scale)
    expect(got!.height).toBe(MAP_DEFAULTS.height * MAP_DEFAULTS.scale)
  })
})

describe('the revision is a content key, not a clock', () => {
  const cities = mappableAreas(PLS)

  it('is stable across calls — it must not churn nine images per deploy', () => {
    expect(serviceAreaRevision(cities)).toBe(serviceAreaRevision(cities))
  })

  it('changes when a city is added, removed, renamed or moved', () => {
    const base = serviceAreaRevision(cities)
    expect(serviceAreaRevision(mappableAreas(PLS.slice(0, 4)))).not.toBe(base)
    expect(serviceAreaRevision(mappableAreas([...PLS, one({ city: 'Gladewater', latitude: 32.5465, longitude: -94.9438 })]))).not.toBe(base)
    expect(serviceAreaRevision(mappableAreas([{ ...PLS[0], city: 'Big Sandy' }, ...PLS.slice(1)]))).not.toBe(base)
    expect(serviceAreaRevision(mappableAreas([{ ...PLS[0], latitude: 32.9 }, ...PLS.slice(1)]))).not.toBe(base)
  })

  it('changes when the image DIMENSIONS change, or old images would be served at a new size', () => {
    expect(serviceAreaRevision(cities, { width: 800 })).not.toBe(serviceAreaRevision(cities))
  })

  it('does NOT change for sub-metre coordinate noise', () => {
    // 5dp ≈ 1.1m. Re-geocoding must not invalidate nine images over rounding.
    const jittered = [{ ...PLS[0], latitude: 32.5876000001 }, ...PLS.slice(1)]
    expect(serviceAreaRevision(mappableAreas(jittered))).toBe(serviceAreaRevision(cities))
  })

  it('is a short hex string, safe in a URL and a filename', () => {
    expect(serviceAreaRevision(cities)).toMatch(/^[0-9a-f]{8}$/)
  })
})
