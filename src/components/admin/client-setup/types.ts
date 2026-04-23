import type { GeocodeSource, HoursEntry } from '../../../../shared/lib/businessInfoValidation'

export interface ClientSetupForm {
  // Step 1 — Business Info
  biz_name: string
  slug: string
  phone: string
  email: string
  address: string
  hours: string
  tagline: string
  // Step 1 — Structured address (atomicity: all 4 present or all 4 absent)
  street_address?: string
  address_locality?: string
  address_region?: string
  postal_code?: string
  address_country?: string
  // Step 1 — Geolocation (atomicity: lat ↔ lng)
  latitude?: number | ''
  longitude?: number | ''
  geocode_source?: GeocodeSource | ''
  // Step 1 — Timezone + structured hours (hours_structured requires timezone)
  timezone?: string
  hours_structured?: HoursEntry[]
  // Step 2 — Setup + Branding
  package_type: 'template-launch' | 'growth-setup' | 'site-migration' | 'custom-rebuild' | ''
  template: string
  palette_id: string
  primary_color: string
  accent_color: string
  logo_url: string
  current_website_url: string
  // Step 3 — Domain
  domain: string
  domain_registrar: string
  no_domain: boolean
  // Step 4 — Social Links
  facebook: string
  google: string
  instagram: string
  youtube: string
  // Step 5 — Plan + Setup Fee
  plan: 'starter' | 'grow' | 'pro' | 'elite' | ''
  setup_fee_amount: number // dollars
  // Step 1 — Admin credentials
  admin_password: string
}

export const INITIAL_FORM: ClientSetupForm = {
  biz_name: '',
  slug: '',
  phone: '',
  email: '',
  address: '',
  hours: '',
  tagline: '',
  street_address: '',
  address_locality: '',
  address_region: '',
  postal_code: '',
  address_country: '',
  latitude: '',
  longitude: '',
  geocode_source: '',
  timezone: '',
  hours_structured: [],
  package_type: '',
  template: '',
  palette_id: '',
  primary_color: '#10b981',
  accent_color: '#0a0f1e',
  logo_url: '',
  current_website_url: '',
  domain: '',
  domain_registrar: '',
  no_domain: false,
  facebook: '',
  google: '',
  instagram: '',
  youtube: '',
  plan: '',
  setup_fee_amount: 0,
  admin_password: '',
}

export const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter — $149/mo',
  grow:    'Grow — $249/mo',
  pro:     'Pro — $349/mo',
  elite:   'Elite — $499/mo',
}
