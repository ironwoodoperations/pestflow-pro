// Vertical-aware service-content accessor (S-PLS-5 / D1). Shells import this
// one function instead of reaching into a vertical's map directly. Pest
// tenants resolve EXACTLY as they did when shells read PEST_CONTENT_MAP —
// getServiceEntry('pest', slug) returns the same object reference from the
// same map, so the pest path is provably unchanged (locked by tests).
import type { PestEntry } from './pestContent';
import { PEST_CONTENT_MAP } from './pestContent';
import { IRRIGATION_CONTENT_MAP } from './irrigationContent';

export type Vertical = 'pest' | 'irrigation';

/**
 * Resolve the tenant's vertical (S-PLS-6 hardening).
 *
 * 1. EXPLICIT KEY WINS: settings.business_info.vertical, validated strictly —
 *    only the exact strings 'irrigation' | 'pest' engage ('Irrigation', junk,
 *    absent → fall through). A routing key must not depend on prose.
 * 2. FALLBACK (kept deliberately, do not remove): the industry substring.
 *    settings.business_info.industry is the AI social prompt input — freeform
 *    prose meant to be edited — so it is the safety net for tenants
 *    provisioned without the explicit key, not the primary switch. Rewriting
 *    the prose can no longer silently 404 an explicit-keyed tenant's services.
 * Absent both → 'pest', the historical behavior. (Vita Glow never reaches
 * vertical-dispatched code: its template branches fire earlier.)
 */
export function resolveVertical(tenant: { vertical?: string | null; industry?: string | null }): Vertical {
  if (tenant.vertical === 'irrigation' || tenant.vertical === 'pest') return tenant.vertical;
  return tenant.industry?.toLowerCase().includes('irrigation') ? 'irrigation' : 'pest';
}

export function getServiceEntry(vertical: Vertical, slug: string): PestEntry | undefined {
  return vertical === 'irrigation' ? IRRIGATION_CONTENT_MAP[slug] : PEST_CONTENT_MAP[slug];
}
