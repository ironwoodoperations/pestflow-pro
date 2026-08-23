// Vertical copy presets (PR A). The registry half of
//   vertical preset (code) → tenant DB override → render
// so one set of shells serves every vertical instead of one hardcoded trade.
// Mirrors getServiceEntry's discipline: a single accessor, no shell reaches
// into the map directly, and the pest values are the CURRENT production
// strings copied verbatim so nothing rendered can move.
//
// Nothing imports this file yet except the schema-vocabulary layer — the
// consumers (location hero, Process, service-area, metadata) land in PR B.
import type { Vertical } from './serviceEntry';

/**
 * Copy slots resolved per vertical.
 *
 * Additive by design: a new slot is a new required field here plus a value in
 * each populated preset. TypeScript then flags every preset missing it, which
 * is the same completeness guarantee the Vertical registry gives consumers.
 * PR B adds the rest of the slots once the inventory pass is done.
 */
export interface VerticalCopy {
  /** Appended to a city in location hero titles: `${city} ${locationHeroSuffix}`. */
  locationHeroSuffix: string;
  /** The Process section's h2. */
  processHeading: string;
  /** Service-area hero subtitle, used when the DB has no override. */
  serviceAreaStrapline: string;
  /** Metadata description tail: `${businessName} — ${metadataFallbackDesc}`. */
  metadataFallbackDesc: string;
}

// Frozen for the same reason PEST_CONTROL_VOCABULARY is: these objects are
// handed out by reference, so an unfrozen preset could be mutated process-wide
// by any caller and would corrupt every later render.
//
// Partial, NOT Record: a vertical may be registered (routable, type-valid)
// before anyone has written its copy. Registration and copy are separate facts.
const VERTICAL_COPY: Partial<Record<Vertical, VerticalCopy>> = Object.freeze({
  // VERBATIM from production — diffed character by character:
  //   locationHeroSuffix   app/tenant/[slug]/[service]/page.tsx:95  `${city} Pest Control`
  //   processHeading       app/tenant/[slug]/_components/sections/Process.tsx:15
  //   serviceAreaStrapline app/tenant/[slug]/service-area/page.tsx:25
  //   metadataFallbackDesc app/tenant/[slug]/layout.tsx:42
  // Changing any of these moves live pest tenants. Don't.
  pest: Object.freeze({
    locationHeroSuffix: 'Pest Control',
    processHeading: 'How Our Pest Control Process Works',
    serviceAreaStrapline: 'Professional pest control in your community and surrounding areas.',
    metadataFallbackDesc: 'professional pest control services',
  }),
  irrigation: Object.freeze({
    locationHeroSuffix: 'Irrigation & Drainage',
    processHeading: 'How Our Irrigation Process Works',
    serviceAreaStrapline: 'Professional irrigation and drainage in your community and surrounding areas.',
    metadataFallbackDesc: 'professional irrigation and drainage services',
  }),
  // lawn, pool, hvac, roof, trailer: registered in VERTICALS, deliberately
  // ABSENT here. No placeholder copy — a pool tenant silently rendering pest
  // copy is the exact failure this architecture exists to prevent, so the
  // accessor throws instead. Fail at build/dev, not quietly in production.
});

/**
 * The only way to read a preset. Throws — loudly, naming the vertical — rather
 * than falling back to pest, so a vertical that reaches render without copy is
 * a caught bug and never a wrong-trade page served to a real customer.
 */
export function getVerticalCopy(vertical: Vertical): VerticalCopy {
  const copy = VERTICAL_COPY[vertical];
  if (!copy) {
    throw new Error(
      `[getVerticalCopy] no copy preset registered for vertical "${vertical}". ` +
        `It is a registered key but has no copy yet — add a preset in ` +
        `src/shells/_shared/verticalCopy.ts. Refusing to fall back to pest copy.`,
    );
  }
  return copy;
}
