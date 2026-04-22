// --- JSONB safe narrowing helpers (S168.2.1) ---
// Placed in a dedicated file because seoSchema.parsers.ts was already at
// 170 lines; appending here would have exceeded the 200-line file limit.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(
  obj: Record<string, unknown>,
  key: string,
): string | undefined {
  const v = obj[key];
  return typeof v === 'string' && v.trim() !== '' ? v : undefined;
}

function getNumber(
  obj: Record<string, unknown>,
  key: string,
): number | undefined {
  const v = obj[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

type HoursItem = { dayOfWeek: string; opens: string; closes: string };

function isHoursItem(value: unknown): value is HoursItem {
  return (
    isRecord(value)
    && typeof value.dayOfWeek === 'string'
    && typeof value.opens === 'string'
    && typeof value.closes === 'string'
  );
}

function getHoursArray(
  obj: Record<string, unknown>,
  key: string,
): HoursItem[] | undefined {
  const v = obj[key];
  if (!Array.isArray(v) || v.length === 0) return undefined;
  return v.every(isHoursItem) ? v : undefined;
}

/**
 * Narrows an untrusted JSONB value (from settings.business_info.value) into
 * the structured subset of BusinessInfo. Returns {} for non-object inputs.
 * Absent or malformed fields come back as undefined — never null, never '',
 * never coerced. This preserves downstream `typeof === 'number'` guards in
 * generateLocalBusinessSchema.
 *
 * Does NOT extract flat fields (name, phone, email, address, hours,
 * license_number, logo_url) — those still come from the tenants row.
 */
export function mapBusinessInfoJsonb(value: unknown): {
  street_address?: string;
  address_locality?: string;
  address_region?: string;
  postal_code?: string;
  address_country?: string;
  latitude?: number;
  longitude?: number;
  geocode_source?: 'manual' | 'google_places';
  timezone?: string;
  hours_structured?: HoursItem[];
} {
  if (!isRecord(value)) return {};

  const gs = (k: string) => getString(value, k);
  const gn = (k: string) => getNumber(value, k);

  const rawGeocodeSource = gs('geocode_source');
  const geocode_source =
    rawGeocodeSource === 'manual' || rawGeocodeSource === 'google_places'
      ? rawGeocodeSource
      : undefined;

  return {
    street_address: gs('street_address'),
    address_locality: gs('address_locality'),
    address_region: gs('address_region'),
    postal_code: gs('postal_code'),
    address_country: gs('address_country'),
    latitude: gn('latitude'),
    longitude: gn('longitude'),
    geocode_source,
    timezone: gs('timezone'),
    hours_structured: getHoursArray(value, 'hours_structured'),
  };
}
