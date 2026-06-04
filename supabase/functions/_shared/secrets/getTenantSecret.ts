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
// not executable by anon/authenticated.
//
// FAIL-SOFT: on any missing/empty value or error, returns null and logs a
// warning — never throws. Callers treat null exactly like the old empty
// settings value (no-op / skip gracefully). This matches the
// trigger_notify_new_lead fail-soft convention.

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
): Promise<string | null> {
  if (!tenantId || !secretName) {
    console.warn('[getTenantSecret] missing tenantId or secretName; returning null')
    return null
  }

  const vaultName = `tenant_${tenantId}_${secretName}`

  try {
    const { data, error } = await serviceClient.rpc('get_tenant_secret', {
      p_tenant_id: tenantId,
      p_secret_name: secretName,
    })

    if (error) {
      console.warn(`[getTenantSecret] vault read failed for ${vaultName}: ${error.message}`)
      return null
    }

    const value = typeof data === 'string' ? data.trim() : ''
    if (!value) {
      console.warn(`[getTenantSecret] no vault secret for ${vaultName} (returning null)`)
      return null
    }

    return value
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[getTenantSecret] unexpected error reading ${vaultName}: ${msg}`)
    return null
  }
}
