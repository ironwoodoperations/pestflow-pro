// Quiet-hours gate utilities. Pure functions — no DB, no network, mockable
// via injected `now` parameter for unit tests.
//
// Per s199 b19: FL FTSA + OK OTPA require consumer SMS only between
// 8:00 AM and 8:00 PM local time. The window is [08:00, 20:00). Exactly
// 20:00:00 is OUTSIDE the window (quiet).
//
// Implementation uses Intl.DateTimeFormat for timezone math (no date lib).
// All inputs are UTC-naive `Date` objects; outputs are UTC `Date` objects.

export const QUIET_HOURS_STATES = ['FL', 'OK'] as const;

// SMS types that bypass the quiet-hours gate entirely. These are operator/
// staff-targeted (B2B transactional, not consumer-facing), and FTSA/OTPA
// quiet-hours rules don't apply.
export const BYPASS_GATE_TYPES = [
  'lead-notification',
  'owner-alert',
  'ops-alert',
  'salesperson-alert',
] as const;

/**
 * Returns the local hour (0–23) in `timezone` for the given UTC instant.
 * Uses Intl.DateTimeFormat with hour12=false so 24-hour output is stable
 * across browser/Deno locale defaults.
 */
function localHourIn(timezone: string, now: Date): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: timezone,
  });
  // Intl en-US with hour12=false sometimes returns "24" for midnight.
  // Normalize: parse number, modulo 24.
  const parts = fmt.formatToParts(now);
  const hourPart = parts.find((p) => p.type === 'hour');
  if (!hourPart) return 0;
  const h = Number(hourPart.value);
  return Number.isFinite(h) ? h % 24 : 0;
}

/**
 * Returns the local Y/M/D in `timezone` for the given UTC instant, as numeric components.
 */
function localDateParts(timezone: string, now: Date): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: timezone,
  });
  const parts = fmt.formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24,
    minute: get('minute'),
    second: get('second'),
  };
}

/**
 * Extract the UTC offset (in minutes) for `timezone` at the given UTC instant.
 * Handles DST transitions automatically via Intl 'longOffset' output (e.g. "GMT-5").
 */
function offsetMinutesAt(timezone: string, now: Date): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  });
  const parts = fmt.formatToParts(now);
  const tzName = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+0';
  // e.g. "GMT-05:00" or "GMT+10:30" or "GMT-5" (older Node) — handle all.
  const m = /GMT([+-])(\d{1,2})(?::?(\d{2}))?/.exec(tzName);
  if (!m) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  const hh = Number(m[2]);
  const mm = Number(m[3] ?? '0');
  return sign * (hh * 60 + mm);
}

/**
 * True if `now` falls OUTSIDE the consumer-SMS allowed window in `timezone`.
 * Allowed window is [08:00, 20:00) local. So 20:00:00 onward is quiet,
 * and 07:59:59 and earlier is quiet.
 */
export function isInQuietWindow(timezone: string, now: Date = new Date()): boolean {
  const hour = localHourIn(timezone, now);
  return hour < 8 || hour >= 20;
}

/**
 * Returns the UTC `Date` corresponding to the next 08:00:00 local time
 * in `timezone`. If `now` is before 08:00 local today, returns today 08:00;
 * else tomorrow 08:00. DST-correct: queries the offset at the target instant,
 * not at `now`.
 */
export function nextEightAm(timezone: string, now: Date = new Date()): Date {
  const local = localDateParts(timezone, now);
  // Decide target Y/M/D — today if now is strictly before 08:00 local, else tomorrow.
  const targetIsToday = local.hour < 8;
  let y = local.year, m = local.month, d = local.day;
  if (!targetIsToday) {
    // Advance one local day. Use UTC arithmetic on a Date constructed from
    // local Y/M/D (treated as UTC), then read back. Day-boundary edge cases
    // (DST spring-forward) are absorbed because the final offset lookup
    // at the target instant corrects for whatever DST state applies.
    const t = new Date(Date.UTC(y, m - 1, d));
    t.setUTCDate(t.getUTCDate() + 1);
    y = t.getUTCFullYear();
    m = t.getUTCMonth() + 1;
    d = t.getUTCDate();
  }
  // Build a candidate UTC instant for "08:00 in timezone on Y/M/D" using a
  // first-pass offset estimate, then re-extract the offset at that candidate
  // and correct (handles DST transitions where the spring-forward day's
  // offset differs from yesterday's).
  const firstGuessUtcMs = Date.UTC(y, m - 1, d, 8, 0, 0) - offsetMinutesAt(timezone, now) * 60_000;
  const firstGuess = new Date(firstGuessUtcMs);
  const correctedOffsetMin = offsetMinutesAt(timezone, firstGuess);
  const correctedUtcMs = Date.UTC(y, m - 1, d, 8, 0, 0) - correctedOffsetMin * 60_000;
  return new Date(correctedUtcMs);
}
