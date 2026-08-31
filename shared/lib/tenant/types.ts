export type TenantBranding = {
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  accent_color?: string;
  template?: string;
  cta_text?: string;
  // S311 — optional per-tenant nav logo height. Absent for every tenant today;
  // absent MUST keep rendering at the historical 40px.
  logo_height_px?: number | string;
};

// S311 — the modern-pro nav logo height.
//
// The logo was hardcoded at 40px in ModernProNavbar, shared by every tenant on
// that shell (and by every tenant whose theme is unrecognized, since modern-pro
// is layout.tsx's default branch). Tenants whose wordmark has different
// proportions cannot all look right at one height.
//
// MAX is 64 because the nav row is Tailwind `h-16` — exactly 64px. A taller
// logo overflows the bar rather than enlarging it. MIN is 16 because anything
// smaller is unreadable at typical logo aspect ratios.
export const LOGO_HEIGHT_DEFAULT_PX = 40;
export const LOGO_HEIGHT_MIN_PX = 16;
export const LOGO_HEIGHT_MAX_PX = 64;

// settings.branding is untrusted JSONB written through the admin UI, so the
// value can be a number, a numeric string ("32"), null, an empty string, or
// nonsense. Anything that is not a finite number falls back to the 40px
// default; a finite number is rounded and clamped into the range above.
// Idempotent, so it is safe to apply both at resolve time and at render time.
export function normalizeLogoHeightPx(raw: unknown): number {
  const n =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string' && raw.trim() !== ''
        ? Number(raw.trim())
        : NaN;
  if (!Number.isFinite(n)) return LOGO_HEIGHT_DEFAULT_PX;
  return Math.min(LOGO_HEIGHT_MAX_PX, Math.max(LOGO_HEIGHT_MIN_PX, Math.round(n)));
}

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
  subdomain: string | null;
  name: string;

  // branding (from settings.branding JSONB)
  template: string;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
  favicon_url: string | null;
  cta_text: string | null;
  // S311 — always set by resolveSettings (to LOGO_HEIGHT_DEFAULT_PX when the
  // tenant has no branding.logo_height_px). Optional so hand-built Tenant
  // literals in tests and fixtures compile unchanged; consumers normalize
  // again at render, so an omitted value still renders at 40px.
  logo_height_px?: number;

  // business_info (from settings.business_info JSONB)
  business_name: string | null;
  phone: string | null;
  email: string | null;
  // Vertical sources, consumed by resolveVertical() in priority order:
  //  1. vertical (S-PLS-6) — explicit settings.business_info.vertical, raw from
  //     JSONB; resolveVertical validates it strictly ('irrigation' | 'pest'
  //     only). The routing key of record.
  //  2. industry (S-PLS-5) — freeform prose (also the AI social prompt input);
  //     substring fallback for tenants provisioned without the explicit key.
  // Both optional so hand-built Tenant literals compile unchanged;
  // resolveSettings always sets them (null when absent).
  vertical?: string | null;
  industry?: string | null;
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
  // Pre-launch indexing gate (S-PLS-4). resolveSettings sets this from
  // settings.seo.noindex via a strict `=== true` check — any other value
  // (absent, "true", 1) resolves to false, so existing tenants are untouched.
  // Optional so hand-built Tenant literals (tests, fixtures) compile unchanged.
  noindex?: boolean;
};
