// Tenant resolution — all pages import resolveTenantId from here.
// On a live subdomain (lonestarpest.pestflowpro.com) the subdomain router
// looks up the slug in the tenants table and returns that tenant's ID.
// On localhost / root domain it falls back to VITE_TENANT_ID (demo tenant).
export { resolveTenantId } from './subdomainRouter'

export function setTenantId(id: string) {
  localStorage.setItem('pf_tenant_id', id)
}
