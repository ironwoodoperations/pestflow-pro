import { cache } from 'react';
import { getServerSupabaseForISR } from '../supabase/server';
import type { Tenant } from './types';

async function resolveSettings(tenantBase: { id: string; slug: string; name: string }): Promise<Tenant> {
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
    name: tenantBase.name,

    template: branding.template ?? 'modern-pro',
    primary_color: branding.primary_color ?? '#111111',
    accent_color: branding.accent_color ?? '#f97316',
    logo_url: branding.logo_url ?? null,
    favicon_url: branding.favicon_url ?? null,
    cta_text: branding.cta_text ?? null,

    business_name: business.name ?? null,
    phone: business.phone ?? null,
    email: business.email ?? null,
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
  };
}

export const resolveTenantBySlug = cache(async (slug: string): Promise<Tenant | null> => {
  // Step 1: slug → id/name (immutable — slugs and IDs never change).
  const supabase = getServerSupabaseForISR();
  const { data: tenantBase, error } = await supabase
    .from('tenants')
    .select('id, slug, name')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !tenantBase) return null;

  // Step 2: fetch mutable settings fresh on every ISR regeneration.
  return resolveSettings(tenantBase);
});
