import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { readFileSync } from 'node:fs'
import { ServiceAreaMap } from '../ServiceAreaMap'
import { mappableAreas, serviceAreaRevision, type ServiceAreaRow } from '../../../../../shared/lib/serviceAreaMap'

// The REAL component, rendered. Asserting the helper alone would pass while the
// markup still shows a placeholder frame — the distinction PR B was built on.

const PLS: ServiceAreaRow[] = [
  { city: 'Hawkins', slug: 'hawkins', state: 'TX', is_live: true, latitude: 32.5876, longitude: -95.2033 },
  { city: 'Holly Lake Ranch', slug: 'holly-lake-ranch', state: 'TX', is_live: true, latitude: 32.7115, longitude: -95.1913 },
  { city: 'Lindale', slug: 'lindale', state: 'TX', is_live: true, latitude: 32.5185, longitude: -95.4097 },
  { city: 'Longview', slug: 'longview', state: 'TX', is_live: true, latitude: 32.5007, longitude: -94.7405 },
  { city: 'Tyler', slug: 'tyler', state: 'TX', is_live: true, latitude: 32.3513, longitude: -95.3011 },
]
const REV = serviceAreaRevision(mappableAreas(PLS))
const STORED = { url: 'https://cdn.example/service-area-maps/pls/abc.png', revision: REV, width: 1280, height: 800 }

const render = (props: Partial<Parameters<typeof ServiceAreaMap>[0]> = {}) =>
  renderToStaticMarkup(createElement(ServiceAreaMap, {
    areas: PLS, stored: STORED, businessName: 'Precision Lawn Systems LLC', ...props,
  }))

describe('the component renders a real map when there is one', () => {
  it('emits the stored image with the tenant\'s own cities', () => {
    const html = render()
    expect(html).toContain(STORED.url)
    for (const c of PLS) expect(html, `${c.city} missing`).toContain(c.city)
  })

  it('holds layout: explicit width and height, lazy and async', () => {
    const html = render()
    expect(html).toMatch(/width="1280"/)
    expect(html).toMatch(/height="800"/)
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('decoding="async"')
  })

  it('alt text names the cities — not "Map"', () => {
    const alt = render().match(/alt="([^"]*)"/)?.[1] ?? ''
    expect(alt).toContain('Hawkins')
    expect(alt).toContain('Tyler')
    expect(alt).not.toBe('Map')
    expect(alt.length).toBeGreaterThan(30)
  })

  it('does NOT crop the bottom of the image — Google attribution is baked in there', () => {
    // The markup this replaced used `overflow-hidden` on the image's container,
    // which clips the attribution strip and breaks the Maps terms.
    const html = render()
    expect(html).not.toContain('overflow-hidden')
    expect(html).toContain('overflow:visible')
  })

  it('the city list is REAL HTML beside the image, labelled to match the markers', () => {
    const html = render()
    // Present AND visible. `<ol hidden>` and `aria-hidden` both satisfy a bare
    // toContain('<ol') while removing the list from everyone who needs it.
    const ol = html.match(/<ol\b[^>]*>/)?.[0] ?? ''
    expect(ol, 'no <ol> at all').not.toBe('')
    expect(ol, 'the city list is hidden').not.toMatch(/\bhidden\b|aria-hidden="true"|display:\s*none/)
    // Every marker label appears in the list, in order.
    const cities = mappableAreas(PLS)
    expect(cities.map((c) => c.label)).toEqual(['1', '2', '3', '4', '5'])
    for (const c of cities) {
      expect(html, `label ${c.label} missing from list`).toContain(`>${c.label}</span>`)
    }
    // …and coverage is legible with the image gone entirely.
    const withoutImg = html.replace(/<img[^>]*>/g, '')
    for (const c of PLS) expect(withoutImg, `${c.city} exists only inside the image`).toContain(c.city)
  })

  it('states are shown when recorded', () => {
    expect(render()).toContain('Hawkins, TX')
  })
})

