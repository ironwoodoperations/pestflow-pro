import { supabase } from './supabase'

// Apex hostnames are explicitly registered to the master/demo tenant.
// NOT the old VITE_TENANT_ID fallback (which resolved ANY unmatched
// hostname to master). Only these specific hostnames resolve to master
// by this rule. Typo'd subdomains still return null and 404.
const APEX_HOSTS = new Set(['pestflowpro.com', 'www.pestflowpro.com'])
const MASTER_TENANT_SLUG = 'pestflow-pro'

/**
 * Extracts the slug subdomain from a *.pestflowpro.com hostname.
 * lonestarpest.pestflowpro.com → "lonestarpest"
 * pestflowpro.com / localhost  → null
 */
function getPestflowSubdomain(): string | null {
  const hostname = window.location.hostname
  if (hostname === 'pestflowpro.com') return null
  if (hostname.endsWith('.pestflowpro.com')) {
    const parts = hostname.split('.')
    if (parts.length === 3) return parts[0]
  }
  return null
}

/**
 * Resolves the tenant ID for the current request.
 * Priority order:
 * 1. ?tenant=<slug> query param (DEV mode only)
 * 2. custom_domain match (e.g. admin.dangpestcontrol.com)
 * 3. *.pestflowpro.com subdomain slug match
 * Returns null if no tenant could be resolved.
 */
export async function resolveTenantId(): Promise<string | null> {
  const hostname = window.location.hostname

  // 0. Apex hostname → master tenant (explicit registration).
  //    Must run before DEV ?tenant= override so production apex always
  //    resolves correctly.
  if (APEX_HOSTS.has(hostname)) {
    try {
      const { data } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', MASTER_TENANT_SLUG)
        .maybeSingle()
      if (data?.id) return data.id
    } catch { /* fall through to other resolution paths */ }
  }

  // 1. ?tenant=<slug> query param (DEV mode only — localhost testing)
  if (import.meta.env.DEV) {
    const params = new URLSearchParams(window.location.search)
    const tenantSlug = params.get('tenant')
    if (tenantSlug) {
      try {
        const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).maybeSingle()
        if (data?.id) return data.id
      } catch { /* fall through */ }
    }
  }

  // 2. Custom domain lookup via tenant_domains table (verified only)
  const isPestflowDomain = hostname === 'pestflowpro.com' || hostname.endsWith('.pestflowpro.com')
  const isLocalhost = hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.vercel.app')
  if (!isPestflowDomain && !isLocalhost) {
    try {
      const { data } = await supabase
        .from('tenant_domains')
        .select('tenant_id')
        .eq('custom_domain', hostname)
        .eq('verified', true)
        .maybeSingle()
      if (data?.tenant_id) return data.tenant_id
    } catch { /* fall through */ }
  }

  // 3. *.pestflowpro.com subdomain
  //    Priority: tenants.subdomain column (explicit registration like 'demo'),
  //    then tenants.slug (backward compat for slug-as-subdomain like 'dang').
  const subdomain = getPestflowSubdomain()
  if (!subdomain) return null
  try {
    // 3a. Match against tenants.subdomain column
    const { data: subRow } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', subdomain)
      .maybeSingle()
    if (subRow?.id) return subRow.id

    // 3b. Fallback to tenants.slug match
    const { data: slugRow, error: slugErr } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', subdomain)
      .maybeSingle()
    if (slugErr || !slugRow?.id) {
      console.error('[subdomainRouter] Tenant not found for subdomain or slug:', subdomain)
      return null
    }
    return slugRow.id
  } catch (err) {
    console.error('[subdomainRouter] Lookup failed:', err)
    return null
  }
}
