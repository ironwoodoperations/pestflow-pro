// S293 PR C — the service-area map, as pure functions.
//
// Everything here is deterministic and dependency-free: no network, no secrets,
// no `src/` import (shared/lib may never reach into the Vite app — verticals
// .test.ts enforces it). Signing lives in signStaticMapUrl.ts because it needs
// crypto; the render path needs none of this to be async.
//
// THE RULE THIS FILE EXISTS TO KEEP: the map may assert only what the tenant
// asserted. Markers sit on the cities they named. There is no radius, no ring,
// no derived territory, and a city we could not geocode is OMITTED rather than
// placed approximately. Absent data means absent output — the same rule PR A
// applied to JSON-LD.

/** A row as the public render path receives it, via the location_data view. */
export interface ServiceAreaRow {
  city: string;
  slug: string;
  state?: string | null;
  is_live?: boolean | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

/** A city that survived every eligibility check, with its map label. */
export interface MappedCity {
  city: string;
  slug: string;
  state: string;
  label: string;
  latitude: number;
  longitude: number;
}

/**
 * Static Maps marker labels are ONE alphanumeric character — not a number.
 * "Numbered 1..N" is therefore unachievable past 9, and dang has 18 live
 * cities. 1-9 then A-Z gives 35 distinct labels, which covers every tenant
 * today (largest is 18). Past 35 the labels stop being unique, so they are
 * dropped entirely rather than repeated: a duplicated label is a wrong label.
 */
export const MAP_LABELS = '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Google renders at most this many markers before the URL gets unreasonable. */
export const MAX_MARKERS = 35;

function finiteCoord(v: unknown, limit: number): number | null {
  // numeric columns arrive from PostgREST as strings often enough that
  // accepting only `number` would silently empty the map.
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return null;
  if (n < -limit || n > limit) return null;
  // 0,0 is Null Island in the Gulf of Guinea. No tenant is there, and it is the
  // shape a failed geocode takes when someone defaults instead of nulling.
  return n;
}

/**
 * Live cities that carry real coordinates, in the order given, labelled.
 *
 * Drops, in order: not live, no usable latitude, no usable longitude, the exact
 * 0,0 pair, and anything past MAX_MARKERS.
 */
export function mappableAreas(areas: readonly ServiceAreaRow[] | null | undefined): MappedCity[] {
  const out: MappedCity[] = [];
  for (const a of areas ?? []) {
    if (!a || a.is_live !== true) continue;
    if (typeof a.city !== 'string' || !a.city.trim()) continue;
    const lat = finiteCoord(a.latitude, 90);
    const lng = finiteCoord(a.longitude, 180);
    if (lat === null || lng === null) continue;
    if (lat === 0 && lng === 0) continue;
    if (out.length >= MAX_MARKERS) break;
    out.push({
      city: a.city.trim(),
      slug: typeof a.slug === 'string' ? a.slug : '',
      state: typeof a.state === 'string' ? a.state.trim() : '',
      label: MAP_LABELS[out.length],
      latitude: lat,
      longitude: lng,
    });
  }
  return out;
}

/** Coordinates are rounded before they reach a URL or a revision hash. */
function coord(n: number): string {
  // 5dp ≈ 1.1 m. More digits change the cache revision without moving a pin.
  return String(Math.round(n * 1e5) / 1e5);
}

export interface StaticMapOptions {
  width?: number;
  height?: number;
  scale?: number;
  markerColor?: string;
}

export const MAP_DEFAULTS = { width: 640, height: 400, scale: 2, markerColor: '0xd94f2b' } as const;

/**
 * The Static Maps request, PATH AND QUERY ONLY — no host, no key, no signature.
 * Signing consumes exactly this string, which is why it is built in one place.
 *
 * NO `center` AND NO `zoom`: their absence is what makes Static Maps fit the
 * viewport to the markers' bounding box. Five towns and twenty frame correctly
 * with no per-tenant tuning, which is the whole reason auto-fit was chosen.
 *
 * NO `path`, NO `visible`, and above all no circle of any kind. There is no
 * radius parameter in the Static Maps API — a ring would have to be drawn as a
 * many-segment `path`, and its absence here is asserted by the tests.
 */
export function buildStaticMapPath(cities: readonly MappedCity[], opts: StaticMapOptions = {}): string {
  if (cities.length === 0) throw new Error('buildStaticMapPath: no cities — callers must render nothing instead');
  const { width, height, scale, markerColor } = { ...MAP_DEFAULTS, ...opts };

  const params: string[] = [
    `size=${width}x${height}`,
    `scale=${scale}`,
    'maptype=roadmap',
    'format=png',
  ];
  const labelled = cities.length <= MAP_LABELS.length;
  for (const c of cities) {
    const style = labelled ? `color:${markerColor}|label:${c.label}` : `color:${markerColor}`;
    params.push(`markers=${encodeURIComponent(`${style}|${coord(c.latitude)},${coord(c.longitude)}`)}`);
  }
  return `/maps/api/staticmap?${params.join('&')}`;
}

/**
 * A content revision over exactly what the image depicts.
 *
 * The image is cached immutably, so this string is the ONLY thing that can
 * invalidate it. It must change when a city is added, removed, renamed or
 * re-geocoded — and must NOT change for anything else, or every deploy churns
 * nine images. It is deliberately NOT tied to ISR's 300s timer: coordinates
 * change on the order of months.
 *
 * FNV-1a, because this is a cache key and not a security boundary.
 */
export function serviceAreaRevision(cities: readonly MappedCity[], opts: StaticMapOptions = {}): string {
  const { width, height, scale, markerColor } = { ...MAP_DEFAULTS, ...opts };
  const material = [
    `v1:${width}x${height}@${scale}:${markerColor}`,
    ...cities.map((c) => `${c.label}|${c.city}|${coord(c.latitude)},${coord(c.longitude)}`),
  ].join(';');
  let h = 0x811c9dc5;
  for (let i = 0; i < material.length; i++) {
    h ^= material.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** "Hawkins, TX" — or just the city when no state is recorded. */
export function cityLabel(c: { city: string; state?: string }): string {
  return c.state ? `${c.city}, ${c.state}` : c.city;
}

/**
 * Alt text that names the towns, because a screen-reader user must get the
 * coverage information the sighted visitor gets. `alt="Map"` conveys nothing —
 * and the map is the only place the pin positions exist.
 *
 * The list is capped so the attribute stays readable; the real city list is
 * rendered as HTML beside the image regardless, which is the actual guarantee
 * that coverage never lives only inside a picture.
 */
export function buildMapAlt(cities: readonly MappedCity[], businessName: string): string {
  const names = cities.map(cityLabel);
  const name = (businessName || '').trim();
  const who = name ? `${name}'s` : 'The';
  const NAMED = 8;
  const shown = names.slice(0, NAMED).join(', ');
  const rest = names.length - NAMED;
  const list = rest > 0 ? `${shown}, and ${rest} more` : shown;
  return `Map of ${who} service area, with markers on ${list}.`;
}

/** What the generator wrote into settings.service_area_map. */
export interface StoredServiceAreaMap {
  url?: unknown;
  revision?: unknown;
  width?: unknown;
  height?: unknown;
}

export interface ResolvedServiceAreaMap {
  url: string;
  alt: string;
  width: number;
  height: number;
  cities: MappedCity[];
}

/**
 * The render path's single decision: is there a map to show, or not?
 *
 * Returns null — meaning RENDER NOTHING, no placeholder and no empty frame —
 * when there are no live coordinates, when no image has been generated, or when
 * the stored image depicts a DIFFERENT set of cities than the one now live.
 * That last case is the interesting one: a stale map is a wrong coverage claim,
 * so it is withheld until the generator catches up rather than shown.
 *
 * This is why the pointer is stored rather than the URL being derived from a
 * hash: a derived URL cannot be known to be absent without fetching it, and
 * "render nothing when absent" then becomes unimplementable at render time.
 */
export function resolveServiceAreaMap(args: {
  areas: readonly ServiceAreaRow[] | null | undefined;
  stored: StoredServiceAreaMap | null | undefined;
  businessName: string;
  options?: StaticMapOptions;
}): ResolvedServiceAreaMap | null {
  const cities = mappableAreas(args.areas);
  if (cities.length === 0) return null;

  const stored = args.stored ?? {};
  const url = typeof stored.url === 'string' ? stored.url.trim() : '';
  if (!url) return null;
  if (typeof stored.revision !== 'string' || !stored.revision) return null;
  if (stored.revision !== serviceAreaRevision(cities, args.options)) return null;

  const { width, height, scale } = { ...MAP_DEFAULTS, ...args.options };
  return {
    url,
    alt: buildMapAlt(cities, args.businessName),
    width: typeof stored.width === 'number' && stored.width > 0 ? stored.width : width * scale,
    height: typeof stored.height === 'number' && stored.height > 0 ? stored.height : height * scale,
    cities,
  };
}
