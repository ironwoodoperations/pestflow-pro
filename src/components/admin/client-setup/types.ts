export interface ClientSetupForm {
  // Step 1 — Business Info
  biz_name: string
  slug: string
  phone: string
  email: string
  address: string
  hours: string
  tagline: string
  // Step 2 — Package + Branding
  package_type: 'standard' | 'custom' | 'premium' | ''
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
  // Step 5 — Plan
  plan: 'starter' | 'grow' | 'pro' | 'elite' | ''
}

export const INITIAL_FORM: ClientSetupForm = {
  biz_name: '',
  slug: '',
  phone: '',
  email: '',
  address: '',
  hours: '',
  tagline: '',
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
}

export const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter — $99/mo',
  grow:    'Grow — $149/mo',
  pro:     'Pro — $249/mo',
  elite:   'Elite — $499/mo',
}
