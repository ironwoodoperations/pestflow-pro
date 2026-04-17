import { cache } from 'react';
import { getServerSupabase } from '../supabase/server';
import type { Tenant } from './types';

export const resolveTenantBySlug = cache(async (slug: string): Promise<Tenant | null> => {
  const supabase = getServerSupabase();

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, slug, name')
    .eq('slug', slug)
    .maybeSingle();

  if (tenantError || !tenant) return null;

  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .eq('tenant_id', tenant.id)
    .in('key', ['branding', 'business_info', 'seo']);

  const byKey = Object.fromEntries(
    (settings ?? []).map((r) => [r.key, r.value ?? {}])
  );
  const branding = byKey.branding ?? {};
  const business = byKey.business_info ?? {};
  const seo = byKey.seo ?? {};

  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,

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
    license_number: business.license_number ?? null,
    certifications: business.certifications ?? null,
    num_technicians: business.num_technicians != null ? Number(business.num_technicians) : null,

    meta_title: seo.meta_title ?? null,
    meta_description: seo.meta_description ?? null,
  };
});
