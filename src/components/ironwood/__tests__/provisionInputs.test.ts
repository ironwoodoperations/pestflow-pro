import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  VERTICAL_UNCHOSEN,
  readVerticalChoice,
  verticalSelectValue,
  verticalFromSelectValue,
  selectedServices,
  toggleService,
  servicesForPicker,
  verticalDecided,
  serviceSelectionOk,
  buildProvisionRequestBody,
} from '../provisionInputs'
import { CATALOG_SLUGS } from '../../../../shared/lib/serviceCatalog'
import { VERTICAL_OPTIONS } from '../../../lib/adminVerticalPreset'

// S342 — the provisioning inputs the Ironwood form never collected.
//
// The payload was previously built inside an async handler that refreshes a
// session and calls fetch(), so none of it was reachable from a test. It is now
// a pure function and this file exercises it directly.

const TIER = { tier: 3, plan_name: 'Pro', monthly_price: 349 }

const mkForm = (bi: Record<string, unknown> = {}) => ({
  slug: 'greenacre',
  company_name: 'Greenacre Lawn & Landscape',
  phone: '9035551234',
  admin_password: 'pw',
  tier: 'pro',
  business_info: bi,
  branding: {},
  customization: {},
} as any)

const build = (bi: Record<string, unknown>) => buildProvisionRequestBody({
  form: mkForm(bi), prospectId: 'p1', resolvedAdminEmail: 'admin@greenacre.com', tierData: TIER,
})

/** The brief's scenario: a maintenance-and-landscape company, 7 of 17. */
const LAWN_SELECTED = [
  'mowing-maintenance', 'seasonal-cleanup', 'tree-shrub-trimming',
  'landscape-design', 'hardscape-stonework', 'sprinkler-systems', 'artificial-turf',
]
const LAWN_NOT_SELECTED = [
  'lawn-fertilization', 'weed-control', 'lawn-aeration', 'overseeding',
  'grub-control', 'lawn-disease-control', 'soil-health',
  'mulch-bed-maintenance', 'perimeter-pest-control', 'mosquito-control',
]

describe('a lawn prospect with 7 of 17 ticked', () => {
  const body = build({ vertical: 'lawn', services: LAWN_SELECTED })

  it('the split is real', () => {
    expect(LAWN_SELECTED).toHaveLength(7)
    expect(CATALOG_SLUGS.lawn).toHaveLength(17)
    expect([...LAWN_SELECTED, ...LAWN_NOT_SELECTED].sort()).toEqual([...CATALOG_SLUGS.lawn].sort())
  })

  it('carries exactly those seven in top-level `services`', () => {
    expect(body.services).toEqual(LAWN_SELECTED)
  })

  it("carries vertical: 'lawn' INSIDE business_info, where provision-tenant reads it", () => {
    // validateVertical(wbi.vertical ?? body.business_info?.vertical) — verified
    // in provision-tenant/index.ts. Top-level would be ignored.
    expect((body.business_info as Record<string, unknown>).vertical).toBe('lawn')
    expect(body.vertical).toBeUndefined()
  })

  it('none of the ten unselected slugs appears anywhere', () => {
    const blob = JSON.stringify(body)
    for (const slug of LAWN_NOT_SELECTED) {
      expect(blob, `${slug} leaked into the payload`).not.toContain(slug)
    }
  })
})

