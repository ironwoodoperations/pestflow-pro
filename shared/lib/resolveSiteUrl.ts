/**
 * Resolve the canonical public origin (scheme + host, no trailing slash) for a
 * tenant. This is the single source of truth for every SSR siteUrl in the
 * tenant route tree — canonical links, OG/Twitter URLs, and JSON-LD `@id`s.
 *
 * Precedence:
 *   1. Explicit custom-domain map (tenants on their own apex/vanity domain).
 *   2. `https://<subdomain|slug>.pestflowpro.ai` — the platform wildcard host.
 *
 * NOTE: the platform host is `.ai`, NOT `.com`. The wildcard redirect shipped
 * in PR #228 already 308s `*.pestflowpro.com` → `*.pestflowpro.ai` in prod, so
 * emitting `.ai` canonicals is the correct, non-regressing target.
 */
export function resolveSiteUrl(tenant: { slug: string; subdomain?: string | null }): string {
  // Explicit custom-domain map. Dang is live on its own apex domain.
  // TODO: read from tenant_domains WHERE verified=true once that table is wired.
  const CUSTOM_DOMAINS: Record<string, string> = {
    dang: 'https://dangpestcontrol.com',
    'dang-pfp': 'https://dangpestcontrol.com',
  };

  const custom = CUSTOM_DOMAINS[tenant.slug];
  if (custom) return custom;

  return `https://${tenant.subdomain ?? tenant.slug}.pestflowpro.ai`;
}
