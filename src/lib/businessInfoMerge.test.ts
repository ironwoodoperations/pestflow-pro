import { describe, it, expect } from 'vitest';
import {
  mergeBusinessInfo, resolveBusinessInfoValue, checkBusinessInfoShape,
  ADDRESS_QUAD, LAT_LNG, FORBIDDEN_KEYS,
} from './businessInfoMerge.ts';

// S292 — the fixture is dang's LIVE business_info row, read from the database,
// plus the four keys other live tenants carry that dang does not
// (after_hours_phone, hours_structured, owner_name, and a second contact field).
// Real data, not invented, because the whole defect was a count taken from a
// sample and reported as the universe.
//
// The universe was established with the union query, not by reading two rows:
//
//   select k, count(*) from settings s, lateral jsonb_object_keys(s.value) k
//   where s.key = 'business_info' group by k;
//
// 23 distinct keys across all nine tenants.

/** The nine the client wizard collects and is entitled to overwrite. */
const WIZARD_KEYS = [
  'name', 'phone', 'email', 'address', 'hours', 'tagline', 'license', 'industry', 'vertical',
];

/**
 * The FOURTEEN the wizard does not collect, and used to delete.
 * Stated here ONLY so the test can name what it is protecting — the merge itself
 * contains no such list, which is the point.
 */
const DROPPED_KEYS = [
  'address_country', 'address_locality', 'address_region', 'street_address',
  'postal_code', 'latitude', 'longitude', 'geocode_source',
  'timezone', 'founded_year', 'certifications', 'num_technicians',
  'after_hours_phone', 'hours_structured',
];

const EXISTING: Record<string, unknown> = {
  // the nine the wizard owns — pre-onboarding values
  name: 'Dang Pest Control',
  phone: '(903) 871-0550',
  email: 'info@dangpestcontrol.com',
  address: '816 Riding Road, Tyler, TX 75703',
  hours: '',
  tagline: '',
  license: '',
  industry: 'Pest Control',
  vertical: 'pest',
  // the fourteen the wizard does not
  street_address: '816 Riding Road',
  address_locality: 'Tyler',
  address_region: 'TX',
  postal_code: '75703',
  address_country: 'US',
  latitude: 32.2692,
  longitude: -95.2603,
  geocode_source: 'manual',
  timezone: 'America/Chicago',
  hours_structured: [
    { dayOfWeek: 'Monday', opens: '08:00', closes: '17:00' },
    { dayOfWeek: 'Tuesday', opens: '08:00', closes: '17:00' },
  ],
  founded_year: '2018',
  certifications: 'TPCL-12345',
  num_technicians: '6',
  after_hours_phone: '(903) 555-0199',
};

const OVERLAY: Record<string, unknown> = {
  name: 'Dang Pest Control LLC',
  phone: '(430) 367-5601',
  email: 'hello@dangpestcontrol.com',
  address: '900 New Road, Tyler, TX 75703',
  hours: 'Mon–Fri 8–5',
  tagline: 'Care you can count on.',
  license: 'TPCL-99999',
  industry: 'Pest Control',
  vertical: 'pest',
};

describe('the fixture is the real shape, and the overlay really changes things', () => {
  // Vacuity guard. If EXISTING were trivial, or the overlay were a no-op, every
  // assertion below would pass while testing nothing.
  it('the existing value carries all 23 live keys', () => {
    expect(Object.keys(EXISTING).sort()).toEqual([...WIZARD_KEYS, ...DROPPED_KEYS].sort());
    expect(Object.keys(EXISTING).length).toBe(23);
  });

  it('the overlay changes a value for every wizard key it supplies', () => {
    let changed = 0;
    for (const k of Object.keys(OVERLAY)) if (OVERLAY[k] !== EXISTING[k]) changed += 1;
    expect(changed, 'overlay is a no-op — the merge tests would prove nothing').toBeGreaterThan(5);
  });

  it('the existing value would be ACCEPTED by the live constraints', () => {
    expect(checkBusinessInfoShape(EXISTING)).toEqual([]);
  });
});

describe('the merge keeps every key the wizard does not collect', () => {
  const merged = mergeBusinessInfo(EXISTING, OVERLAY);

  it('retains all FOURTEEN dropped keys, by name', () => {
    for (const key of DROPPED_KEYS) {
      expect(Object.prototype.hasOwnProperty.call(merged, key), `LOST: ${key}`).toBe(true);
      expect(merged[key], `CHANGED: ${key}`).toEqual(EXISTING[key]);
    }
  });

  it('updates all nine the wizard does collect', () => {
    for (const key of Object.keys(OVERLAY)) {
      expect(merged[key], `not updated: ${key}`).toEqual(OVERLAY[key]);
    }
  });

  it('loses nothing at all — output key set equals input key set', () => {
    expect(Object.keys(merged).sort()).toEqual(Object.keys(EXISTING).sort());
  });

  it('the result would still be ACCEPTED by the live constraints', () => {
    expect(checkBusinessInfoShape(merged)).toEqual([]);
  });

  // The assertion that survives the NEXT key being added. A count assertion is
  // what got this wrong twice; this one does not care how many there are.
  it('preserves a key the merge has never heard of', () => {
    const withNovel = { ...EXISTING, some_future_key: 'value nobody has written yet' };
    expect(mergeBusinessInfo(withNovel, OVERLAY)['some_future_key']).toBe('value nobody has written yet');
  });
});

