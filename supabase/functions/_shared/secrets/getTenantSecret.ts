// _shared/secrets/getTenantSecret.ts — S254
//
// Single read path for per-tenant secrets that used to live in the
// anon-readable settings.integrations JSONB. Those 4 true secrets
// (facebook_access_token, ga4_oauth_refresh_token, gsc_oauth_refresh_token,
// textbelt_api_key) now live in Postgres Vault so a future RLS/policy change
// can never re-expose them.
//
// VAULT NAMING CONVENTION (per-tenant):
//   tenant_<tenantId>_<secretName>
//   e.g. tenant_1611b16f-381b-4d4f-ba3a-fbde56ad425b_facebook_access_token
//
// ACCESS PATTERN — why an RPC and not a direct table read:
//   vault.decrypted_secrets is NOT exposed through PostgREST (Supabase only
//   exposes `public, graphql_public`), so supabase-js .schema('vault').from(...)
//   would fail with a "schema not exposed" error even though service_role holds
//   SELECT on the view. We therefore call public.get_tenant_secret(), a
//   SECURITY DEFINER function (owned by postgres, EXECUTE granted to
//   service_role only) that reads vault.decrypted_secrets server-side. This
//   mirrors the established S199 vault-reader convention
//   (trigger_notify_new_lead reads vault inside a SECURITY DEFINER function).
//
// SERVICE-ROLE ONLY: pass a service-role Supabase client. get_tenant_secret is
// not executable by anon/authenticated. tenantId AND secretName are passed
// explicitly — never derived from a JWT/session inside this helper.
//
// FAIL-HARD (S254 validator gate): this helper NEVER returns null/empty. A
// missing secret throws VaultSecretMissingError; a decryption/transport/RPC
// error throws VaultSecretAccessError. This makes it impossible to silently
// pass a null credential to Textbelt / Facebook Graph / Google. Each call site
// catches and decides: treat "missing" as the integration's not-configured
// state (skip / unconfigured / no-credentials), and surface an access error
// loudly. There is intentionally NO fallback-read to settings.integrations —
// Vault is populated + verified before the strip, so a fallback would only
// mask the missing-secret failure we want surfaced.

// Thrown when the named secret simply does not exist (or is empty) in Vault.
// Call sites map this to "this integration isn't configured for this tenant".
export class VaultSecretMissingError extends Error {
  constructor(public readonly vaultName: string) {
    super(`Vault secret missing: ${vaultName}`)
    this.name = 'VaultSecretMissingError'
  }
}

// Thrown when the RPC/decryption/transport itself failed (pgsodium/key issue,
// network, RPC error). Distinct from "missing" so call sites can fail loudly
// instead of silently treating a broken Vault as "not configured".
export class VaultSecretAccessError extends Error {
  constructor(public readonly vaultName: string, cause: string) {
    super(`Vault read failed for ${vaultName}: ${cause}`)
    this.name = 'VaultSecretAccessError'
  }
}

// Loosely typed to avoid version-coupling this shared helper to a specific
// supabase-js import. Any client exposing .rpc() satisfies it.
interface RpcCapableClient {
  rpc(
    fn: string,
    params: Record<string, unknown>,
  ): Promise<{ data: unknown; error: { message: string } | null }>
}

export async function getTenantSecret(
  serviceClient: RpcCapableClient,
  tenantId: string,
  secretName: string,
): Promise<string> {
  const vaultName = `tenant_${tenantId}_${secretName}`

  if (!tenantId || !secretName) {
    throw new VaultSecretAccessError(vaultName, 'missing tenantId or secretName')
  }

  let data: unknown
  try {
    const res = await serviceClient.rpc('get_tenant_secret', {
      p_tenant_id: tenantId,
      p_secret_name: secretName,
    })
    if (res.error) {
      throw new VaultSecretAccessError(vaultName, res.error.message)
    }
    data = res.data
  } catch (err) {
    if (err instanceof VaultSecretAccessError) throw err
    const msg = err instanceof Error ? err.message : String(err)
    throw new VaultSecretAccessError(vaultName, msg)
  }

  const value = typeof data === 'string' ? data.trim() : ''
  if (!value) {
    throw new VaultSecretMissingError(vaultName)
  }

  return value
}
