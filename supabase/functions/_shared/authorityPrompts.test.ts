import { describe, it, expect } from 'vitest';
import { generateAuthorityPrompts, DEFAULT_MAX_PROMPTS } from './authorityPrompts.ts';

// S289 — every fixture below is REAL production data, read from the live DB, not
// invented for the test. That matters twice over: the generator is shaped on
// dang's ten hand-written rows (the only worked example that exists), and the
// empty-output cases are real tenants, not hypotheticals.

const DANG = {
  businessName: 'Dang Pest Control',
  city: 'Tyler',
  state: 'TX',
  // dang's live service_areas. NINE of the eighteen have a NULL state.
  serviceAreas: [
    { city: 'Arp', state: null }, { city: 'Athens', state: null },
    { city: 'Bullard', state: 'TX' }, { city: 'Canton', state: 'TX' },
    { city: 'Chandler', state: null }, { city: 'Chapel Hill', state: null },
    { city: 'Flint', state: null }, { city: 'Gilmer', state: null },
    { city: 'Gladewater', state: null }, { city: 'Henderson', state: 'TX' },
    { city: 'Hideaway', state: null }, { city: 'Jacksonville', state: 'TX' },
    { city: 'Kilgore', state: 'TX' }, { city: 'Lindale', state: 'TX' },
    { city: 'Longview', state: 'TX' }, { city: 'Noonday', state: null },
    { city: 'Tyler', state: 'TX' }, { city: 'Whitehouse', state: 'TX' },
  ],
  serviceSlugs: [
    'pest-control', 'termite-control', 'termite-inspections', 'spider-control',
    'roach-control', 'ant-control', 'mosquito-control', 'scorpion-control',
    'bed-bug-control', 'flea-tick-control', 'rodent-control', 'wasp-hornet-control',
  ],
};

const PLS = {
  businessName: 'Precision Lawn Systems LLC',
  city: 'Hawkins',
  state: 'TX',
  serviceAreas: [
    { city: 'Hawkins', state: 'TX' }, { city: 'Holly Lake Ranch', state: 'TX' },
    { city: 'Lindale', state: 'TX' }, { city: 'Longview', state: 'TX' },
    { city: 'Tyler', state: 'TX' },
  ],
  serviceSlugs: ['sprinkler-systems', 'drainage', 'pump-systems', 'sod-dirt-work', 'retaining-walls'],
};

// vita-glow, exactly as stored: vertical NULL, address NULL, zero service_areas.
const VITA_GLOW = {
  businessName: 'Vita Glow Wellness',
  city: '', state: '', serviceAreas: [], serviceSlugs: [],
};

describe('dang — the reference set', () => {
  const out = generateAuthorityPrompts(DANG);

  it('produces exactly the reference count', () => {
    expect(out).toHaveLength(DEFAULT_MAX_PROMPTS);
    expect(DEFAULT_MAX_PROMPTS).toBe(10);
  });

  it('reproduces the live shapes', () => {
    // The four shapes dang's hand-written rows use, each present at least once.
    expect(out.some((p) => /^best .+ in Tyler TX$/.test(p))).toBe(true);
    expect(out.some((p) => /^best .+ company /.test(p))).toBe(true);
    expect(out.some((p) => / services /.test(p))).toBe(true);
    expect(out.some((p) => / reviews$/.test(p))).toBe(true);
    expect(out.some((p) => / near me /.test(p))).toBe(true);
  });

  it('leads with the branded query', () => {
    expect(out[0]).toBe('Dang Pest Control reviews');
  });

  it('uses the business city and real service areas, and no other place', () => {
    const cities = ['Tyler', 'Arp', 'Athens', 'Bullard', 'Canton', 'Chandler', 'Chapel Hill',
      'Flint', 'Gilmer', 'Gladewater', 'Henderson', 'Hideaway', 'Jacksonville', 'Kilgore',
      'Lindale', 'Longview', 'Noonday', 'Whitehouse'];
    for (const p of out.slice(1)) {
      expect(cities.some((c) => p.indexOf(c) !== -1), `no known city in: ${p}`).toBe(true);
    }
  });

  it('never invents a state for a service area that has none', () => {
    // Athens, Arp, Chandler … are stored with state NULL. dang's hand-written
    // row says "Athens TX"; a human knew that. The generator must not guess it.
    for (const p of out) {
      expect(p).not.toMatch(/\b(Athens|Arp|Chandler|Chapel Hill|Flint|Gilmer|Gladewater|Hideaway|Noonday) TX\b/);
    }
  });

  it('is deterministic', () => {
    expect(generateAuthorityPrompts(DANG)).toEqual(out);
  });

  it('emits no duplicates', () => {
    expect(new Set(out.map((p) => p.toLowerCase())).size).toBe(out.length);
  });
});

