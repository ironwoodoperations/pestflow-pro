import { getServerSupabase } from '../supabase/server';
import type { Tenant, TenantBranding, TenantBusinessInfo } from './types';

export async function resolveTenantBySlug(slug: string): Promise<Tenant | null> {
  const supabase = getServerSupabase();

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, slug, name')
    .eq('slug', slug)
    .maybeSingle();

  if (tenantError || !tenant) return null;

  const { data: settings, error: settingsError } = await supabase
    .from('settings')
    .select('key, value')
    .eq('tenant_id', tenant.id)
    .in('key', ['branding', 'business_info']);

  if (settingsError) return null;

  const rows = settings ?? [];
  const branding: TenantBranding =
    (rows.find((r) => r.key === 'branding')?.value as TenantBranding) ?? {};
  const business_info: TenantBusinessInfo =
    (rows.find((r) => r.key === 'business_info')?.value as TenantBusinessInfo) ?? {};

  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    branding,
    business_info,
  };
}
