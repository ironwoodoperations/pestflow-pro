// S253 / A1 — deterministic citation/mention matching.
// PURE module (no imports beyond ./types.ts). Shared by the edge worker and
// vitest. The validator settled: `cited` is DETERMINISTIC exact-hostname matching,
// never the model's self-report.

import type { TenantContext, EngineAnswer } from './types.ts';
import { getRegistrableDomain } from './registrableDomain.ts';

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

// Normalize a full URL to host + path (lowercased, no trailing slash) for
// tracked-listing-URL matching. Tracking params + fragments are stripped: the URL
// parser exposes the query string and hash as `.search` / `.hash`, which we never
// read, so `?utm_source=openai`, `?fbclid=…`, `#section` are dropped by
// construction (validator: the live raw response literally had ?utm_source=openai).
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

// True when a citation URL belongs to the tenant, via any of:
//   1. EXACT owner-host match (shared-platform subdomains, *.pestflowpro.ai) —
//      these must stay exact or every tenant's subdomain would cross-match.
//   2. Registrable-domain (eTLD+1) match against the tenant's EXCLUSIVELY-owned
//      domains, so apex / www. / admin. / deep-page citations of the tenant's own
//      domain all resolve (A1 fix: engine cited www.dangpestcontrol.com while the
//      owner host was admin.dangpestcontrol.com — same registrable domain).
//   3. EXACT tracked-URL (host+path) match — directory listings (Yelp/Angi/GBP)
//      stay exact-URL so citing yelp.com/biz/<competitor> never counts as us.
// Matching is EXACT (host/registrable-domain/url), NOT substring — avoids
// austinpestpro vs austinpestpros (validator note). Tracking params are stripped
// before host extraction and URL comparison (hostnameOf/normalizeUrl drop query +
// fragment by construction).
export function citationMatchesTenant(rawUrl: string, ctx: TenantContext): boolean {
  const host = hostnameOf(rawUrl);
  if (host) {
    const ownerHostSet = new Set(ctx.ownerHosts.map(normalizeHostname).filter(Boolean));
    if (ownerHostSet.has(host)) return true;

    const ownerDomainSet = new Set((ctx.ownerDomains || []).map(normalizeHostname).filter(Boolean));
    if (ownerDomainSet.size > 0 && ownerDomainSet.has(getRegistrableDomain(host))) return true;
  }
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
