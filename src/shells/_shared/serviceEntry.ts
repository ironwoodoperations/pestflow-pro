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
import type { Vertical } from '../../../shared/lib/verticals';

export { VERTICALS, isVertical, resolveVertical } from '../../../shared/lib/verticals';
export type { Vertical } from '../../../shared/lib/verticals';

export function getServiceEntry(vertical: Vertical, slug: string): PestEntry | undefined {
  return vertical === 'irrigation' ? IRRIGATION_CONTENT_MAP[slug] : PEST_CONTENT_MAP[slug];
}
