// S253 / A1 fix — registrable-domain (eTLD+1) reducer + shared-platform guard.
// PURE module (no Deno/esm.sh imports) so it is importable by BOTH the Deno edge
// worker and Node/vitest unit tests.
//
// WHY: AI engines cite a tenant under whichever host they happen to surface
// (apex, www., admin., a deep page). Owner-host matching must collapse those to
// the registrable domain (eTLD+1) so admin.X.com / www.X.com / X.com all resolve
// to X.com and match — see citationMatchesTenant in match.ts.
//
// SCOPE (deliberate): edge-compatible and dependency-free. This is NOT a full
// Public Suffix List — it is a tiny in-code multi-part-suffix allowlist plus the
// US two-letter-locality rule, which is all our footprint (a handful of US
// pest-control tenants) needs. A naive "last two labels" reducer is UNSAFE: it
// mis-collapses multi-part suffixes and, critically, the US '.us' locality
// structure (pestcontrol.austin.tx.us would collapse to 'tx.us', so two distinct
// tenants under the same state would share a registrable domain and BREAK TENANT
// ISOLATION). If/when we onboard international or multi-part-suffix domains,
// replace this module with a real PSL (e.g. the `psl` package) — do NOT keep
// extending the table ad hoc.

// Multi-part public suffixes where the registrable domain is the last THREE
// labels (e.g. example.co.uk → example.co.uk, not co.uk). Keep tiny + in-code.
const MULTI_PART_SUFFIXES = new Set<string>([
  'co.uk', 'org.uk', 'me.uk', 'net.uk', 'ltd.uk', 'plc.uk', 'sch.uk', 'gov.uk',
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au',
  'co.nz', 'net.nz', 'org.nz',
  'com.mx', 'org.mx', 'gob.mx',
  'com.br', 'com.sg', 'com.cn', 'co.za', 'co.in', 'co.jp', 'co.kr',
]);

// Reduce a hostname to its registrable domain (eTLD+1). Lowercases and tolerates
// stray leading/trailing dots. Bare hostnames pass through (no scheme needed).
export function getRegistrableDomain(hostname: string): string {
  const h = (hostname || '').trim().toLowerCase().replace(/^\.+|\.+$/g, '');
  if (!h) return '';
  const labels = h.split('.').filter(Boolean);
  if (labels.length <= 2) return labels.join('.');

  const last2 = labels.slice(-2).join('.');
  // US locality structure: <name>.<locality>.<2-letter-state>.us — e.g.
  // pestcontrol.austin.tx.us. The registrable unit is <locality>.<state>.us
  // (last THREE labels) so distinct tenants in the same state do NOT collapse.
  const usLocality =
    labels[labels.length - 1] === 'us' && labels[labels.length - 2].length === 2;

  if (MULTI_PART_SUFFIXES.has(last2) || usLocality) {
    return labels.slice(-3).join('.');
  }
  return last2;
}

// Registrable domains that are KNOWN multi-tenant / shared platforms. A bare
// subdomain on one of these (e.g. dang.pestpages.com) is NOT exclusively owned by
// the tenant, so collapsing it to the apex would credit EVERY other business on
// the platform (cross-tenant citation bleed). Hosts whose registrable domain is
// in this set MUST fall back to exact-host matching, never registrable collapse.
// pestflowpro.ai is ours; the rest are common site builders / hosting platforms.
const SHARED_PLATFORM_DOMAINS = new Set<string>([
  'pestflowpro.ai',
  'pestpages.com',
  'wixsite.com', 'squarespace.com', 'weebly.com', 'godaddysites.com',
  'business.site', 'web.app', 'firebaseapp.com', 'netlify.app', 'vercel.app',
  'github.io', 'wordpress.com', 'blogspot.com',
]);

// True when `hostname` lives on a known shared/multi-tenant platform and must
// therefore be matched EXACTLY (never collapsed to its registrable domain).
export function isSharedPlatformHost(hostname: string): boolean {
  const reg = getRegistrableDomain(hostname);
  return reg !== '' && SHARED_PLATFORM_DOMAINS.has(reg);
}