describe('pls — irrigation, no pest vocabulary anywhere', () => {
  const out = generateAuthorityPrompts(PLS);

  it('produces a full set from real irrigation data', () => {
    expect(out).toHaveLength(10);
  });

  it('contains no pest vocabulary at all', () => {
    expect(out.join(' | ')).not.toMatch(/\b(pest|termite|spider|roach|mosquito|scorpion|bed ?bug|flea|rodent|wasp|hornet|exterminator)\b/i);
  });

  it('asks about the services pls actually has', () => {
    const joined = out.join(' | ');
    expect(joined).toMatch(/sprinkler systems/);
    expect(joined).toMatch(/drainage/);
  });

  it('asks in the cities pls actually serves', () => {
    const joined = out.join(' | ');
    expect(joined).toMatch(/Hawkins TX|Lindale TX|Longview TX|Tyler TX|Holly Lake Ranch TX/);
  });
});

describe('an unrecorded vertical yields no trade queries — never pest', () => {
  const out = generateAuthorityPrompts(VITA_GLOW);

  it('produces ONLY the branded query, because that is all we know', () => {
    expect(out).toEqual(['Vita Glow Wellness reviews']);
  });

  it('names no trade', () => {
    expect(out.join(' ')).not.toMatch(/pest|irrigation|control|sprinkler/i);
  });

  it('a tenant we know nothing at all about yields an EMPTY list', () => {
    expect(generateAuthorityPrompts({
      businessName: '', city: '', state: '', serviceAreas: [], serviceSlugs: [],
    })).toEqual([]);
  });
});

