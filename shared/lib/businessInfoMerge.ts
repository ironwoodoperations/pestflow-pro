// S292 — merging into settings.business_info instead of replacing it.
//
// S330 — MOVED FROM src/lib/ TO shared/lib/, so there is ONE implementation.
// The S324 report recorded that this guard "exists on one write path and the other
// one was never brought under it": provision-tenant seeds business_info as a whole
// replacement and could not import this, because src/ is not reachable from an edge
// function's relative path. shared/lib IS reachable — the deployed service-area-map
// bundle carries `from '../../../shared/lib/serviceAreaMap.ts'` unrewritten, and Deno
// resolves it at runtime given an explicit .ts extension. Moving the module was
// therefore preferred over copying the rule, which is how the two paths drifted apart
// in the first place.
//
// Still pure: no I/O, no Supabase, no React, and no import of any kind — which is what
// lets it live here without tripping the shared/lib-must-not-import-src guard.
//
// THE DEFECT. Onboarding's handleLaunch upserted business_info as a WHOLE
// REPLACEMENT VALUE. It wrote nine keys; every other key in the row was deleted.
// A client finishing onboarding silently destroyed their own structured address,
// geocode, timezone, opening hours, founding year, certifications, technician
// count and after-hours phone.
//
// THE COUNT WAS WRONG TWICE — SEVEN, THEN TWELVE. It is FOURTEEN. Both earlier
// numbers came from sampling a couple of tenants and reporting the result as the
// universe. The correct method is to ask the database for the union of keys
// across every row:
//
//   select k, count(*) from settings s, lateral jsonb_object_keys(s.value) k
//   where s.key = 'business_info' group by k;
//
// 23 distinct keys across nine tenants, 9 written by the wizard, 14 destroyed.
//
// WHICH IS WHY THIS MODULE DOES NOT CONTAIN A LIST OF THE FOURTEEN. A literal
// list has now been wrong twice and would be wrong again the next time any code
// path adds a key. The merge preserves whatever is there without needing to know
// what it is.
//
// Pure: no I/O, no Supabase, no React. The caller supplies the existing value.

/**
 * Keys governed by `business_info_structured_shape`. Read from the live
 * constraint, not inferred:
 *
 *   (street_address + address_locality + address_region + postal_code) IN (0, 4)
 *   address_region  ~ '^[A-Z]{2}$'      address_country ~ '^[A-Z]{2}$'
 *   postal_code     ~ '^\d{5}(-\d{4})?$'
 *   (value ? 'latitude') = (value ? 'longitude')   both numbers, in range
 *   geocode_source IN ('manual','google_places')
 *   hours_structured => array, length <= 7, AND timezone present
 *   timezone => non-empty string
 *
 * A SPREAD PRESERVES A VALID GROUP. A PARTIAL OVERLAY BREAKS IT. That is the
 * whole reason this module exists rather than an inline `{...existing, ...form}`:
 * the spread is safe, and the overlay is what has to be policed.
 */
export const ADDRESS_QUAD: readonly string[] = [
  'street_address', 'address_locality', 'address_region', 'postal_code',
];
export const LAT_LNG: readonly string[] = ['latitude', 'longitude'];

/** hours_structured is legal only when timezone is also present. NOT symmetric — timezone alone is fine. */
export const HOURS_REQUIRES: Readonly<Record<string, string>> = { hours_structured: 'timezone' };

/**
 * `business_info_no_year_founded` forbids this key outright. It matters because
 * provision-tenant reads `wbi.founded_year || wbi.year_founded`, so any code
 * that spreads a whole wizard form could reintroduce it and 23514 the write.
 * Stripped from BOTH sides — a value that somehow carries one is cleaned rather
 * than propagated.
 */
export const FORBIDDEN_KEYS: readonly string[] = ['year_founded'];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** Overlay supplies every member of the group, or none of them. */
function groupIsComplete(overlay: Record<string, unknown>, group: readonly string[]): boolean {
  let present = 0;
  for (let i = 0; i < group.length; i += 1) {
    if (Object.prototype.hasOwnProperty.call(overlay, group[i]) && overlay[group[i]] !== undefined) present += 1;
  }
  return present === 0 || present === group.length;
}

function inGroup(key: string, group: readonly string[]): boolean {
  return group.indexOf(key) !== -1;
}

