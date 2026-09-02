import { cache } from 'react';
import { getServerSupabaseForISR } from '../supabase/server';
import { normalizeLogoHeightPx, type Tenant } from './types';

async function resolveSettings(tenantBase: { id: string; slug: string; subdomain: string | null; name: string; custom_domain: string | null }): Promise<Tenant> {
  const supabase = getServerSupabaseForISR();
  const { data: settings, error } = await supabase
    .from('settings')
    .select('key, value')
    .eq('tenant_id', tenantBase.id)
    .in('key', ['branding', 'business_info', 'seo']);

  if (error) {
    console.error('[resolveSettings] error', { tenantId: tenantBase.id, code: error.code, message: error.message });
  }

  const byKey = Object.fromEntries(
    (settings ?? []).map((r) => [r.key, r.value ?? {}])
  );
  const branding = byKey.branding ?? {};
  const business = byKey.business_info ?? {};
  const seo = byKey.seo ?? {};

  return {
    id: tenantBase.id,
    slug: tenantBase.slug,
    subdomain: tenantBase.subdomain ?? null,
    name: tenantBase.name,
    // S321 — carried through EXPLICITLY, and that is the whole point of this line.
    // This function CONSTRUCTS a new object; a column added to the SELECT but not listed
    // here is silently dropped, resolveSiteUrl receives undefined, and the canonical falls
    // back to the platform subdomain with nothing visibly broken. Same shape as the S311
    // logo_height_px finding. Both validators flagged it independently.
    custom_domain: tenantBase.custom_domain ?? null,

    template: branding.theme ?? 'modern-pro',
    primary_color: branding.primary_color ?? '#111111',
    accent_color: branding.accent_color ?? '#f97316',
    logo_url: branding.logo_url ?? null,
    favicon_url: branding.favicon_url ?? null,
    cta_text: branding.cta_text ?? null,
    // S311 — resolved here, alongside logo_url, because useTenant() only ever
    // exposes what this function builds. A field read straight from `branding`
    // at render time would be undefined with nothing visibly broken.
    logo_height_px: normalizeLogoHeightPx(branding.logo_height_px),

    business_name: business.name ?? null,
    phone: business.phone ?? null,
    email: business.email ?? null,
    industry: business.industry ?? null,
    vertical: business.vertical ?? null,
    address: business.address ?? null,
    hours: business.hours ?? null,
    tagline: business.tagline ?? null,
    owner_name: business.owner_name ?? null,
    founded_year: business.founded_year != null ? Number(business.founded_year) : null,
    license_number: business.license ?? business.license_number ?? null,
    certifications: business.certifications ?? null,
    num_technicians: business.num_technicians != null ? Number(business.num_technicians) : null,

    meta_title: seo.meta_title ?? null,
    meta_description: seo.meta_description ?? null,
    // Validator gate: only the literal boolean true engages the noindex —
    // untrusted JSONB strings/numbers ("true", 1) must not flip robots.
    noindex: seo.noindex === true,
  };
}

export const resolveTenantBySlug = cache(async (slug: string): Promise<Tenant | null> => {
  // Validator gate: PostgREST .or() filter parses commas as condition
  // separators. slug comes from a Next.js dynamic route segment, which
  // Next.js URL-decodes before populating params, so a request like
  // /tenant/foo,subdomain.eq.bar/ would let URL-derived characters break
  // the .or() filter grammar. Whitelist before query.
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return null;
  }

  // Step 1: resolve by slug OR subdomain → id/slug/subdomain/name.
  const supabase = getServerSupabaseForISR();
  const { data: tenantBase, error } = await supabase
    .from('tenants')
    .select('id, slug, subdomain, name, custom_domain')
    .or(`slug.eq.${slug},subdomain.eq.${slug}`)
    .maybeSingle();

  if (error || !tenantBase) return null;

  // Step 2: fetch mutable settings fresh on every ISR regeneration.
  return resolveSettings(tenantBase);
});
