export type TenantBranding = {
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  accent_color?: string;
  template?: string;
  cta_text?: string;
};

export type TenantBusinessInfo = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
  tagline?: string;
  industry?: string;
  license_number?: string;
  certifications?: string;
  founded_year?: number | string;
  num_technicians?: number | string;
  owner_name?: string;
};

export type Tenant = {
  // tenant identity
  id: string;
  slug: string;
  name: string;

  // branding (from settings.branding JSONB)
  template: string;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
  favicon_url: string | null;
  cta_text: string | null;

  // business_info (from settings.business_info JSONB)
  business_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  hours: string | null;
  tagline: string | null;
  owner_name: string | null;
  founded_year: number | null;
  license_number: string | null;
  certifications: string | null;
  num_technicians: number | null;

  // seo (from settings.seo JSONB)
  meta_title: string | null;
  meta_description: string | null;
};