/**
 * Merge an overlay into an existing business_info value.
 *
 * - Everything in `existing` survives unless the overlay names it. That is the
 *   class fix: no key list, so no key list to get wrong.
 * - A grouped key is applied ONLY when the overlay supplies its whole group.
 *   A partial address quad or a lone latitude is dropped, leaving the existing
 *   group intact, because writing half a group violates the CHECK constraint and
 *   fails the entire upsert.
 * - `hours_structured` is applied only if `timezone` will be present in the
 *   result — from the overlay or from what was already there.
 * - `undefined` in the overlay means "leave alone", not "delete". A form field
 *   the wizard does not collect must never blank a stored value.
 * - `year_founded` can never appear in the output, from either side.
 *
 * Deleting a key is deliberately NOT expressible here. Every caller today is
 * updating a subset; a merge helper that could also delete would reintroduce the
 * exact failure mode it exists to prevent.
 */
export function mergeBusinessInfo(
  existing: unknown,
  overlay: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  if (isPlainObject(existing)) {
    const keys = Object.keys(existing);
    for (let i = 0; i < keys.length; i += 1) out[keys[i]] = existing[keys[i]];
  }

  const quadComplete = groupIsComplete(overlay, ADDRESS_QUAD);
  const latLngComplete = groupIsComplete(overlay, LAT_LNG);

  const overlayKeys = Object.keys(overlay);
  for (let i = 0; i < overlayKeys.length; i += 1) {
    const key = overlayKeys[i];
    const value = overlay[key];
    if (value === undefined) continue;
    if (FORBIDDEN_KEYS.indexOf(key) !== -1) continue;
    if (inGroup(key, ADDRESS_QUAD) && !quadComplete) continue;
    if (inGroup(key, LAT_LNG) && !latLngComplete) continue;
    if (key === 'hours_structured') {
      const tzInOverlay = Object.prototype.hasOwnProperty.call(overlay, 'timezone')
        && overlay['timezone'] !== undefined;
      const tzInExisting = Object.prototype.hasOwnProperty.call(out, 'timezone');
      if (!tzInOverlay && !tzInExisting) continue;
    }
    out[key] = value;
  }

  for (let i = 0; i < FORBIDDEN_KEYS.length; i += 1) delete out[FORBIDDEN_KEYS[i]];

  return out;
}

/**
 * A read-time mirror of `business_info_structured_shape` +
 * `business_info_no_year_founded` + `settings_business_info_vertical_valid`.
 *
 * Returns the list of violations, empty when the value would be accepted.
 *
 * This is NOT a second source of truth — the database is. It exists so tests can
 * assert "the merge output would be ACCEPTED", rather than the weaker and more
 * brittle "the merge output has fourteen keys". A shape assertion survives the
 * next key being added; a count assertion does not, which is how the count got
 * to be wrong twice.
 */
export function checkBusinessInfoShape(value: unknown): string[] {
  const problems: string[] = [];
  if (!isPlainObject(value)) return problems;
  const has = (k: string) => Object.prototype.hasOwnProperty.call(value, k);

  if (has('year_founded')) problems.push('business_info_no_year_founded: year_founded present');

  let quad = 0;
  for (let i = 0; i < ADDRESS_QUAD.length; i += 1) if (has(ADDRESS_QUAD[i])) quad += 1;
  if (quad !== 0 && quad !== 4) problems.push(`structured_shape: address quad has ${quad} of 4`);

  if (has('address_region') && !/^[A-Z]{2}$/.test(String(value['address_region']))) {
    problems.push('structured_shape: address_region must match ^[A-Z]{2}$');
  }
  if (has('address_country') && !/^[A-Z]{2}$/.test(String(value['address_country']))) {
    problems.push('structured_shape: address_country must match ^[A-Z]{2}$');
  }
  if (has('postal_code') && !/^\d{5}(-\d{4})?$/.test(String(value['postal_code']))) {
    problems.push('structured_shape: postal_code must match ^\\d{5}(-\\d{4})?$');
  }
  if (has('latitude') !== has('longitude')) {
    problems.push('structured_shape: latitude and longitude must both be present or both absent');
  }
  if (has('latitude')) {
    const la = value['latitude'];
    const lo = value['longitude'];
    if (typeof la !== 'number' || la < -90 || la > 90) problems.push('structured_shape: latitude out of range or not a number');
    if (typeof lo !== 'number' || lo < -180 || lo > 180) problems.push('structured_shape: longitude out of range or not a number');
  }
  if (has('geocode_source') && ['manual', 'google_places'].indexOf(String(value['geocode_source'])) === -1) {
    problems.push('structured_shape: geocode_source must be manual or google_places');
  }
  if (has('hours_structured')) {
    const hs = value['hours_structured'];
    if (!Array.isArray(hs)) problems.push('structured_shape: hours_structured must be an array');
    else if (hs.length > 7) problems.push('structured_shape: hours_structured may hold at most 7 entries');
    if (!has('timezone')) problems.push('structured_shape: hours_structured requires timezone');
  }
  if (has('timezone')) {
    const tz = value['timezone'];
    if (typeof tz !== 'string' || tz.length === 0) problems.push('structured_shape: timezone must be a non-empty string');
  }
  const vert = value['vertical'];
  if (vert !== undefined && vert !== null && ['pest', 'irrigation', 'lawn'].indexOf(String(vert)) === -1) {
    problems.push('vertical_valid: vertical must be pest or irrigation');
  }
  return problems;
}

