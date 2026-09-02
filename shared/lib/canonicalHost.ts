// S321 PR B — normalize a stored custom domain to a bare host.
//
// SEPARATE FROM supabase/functions/_shared/originHost.ts ON PURPOSE, not by oversight.
// That module is Deno-land: it is bundled into an edge function and imported with an
// explicit `.ts` extension, which this Next.js/Node module graph does not resolve. The two
// have different runtimes and different import grammars. What they MUST share is the
// SEMANTICS, so the rules below are stated in the same order and the tests assert the same
// rejections. If one changes, change both.
//
// The stored value is a HOST ('precisionlawnsystems.com'), never a URL. Storing a URL would
// make every consumer re-derive a host, and a canonical that disagrees between consumers is
// the indexing defect this change exists to remove.

/**
 * Normalize a stored `tenants.custom_domain` value to a bare lowercase host, or null when it
 * is not something we will emit in a canonical URL.
 *
 * Returns null rather than throwing: this runs inside `generateMetadata`, and a throw there
 * fails the page render. A bad value must degrade to the platform subdomain, not to a 500.
 */
export function normalizeCanonicalHost(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // A stored value carrying a scheme is accepted and reduced to its host, because operators
  // paste URLs into admin fields. Anything else is parsed as a bare host.
  let host: string;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    let url: URL;
    try { url = new URL(trimmed); } catch { return null; }
    if (url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    if (url.port) return null;
    host = url.hostname;
  } else {
    host = trimmed;
  }

  host = host.toLowerCase().replace(/\.$/, '');

  // Reject anything that is not a plain hostname: a path, query, fragment, userinfo, port,
  // whitespace or percent-encoding all mean the stored value is not a host.
  if (!host) return null;
  if (/[\/?#@\s%:]/.test(host)) return null;
  // Must look like a dotted hostname. Rules out 'localhost', bare labels and ip-ish junk
  // reaching a public canonical.
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(host)) return null;

  return host;
}
