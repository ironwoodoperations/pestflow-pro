import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  isEmptyOverlayValue,
  dropEmptyOverwrites,
  mergeSettingsValue,
  mergeSettingsRead,
} from './settingsMerge';
import { mergeBusinessInfo, checkBusinessInfoShape } from './businessInfoMerge';

const PROVISION = readFileSync(
  join(__dirname, '..', '..', 'supabase', 'functions', 'provision-tenant', 'index.ts'),
  'utf8',
);

/** Comments out, code in — a comment describing a replace is not a replace. */
function codeOnly(body: string): string {
  return body
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !/^[ \t]*(\/\/|\*)/.test(l))
    .join('\n');
}

// ── The two real fixtures the brief names. ────────────────────────────────────────────
// dang's 23 integrations keys, and the 14 business_info keys S292 destroyed.
const DANG_INTEGRATIONS: Record<string, unknown> = Object.fromEntries(
  Array.from({ length: 23 }, (_, i) => [`k${i}`, `v${i}`]),
);
const S292_DESTROYED = [
  'address_country', 'address_locality', 'address_region', 'street_address', 'postal_code',
  'latitude', 'longitude', 'geocode_source', 'timezone', 'founded_year', 'certifications',
  'num_technicians', 'after_hours_phone', 'hours_structured',
];
const OWNER_EDITED_BUSINESS_INFO: Record<string, unknown> = {
  name: 'Precision Lawn Systems', phone: '9035551234', email: 'owner@example.com',
  street_address: '1 Main St', address_locality: 'Tyler', address_region: 'TX',
  postal_code: '75701', address_country: 'US',
  latitude: 32.35, longitude: -95.3, geocode_source: 'google_places',
  timezone: 'America/Chicago', hours_structured: [{ d: 'Mon' }],
  founded_year: '2011', certifications: 'TDA', num_technicians: '4',
  after_hours_phone: '9035559999',
};

describe('isEmptyOverlayValue — 0 and false are NOT empty', () => {
  it('treats absent, null, empty string and empty array as empty', () => {
    expect(isEmptyOverlayValue(undefined)).toBe(true);
    expect(isEmptyOverlayValue(null)).toBe(true);
    expect(isEmptyOverlayValue('')).toBe(true);
    expect(isEmptyOverlayValue([])).toBe(true);
  });

  // S325's lesson: a falsy check here would classify seo.noindex=false and
  // subscription.tier=0 as absent and refuse to write them.
  it('treats 0 and false as MEANINGFUL, not empty', () => {
    expect(isEmptyOverlayValue(0)).toBe(false);
    expect(isEmptyOverlayValue(false)).toBe(false);
  });

  it('treats non-empty scalars, arrays and objects as meaningful', () => {
    expect(isEmptyOverlayValue('x')).toBe(false);
    expect(isEmptyOverlayValue([1])).toBe(false);
    expect(isEmptyOverlayValue({})).toBe(false);
  });
});

describe('mergeSettingsValue — everything unnamed survives', () => {
  it('preserves all 23 of dang’s integrations keys through an unrelated overlay', () => {
    const out = mergeSettingsValue(DANG_INTEGRATIONS, { zernio_profile_id: 'abc' });
    for (const k of Object.keys(DANG_INTEGRATIONS)) {
      expect(out[k], `key ${k} was destroyed`).toBe(DANG_INTEGRATIONS[k]);
    }
    expect(out.zernio_profile_id).toBe('abc');
    expect(Object.keys(out)).toHaveLength(24);
  });

  it('a blank overlay value does NOT overwrite a real one', () => {
    const out = mergeSettingsValue({ lead_email: 'owner@x.com' }, { cc_email: '', lead_email: '' });
    expect(out.lead_email).toBe('owner@x.com');
    expect(out.cc_email).toBe('');
  });

  it('a real overlay value DOES win — a re-provision with new data is intentional', () => {
    const out = mergeSettingsValue({ lead_email: 'old@x.com' }, { lead_email: 'new@x.com' });
    expect(out.lead_email).toBe('new@x.com');
  });

  it('false and 0 overwrite, because they are values', () => {
    expect(mergeSettingsValue({ active: true }, { active: false }).active).toBe(false);
    expect(mergeSettingsValue({ tier: 3 }, { tier: 0 }).tier).toBe(0);
  });

  it('no existing row — a FIRST provision seeds the overlay verbatim', () => {
    const overlay = { a: '', b: 'x', c: [] as unknown[] };
    expect(mergeSettingsValue(null, overlay)).toStrictEqual(overlay);
    expect(mergeSettingsValue(undefined, overlay)).toStrictEqual(overlay);
  });

  it('cannot delete a key — absence in the overlay means "leave alone"', () => {
    const out = mergeSettingsValue({ keep: 'yes' }, {});
    expect(out).toStrictEqual({ keep: 'yes' });
  });
});