/** What the client onboarding wizard collects and is entitled to overwrite. */
export interface OnboardingBusinessInfoOverlay {
  name: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  tagline: string;
  license: string;
  industry: string;
  /** Omitted entirely when the tenant's trade is not recorded — never written as ''. */
  vertical?: 'pest' | 'irrigation' | 'lawn';
}

/**
 * Read the CURRENT stored value and merge the overlay into it.
 *
 * READ AT SAVE TIME, NOT FROM PRELOADED STATE — this is the whole point of the
 * function existing. Onboarding.tsx preloads `vertical` in a useEffect. Building
 * the merge on that state means that if the launch fires before the read
 * resolves, the base is empty, the write is a whole replacement again, and
 * NOTHING LOOKS WRONG. That is the S285 ContentTab sidebar race in a new
 * location: a snapshot taken before an async value landed.
 *
 * Awaiting the read here removes the race instead of guarding it. There is no
 * ordering in which this returns a merge built on a stale base.
 */
export async function resolveBusinessInfoValue(
  readExisting: () => Promise<unknown>,
  overlay: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const existing = await readExisting();
  return mergeBusinessInfo(existing, overlay);
}

/** The shape every supabase-js single-row read returns. */
export interface ReadResult<T> {
  data: T | null;
  error: { message: string } | null;
}

/**
 * Read a value, THROWING on a query error rather than degrading to null.
 *
 * WHY THIS EXISTS — the error path recreated the exact bug this module removes.
 * A reader that destructures only `data` and discards `error` returns null on a
 * transient network failure, an RLS denial or a 500. mergeBusinessInfo(null, …)
 * then yields overlay-only, which is a WHOLE REPLACEMENT, arrived at silently
 * through the failure path.
 *
 * mergeBusinessInfo cannot tell the two apart, and should not try. Treating null
 * as "no row yet" is CORRECT — a first-time tenant genuinely has none. Only the
 * reader knows whether it got an empty result or an error, so only the reader
 * can make this distinction, and it was throwing that information away.
 *
 * A launch that stops with an error is recoverable. A launch that silently
 * destroys fourteen keys is not. Same trade already made inside this module for
 * partial groups: refuse the write rather than corrupt the row.
 */
export async function readOrThrow<T>(
  label: string,
  query: () => Promise<ReadResult<T>>,
): Promise<T | null> {
  const { data, error } = await query();
  if (error) {
    throw new Error(
      `${label}: read failed, refusing to write (a merge built on a failed read is a whole replacement) — ${error.message}`,
    );
  }
  return data;
}

/**
 * Both merged values, resolved BEFORE any write happens.
 *
 * The single await gate is the point. Every upsert in handleLaunch is textually
 * after this call, so a reader that throws aborts the launch with nothing
 * written — rather than leaving the settings row updated and the prospect row
 * stale, which is what a per-write read would do.
 */
export async function prepareBusinessInfoWrites(deps: {
  readSettingsBusinessInfo: () => Promise<unknown>;
  readProspectBusinessInfo: () => Promise<unknown>;
  overlay: Record<string, unknown>;
}): Promise<{ settings: Record<string, unknown>; prospect: Record<string, unknown> }> {
  const settingsExisting = await deps.readSettingsBusinessInfo();
  const prospectExisting = await deps.readProspectBusinessInfo();
  return {
    settings: mergeBusinessInfo(settingsExisting, deps.overlay),
    prospect: mergeBusinessInfo(prospectExisting, deps.overlay),
  };
}
