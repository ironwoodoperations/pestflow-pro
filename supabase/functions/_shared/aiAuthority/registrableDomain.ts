// S253 / A1 — registrable-domain (eTLD+1) reducer + collapse-eligibility.
// PURE module (no imports) so it is importable by both the Deno edge worker and
// Node/vitest. Edge-compatible: a tiny in-code multi-part public-suffix allowlist
// instead of a full Public Suffix List dependency (a full PSL is overkill for this
// footprint). Revisit with a real PSL if international/multi-part coverage grows.

// Known multi-part public suffixes where the registrable domain is the last THREE
// labels (e.g. bbc.co.uk → registrable 'bbc.co.uk', suffix 'co.uk'). Keep this
// tiny and explicit — it only needs to cover suffixes our tenants actually use.
const MULTI_PART_SUFFIXES = new Set<string>([
  'co.uk', 'org.uk', 'me.uk', 'ac.uk', 'gov.uk', 'net.uk', 'ltd.uk', 'plc.uk',
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au',
  'co.nz', 'org.nz', 'net.nz', 'govt.nz',
  'com.mx', 'org.mx', 'gob.mx',
  'co.jp', 'or.jp', 'ne.jp', 'go.jp',
  'co.za', 'org.za',
  'com.br', 'net.br', 'gov.br',
  'com.sg', 'com.my', 'com.tr',
]);

// Leftmost single-label subdomains that signal the tenant OWNS the apex, so
// collapsing to the registrable domain is safe. Anything else that is a subdomain
// is treated as a possibly-shared-platform tenant subdomain → exact-host only.
const OWNED_SUBDOMAIN_PREFIXES = new Set<string>([
  'www', 'admin', 'blog', 'app', 'portal', 'mail', 'shop', 'store', 'go', 'get', 'm',
]);

function cleanHost(hostname: string): string {
  return (hostname || '').trim().toLowerCase().replace(/\.+$/, '');
}

// Reduce a hostname to its registrable domain (eTLD+1).
// Strategy: last-2 labels, EXCEPT known multi-part suffixes and the US two-letter
// locality structure (e.g. tx.us, ca.us → keep last-3). A strict last-2 reducer
// would collapse two different tenants on *.tx.us to the SAME 'tx.us' and break
// tenant isolation (validator-flagged). <= 2 labels → returned as-is.
export function getRegistrableDomain(hostname: string): string {
  const h = cleanHost(hostname);
  if (!h) return '';
  const labels = h.split('.').filter(Boolean);
  if (labels.length <= 2) return labels.join('.');

  const last2 = labels.slice(-2).join('.');
  const lastLabel = labels[labels.length - 1];
  const secondToLast = labels[labels.length - 2];
  // '.us' two-letter-locality (tx.us, ca.us, ny.us, …): registrable domain is the
  // last THREE labels so austin.tx.us != dallas.tx.us (cross-tenant isolation).
  const isUsLocality = lastLabel === 'us' && secondToLast.length === 2;
  if (MULTI_PART_SUFFIXES.has(last2) || isUsLocality) {
    return labels.slice(-3).join('.');
  }
  return last2;
}

// True when collapsing this owner host to its registrable domain is SAFE — i.e.
// the tenant exclusively owns the apex. Eligible: a bare apex, or a single
// known-owned subdomain prefix (www./admin./blog./…). NOT eligible: a
// tenant-specific subdomain on a potentially shared/multi-tenant platform (e.g.
// dang.pestflowpro.ai) — those must be matched by exact host to avoid
// cross-tenant citation bleed. When in doubt → not eligible (exact host wins).
export function isRegistrableCollapseEligible(hostname: string): boolean {
  const h = cleanHost(hostname);
  if (!h) return false;
  const reg = getRegistrableDomain(h);
  if (!reg) return false;
  if (h === reg) return true; // bare apex (including multi-part-suffix apex)
  const hLabels = h.split('.');
  const regLabels = reg.split('.');
  const subLabels = hLabels.slice(0, hLabels.length - regLabels.length);
  return subLabels.length === 1 && OWNED_SUBDOMAIN_PREFIXES.has(subLabels[0]);
}
