// S255 — vault-managed integration secret keys (write-path migration).
//
// These 4 keys are TRUE secrets. As of S254 they are read server-side from
// Postgres Vault via get_tenant_secret; the WRITE path (S255) routes them
// through the set-tenant-secret edge function → set_tenant_secret RPC. They
// must NEVER be written into settings.integrations again — a future RLS/policy
// change on that anon-adjacent JSONB could otherwise re-expose them.
//
// The classic leak vector is a form that loads the whole integrations blob,
// lets an admin edit non-secret keys, then POSTs the whole blob back —
// silently re-inserting any secret that was still present. stripVaultSecrets()
// is the guard every such write path runs on its payload before upsert.

export const VAULT_SECRET_KEYS = [
  'facebook_access_token',
  'ga4_oauth_refresh_token',
  'gsc_oauth_refresh_token',
  'textbelt_api_key',
] as const

export type VaultSecretKey = (typeof VAULT_SECRET_KEYS)[number]

// Return a shallow copy of an integrations object with the 4 vault-managed
// secret keys removed. Non-secret keys are preserved exactly. Safe on
// null/undefined (returns {}). Use on any settings.integrations write payload.
export function stripVaultSecrets<T extends Record<string, unknown>>(
  integrations: T | null | undefined,
): Partial<T> {
  if (!integrations) return {}
  const out: Record<string, unknown> = { ...integrations }
  for (const k of VAULT_SECRET_KEYS) delete out[k]
  return out as Partial<T>
}
