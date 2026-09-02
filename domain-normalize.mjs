// S318 — Hostname canonicalization + lookup shared by the build-time domain-map
// projector (scripts/generate-domain-map.mjs) and the Edge middleware resolution
// (middleware.ts). The keys written into domain-map.json and the incoming Host
// header looked up against it MUST be canonicalized by the SAME function or
// lookups silently miss. ZERO dependencies on purpose — this module is in the
// Edge middleware import graph and must stay tiny (bundle hygiene), exactly as
// redirects-normalize.mjs is for paths.

/**
 * Canonicalize a hostname so map keys and incoming hosts compare 1:1.
 *  - strip a :port suffix
 *  - lowercase
 *  - strip a single trailing dot (the FQDN root label: "example.com." is the
 *    same host as "example.com" and some clients send it)
 *  - trim surrounding whitespace, which a hand-entered DB value can carry
 *
 * Deliberately does NOT strip a leading "www." — apex and www are DISTINCT keys
 * and both are projected, so that resolution never depends on Vercel dashboard
 * redirect state we cannot see from this repo.
 *
 * @param {string} host
 * @returns {string}
 */
export function canonicalizeHost(host) {
  let h = host == null ? '' : String(host);
  h = h.trim().split(':')[0].toLowerCase();
  if (h.length > 1 && h.endsWith('.')) h = h.slice(0, -1);
  return h;
}

/**
 * Resolve a request Host to a tenant slug via the build-time projection.
 * Returns null on any miss — the caller then falls through to existing
 * behaviour unchanged, which is what keeps this purely additive.
 *
 * @param {string} host raw Host header value
 * @param {Record<string, string>} map hostname -> slug
 * @returns {string | null}
 */
export function resolveCustomHost(host, map) {
  const key = canonicalizeHost(host);
  if (!key) return null;
  const slug = map?.[key];
  return typeof slug === 'string' && slug.length > 0 ? slug : null;
}
