export let DEMO_TENANT_ID = import.meta.env.VITE_TENANT_ID || ''

export async function resolveTenantId(): Promise<string> {
  const stored = localStorage.getItem('pf_tenant_id')
  return stored || DEMO_TENANT_ID
}

export function setTenantId(id: string) {
  localStorage.setItem('pf_tenant_id', id)
}