describe('constrained groups survive intact', () => {
  it('the address quad stays all-four', () => {
    const merged = mergeBusinessInfo(EXISTING, OVERLAY);
    for (const k of ADDRESS_QUAD) expect(merged[k]).toEqual(EXISTING[k]);
    expect(checkBusinessInfoShape(merged)).toEqual([]);
  });

  it('latitude and longitude keep parity', () => {
    const merged = mergeBusinessInfo(EXISTING, OVERLAY);
    for (const k of LAT_LNG) expect(merged[k]).toEqual(EXISTING[k]);
  });

  it('hours_structured and timezone survive together', () => {
    const merged = mergeBusinessInfo(EXISTING, OVERLAY);
    expect(merged['hours_structured']).toEqual(EXISTING['hours_structured']);
    expect(merged['timezone']).toBe('America/Chicago');
  });

  // A PARTIAL overlay of a group is the failure the constraint exists to catch.
  // The merge drops it rather than corrupting the row — a dropped edit is
  // recoverable, a 23514 on the whole upsert loses the entire launch.
  it('refuses a PARTIAL address quad and leaves the existing one intact', () => {
    const merged = mergeBusinessInfo(EXISTING, { ...OVERLAY, postal_code: '75701' });
    expect(merged['postal_code']).toBe('75703');
    expect(checkBusinessInfoShape(merged)).toEqual([]);
  });

  it('accepts a COMPLETE address quad', () => {
    const merged = mergeBusinessInfo(EXISTING, {
      ...OVERLAY,
      street_address: '900 New Road', address_locality: 'Whitehouse',
      address_region: 'TX', postal_code: '75791',
    });
    expect(merged['address_locality']).toBe('Whitehouse');
    expect(merged['postal_code']).toBe('75791');
    expect(checkBusinessInfoShape(merged)).toEqual([]);
  });

  it('refuses a lone latitude, keeping lat/lng parity', () => {
    const merged = mergeBusinessInfo(EXISTING, { ...OVERLAY, latitude: 1 });
    expect(merged['latitude']).toBe(32.2692);
    expect(checkBusinessInfoShape(merged)).toEqual([]);
  });

  it('refuses hours_structured when no timezone would exist', () => {
    const bare = { name: 'X' };
    const merged = mergeBusinessInfo(bare, { hours_structured: [{ dayOfWeek: 'Monday' }] });
    expect(Object.prototype.hasOwnProperty.call(merged, 'hours_structured')).toBe(false);
    expect(checkBusinessInfoShape(merged)).toEqual([]);
  });

  it('accepts hours_structured when the overlay also supplies timezone', () => {
    const merged = mergeBusinessInfo({ name: 'X' }, {
      hours_structured: [{ dayOfWeek: 'Monday' }], timezone: 'America/Chicago',
    });
    expect(merged['hours_structured']).toEqual([{ dayOfWeek: 'Monday' }]);
    expect(checkBusinessInfoShape(merged)).toEqual([]);
  });
});

describe('year_founded can never reach the write', () => {
  it('is stripped when the OVERLAY carries it', () => {
    const merged = mergeBusinessInfo(EXISTING, { ...OVERLAY, year_founded: '2018' });
    expect(Object.prototype.hasOwnProperty.call(merged, 'year_founded')).toBe(false);
    expect(checkBusinessInfoShape(merged)).toEqual([]);
  });

  it('is stripped when the EXISTING value carries it — cleaned, not propagated', () => {
    const merged = mergeBusinessInfo({ ...EXISTING, year_founded: '2018' }, OVERLAY);
    expect(Object.prototype.hasOwnProperty.call(merged, 'year_founded')).toBe(false);
  });

  it('founded_year — the legal one — is untouched by that strip', () => {
    const merged = mergeBusinessInfo({ ...EXISTING, year_founded: '2018' }, OVERLAY);
    expect(merged['founded_year']).toBe('2018');
  });

  it('the shape checker actually rejects year_founded (the guard is live)', () => {
    expect(checkBusinessInfoShape({ ...EXISTING, year_founded: '2018' }))
      .toContain('business_info_no_year_founded: year_founded present');
    expect(FORBIDDEN_KEYS).toContain('year_founded');
  });
});