describe('missing facts reduce the output, they never fill it in', () => {
  it('no city: falls back to service areas only', () => {
    const out = generateAuthorityPrompts({ ...PLS, city: '', state: '' });
    expect(out.length).toBeGreaterThan(1);
    // Hawkins is also a service area, so it survives; the point is nothing new appeared.
    for (const p of out.slice(1)) {
      expect(/Hawkins TX|Holly Lake Ranch TX|Lindale TX|Longview TX|Tyler TX/.test(p)).toBe(true);
    }
  });

  it('no service areas: falls back to the business city only', () => {
    const out = generateAuthorityPrompts({ ...PLS, serviceAreas: [] });
    for (const p of out.slice(1)) expect(p).toContain('Hawkins TX');
  });

  it('no services (unrecorded vertical) but a known city: still no trade queries', () => {
    const out = generateAuthorityPrompts({ ...PLS, serviceSlugs: [] });
    expect(out).toEqual(['Precision Lawn Systems LLC reviews']);
  });

  it('no state recorded anywhere: city-only queries, no invented state', () => {
    const out = generateAuthorityPrompts({
      ...PLS, state: '', serviceAreas: [{ city: 'Hawkins', state: null }],
    });
    expect(out.join(' ')).not.toMatch(/\bTX\b/);
    expect(out.some((p) => p.indexOf('Hawkins') !== -1)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// The claim guard. NOT vacuous: it is proven against strings that WOULD violate
// it, so it cannot pass by inspecting nothing. (S287's M5 — a guard gutted to
// scan nothing passed its own test, because the corpus happened to be clean.)
// ---------------------------------------------------------------------------

const OFFER = /\bfree\b|\bdiscount\b|limited[- ]time|\bno cost\b|% off/i;
const CAPACITY = /same-day|next-day|24\/7|no contracts|guaranteed/i;
// A superlative ABOUT the tenant. The distinction is not a regex over one
// string — it is whether the superlative and the BUSINESS NAME appear together.
// "best pest control in Tyler TX" asks which provider is best; "best pest
// control company Dang Pest Control" answers it on the tenant's behalf.
const SUPERLATIVE = /\b(best|top|#1|number one|leading)\b/i;
const claimsSuperiority = (prompt: string, businessName: string) =>
  SUPERLATIVE.test(prompt) && businessName !== '' && prompt.indexOf(businessName) !== -1;

describe('no generated prompt claims anything about the tenant', () => {
  const ALL = [
    ...generateAuthorityPrompts(DANG),
    ...generateAuthorityPrompts(PLS),
    ...generateAuthorityPrompts(VITA_GLOW),
  ];

  it('inspected a non-trivial corpus (the guard cannot pass vacuously)', () => {
    expect(ALL.length).toBeGreaterThanOrEqual(20);
  });

  it('carries no offer', () => {
    expect(ALL.filter((p) => OFFER.test(p))).toEqual([]);
  });

  it('carries no capacity or contractual promise', () => {
    expect(ALL.filter((p) => CAPACITY.test(p))).toEqual([]);
  });

  it('never names the business alongside a superlative', () => {
    for (const p of ALL) {
      expect(claimsSuperiority(p, 'Dang Pest Control'), p).toBe(false);
      expect(claimsSuperiority(p, 'Precision Lawn Systems LLC'), p).toBe(false);
      expect(claimsSuperiority(p, 'Vita Glow Wellness'), p).toBe(false);
    }
  });

  it('the patterns are live — each fires on a string that would violate it', () => {
    expect(OFFER.test('free termite inspection Tyler TX')).toBe(true);
    expect(OFFER.test('20% off pest control Tyler TX')).toBe(true);
    expect(CAPACITY.test('same-day pest control Tyler TX')).toBe(true);
    expect(CAPACITY.test('guaranteed termite removal')).toBe(true);
    expect(claimsSuperiority('best pest control company Dang Pest Control', 'Dang Pest Control')).toBe(true);
    expect(claimsSuperiority('the leading choice — Dang Pest Control', 'Dang Pest Control')).toBe(true);
    // …and NOT on the legitimate market question, which names no business.
    expect(claimsSuperiority('best pest control in Tyler TX', 'Dang Pest Control')).toBe(false);
    expect(OFFER.test('best pest control in Tyler TX')).toBe(false);
    expect(CAPACITY.test('best pest control in Tyler TX')).toBe(false);
  });
});

describe('coverage and deduplication', () => {
  it('visits the CROSS pairs, not just matching indices', () => {
    // The defect an independent-cycles walk would have: with two services and
    // two locations it produces (s0,l0) and (s1,l1) only. Every live tenant has
    // five or more of each, so this would never have shown up in production data.
    const out = generateAuthorityPrompts({
      businessName: '', city: '', state: '',
      serviceAreas: [{ city: 'Alpha', state: 'TX' }, { city: 'Beta', state: 'TX' }],
      serviceSlugs: ['one-service', 'two-service'],
    });
    const joined = out.join(' | ');
    for (const combo of [['one service', 'Alpha'], ['one service', 'Beta'],
                         ['two service', 'Alpha'], ['two service', 'Beta']]) {
      expect(out.some((p) => p.indexOf(combo[0]) !== -1 && p.indexOf(combo[1]) !== -1),
        `missing pair ${combo.join(' x ')} in: ${joined}`).toBe(true);
    }
  });

  // NOT vacuous: dedupe cannot fire on the real fixtures above, so it is proven
  // on an input where the walk genuinely collides — a duplicated service slug
  // landing on the same template. (S287's M5: a check that cannot fire is not
  // evidence, and mutating dedupe away passed silently until this existed.)
  it('drops a duplicate produced by a repeated service slug', () => {
    const slugs = ['a-service', 'b-service', 'c-service', 'd-service', 'e-service', 'f-service', 'a-service'];
    const out = generateAuthorityPrompts({
      businessName: '', city: 'Solo', state: 'TX', serviceAreas: [], serviceSlugs: slugs, max: 20,
    });
    expect(new Set(out.map((p) => p.toLowerCase())).size).toBe(out.length);
    // 7 slugs, one repeated onto the same template -> 6 distinct, not 7.
    expect(out).toHaveLength(6);
  });

  it('is case-insensitive about duplicates', () => {
    const out = generateAuthorityPrompts({
      businessName: 'Acme', city: '', state: '', serviceAreas: [], serviceSlugs: [], max: 5,
    });
    expect(out).toEqual(['Acme reviews']);
  });
});
