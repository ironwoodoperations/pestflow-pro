// Vertical-aware service-content accessor (S-PLS-5 / D1). Shells import this
// one function instead of reaching into a vertical's map directly. Pest
// tenants resolve EXACTLY as they did when shells read PEST_CONTENT_MAP —
// getServiceEntry('pest', slug) returns the same object reference from the
// same map, so the pest path is provably unchanged (locked by tests).
import type { PestEntry } from './pestContent';
import { PEST_CONTENT_MAP } from './pestContent';
import { IRRIGATION_CONTENT_MAP } from './irrigationContent';

/**
 * The vertical registry (PR A). Adding a vertical is a ONE-LINE change here:
 * `Vertical` derives from these keys, so every consumer that switches on a
 * vertical is re-checked by TypeScript the moment a key is added.
 *
 * Registration is deliberately separate from having copy. A key may be
 * registered (routable, type-valid) before its preset exists — getVerticalCopy
 * throws for those rather than silently serving pest copy.
 *
 * irrigation and lawn are SEPARATE verticals, not aliases: irrigation is
 * water management (sprinklers, drainage, pumps), lawn is turf care. A tenant
 * doing both is two service sets, not one merged vocabulary.
 */
export const VERTICALS = Object.freeze([
  'pest',
  'irrigation',
  'lawn',
  'pool',
  'hvac',
  'roof',
  'trailer',
] as const);

export type Vertical = (typeof VERTICALS)[number];

/** Strict membership test — the only thing that may promote a DB string to a Vertical. */
export function isVertical(value: unknown): value is Vertical {
  return typeof value === 'string' && (VERTICALS as readonly string[]).includes(value);
}

// Dev-only warning bookkeeping. resolveVertical runs on every request for every
// page, so an unconditional console.warn would bury the signal it exists to
// raise; each distinct (vertical, industry) pair warns once per process.
const warnedFallbacks = new Set<string>();

function warnFallbackResolution(
  tenant: { vertical?: string | null; industry?: string | null },
  resolved: Vertical,
): void {
  // Read NODE_ENV off globalThis rather than the bare `process` identifier:
  // this module is in BOTH the Next program and the Vite program, and the Vite
  // tsconfig has no node types. Warn only when we can positively confirm a
  // non-production Node env — in the browser `process` is absent, NODE_ENV is
  // undefined, and this returns silently.
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  if (env?.NODE_ENV === undefined || env.NODE_ENV === 'production') return;
  const key = `${tenant.vertical ?? ''}|${tenant.industry ?? ''}`;
  if (warnedFallbacks.has(key)) return;
  warnedFallbacks.add(key);
  console.warn(
    `[resolveVertical] no valid business_info.vertical (got ${JSON.stringify(tenant.vertical)}); ` +
      `resolved '${resolved}' from industry ${JSON.stringify(tenant.industry)}. ` +
      `Set business_info.vertical explicitly at provisioning — one of: ${VERTICALS.join(', ')}.`,
  );
}

/**
 * Resolve the tenant's vertical (S-PLS-6 hardening; registry-opened in PR A).
 *
 * 1. EXPLICIT KEY WINS: settings.business_info.vertical, validated strictly
 *    against the registry — only an exact registered key engages ('Irrigation',
 *    junk, absent → fall through). A routing key must not depend on prose.
 * 2. FALLBACK (kept deliberately, do not remove): the industry substring.
 *    settings.business_info.industry is the AI social prompt input — freeform
 *    prose meant to be edited — so it is the safety net for tenants
 *    provisioned without the explicit key, not the primary switch. Rewriting
 *    the prose can no longer silently 404 an explicit-keyed tenant's services.
 * Absent both → 'pest', the historical behavior. (Vita Glow never reaches
 * vertical-dispatched code: its template branches fire earlier.)
 *
 * PR A deliberately does NOT generalize step 2 into a scan over all registered
 * keys. Widening it would newly route a pest tenant whose freeform industry
 * prose happens to contain e.g. "lawn", which is exactly the silent movement
 * this PR's byte-identical invariant forbids. Step 2 stays the irrigation
 * substring check it has always been; new verticals arrive via step 1.
 */
export function resolveVertical(tenant: { vertical?: string | null; industry?: string | null }): Vertical {
  if (isVertical(tenant.vertical)) return tenant.vertical;
  const resolved: Vertical = tenant.industry?.toLowerCase().includes('irrigation') ? 'irrigation' : 'pest';
  warnFallbackResolution(tenant, resolved);
  return resolved;
}

export function getServiceEntry(vertical: Vertical, slug: string): PestEntry | undefined {
  return vertical === 'irrigation' ? IRRIGATION_CONTENT_MAP[slug] : PEST_CONTENT_MAP[slug];
}