describe('SITE 2 — the seo write', () => {
  const seoOverlay = { meta_description: 'd', service_areas: [] as unknown[], focus_keyword: 'k' };

  // pls carries noindex=false today, and that boolean is what makes a paying client's
  // site indexable.
  it('preserves noindex when present, including the boolean false', () => {
    const out = mergeSettingsValue({ noindex: false, meta_description: 'old' }, seoOverlay);
    expect(out.noindex).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(out, 'noindex')).toBe(true);
  });

  it('does NOT invent noindex when absent', () => {
    const out = mergeSettingsValue({ meta_description: 'old' }, seoOverlay);
    expect(Object.prototype.hasOwnProperty.call(out, 'noindex')).toBe(false);
  });

  it('the [] placeholder does not wipe a populated service_areas list', () => {
    const out = mergeSettingsValue({ service_areas: ['tyler', 'arp'] }, seoOverlay);
    expect(out.service_areas).toStrictEqual(['tyler', 'arp']);
  });

  it('but DOES seed [] on a first provision, where there is nothing to lose', () => {
    expect(mergeSettingsValue(null, seoOverlay).service_areas).toStrictEqual([]);
  });
});

describe('SITE 1 — business_info takes BOTH rules', () => {
  // The composition provision-tenant uses: drop blank overwrites, then apply the S292
  // grouped-key rules.
  const compose = (existing: unknown, overlay: Record<string, unknown>) =>
    mergeBusinessInfo(existing, dropEmptyOverwrites(existing, overlay));

  it('a re-provision with a blank wizard preserves every one of the 14 S292 keys', () => {
    const blankSeed = {
      name: '', phone: '', email: '', address: '', hours: '', tagline: '',
      industry: '', license: '', certifications: '', founded_year: '',
      num_technicians: '', owner_name: '', after_hours_phone: '',
    };
    const out = compose(OWNER_EDITED_BUSINESS_INFO, blankSeed);
    for (const k of S292_DESTROYED) {
      expect(out[k], `S292 key ${k} was destroyed`).toStrictEqual(OWNER_EDITED_BUSINESS_INFO[k]);
    }
    expect(out.name).toBe('Precision Lawn Systems');
  });

  it('the merged value would still be ACCEPTED by the live CHECK constraints', () => {
    const out = compose(OWNER_EDITED_BUSINESS_INFO, { name: 'New Name', phone: '' });
    expect(checkBusinessInfoShape(out)).toStrictEqual([]);
  });

  it('a PARTIAL address quad in the overlay is dropped, leaving the stored one intact', () => {
    const out = compose(OWNER_EDITED_BUSINESS_INFO, { street_address: '2 Other St' });
    expect(out.street_address).toBe('1 Main St');
    expect(checkBusinessInfoShape(out)).toStrictEqual([]);
  });

  it('a COMPLETE quad in the overlay is applied', () => {
    const out = compose(OWNER_EDITED_BUSINESS_INFO, {
      street_address: '2 Other St', address_locality: 'Arp', address_region: 'TX', postal_code: '75750',
    });
    expect(out.street_address).toBe('2 Other St');
    expect(out.address_locality).toBe('Arp');
    expect(checkBusinessInfoShape(out)).toStrictEqual([]);
  });

  it('a first provision still seeds business_info as written', () => {
    const seed = { name: 'New Co', phone: '5551234', email: 'a@b.co', timezone: 'America/Chicago' };
    expect(compose(null, seed)).toStrictEqual(seed);
  });
});

