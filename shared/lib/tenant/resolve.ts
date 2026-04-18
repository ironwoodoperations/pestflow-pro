import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getServerSupabase, getServerSupabaseForISR } from '../supabase/server';
import { cacheTags } from '../../../app/_lib/cacheTags';
import type { Tenant } from './types';

// Separate cached function for settings fetch — tagged so revalidateTag('settings')
// busts it immediately when branding/business_info/seo is saved in admin.
function resolveSettings(tenantBase: { id: string; slug: string; name: string }) {
  return unstable_cache(
    async (): Promise<Tenant> => {
      const supabase = getServerSupabase(); // cache: 'no-store' — gets fresh DB data on cache miss
      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .eq('tenant_id', tenantBase.id)
        .in('key', ['branding', 'business_info', 'seo']);

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
    },
    ['tenant_resolve_settings', tenantBase.id],
    { tags: [cacheTags.settings(tenantBase.id)], revalidate: 300 }
  )();
}

export const resolveTenantBySlug = cache(async (slug: string): Promise<Tenant | null> => {
  // Step 1: slug → id/name (immutable — slugs and IDs never change).
  // Uses getServerSupabaseForISR so this fetch doesn't block route ISR caching.
  const supabase = getServerSupabaseForISR();
  const { data: tenantBase, error } = await supabase
    .from('tenants')
    .select('id, slug, name')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !tenantBase) return null;

  // Step 2: fetch mutable settings, cached with settings tag.
  return resolveSettings(tenantBase);
});