describe('changing vertical clears the selection', () => {
  // THE SHARED SLUGS ARE THE POINT. sprinkler-systems and artificial-turf are
  // in BOTH the lawn and irrigation catalogs, so a naive "filter to the new
  // catalog" would let them survive a switch and silently seed the wrong trade.
  const SHARED = ['sprinkler-systems', 'artificial-turf']

  it('both shared slugs really are in both catalogs — or this test proves nothing', () => {
    for (const s of SHARED) {
      expect(CATALOG_SLUGS.lawn).toContain(s)
      expect(CATALOG_SLUGS.irrigation).toContain(s)
    }
  })

  it('the CONTRACT: a cleared selection reads back empty', () => {
    const afterSwitch = { vertical: 'irrigation', services: [] }
    expect(selectedServices(afterSwitch)).toEqual([])
    expect(serviceSelectionOk(afterSwitch)).toBe(false)
  })

  it('THE COMPONENT ACTUALLY CLEARS IT (source scan)', () => {
    // THE CONTRACT TEST ABOVE IS NOT ENOUGH, and mutation-testing proved it:
    // deleting `services: []` from the component's onChange left all 25 tests
    // green. A guard that cannot fail is the S319 defect, so this scans the real
    // handler. SiteContent renders JSX and its imports make it awkward to drive
    // headlessly for one assertion; the scan is honest about being a scan.
    const src = readFileSync(join(__dirname, '..', 'ProspectDetail.SiteContent.tsx'), 'utf8')
    const at = src.indexOf('verticalFromSelectValue(e.target.value)')
    expect(at, 'the vertical onChange handler is gone').toBeGreaterThan(-1)
    // Same setField call: the clear must travel WITH the vertical write, not be
    // a separate effect that could be reordered or skipped.
    const handler = src.slice(src.lastIndexOf('setField(', at), src.indexOf('})', at))
    expect(handler, 'changing vertical no longer clears the selection').toMatch(/services:\s*\[\]/)
  })

  it('a stale shared selection would NOT be silently valid', () => {
    // If the clear were ever dropped, the leftover slugs stay in the payload —
    // which is exactly what this asserts is visible rather than harmless.
    const stale = build({ vertical: 'irrigation', services: SHARED })
    expect(stale.services).toEqual(SHARED)
  })
})

describe('"not recorded" is a real, reachable answer', () => {
  it('the explicit option exists in VERTICAL_OPTIONS and maps to null', () => {
    expect(VERTICAL_OPTIONS.some((o) => o.value === '')).toBe(true)
    expect(verticalFromSelectValue('')).toBeNull()
  })

  it('produces vertical null and NO services key', () => {
    const body = build({ vertical: null })
    expect((body.business_info as Record<string, unknown>).vertical).toBeUndefined()
    expect(body.services).toBeUndefined()
  })

  it('and the checklist still passes', () => {
    const bi = { vertical: null }
    expect(verticalDecided(bi)).toBe(true)
    expect(serviceSelectionOk(bi)).toBe(true)
  })
})

describe('the checklist demands a DECISION, not just a non-empty field', () => {
  it('never touched -> fails', () => {
    expect(verticalDecided({})).toBe(false)
    expect(verticalSelectValue({})).toBe(VERTICAL_UNCHOSEN)
  })

  it('explicitly not recorded -> passes', () => {
    expect(verticalDecided({ vertical: null })).toBe(true)
    expect(verticalSelectValue({ vertical: null })).toBe('')
  })

  it('a catalog vertical with nothing ticked -> fails the service gate', () => {
    expect(verticalDecided({ vertical: 'lawn' })).toBe(true)
    expect(serviceSelectionOk({ vertical: 'lawn' })).toBe(false)
    expect(serviceSelectionOk({ vertical: 'lawn', services: [] })).toBe(false)
    expect(serviceSelectionOk({ vertical: 'lawn', services: ['weed-control'] })).toBe(true)
  })
})

