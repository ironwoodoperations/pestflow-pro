export interface ClientSetupForm {
  // Step 1 — Plan
  plan: 'starter' | 'grow' | 'pro' | 'elite' | ''
  // Step 2 — Business Info
  biz_name: string
  contact_name: string
  phone: string
  email: string
  address: string
  industry: string
  // Step 3 — Branding
  logo_url: string
  primary_color: string
  template: string
  tagline: string
  domain: string
  // Step 4 — Social & Services
  facebook: string
  instagram: string
  google: string
  youtube: string
  services: string
  // Step 5 — Integrations
  google_place_id: string
  ga4_id: string
  notes: string
  tenant_id: string
  slug: string
  admin_password: string
}

export const INITIAL_FORM: ClientSetupForm = {
  plan: '', biz_name: '', contact_name: '', phone: '', email: '',
  address: '', industry: '', logo_url: '', primary_color: '#10b981',
  template: 'modern-pro', tagline: '', domain: '', facebook: '', instagram: '', google: '',
  youtube: '', services: '', google_place_id: '', ga4_id: '', notes: '', tenant_id: '', slug: '', admin_password: '',
}

export const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter — $99/mo — Website + CRM + basic SEO',
  grow:    'Grow — $149/mo — Full SEO + Blog + Social scheduling',
  pro:     'Pro — $249/mo — AI tools + campaigns + advanced reports',
  elite:   'Elite — $499/mo — All platforms + live reviews + priority support',
}
