// Vertical-aware service-content accessor (S-PLS-5 / D1). Shells import this
// one function instead of reaching into a vertical's map directly. Pest
// tenants resolve EXACTLY as they did when shells read PEST_CONTENT_MAP —
// getServiceEntry('pest', slug) returns the same object reference from the
// same map, so the pest path is provably unchanged (locked by tests).
//
// PR A: the registry and resolveVertical MOVED to shared/lib/verticals so the
// schema layer can reach them without shared/ importing src/. They are
// re-exported here unchanged, so every existing consumer of this module keeps
// importing from the same path with zero line changes.
import type { PestEntry } from './pestContent';
import { PEST_CONTENT_MAP } from './pestContent';
import { IRRIGATION_CONTENT_MAP } from './irrigationContent';
import { LAWN_CONTENT_MAP } from './lawnContent';
import type { Vertical } from '../../../shared/lib/verticals';

export { VERTICALS, isVertical, resolveVertical } from '../../../shared/lib/verticals';
export type { Vertical } from '../../../shared/lib/verticals';

/**
 * Vertical → catalog. S323 PR A replaced a two-way ternary
 * (`vertical === 'irrigation' ? IRRIGATION : PEST`) with this table, and the
 * change is not cosmetic: the ternary's ELSE branch served PEST content to
 * every vertical that was not irrigation. Adding 'lawn' to VERTICALS without
 * this would have made a lawn tenant resolve pest slugs — the exact
 * wrong-trade-page failure the architecture exists to prevent.
 *
 * Partial, and there is NO pest fallback. An unregistered-but-valid vertical
 * (pool, hvac, roof, trailer) resolves NOTHING, matching NEUTRAL_ADMIN_PRESET's
 * empty servicePageSlugs: a tenant whose catalog has not been written has no
 * service pages, rather than another trade's. That is a behaviour change only
 * for verticals no tenant can hold — settings_business_info_vertical_valid
 * permits 'pest', 'irrigation' and NULL, and resolveVertical returns only pest
 * or irrigation — so pest and irrigation tenants are byte-identical. Locked by
 * tests asserting the same-object-reference identity for both.
 *
 * SERVICE_SLUGS_BY_VERTICAL in app/tenant/[slug]/_lib/serviceData.ts is the
 * router-side twin of this table and MUST agree with it key for key: the route
 * decides service-page vs location-page from the slug SET, then renders from
 * the entry. A vertical in one and not the other renders a service page with no
 * entry. lawnCatalog.test.ts pins the two tables equal.
 */
const CONTENT_MAP_BY_VERTICAL: Partial<Record<Vertical, Record<string, PestEntry>>> = {
  pest: PEST_CONTENT_MAP,
  irrigation: IRRIGATION_CONTENT_MAP,
  lawn: LAWN_CONTENT_MAP,
};

export function getServiceEntry(vertical: Vertical, slug: string): PestEntry | undefined {
  const map = CONTENT_MAP_BY_VERTICAL[vertical];
  return map ? map[slug] : undefined;
}
