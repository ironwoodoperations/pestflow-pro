// S329 — THE `.ts` IS LOAD-BEARING. DO NOT DROP IT BACK TO './canonicalHost'.
//
// This module is now imported by a Supabase edge function (zernio-connect, via
// connectLogic.ts) so that the platform has ONE host resolver rather than a second copy
// living in Deno-land. Deno requires an explicit extension on a relative specifier, and
// the Supabase CLI ships source files VERBATIM — the deployed service-area-map bundle
// carries `from '../../../shared/lib/serviceAreaMap.ts'` unrewritten — so the specifier
// is resolved at RUNTIME, not inlined at build time. Extensionless, the edge function
// would fail to resolve this import in production.
//
// The cost, paid deliberately: tsconfig.json now sets `allowImportingTsExtensions`,
// without which tsc rejects this line as TS5097. Next, Vite and vitest all resolve the
// explicit extension unchanged (build + 1565 tests verified). The 14 Next-side importers
// of resolveSiteUrl are untouched — they still import it extensionlessly.
import { normalizeCanonicalHost } from './canonicalHost.ts';

/**
 * Resolve the canonical public origin (scheme + host, no trailing slash) for a
 * tenant. This is the single source of truth for every SSR siteUrl in the
 * tenant route tree — canonical links, OG/Twitter URLs, and JSON-LD `@id`s.
 *
 * Precedence:
 *   1. Explicit custom-domain map — checked FIRST. See the block comment below; the order
 *      is load-bearing and is asserted by a test.
 *   2. `tenants.custom_domain`, normalized to a host (S321).
 *   3. `https://<subdomain|slug>.pestflowpro.ai` — the platform wildcard host.
 *
 * NOTE: the platform host is `.ai`, NOT `.com`. The wildcard redirect shipped
 * in PR #228 already 308s `*.pestflowpro.com` → `*.pestflowpro.ai` in prod, so
 * emitting `.ai` canonicals is the correct, non-regressing target.
 */
export function resolveSiteUrl(
  tenant: { slug: string; subdomain?: string | null; custom_domain?: string | null },
): string {
  // ── STEP 1 — the explicit map. CHECKED FIRST, AND THAT ORDER IS LOAD-BEARING. ──
  //
  // DO NOT REMOVE THESE ENTRIES AND DO NOT MOVE THIS BELOW STEP 2. Both were considered
  // and both are prohibited:
  //
  //   * `dang-pfp` is NOT dead code. It is pre-wired for an in-progress Vite→Next.js
  //     migration of a tenant that runs on its own repository and is live in production.
  //   * dang's `tenants.custom_domain` holds `admin.dangpestcontrol.com` — the ADMIN host,
  //     which DOES NOT RESOLVE IN DNS. Consulting the column first would point a live
  //     client's public canonical at an admin login host that does not answer. The map
  //     taking precedence is precisely what prevents that.
  //
  // The S321 validator gate split on this: one model required deleting the map, the other
  // required it keep exact priority. Conservative won — keeping it changes nothing for that
  // tenant, removing it changes a live client's canonical. `resolveSiteUrl.test.ts` fails if
  // the map is emptied or the two steps are reordered, so this is executable, not a comment.
  const CUSTOM_DOMAINS: Record<string, string> = {
    dang: 'https://dangpestcontrol.com',
    'dang-pfp': 'https://dangpestcontrol.com',
  };

  const custom = CUSTOM_DOMAINS[tenant.slug];
  if (custom) return custom;

  // ── STEP 2 — tenants.custom_domain. NEW in S321, reached only on a map miss. ──
  //
  // Normalized rather than trusted: the column is operator-editable through the admin
  // Domain tab, so it can hold a URL, a trailing dot, or junk. A bad value degrades to the
  // platform subdomain below — never to a throw, which inside generateMetadata would fail
  // the page render rather than the canonical.
  const fromColumn = normalizeCanonicalHost(tenant.custom_domain);
  if (fromColumn) return `https://${fromColumn}`;

  // ── STEP 3 — the platform wildcard host. UNCHANGED. ──
  return `https://${tenant.subdomain ?? tenant.slug}.pestflowpro.ai`;
}