describe('RENDER NOTHING — no placeholder, no empty frame, no gap', () => {
  const NOTHING = ''

  it('a tenant with no service areas renders literally nothing', () => {
    // vita-glow: zero rows in the live service_areas table.
    expect(render({ areas: [], businessName: 'Vita Glow Wellness' })).toBe(NOTHING)
  })

  it('a tenant whose cities all lack coordinates renders nothing', () => {
    const ungeocoded = PLS.map((c) => ({ ...c, latitude: null, longitude: null }))
    expect(render({ areas: ungeocoded })).toBe(NOTHING)
  })

  it('no generated image yet renders nothing', () => {
    expect(render({ stored: null })).toBe(NOTHING)
    expect(render({ stored: {} })).toBe(NOTHING)
  })

  it('a STALE image renders nothing rather than a wrong coverage claim', () => {
    expect(render({ stored: { ...STORED, revision: 'deadbeef' } })).toBe(NOTHING)
  })

  it('draft-only cities render nothing', () => {
    expect(render({ areas: PLS.map((c) => ({ ...c, is_live: false })) })).toBe(NOTHING)
  })

  it('"nothing" means no section, no frame and no spacer — not an empty div', () => {
    const html = render({ areas: [] })
    expect(html).not.toMatch(/<section|<div|<img|<ol/)
    expect(html.trim()).toHaveLength(0)
  })

  it('the empty assertion is not vacuous — the same component DOES render markup', () => {
    // If ServiceAreaMap returned null unconditionally, every test above would
    // still pass. This is the one that would fail.
    const html = render()
    expect(html.length).toBeGreaterThan(400)
    expect(html).toMatch(/<section/)
    expect(html).toMatch(/<img/)
  })
})

describe('the fabricated demo map is gone', () => {
  it('no component references /demo-coverage-map.svg any more', () => {
    // It was an abstract blob with dashed lines, shown to EVERY tenant as their
    // coverage area — a drawing of a territory nobody has.
    // Scoped to a REFERENCE — a src=, an import, a URL — not to the string
    // anywhere in the file. The replacement comment names the asset it removed,
    // and a guard that forbids naming the thing you deleted is a guard that
    // gets deleted itself.
    const page = readFileSync(new URL('../ServiceAreaPage.tsx', import.meta.url), 'utf8')
    const code = page.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n')
    expect(code).not.toMatch(/src=\{?["'][^"']*demo-coverage-map/)
    expect(code).not.toMatch(/from\s+["'][^"']*demo-coverage-map/)
    expect(page).toContain('ServiceAreaMap')
    // …and the guard is live: it fires on the markup that was there.
    expect(/src=\{?["'][^"']*demo-coverage-map/.test('<img src="/demo-coverage-map.svg" />')).toBe(true)
  })

  it('the file this guard reads is really ServiceAreaPage', () => {
    const page = readFileSync(new URL('../ServiceAreaPage.tsx', import.meta.url), 'utf8')
    expect(page).toContain('export function ServiceAreaPage')
    expect(page.length).toBeGreaterThan(1000)
  })
})

describe('nothing in the emitted HTML leaks a credential or the rejected design', () => {
  it('no API key, signature, or maps.googleapis URL reaches the page', () => {
    const html = render()
    expect(html).not.toContain('maps.googleapis.com')
    expect(html).not.toMatch(/[?&]key=/)
    expect(html).not.toMatch(/signature=/)
    expect(html).not.toMatch(/AIza/)
  })

  it('no radius or coverage-distance wording reaches the VISIBLE text', () => {
    // Scoped to what a visitor reads, not to the whole HTML: `border-radius`
    // and `rounded-full` are CSS, and a matcher that trips on them is a
    // matcher that will be deleted the first time it cries wolf. The text is
    // also the honest target — a coverage claim is words, not a stylesheet.
    const visibleText = (html: string) => html.replace(/<[^>]*>/g, ' ')
    const CLAIM = /\bradius\b|\bcircle\b|\bmiles?\b|\bwithin\b|\bsurrounding\b/i
    expect(visibleText(render())).not.toMatch(CLAIM)
    // The alt text is read aloud, so it counts as visible text too.
    expect(render().match(/alt="([^"]*)"/)?.[1] ?? '').not.toMatch(CLAIM)
    // …and the matcher is live: it fires on the copy this design rejected.
    expect(CLAIM.test('Serving a 25 mile radius around Big Sandy')).toBe(true)
    expect(CLAIM.test('and surrounding communities')).toBe(true)
    // …without tripping on the CSS that made the first version of this useless.
    // Note a hyphen IS a word boundary, so /\bradius\b/ matches "border-radius"
    // on its own — it is the tag-stripping that makes this safe, which is why
    // the probe runs through the same pipeline rather than against raw CSS.
    expect(CLAIM.test('border-radius')).toBe(true)
    expect(visibleText('<div style="border-radius:0.75rem" class="rounded-full">Hawkins, TX</div>'))
      .not.toMatch(CLAIM)
  })
})