describe('undefined means leave alone, never delete', () => {
  it('an undefined overlay value does not blank a stored one', () => {
    const merged = mergeBusinessInfo(EXISTING, { license: undefined, name: 'New Name' });
    expect(merged['license']).toBe('');
    expect(merged['name']).toBe('New Name');
  });

  it('an absent vertical does not delete a recorded one — the S290 regression', () => {
    const noVertical = { ...OVERLAY };
    delete noVertical['vertical'];
    expect(mergeBusinessInfo(EXISTING, noVertical)['vertical']).toBe('pest');
  });

  it('a missing or non-object existing value degrades to the overlay alone', () => {
    expect(mergeBusinessInfo(null, { name: 'X' })).toEqual({ name: 'X' });
    expect(mergeBusinessInfo(undefined, { name: 'X' })).toEqual({ name: 'X' });
    expect(mergeBusinessInfo('nonsense', { name: 'X' })).toEqual({ name: 'X' });
    expect(mergeBusinessInfo([1, 2], { name: 'X' })).toEqual({ name: 'X' });
  });
});

// ── THE RACE ────────────────────────────────────────────────────────────────
//
// S290 added a useEffect that preloads `vertical` from this row. Building the
// merge on that state means that if the launch fires before the read resolves,
// the base is empty and the write is a whole replacement again — with nothing
// visibly wrong. Same shape as the S285 ContentTab sidebar race.
//
// These tests discriminate between the two implementations. The snapshot version
// is written out in full so the difference is demonstrated, not asserted.
describe('the read happens at SAVE time, so ordering cannot lose a key', () => {
  /** A promise whose resolution the test controls. */
  function deferred<T>() {
    let resolve!: (v: T) => void;
    const promise = new Promise<T>((r) => { resolve = r; });
    return { promise, resolve };
  }

  it('merges correctly when the read resolves AFTER the launch begins', async () => {
    const d = deferred<unknown>();
    const pending = resolveBusinessInfoValue(() => d.promise, OVERLAY);
    // launch is already in flight; the row arrives only now
    d.resolve(EXISTING);
    const merged = await pending;
    for (const key of DROPPED_KEYS) {
      expect(Object.prototype.hasOwnProperty.call(merged, key), `LOST in the race: ${key}`).toBe(true);
    }
    expect(Object.keys(merged).sort()).toEqual(Object.keys(EXISTING).sort());
  });

  it('the snapshot implementation LOSES all fourteen — this is what we are not doing', () => {
    // The rejected shape: a value captured before the read resolved.
    const preloadedSnapshot: Record<string, unknown> = {}; // read has not landed yet
    const snapshotMerge = { ...preloadedSnapshot, ...OVERLAY };
    for (const key of DROPPED_KEYS) {
      expect(Object.prototype.hasOwnProperty.call(snapshotMerge, key), `${key} should be lost here`).toBe(false);
    }
    // …and the save-time read, given the same ordering, loses none.
    expect(Object.keys(mergeBusinessInfo(EXISTING, OVERLAY)).length).toBe(23);
  });

  it('is order-independent: an already-resolved read gives the identical result', async () => {
    const late = await resolveBusinessInfoValue(() => new Promise((r) => setTimeout(() => r(EXISTING), 5)), OVERLAY);
    const immediate = await resolveBusinessInfoValue(() => Promise.resolve(EXISTING), OVERLAY);
    expect(late).toEqual(immediate);
    expect(late).toEqual(mergeBusinessInfo(EXISTING, OVERLAY));
  });

  it('a read that yields nothing still writes the overlay rather than throwing', async () => {
    const merged = await resolveBusinessInfoValue(() => Promise.resolve(null), OVERLAY);
    expect(merged).toEqual(OVERLAY);
  });
});

describe('checkBusinessInfoShape mirrors the live constraints and can fail', () => {
  // Each rule fired against a value that violates it. A shape checker that
  // never rejects anything is not evidence that the merge output is valid.
  const cases: Array<[string, Record<string, unknown>, string]> = [
    ['partial address quad', { street_address: 'a' }, 'address quad has 1 of 4'],
    ['bad address_region', { address_region: 'Texas' }, 'address_region must match'],
    ['bad address_country', { address_country: 'USA' }, 'address_country must match'],
    ['bad postal_code', { street_address: 'a', address_locality: 'b', address_region: 'TX', postal_code: '7570' }, 'postal_code must match'],
    ['lone latitude', { latitude: 1 }, 'both be present or both absent'],
    ['latitude out of range', { latitude: 999, longitude: 0 }, 'latitude out of range'],
    ['bad geocode_source', { geocode_source: 'guessed' }, 'geocode_source must be'],
    ['hours_structured without timezone', { hours_structured: [] }, 'hours_structured requires timezone'],
    ['empty timezone', { timezone: '' }, 'timezone must be a non-empty string'],
    ['bad vertical', { vertical: 'hvac' }, 'vertical must be pest or irrigation'],
    ['year_founded present', { year_founded: '2018' }, 'year_founded present'],
  ];

  for (const [label, value, expected] of cases) {
    it(`rejects: ${label}`, () => {
      const problems = checkBusinessInfoShape(value).join(' | ');
      expect(problems, `${label} was accepted`).toContain(expected);
    });
  }

  it('accepts a valid value, so it is not simply rejecting everything', () => {
    expect(checkBusinessInfoShape(EXISTING)).toEqual([]);
    expect(checkBusinessInfoShape({ name: 'X' })).toEqual([]);
    expect(checkBusinessInfoShape({})).toEqual([]);
  });
});