describe('the picker', () => {
  it('is empty until a vertical is chosen', () => {
    expect(servicesForPicker({})).toHaveLength(0)
    expect(servicesForPicker({ vertical: null })).toHaveLength(0)
  })

  it('shows the catalog for the chosen vertical, with titles', () => {
    const lawn = servicesForPicker({ vertical: 'lawn' })
    expect(lawn).toHaveLength(17)
    // The operator matches against the client's website, so the TITLE matters.
    expect(lawn.find((s) => s.slug === 'mowing-maintenance')?.title).toBe('Mowing & Edging')
  })

  it('toggling keeps CATALOG order, not click order', () => {
    let bi: Record<string, unknown> = { vertical: 'lawn', services: [] }
    for (const slug of ['artificial-turf', 'weed-control', 'lawn-fertilization']) {
      bi = { ...bi, services: toggleService(bi, slug) }
    }
    expect(bi.services).toEqual(['lawn-fertilization', 'weed-control', 'artificial-turf'])
  })

  it('toggling twice removes', () => {
    const once = toggleService({ vertical: 'lawn', services: [] }, 'overseeding')
    expect(once).toEqual(['overseeding'])
    expect(toggleService({ vertical: 'lawn', services: once }, 'overseeding')).toEqual([])
  })
})

describe('the fabricated industry default is gone', () => {
  it('an unstated industry stays EMPTY', () => {
    const body = build({ vertical: 'lawn', services: ['weed-control'] })
    expect((body.business_info as Record<string, unknown>).industry).toBe('')
  })

  it('a stated industry is preserved', () => {
    const body = build({ vertical: 'lawn', services: ['weed-control'], industry: 'Lawn & Landscape' })
    expect((body.business_info as Record<string, unknown>).industry).toBe('Lawn & Landscape')
  })

  it('SOURCE SCAN: the hardcoded trade no longer appears in the payload path', () => {
    // COMMENTS OUT, CODE IN. provisionInputs.ts's own header QUOTES the literal
    // it removed, in order to explain it — a raw scan flags the documentation as
    // if it were live code. The repo hit this in S313 and again here.
    const codeOnly = (body: string) => body
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^[ \t]*\/\/.*$/gm, '')
      .replace(/([^:])\/\/.*$/gm, '$1')

    for (const f of ['provisionInputs.ts', 'ProspectDetail.Provisioning.tsx']) {
      const code = codeOnly(readFileSync(join(__dirname, '..', f), 'utf8'))
      expect(code, `${f} still hardcodes a trade`).not.toMatch(/\|\|\s*'Pest Control'/)
      expect(code, `${f} still names the trade in code at all`).not.toContain("'Pest Control'")
    }

    // ANTI-VACUITY, and it has teeth: the scanner must still SEE a reintroduced
    // fallback. Feeding it the old line proves the stripper did not eat the code.
    expect(codeOnly("const x = bi.industry || 'Pest Control'\n")).toMatch(/\|\|\s*'Pest Control'/)
  })
})

describe('existing callers are unchanged', () => {
  it('pest with a full selection still posts all 12', () => {
    const body = build({ vertical: 'pest', services: [...CATALOG_SLUGS.pest] })
    expect(body.services).toEqual([...CATALOG_SLUGS.pest])
  })

  it('the rest of the body keeps its shape', () => {
    const body = build({ vertical: null })
    expect(body.slug).toBe('greenacre')
    expect(body.admin_email).toBe('admin@greenacre.com')
    expect(body.subscription).toEqual(TIER)
    expect((body.branding as Record<string, unknown>).template).toBe('modern-pro')
    expect((body.customization as Record<string, unknown>).show_license).toBe(true)
  })
})

describe('ironwood-provision forwards services (SOURCE SCAN)', () => {
  // The edge function imports from esm.sh and vitest cannot load it, so this is
  // a scan and saying so is the point. It is only PROVEN by the live call after
  // Scott deploys.
  const EDGE = readFileSync(
    join(__dirname, '..', '..', '..', '..', 'supabase', 'functions', 'ironwood-provision', 'index.ts'), 'utf8')

  it('services is destructured from the body', () => {
    // Without this the field is silently dropped: the payload below is rebuilt
    // from named fields only.
    expect(EDGE).toMatch(/\n\s*services,\n\s*\} = body/)
  })

  it('services is forwarded into the rebuilt payload', () => {
    expect(EDGE).toContain('? { services } : {}')
  })

  it('business_info is still passed through wholesale, so vertical needs no change', () => {
    expect(EDGE).toContain('business_info: business_info || {}')
  })
})
