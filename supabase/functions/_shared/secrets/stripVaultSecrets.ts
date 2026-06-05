// _shared/secrets/stripVaultSecrets.ts — S255
//
// Edge-function guard mirroring the frontend src/lib/integrationSecretKeys.ts.
// The 4 true secrets live in Vault (read via getTenantSecret, written via
// set_tenant_secret). Any service-role code that reads the whole
// settings.integrations blob and writes it back (outscraper sync, places
// place_id cache-back, zernio account sync, etc.) must run its payload through
// this first so it can never round-trip a secret back into the anon-adjacent
// JSONB. Non-secret keys are preserved exactly.

export const VAULT_SECRET_KEYS = [
  'facebook_access_token',
  'ga4_oauth_refresh_token',
  'gsc_oauth_refresh_token',
  'textbelt_api_key',
] as const

export function stripVaultSecrets(
  integrations: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!integrations) return {}
  const out: Record<string, unknown> = { ...integrations }
  for (const k of VAULT_SECRET_KEYS) delete out[k]
  return out
}
