import type { RedirectRow } from './RedirectMapTable'

export type ProspectStatus =
  | 'prospect' | 'quoted' | 'paid' | 'onboarding'
  | 'provisioned' | 'active' | 'churned'

export interface Salesperson {
  id: string
  name: string
  email: string | null
  phone: string | null
  cal_booking_url: string | null
  active: boolean
  commission_setup_pct: number
  commission_recurring_pct: number
  invited_at?: string | null
  created_at?: string
}

export interface Prospect {
  id: string
  created_at: string
  updated_at: string
  status: ProspectStatus
  contact_name: string | null
  company_name: string
  phone: string | null
  email: string | null
  website_url: string | null
  notes: string | null
  call_date: string | null
  social_facebook: string | null
  social_instagram: string | null
  social_google: string | null
  social_youtube: string | null
  social_tiktok: string | null
  has_existing_social: boolean | null
  package_id: string | null
  setup_fee_amount: number | null
  plan_tier: number | null
  plan_name: string | null
  monthly_price: number | null
  setup_invoice_sent_at: string | null
  stripe_customer_id: string | null
  payment_confirmed_at: string | null
  slug: string | null
  admin_email: string | null
  admin_password: string | null
  business_info: Record<string, any> | null
  branding: Record<string, any> | null
  customization: Record<string, any> | null
  intake_data: Record<string, any> | null
  intake_submitted_at: string | null
  pipeline_stage: string
  build_path: string | null
  build_path_set_at: string | null
  custom_scope_notes: string | null
  service_areas: string | null
  hero_headline: string | null
  tenant_id: string | null
  provisioned_at: string | null
  site_revealed_at: string | null
  salesperson_id: string | null
  onboarding_rep_id: string | null
  tier: string | null
  redirect_map: RedirectRow[]
  redirect_map_complete: boolean
  source_url: string | null
  ps_desktop_old: number | null
  ps_mobile_old: number | null
  ps_desktop_new: number | null
  ps_mobile_new: number | null
}
