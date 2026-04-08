import { supabase } from './supabase'

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
 * 1. ?tenant=<slug> query param (dev/preview testing)
 * 2. custom_domain match (e.g. admin.dangpestcontrol.com)
 * 3. *.pestflowpro.com subdomain slug match
 * 4. VITE_TENANT_ID fallback (localhost / root domain)
 */
export async function resolveTenantId(): Promise<string> {
  const fallback = (import.meta.env.VITE_TENANT_ID as string) || ''
  const hostname = window.location.hostname

  // 1. ?tenant=<slug> query param
  const params = new URLSearchParams(window.location.search)
  const tenantSlug = params.get('tenant')
  if (tenantSlug) {
    try {
      const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).maybeSingle()
      if (data?.id) return data.id
    } catch { /* fall through */ }
  }

  // 2. Custom domain lookup (e.g. admin.dangpestcontrol.com)
  const isPestflowDomain = hostname === 'pestflowpro.com' || hostname.endsWith('.pestflowpro.com')
  const isLocalhost = hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.vercel.app')
  if (!isPestflowDomain && !isLocalhost) {
    try {
      const { data } = await supabase.from('tenants').select('id').eq('custom_domain', hostname).maybeSingle()
      if (data?.id) return data.id
    } catch { /* fall through */ }
  }

  // 3. *.pestflowpro.com subdomain
  const subdomain = getPestflowSubdomain()
  if (!subdomain) return fallback

  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', subdomain)
      .maybeSingle()

    if (error || !data?.id) {
      console.error('[subdomainRouter] Tenant not found for slug:', subdomain)
      return fallback
    }
    return data.id
  } catch (err) {
    console.error('[subdomainRouter] Lookup failed:', err)
    return fallback
  }
}
