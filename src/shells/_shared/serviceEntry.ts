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
 * Derive the tenant's vertical from settings.business_info.industry (carried
 * on the resolved Tenant). The §7 industry string for irrigation tenants
 * leads with "irrigation"; every pest tenant carries "Pest Control"; absent
 * or unrecognized values default to 'pest' — the historical behavior.
 * (Vita Glow never reaches vertical-dispatched code: its template branches
 * fire earlier in layout/page/[service].)
 */
export function resolveVertical(tenant: { industry?: string | null }): Vertical {
  return tenant.industry?.toLowerCase().includes('irrigation') ? 'irrigation' : 'pest';
}

export function getServiceEntry(vertical: Vertical, slug: string): PestEntry | undefined {
  return vertical === 'irrigation' ? IRRIGATION_CONTENT_MAP[slug] : PEST_CONTENT_MAP[slug];
}
