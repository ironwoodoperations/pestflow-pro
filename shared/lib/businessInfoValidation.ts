// Mirrors CHECK constraint business_info_structured_shape
// Migration: supabase/migrations/*s168_2_seo25_structured_backfill*

export const ADDRESS_REGION_PATTERN = /^[A-Z]{2}$/;
export const POSTAL_CODE_PATTERN = /^\d{5}(-\d{4})?$/;
export const COUNTRY_PATTERN = /^[A-Z]{2}$/;
export const TIME_PATTERN = /^\d{2}:\d{2}:\d{2}$/;

// Matches geocode_source enum in shared/lib/seoSchema.ts BusinessInfo interface
export const GEOCODE_SOURCES = ['manual', 'google_places'] as const;
export type GeocodeSource = typeof GEOCODE_SOURCES[number];

export type HoursEntry = { dayOfWeek: string; opens: string; closes: string };

export type BusinessInfoValidatable = {
  street_address?: string;
  address_locality?: string;
  address_region?: string;
  postal_code?: string;
  address_country?: string;
  latitude?: number | '';
  longitude?: number | '';
  geocode_source?: GeocodeSource | '';
  timezone?: string;
  hours_structured?: HoursEntry[];
};

export function validateBusinessInfo(
  form: BusinessInfoValidatable
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (form.address_region && !ADDRESS_REGION_PATTERN.test(form.address_region))
    errors.address_region = 'State must be 2 uppercase letters (e.g. TX)';
  if (form.postal_code && !POSTAL_CODE_PATTERN.test(form.postal_code))
    errors.postal_code = 'ZIP must be 5 digits or 5+4 format';
  if (form.address_country && !COUNTRY_PATTERN.test(form.address_country))
    errors.address_country = 'Country must be 2 uppercase letters (e.g. US)';
  if (form.latitude !== '' && form.latitude !== undefined) {
    const lat = Number(form.latitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90)
      errors.latitude = 'Latitude must be between -90 and 90';
  }
  if (form.longitude !== '' && form.longitude !== undefined) {
    const lng = Number(form.longitude);
    if (!Number.isFinite(lng) || lng < -180 || lng > 180)
      errors.longitude = 'Longitude must be between -180 and 180';
  }
  if (form.geocode_source && !(GEOCODE_SOURCES as readonly string[]).includes(form.geocode_source))
    errors.geocode_source = 'Unknown geocode source';

  const addr = [form.street_address, form.address_locality, form.address_region, form.postal_code];
  const filled = addr.filter(v => v && String(v).trim()).length;
  if (filled > 0 && filled < 4) {
    const keys = ['street_address', 'address_locality', 'address_region', 'postal_code'] as const;
    const msg = 'All four address fields must be filled together, or all left empty';
    keys.forEach((k, i) => { if (!addr[i] || !String(addr[i]).trim()) errors[k] = msg; });
  }

  if ((form.hours_structured?.length ?? 0) > 0 && !form.timezone)
    errors.timezone = 'Timezone is required when hours are set';

  (form.hours_structured ?? []).forEach((entry, index) => {
    const key = `hours_structured.${index}`;
    if (!TIME_PATTERN.test(entry.opens) || !TIME_PATTERN.test(entry.closes))
      errors[key] = 'Time must be HH:MM:SS format';
    else if (entry.opens >= entry.closes)
      errors[key] = 'Close time must be after open time';
  });

  return errors;
}
