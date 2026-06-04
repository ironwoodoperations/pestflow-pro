// S253 / A1 — deterministic citation/mention matching.
// PURE module (no imports beyond ./types.ts). Shared by the edge worker and
// vitest. The validator settled: `cited` is DETERMINISTIC exact-hostname matching,
// never the model's self-report.

import type { TenantContext, EngineAnswer } from './types.ts';
import { getRegistrableDomain, isRegistrableCollapseEligible } from './registrableDomain.ts';

// Normalize a hostname for exact comparison: lowercase, strip a single leading
// "www.". (Ports/paths are already gone once we pull .hostname from URL.)
export function normalizeHostname(host: string): string {
  let h = (host || '').trim().toLowerCase();
  if (h.startsWith('www.')) h = h.slice(4);
  return h;
}

// Parse a hostname out of an arbitrary citation string. Tolerates bare hostnames
// ("acmepest.com/x") and full URLs ("https://acmepest.com/x"). Returns '' on junk.
export function hostnameOf(rawUrl: string): string {
  const s = (rawUrl || '').trim();
  if (!s) return '';
  try {
    const u = new URL(s.includes('://') ? s : `https://${s}`);
    return normalizeHostname(u.hostname);
  } catch {
    return '';
  }
}

// Normalize a full URL to host + path (lowercased, no trailing slash, no query/
// hash) for tracked-listing-URL matching.
export function normalizeUrl(rawUrl: string): string {
  const s = (rawUrl || '').trim();
  if (!s) return '';
  try {
    const u = new URL(s.includes('://') ? s : `https://${s}`);
    let path = u.pathname.replace(/\/+$/, '');
    return `${normalizeHostname(u.hostname)}${path}`.toLowerCase();
  } catch {
    return '';
  }
}

// True when a citation URL belongs to the tenant. Three independent signals:
//   1. EXACT owner-host match — covers tenant-specific subdomains on shared/
//      multi-tenant platforms (e.g. <slug>.pestflowpro.ai) which must NOT collapse.
//   2. REGISTRABLE-domain (eTLD+1) match — only for owner hosts the tenant
//      exclusively owns (bare apex / www./admin./… subdomain) plus an optional
//      per-tenant canonical_apex override. Lets admin.X.com / www.X.com / X.com all
//      match a citation of X.com (the A1 bug: tenants.custom_domain was the admin
//      host while the engine cited the public apex). A cited URL on the same
//      registrable domain — any subdomain — counts.
//   3. EXACT tracked-URL (host+path) match — directory/listing URLs are never
//      collapsed (citing yelp.com/biz/<competitor> must not count as the tenant).
// Host/URL extraction drops query + fragment (URL.hostname / URL.pathname), so
// tracking params like ?utm_source=openai never affect matching.
// Exact-where-it-matters, NOT substring — avoids austinpestpro vs austinpestpros.
export function citationMatchesTenant(rawUrl: string, ctx: TenantContext): boolean {
  const citedHost = hostnameOf(rawUrl);

  if (citedHost) {
    // 1) Exact owner-host match.
    const ownerExact = new Set(ctx.ownerHosts.map(normalizeHostname).filter(Boolean));
    if (ownerExact.has(citedHost)) return true;

    // 2) Registrable-domain match for exclusively-owned apexes + canonical_apex.
    const ownerApexes = new Set<string>();
    for (const oh of ctx.ownerHosts) {
      const n = normalizeHostname(oh);
      if (n && isRegistrableCollapseEligible(n)) ownerApexes.add(getRegistrableDomain(n));
    }
    if (ctx.canonicalApex) {
      // Pinned apex — trusted directly, bypassing the reducer (the long-tail
      // safety net for any domain the reducer would get wrong).
      const ca = normalizeHostname(ctx.canonicalApex);
      if (ca) ownerApexes.add(ca);
    }
    for (const apex of ownerApexes) {
      if (apex && (citedHost === apex || citedHost.endsWith(`.${apex}`))) return true;
    }
  }

  // 3) Tracked directory/listing URLs — exact normalized URL (host + path).
  const tracked = new Set(ctx.trackedUrls.map(normalizeUrl).filter(Boolean));
  return tracked.size > 0 && tracked.has(normalizeUrl(rawUrl));
}

// Collapse whitespace + lowercase for resilient text matching.
function norm(s: string): string {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// `mentioned` = the tenant's business name appears in the answer text. Programmatic
// and deterministic. Full-name match (case/space-insensitive).
export function detectMention(answerText: string, businessName: string): boolean {
  const name = norm(businessName);
  if (!name) return false;
  return norm(answerText).includes(name);
}

// 1-based rank of the tenant's FIRST matching citation in the engine's ordered
// list; null if the tenant is not cited.
export function firstPosition(citationUrls: string[], ctx: TenantContext): number | null {
  for (let i = 0; i < citationUrls.length; i++) {
    if (citationMatchesTenant(citationUrls[i], ctx)) return i + 1;
  }
  return null;
}

// share_of_voice = tenant citations / total citations over the answer's citation
// list, 0..1. null when there are no citations at all (can't divide).
export function shareOfVoice(citationUrls: string[], ctx: TenantContext): number | null {
  if (citationUrls.length === 0) return null;
  const mine = citationUrls.filter((u) => citationMatchesTenant(u, ctx)).length;
  return mine / citationUrls.length;
}

// Compute the four deterministic signals from an extracted EngineAnswer.
export function computeSignals(answer: EngineAnswer, ctx: TenantContext): {
  cited: boolean; mentioned: boolean; position: number | null; share_of_voice: number | null;
} {
  const position = firstPosition(answer.citationUrls, ctx);
  return {
    cited: position !== null,
    mentioned: detectMention(answer.answerText, ctx.businessName),
    position,
    share_of_voice: shareOfVoice(answer.citationUrls, ctx),
  };
}
