import type { AboutStat } from './queries';

/**
 * PR B / WS7 — resolve settings.about.stats into renderable tiles.
 *
 * This replaces four hardcoded tiles on the modern-pro about page, two of which
 * were fabricated ('5,000+ Properties protected', '24/7 Response window') and
 * one of which invented fifteen years of trading for any tenant without a
 * founded_year. There is NO fallback tile here and there must never be one:
 * rendering nothing is correct, inventing a number is not.
 *
 * Rules:
 *  - 'auto:years_operating' computes from founded_year. Absent or unusable
 *    founded_year DROPS the tile rather than substituting anything.
 *  - Entries that are not objects with a non-empty string `value` AND `label`
 *    are skipped, never rendered as `undefined`.
 *  - At most 4 tiles; extras are ignored. Truncation happens AFTER dropping
 *    unresolvable entries, so a dropped auto tile does not consume a slot.
 */
export const AUTO_YEARS_OPERATING = 'auto:years_operating';
export const MAX_ABOUT_STATS = 4;

export interface ResolvedStat { value: string; label: string }

function isWellFormed(entry: unknown): entry is AboutStat {
  if (typeof entry !== 'object' || entry === null) return false;
  const { value, label } = entry as { value?: unknown; label?: unknown };
  return typeof value === 'string' && value.trim().length > 0
    && typeof label === 'string' && label.trim().length > 0;
}

/** Years of operation, or null when founded_year cannot support a real number. */
export function yearsOperating(foundedYear: string | number | undefined | null, currentYear: number): number | null {
  if (foundedYear === undefined || foundedYear === null || `${foundedYear}`.trim() === '') return null;
  const founded = Number(foundedYear);
  if (!Number.isFinite(founded)) return null;
  const years = currentYear - founded;
  // A zero or negative span is not a claim worth making, and a founding year in
  // the future is bad data rather than a tile.
  return years > 0 ? years : null;
}

export function resolveAboutStats(
  stats: unknown,
  foundedYear: string | number | undefined | null,
  currentYear: number,
): ResolvedStat[] {
  if (!Array.isArray(stats)) return [];
  const resolved: ResolvedStat[] = [];
  for (const entry of stats) {
    if (!isWellFormed(entry)) continue;
    if (entry.value === AUTO_YEARS_OPERATING) {
      const years = yearsOperating(foundedYear, currentYear);
      if (years === null) continue;
      resolved.push({ value: `${years}+`, label: entry.label });
      continue;
    }
    resolved.push({ value: entry.value, label: entry.label });
  }
  return resolved.slice(0, MAX_ABOUT_STATS);
}
