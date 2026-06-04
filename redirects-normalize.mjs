// S253 / D1 — Path canonicalization shared by the build-time redirect-map
// projector (scripts/generate-redirects-map.mjs) and the Edge middleware lookup
// (middleware.ts). The keys written into redirects-map.json and the incoming
// request paths looked up against it MUST be canonicalized by the SAME function
// or lookups silently miss. ZERO dependencies on purpose — this module is in the
// Edge middleware import graph and must stay tiny (bundle hygiene, Task 2).

/**
 * Canonicalize a URL path so map keys and incoming paths compare 1:1.
 *  - ensure a single leading slash
 *  - collapse duplicate slashes (`//` -> `/`)
 *  - strip a trailing slash UNLESS the path is exactly `/`
 *  - lowercase
 *
 * NOTE on decoding: this function does NOT decode. The build step decodes the
 * DB value ONCE (because nextUrl.pathname arrives already-decoded at runtime)
 * before calling this; middleware passes nextUrl.pathname straight through.
 *
 * @param {string} path
 * @returns {string}
 */
export function canonicalizePath(path) {
  let p = path == null ? '' : String(path);
  if (!p.startsWith('/')) p = '/' + p;
  p = p.replace(/\/{2,}/g, '/');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p.toLowerCase();
}
