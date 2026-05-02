// Tenant resolution — all pages import resolveTenantId from here.
// On a live subdomain (lonestarpest.pestflowpro.com) the subdomain router
// looks up the slug in the tenants table and returns that tenant's ID.
// Returns '' on unresolved hostname; use TenantBootProvider for null-aware boot.
import { resolveTenantId as _resolveTenantId } from './subdomainRouter'

// Backward-compat shim: returns '' on null until consumers are migrated to
// TenantBootProvider (commit 3). Preserves Promise<string> contract for all callers.
export async function resolveTenantId(): Promise<string> {
  return (await _resolveTenantId()) ?? ''
}

export function setTenantId(id: string) {
  localStorage.setItem('pf_tenant_id', id)
}
