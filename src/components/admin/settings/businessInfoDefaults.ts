import type { GeocodeSource, HoursEntry } from '../../../../shared/lib/businessInfoValidation'

// S297 — the Business Info form's initial state and its load-path coercion, in
// their own module for two reasons.
//
// TESTABILITY. BusinessInfoSection loads its row in an effect and paints a
// "Loading..." stub until it resolves. renderToStaticMarkup runs no effects and
// this project has neither jsdom nor @testing-library/react, so the S297 guard
// cannot reach these two values through a render. Exporting them lets the guard
// assert the VALUES the component actually uses — a real assertion, not a source
// grep, which is the bar adminRenderedStrings.test.tsx was built to hold.
//
// A SEPARATE FILE rather than extra exports on the component: react-refresh
// warns when a component module also exports constants, and the whole point of
// hoisting these was to stop hiding a default inside a render body.

export interface BusinessInfoForm {
  name: string; phone: string; email: string; address: string; hours: string
  tagline: string; license: string; after_hours_phone: string; founded_year: string; industry: string
  street_address: string; address_locality: string; address_region: string
  postal_code: string; address_country: string
  latitude: number | ''; longitude: number | ''
  geocode_source: GeocodeSource | ''; timezone: string; hours_structured: HoursEntry[]
}

/**
 * `industry` was 'Pest Control' here. A DEFAULTED industry is how pest content
 * reached every new site in the first place — see the note in
 * client-setup/ClientSetupPayment.tsx, which records exactly that.
 */
export const INITIAL_BUSINESS_INFO_FORM: BusinessInfoForm = {
  name: '', phone: '', email: '', address: '', hours: '', tagline: '', license: '',
  after_hours_phone: '', founded_year: '', industry: '',
  street_address: '', address_locality: '', address_region: '', postal_code: '', address_country: '',
  latitude: '', longitude: '', geocode_source: '', timezone: '', hours_structured: [],
}

/**
 * The load-path coercion — the worse of the two defects S297 replaces here.
 *
 * It read `String(v.industry || 'Pest Control')`, so an irrigation tenant whose
 * stored industry was empty opened Settings with "Pest Control" already in the
 * box and could save it without ever typing it. That is a defaulted trade
 * becoming a stored trade on the tenant's own record. Empty stays empty.
 */
export function industryFromStored(v: unknown): string {
  const stored = (v as { industry?: unknown } | null | undefined)?.industry
  return typeof stored === 'string' ? stored : ''
}
