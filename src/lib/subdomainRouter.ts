import { supabase } from './supabase'

/**
 * Extracts the subdomain from the current hostname.
 * lonestarpest.pestflowpro.com → "lonestarpest"
 * pestflowpro.com              → null
 * localhost / vercel.app       → null (fall back to VITE_TENANT_ID)
 */
function getSubdomain(): string | null {
  const hostname = window.location.hostname
  if (hostname === 'pestflowpro.com') return null
  if (hostname.endsWith('.pestflowpro.com')) {
    const parts = hostname.split('.')
    // exactly 3 parts: [slug, pestflowpro, com]
    if (parts.length === 3) return parts[0]
  }
  return null
}

/**
 * Resolves the tenant ID for the current request.
 * - On a subdomain like lonestarpest.pestflowpro.com: looks up slug in tenants table
 * - On root domain / localhost / Vercel preview: falls back to VITE_TENANT_ID
 */
export async function resolveTenantId(): Promise<string> {
  const fallback = (import.meta.env.VITE_TENANT_ID as string) || ''

  const subdomain = getSubdomain()
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
