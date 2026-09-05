// S342 — the provisioning inputs the Ironwood form was never collecting.
//
// PURE AND SEPARATE FROM THE COMPONENT so it can be tested. ProspectDetail.
// Provisioning.tsx builds its request body inside an async handler that also
// refreshes a session and calls fetch(); none of that is reachable from a unit
// test, and the payload is the part that has to be right.
//
// ═══ WHAT WAS WRONG ═══
//
// The form posted NO `vertical` and NO `services`. Traced end to end:
//   vertical absent -> validateVertical(undefined) -> null, "not recorded"
//   vertical null   -> catalogSlugsFor(null) -> [] -> buildPageContentRows seeds
//                      ONLY platform pages. Zero service pages, zero service
//                      seo_meta rows, zero tenant_services rows.
// Not seventeen wrong pages for a lawn client — NONE AT ALL, for anybody.
//
// It also hardcoded `industry: bi.industry || 'Pest Control'`, writing a trade
// into settings.business_info for every client who did not type over it. That
// is the fabrication class the S283-S300 arc removed from the seed, still live
// in the UI. It is deleted here and NOT replaced with another default: the
// vertical carries the trade now, and '' is the honest value for "not stated".

import { VERTICAL_OPTIONS } from '../../lib/adminVerticalPreset'
import { catalogFor, isCatalogVertical } from '../../../shared/lib/serviceCatalog'
import type { Prospect } from './types'

/** The prospect's business_info JSONB. Values are free-form. */
type BusinessInfo = Record<string, unknown>

/**
 * The `<select>` value used while the operator has not chosen yet.
 *
 * DELIBERATELY NOT '' — VERTICAL_OPTIONS already uses '' for the real
 * "Not listed / other" choice, and the checklist has to tell "decided nothing
 * is recorded" from "never touched the field". Collapsing them would let a
 * prospect through the gate having answered no question at all.
 */
export const VERTICAL_UNCHOSEN = '__unchosen__'

/** Persisted shape. Both live in prospects.business_info (existing JSONB). */
export interface VerticalChoice {
  /** True once the operator has made ANY choice, including "not recorded". */
  decided: boolean
  /** 'pest' | 'irrigation' | 'lawn', or null for an explicit "not recorded". */
  vertical: string | null
}

/**
 * Read the operator's choice out of business_info.
 *
 * KEY PRESENCE is the signal, not truthiness: an explicit "not recorded" is
 * stored as `vertical: null`, which is a real and legal state (the CHECK
 * permits NULL). `undefined` — the key absent — means nobody has decided.
 */
export function readVerticalChoice(bi: BusinessInfo | null | undefined): VerticalChoice {
  const b = bi ?? {}
  if (!Object.prototype.hasOwnProperty.call(b, 'vertical')) return { decided: false, vertical: null }
  const v = b.vertical
  if (v === null || v === undefined || v === '') return { decided: true, vertical: null }
  return { decided: true, vertical: String(v) }
}

/** What the `<select>` should show for the current stored state. */
export function verticalSelectValue(bi: BusinessInfo | null | undefined): string {
  const { decided, vertical } = readVerticalChoice(bi)
  if (!decided) return VERTICAL_UNCHOSEN
  return vertical ?? ''
}

/**
 * Translate a `<select>` value into what gets stored.
 * '' is the explicit "not recorded" option and stores a real null.
 */
export function verticalFromSelectValue(value: string): string | null {
  return value === '' || value === VERTICAL_UNCHOSEN ? null : value
}

/** The tenant's selected slugs, always an array. */
export function selectedServices(bi: BusinessInfo | null | undefined): string[] {
  const raw = (bi ?? {}).services
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of raw) {
    const slug = String(s ?? '').trim()
    if (slug === '' || seen.has(slug)) continue
    seen.add(slug)
    out.push(slug)
  }
  return out
}

/**
 * Toggle one slug, keeping CATALOG order rather than click order.
 *
 * Catalog order drives the admin sidebar and the order pages are seeded in, so
 * the stored list should not depend on the sequence the operator happened to
 * tick boxes in.
 */
export function toggleService(
  bi: BusinessInfo | null | undefined,
  slug: string,
): string[] {
  const { vertical } = readVerticalChoice(bi)
  const current = new Set(selectedServices(bi))
  if (current.has(slug)) current.delete(slug)
  else current.add(slug)
  return catalogFor(vertical).map((s) => s.slug).filter((s) => current.has(s))
}

/** The checkbox list for the chosen vertical. Empty until one is chosen. */
export function servicesForPicker(bi: BusinessInfo | null | undefined) {
  const { vertical } = readVerticalChoice(bi)
  return catalogFor(vertical)
}

