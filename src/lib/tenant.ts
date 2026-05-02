import { resolveTenantId as _resolve } from './subdomainRouter'

// Backward-compat shim for 48 public-facing resolveTenantId() callers.
// Migrate callers to useTenant() from context/TenantBootProvider in commit 4.
export async function resolveTenantId(): Promise<string> {
  return (await _resolve()) ?? ''
}
