import { withCity, type VerticalCopy } from '../../../../src/shells/_shared/verticalCopy';

/**
 * PR B / WS2 — location-page copy precedence, extracted so the rule is
 * testable rather than buried in JSX.
 *
 * THE RULE, and the whole point of the architecture:
 *     tenant DB row  >  vertical preset
 * A location row's hero_title and intro always win. The preset only supplies
 * what the DB has not. Whitespace-only DB values do not count as set.
 */
export interface LocationRow { city?: string; hero_title?: string; intro?: string }

export function resolveLocationHeroTitle(loc: LocationRow, city: string, copy: VerticalCopy): string {
  return loc.hero_title || `${city} ${copy.locationHeroSuffix}`;
}

/**
 * The intro paragraphs to render, plus WHERE they came from.
 *
 * `fromDb` is not cosmetic: the original markup gave a DB intro `mb-4` and gave
 * only the LAST PRESET paragraph `mb-6`. Collapsing both cases into one map
 * silently changed the DB-intro margin, so the caller needs to know which it
 * has. Byte-identical means the class strings too.
 */
export interface ResolvedIntro { paragraphs: string[]; fromDb: boolean }

export function resolveLocationIntro(loc: LocationRow, city: string, copy: VerticalCopy): ResolvedIntro {
  const fromDb = loc.intro?.trim();
  if (fromDb) return { paragraphs: [fromDb], fromDb: true };
  return { paragraphs: copy.locationIntroFallback.map((p) => withCity(p, city)), fromDb: false };
}