// ── the pre-provision gate ──────────────────────────────────────────────────

/**
 * The operator must have DECIDED, not just left the field alone.
 *
 * "Not recorded" is a legitimate answer and passes. Never opening the select
 * does not.
 */
export function verticalDecided(bi: BusinessInfo | null | undefined): boolean {
  return readVerticalChoice(bi).decided
}

/**
 * A vertical WITH A CATALOG needs at least one service ticked.
 *
 * This mirrors the backend rather than inventing a rule: provision_tenant_atomic
 * raises 22023 for a recorded vertical with an empty selection, and buildPayload
 * returns a 400. The checklist exists to make that a readable sentence in front
 * of the operator instead of a failed request after the fact.
 *
 * A vertical with no catalog, and "not recorded", need nothing — they seed no
 * service pages by design.
 */
export function serviceSelectionOk(bi: BusinessInfo | null | undefined): boolean {
  const { vertical } = readVerticalChoice(bi)
  if (!isCatalogVertical(vertical)) return true
  return selectedServices(bi).length > 0
}

/** Labels, so the checklist and the picker cannot disagree about a name. */
export function verticalLabel(vertical: string | null): string {
  const opt = VERTICAL_OPTIONS.find((o) => o.value === (vertical ?? ''))
  return opt?.label ?? String(vertical)
}

// ── the request body ────────────────────────────────────────────────────────

export interface TierProvision { tier: number; plan_name: string; monthly_price: number }

export interface ProvisionRequestInput {
  form: Partial<Prospect>
  prospectId: string | null
  resolvedAdminEmail: string
  tierData: TierProvision
}

/**
 * The exact JSON body posted to ironwood-provision.
 *
 * `vertical` goes INSIDE business_info because that is where provision-tenant
 * reads it — `validateVertical(wbi.vertical ?? body.business_info?.vertical)` —
 * and ironwood-provision forwards business_info wholesale, so no edge change is
 * needed for it.
 *
 * `services` is TOP-LEVEL because that is where provision-tenant's RequestBody
 * declares it. ironwood-provision destructures a fixed list and rebuilds the
 * payload explicitly, so this one DOES need the edge function to forward it.
 */
export function buildProvisionRequestBody(input: ProvisionRequestInput): Record<string, unknown> {
  const { form, prospectId, resolvedAdminEmail, tierData } = input
  const bi = (form.business_info || {}) as BusinessInfo
  const br = (form.branding || {}) as BusinessInfo
  const cu = (form.customization || {}) as BusinessInfo
  const { vertical } = readVerticalChoice(bi)
  const services = selectedServices(bi)

  return {
    prospect_id: prospectId,
    slug: form.slug,
    admin_email: resolvedAdminEmail,
    admin_password: form.admin_password,
    business_info: {
      name: bi.name || form.company_name || '',
      phone: bi.phone || form.phone || '',
      email: bi.email || form.admin_email || '',
      address: bi.address || '',
      tagline: bi.tagline || '',
      hours: bi.hours || '',
      // NO 'Pest Control' FALLBACK. Empty is the honest state for an unstated
      // industry; the vertical below carries the trade.
      industry: bi.industry || '',
      // Omitted entirely when not recorded, matching the settings rows of
      // tenants whose vertical is a real NULL rather than a JSON null.
      ...(vertical ? { vertical } : {}),
      license: bi.license || '',
      certifications: bi.certifications || '',
      founded_year: bi.founded_year || '',
      num_technicians: bi.num_technicians || '',
    },
    // Omitted when nothing is selected: ABSENT means "not stated" to
    // buildPayload and falls back to the whole catalog, which is right for a
    // vertical with no catalog and for "not recorded" (both seed nothing).
    // An empty ARRAY would be a statement of nothing and a 400.
    ...(services.length > 0 ? { services } : {}),
    branding: {
      primary_color: br.primary_color || '#E87800',
      accent_color: br.accent_color || '#1a1a1a',
      template: br.template || 'modern-pro',
      cta_text: br.cta_text || 'Get a Free Quote',
      logo_url: br.logo_url || null,
      favicon_url: br.favicon_url || null,
    },
    customization: {
      hero_headline: cu.hero_headline || form.company_name || '',
      show_license: cu.show_license ?? true,
      show_years: cu.show_years ?? true,
      show_technicians: cu.show_technicians ?? true,
      show_certifications: cu.show_certifications ?? true,
    },
    social: {
      facebook: form.social_facebook, instagram: form.social_instagram,
      google: form.social_google, youtube: form.social_youtube,
    },
    subscription: {
      tier: tierData.tier,
      plan_name: tierData.plan_name,
      monthly_price: tierData.monthly_price,
    },
  }
}