describe('mergeSettingsRead — the read happens here, and a failed read ABORTS', () => {
  it('merges into the value the reader returns', async () => {
    const out = await mergeSettingsRead(
      'k', async () => ({ data: { value: { keep: 1 } }, error: null }), { add: 2 },
    );
    expect(out).toStrictEqual({ keep: 1, add: 2 });
  });

  it('treats a genuinely absent row as {} — a first provision has none', async () => {
    const out = await mergeSettingsRead('k', async () => ({ data: null, error: null }), { a: 1 });
    expect(out).toStrictEqual({ a: 1 });
  });

  // A reader that swallows `error` returns null, and merging into null is a WHOLE
  // REPLACEMENT arrived at silently through the failure path.
  it('THROWS on a read error rather than degrading to a replacement', async () => {
    await expect(
      mergeSettingsRead('business_info', async () => ({ data: null, error: { message: 'boom' } }), { a: 1 }),
    ).rejects.toThrow(/refusing to write/);
  });

  it('does not write anything it cannot base on a real read', async () => {
    let called = 0;
    await expect(
      mergeSettingsRead('k', async () => { called += 1; return { data: null, error: { message: 'x' } }; }, {}),
    ).rejects.toThrow();
    expect(called).toBe(1);
  });
});

describe('S330\'s invariant, after S340 moved the merge into the database', () => {
  const code = codeOnly(PROVISION);

  // S330 pinned that provision-tenant's settings writes MERGE rather than
  // replace. S340 rewrote the function onto provision_tenant_atomic, so the edge
  // no longer writes settings AT ALL — the RPC does, through
  // public.merge_setting_value (S336). The invariant is unchanged and still
  // load-bearing; only its home moved, so these guards follow it rather than
  // being deleted. A deleted guard is a lapsed protection.
  const RPC_SQL = readFileSync(
    join(__dirname, '..', '..', 'supabase', 'migrations', 's338_provision_tenant_atomic.sql'),
    'utf8',
  );

  it('anti-vacuity: both files were actually read', () => {
    expect(code.length).toBeGreaterThan(1000);
    expect(RPC_SQL.length).toBeGreaterThan(1000);
  });

  it('the edge performs NO settings write of its own any more', () => {
    // Any direct write here would bypass merge_setting_value entirely — the
    // exact replace-instead-of-merge regression S330 exists to prevent.
    expect(code).not.toMatch(/from\('settings'\)\s*\n?\s*\.(upsert|update|insert)\(/);
    expect(code).not.toContain('for (const row of settingsRows)');
  });

  it('THE MERGE: the RPC upserts settings through merge_setting_value', () => {
    const stmt = RPC_SQL.slice(RPC_SQL.indexOf('INSERT INTO public.settings'));
    expect(stmt.slice(0, 400)).toContain('ON CONFLICT (tenant_id, key) DO UPDATE');
    expect(stmt.slice(0, 400)).toContain('public.merge_setting_value(');
  });

  it('it is a MERGE, not a replace: EXCLUDED.value is never assigned bare', () => {
    // `SET value = EXCLUDED.value` is precisely the S292/S330 defect, in SQL.
    const stmt = RPC_SQL.slice(RPC_SQL.indexOf('INSERT INTO public.settings'), );
    expect(stmt.slice(0, 400)).not.toMatch(/SET value = EXCLUDED\.value/);
  });

  it('the seo projection comes from PERSISTED rows, never the payload', () => {
    expect(RPC_SQL).toMatch(/FROM public\.service_areas sa WHERE sa\.tenant_id = v_tenant AND sa\.is_live/);
  });

  it('SITE 3 — the integrations writer still strips vault secrets, now in the worker', () => {
    // The inline Zernio write moved to process-outbound-queue with the rest of
    // the outbound work. Its merge is buildZernioIntegrationsValue, which takes
    // the strip function as an argument and is unit-tested in dispatch.test.ts.
    const worker = readFileSync(
      join(__dirname, '..', '..', 'supabase', 'functions', 'process-outbound-queue', 'index.ts'),
      'utf8',
    );
    expect(worker).toContain("from '../_shared/secrets/stripVaultSecrets.ts'");
    expect(codeOnly(worker)).toContain('buildZernioIntegrationsValue(row?.value, profileId, stripVaultSecrets)');
  });
});
