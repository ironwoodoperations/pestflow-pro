import { describe, it, expect } from 'vitest';
import {
  VERTICAL_SEED, SEED_VERTICALS, SEED_PLATFORM_SLUGS,
  validateVertical, isSeedVertical, tradeTitleFor, tradeNounFor, servicePagesFor,
  buildPageContentRows, buildSeoSettings, buildPageSeoMeta,
  buildServiceAreaHeroTitle, buildServiceAreaSeo,
} from './provisioningSeed.ts';
import { ADMIN_PRESETS, PLATFORM_PAGE_SLUGS, VERTICAL_OPTIONS } from '../../../src/lib/adminVerticalPreset.ts';
import { SERVICE_CATALOG, CATALOG_SLUGS } from '../../../shared/lib/serviceCatalog.ts';
import { INITIAL_FORM as CLIENT_SETUP_FORM } from '../../../src/components/admin/client-setup/types.ts';
import { INITIAL_FORM as ONBOARDING_FORM } from '../../../src/components/admin/onboarding/types.ts';

// S290 — these are REAL tests: provisioningSeed.ts is a pure module and vitest
// runs it. provision-tenant/index.ts itself has NO test harness and the root
// tsconfig excludes supabase/, so the wiring in that file is verified only by
// reading it and by esbuild parsing it. That is stated in the PR and is NOT
// presented as a test. Everything below exercises the module the edge function
// calls, which is the point of extracting it.

// ── The vocabulary that must not drift ──────────────────────────────────────
//
// S335 — THIS ASSERTION CHANGED SHAPE RATHER THAN BEING DELETED.
//
// It used to compare two hand-maintained copies of the slug list, because
// provisioningSeed was believed unable to import across trees. Both lists now
// come from shared/lib/serviceCatalog, so comparing their VALUES would be
// tautological — true by construction, and passing just as happily on the day
// someone pastes a literal back in.
//
// What is asserted instead is IDENTITY: each consumer must hand back the very
// array the catalog exports. A re-copied list is necessarily a different array
// object, so it fails here however carefully its contents were typed — which is
// the regression the extraction exists to prevent, and the one a value check
// cannot see.
describe('seeded service pages resolve to THE catalog, not a copy of it', () => {
  for (const v of SEED_VERTICALS) {
    it(`${v}: VERTICAL_SEED.servicePages IS SERVICE_CATALOG.${v}`, () => {
      expect(VERTICAL_SEED[v].servicePages).toBe(SERVICE_CATALOG[v]);
    });

    it(`${v}: the admin preset IS the same catalog's slug array`, () => {
      expect(ADMIN_PRESETS[v].servicePageSlugs).toBe(CATALOG_SLUGS[v]);
    });

    // Anti-vacuity: identity above would be worthless if the arrays were empty
    // or the two verticals shared one array.
    it(`${v}: the catalog is non-trivial and vertical-specific`, () => {
      expect(SERVICE_CATALOG[v].length).toBeGreaterThan(4);
      expect(CATALOG_SLUGS[v]).not.toBe(CATALOG_SLUGS.lawn);
      expect(VERTICAL_SEED[v].servicePages.map((p) => p.slug))
        .toEqual(ADMIN_PRESETS[v].servicePageSlugs);
    });
  }

  // S323 PR A SPLIT THE TWO LISTS, deliberately, and this assertion changed
  // shape rather than being deleted.
  //
  // Equality was the right invariant while every vertical with a preset was
  // also seedable. 'lawn' is not: its preset holds the FULL CATALOG of 17
  // services, and provisioning must never seed a whole catalog — that is the
  // S290 fabrication defect wearing a menu, giving a client a dozen service
  // pages they do not sell. Lawn becomes seedable in PR B, when provisioning
  // seeds the SELECTED services only.
  //
  // What still must hold, and what this now asserts: nothing seedable may lack
  // a preset (that would seed a page the admin sidebar cannot show), and the
  // gap is NAMED — a second admin-only vertical appearing by accident fails
  // here rather than passing under a loose subset check.
  it('every seedable vertical has an admin preset, and the gap is named', () => {
    for (const v of SEED_VERTICALS) {
      expect(Object.keys(ADMIN_PRESETS), `seedable vertical with no preset: ${v}`).toContain(v);
    }
    const adminOnly = Object.keys(ADMIN_PRESETS)
      .filter((v) => (SEED_VERTICALS as string[]).indexOf(v) === -1)
      .sort();
    expect(adminOnly, 'admin-only verticals changed — is this deliberate?').toEqual(['lawn']);
  });

  it('every platform page the admin preset lists is known here', () => {
    for (const slug of PLATFORM_PAGE_SLUGS) {
      expect(SEED_PLATFORM_SLUGS, `platform slug missing: ${slug}`).toContain(slug);
    }
  });
});

// ── Rule (b): what may never appear in a seeded string ───────────────────────
//
// Word boundaries throughout. /free/ matches "freeze"; /pest/ matches
// "PestFlow Pro". Both have already cost a PR in this arc.
const FORBIDDEN: Array<{ name: string; re: RegExp }> = [
  { name: 'guarantee', re: /\bguarantee(d|s)?\b|\bwarrant(y|ies|ied)\b/i },
  { name: 'free offer', re: /\bfree\b(?!\s*(?:of\s+charge\s+to\s+no\s+one))/i },
  { name: 'capacity / speed promise', re: /\bfast\b|\bsame[- ]day\b|\b24\/7\b|\bimmediate(ly)?\b|\bquick(ly)?\b|\brapid\b/i },
  { name: 'licence / insurance claim', re: /\blicen[sc]ed?\b|\binsured\b|\bcertified\b|\bbonded\b/i },
  { name: 'ownership / tenure claim', re: /\bfamily[- ]owned\b|\blocally[- ]owned\b|\blocally trusted\b|\byears of experience\b/i },
  { name: 'superiority claim', re: /\bbest\b|\b#1\b|\btop[- ]rated\b|\bleading\b|\bexpert(s)?\b|\btrusted\b/i },
  { name: 'effectiveness claim', re: /\beffective\b|\bproven\b|\bcomprehensive\b|\bhonest pricing\b/i },
];

/** Every string a seed function produces, for one input, flattened. */
function allSeededStrings(vertical: string | null, opts?: { city?: string; state?: string; tagline?: string; phone?: string }): string[] {
  const businessName = 'Northgate Property Services';
  const o = opts || {};
  const out: string[] = [];

  for (const row of buildPageContentRows({ vertical, businessName, heroHeadline: 'Care for your property' })) {
    out.push(row.title, row.subtitle, row.intro, row.hero_headline);
  }
  const seo = buildSeoSettings({ vertical, businessName, city: o.city, state: o.state, tagline: o.tagline });
  out.push(seo.meta_description, seo.focus_keyword);

  const pageSeo = buildPageSeoMeta({ vertical, businessName, city: o.city, state: o.state, phone: o.phone });
  for (const slug of Object.keys(pageSeo)) {
    out.push(pageSeo[slug].meta_title, pageSeo[slug].meta_description);
  }
  if (o.city) {
    out.push(buildServiceAreaHeroTitle(vertical, o.city));
    const sa = buildServiceAreaSeo(vertical, o.city, o.state ?? null, businessName);
    out.push(sa.meta_title, sa.meta_description, sa.focus_keyword);
  }
  return out.filter((s) => typeof s === 'string' && s.length > 0);
}

const CASES: Array<{ label: string; vertical: string | null; opts: { city?: string; state?: string; tagline?: string; phone?: string } }> = [
  { label: 'pest, full facts', vertical: 'pest', opts: { city: 'Tyler', state: 'TX', phone: '(430) 367-5601' } },
  { label: 'pest, no city', vertical: 'pest', opts: {} },
  { label: 'pest, with tagline', vertical: 'pest', opts: { city: 'Tyler', state: 'TX', tagline: 'Care you can count on.' } },
  { label: 'irrigation, full facts', vertical: 'irrigation', opts: { city: 'Hawkins', state: 'TX' } },
  { label: 'irrigation, no state', vertical: 'irrigation', opts: { city: 'Hawkins' } },
  { label: 'unknown vertical', vertical: null, opts: { city: 'Tyler', state: 'TX' } },
  { label: 'unknown vertical, no facts at all', vertical: null, opts: {} },
];

describe('no seeded string carries a claim the tenant never made', () => {
  // The guard must be looking at real output, not an empty array. Gutting
  // allSeededStrings would otherwise pass every assertion below.
  it('inspects a non-trivial corpus (the guard cannot pass vacuously)', () => {
    for (const c of CASES) {
      const corpus = allSeededStrings(c.vertical, c.opts);
      expect(corpus.length, `${c.label} produced nothing to inspect`).toBeGreaterThan(8);
    }
    expect(allSeededStrings('pest', { city: 'Tyler', state: 'TX' }).length).toBeGreaterThan(40);
  });

  for (const c of CASES) {
    for (const f of FORBIDDEN) {
      it(`${c.label}: no ${f.name}`, () => {
        const offenders = allSeededStrings(c.vertical, c.opts).filter((s) => f.re.test(s));
        expect(offenders, `${f.name} in: ${JSON.stringify(offenders)}`).toEqual([]);
      });
    }
  }

  // Each pattern must be able to fire, or a green run proves nothing about it.
  it('every forbidden pattern is live — each fires on a string that would violate it', () => {
    const violations: Record<string, string> = {
      'guarantee': 'Fast, effective, guaranteed.',
      'free offer': 'Call for a free quote.',
      'capacity / speed promise': 'Licensed technicians, fast response.',
      'licence / insurance claim': 'Family-owned, fully licensed and insured.',
      'ownership / tenure claim': 'Locally owned and operated.',
      'superiority claim': 'Your local pest control experts.',
      'effectiveness claim': 'Comprehensive pest management solutions.',
    };
    for (const f of FORBIDDEN) {
      expect(f.re.test(violations[f.name]), `${f.name} did not fire on its own example`).toBe(true);
    }
  });

  // These are the exact strings S290 deleted. Named individually so a
  // reintroduction points at the line that came back.
  it('the specific strings that used to ship are gone', () => {
    const corpus = allSeededStrings('pest', { city: 'Tyler', state: 'TX' }).join(' | ');
    for (const gone of [
      'Fast, effective, guaranteed',
      'Licensed technicians',
      'Family-owned, fully licensed and insured',
      'Call for a free quote',
      'Free inspections available',
      'Licensed & insured professionals',
      'Locally owned and operated',
      'and surrounding areas',
    ]) {
      expect(corpus, `deleted string is back: ${gone}`).not.toContain(gone);
    }
  });
});

// ── Rule (b): an unrecorded vertical names no trade ─────────────────────────
describe('an UNKNOWN vertical seeds platform pages only, and names no trade', () => {
  const rows = buildPageContentRows({ vertical: null, businessName: 'Vita Glow Wellness' });

  it('seeds zero service pages', () => {
    const platform = SEED_PLATFORM_SLUGS;
    const service = rows.filter((r) => platform.indexOf(r.page_slug) === -1);
    expect(service).toEqual([]);
  });

  it('seeds exactly the platform pages provisioning owns', () => {
    expect(rows.map((r) => r.page_slug)).toEqual(['home', 'about', 'contact', 'faq', 'quote']);
  });

  it('names no trade in ANY string, pest or otherwise', () => {
    const joined = allSeededStrings(null, { city: 'Tyler', state: 'TX', phone: '555' }).join(' | ');
    expect(joined).not.toMatch(/\b(pest|termite|spider|roach|ant|mosquito|scorpion|bed ?bug|flea|tick|rodent|wasp|hornet|exterminator)\b/i);
    expect(joined).not.toMatch(/\b(irrigation|sprinkler|drainage|sod|retaining wall)\b/i);
    // Not the neutral trade noun either: 'home services' is a platform
    // description, not this tenant's trade.
    expect(joined).not.toMatch(/home services/i);
  });

  it('the home title is the business name alone — no trade appended', () => {
    expect(rows[0].page_slug).toBe('home');
    expect(rows[0].title).toBe('Vita Glow Wellness');
  });

  it('leaves focus_keyword empty rather than guessing one', () => {
    expect(buildSeoSettings({ vertical: null, businessName: 'Vita Glow Wellness', city: 'Tyler' }).focus_keyword).toBe('');
  });

  it('a service area gets the city alone, not a guessed trade', () => {
    expect(buildServiceAreaHeroTitle(null, 'Tyler')).toBe('Tyler');
  });
});

// ── The recorded verticals do name their trade ───────────────────────────────
describe('a recorded vertical seeds its own trade, and only its own', () => {
  it('pest seeds the twelve pest pages and no irrigation vocabulary', () => {
    const rows = buildPageContentRows({ vertical: 'pest', businessName: 'Dang Pest Control' });
    const slugs = rows.map((r) => r.page_slug);
    expect(slugs).toEqual([
      'home', 'about',
      'pest-control', 'termite-control', 'termite-inspections', 'spider-control',
      'roach-control', 'ant-control', 'mosquito-control', 'scorpion-control',
      'bed-bug-control', 'flea-tick-control', 'rodent-control', 'wasp-hornet-control',
      'contact', 'faq', 'quote',
    ]);
    expect(rows.map((r) => r.title).join(' ')).not.toMatch(/\b(sprinkler|irrigation|drainage)\b/i);
    expect(rows[0].title).toBe('Dang Pest Control — Professional Pest Control');
  });

  it('irrigation seeds the five irrigation pages and no pest vocabulary', () => {
    const rows = buildPageContentRows({ vertical: 'irrigation', businessName: 'Precision Lawn Systems LLC' });
    expect(rows.map((r) => r.page_slug)).toEqual([
      'home', 'about',
      'sprinkler-systems', 'drainage', 'pump-systems', 'sod-dirt-work', 'artificial-turf',
      'contact', 'faq', 'quote',
    ]);
    const joined = rows.map((r) => r.title + ' ' + r.hero_headline).join(' | ');
    expect(joined).not.toMatch(/\b(pest|termite|roach|rodent|exterminator)\b/i);
    expect(rows[0].title).toBe('Precision Lawn Systems LLC — Professional Irrigation');
  });

  it('service-page subtitles and intros are EMPTY, not filled with marketing copy', () => {
    for (const v of SEED_VERTICALS) {
      const rows = buildPageContentRows({ vertical: v, businessName: 'X' });
      const services = servicePagesFor(v).map((p) => p.slug);
      for (const row of rows) {
        expect(row.intro, `${v}/${row.page_slug} intro`).toBe('');
        if (services.indexOf(row.page_slug) !== -1) {
          expect(row.subtitle, `${v}/${row.page_slug} subtitle`).toBe('');
        }
      }
    }
  });

  it('a service area gets city + trade when the trade is recorded', () => {
    expect(buildServiceAreaHeroTitle('pest', 'Tyler')).toBe('Tyler Pest Control');
    expect(buildServiceAreaHeroTitle('irrigation', 'Hawkins')).toBe('Hawkins Irrigation');
  });
});

// ── Rule (a): no region the tenant did not supply ────────────────────────────
describe('no region the tenant did not supply', () => {
  it('omits the serving clause entirely when there is no city', () => {
    const seo = buildSeoSettings({ vertical: 'pest', businessName: 'Acme' });
    expect(seo.meta_description).not.toMatch(/serving/i);
    expect(seo.meta_description).not.toMatch(/your area/i);
  });

  it('uses the city alone when no state is recorded — it does not borrow one', () => {
    const seo = buildSeoSettings({ vertical: 'irrigation', businessName: 'Acme', city: 'Hawkins' });
    expect(seo.meta_description).toContain('Serving Hawkins.');
    expect(seo.meta_description).not.toMatch(/\bTX\b/);
  });

  it('names no city in per-page meta when none was supplied', () => {
    const meta = buildPageSeoMeta({ vertical: 'pest', businessName: 'Acme' });
    for (const slug of Object.keys(meta)) {
      expect(meta[slug].meta_title + ' ' + meta[slug].meta_description).not.toMatch(/\bin\s+,|undefined|null/);
    }
    expect(meta['home'].meta_description).toBe('Acme provides pest control services.');
  });

  it('includes the phone only when the tenant supplied one', () => {
    const withPhone = buildPageSeoMeta({ vertical: 'pest', businessName: 'Acme', city: 'Tyler', phone: '(430) 367-5601' });
    const without = buildPageSeoMeta({ vertical: 'pest', businessName: 'Acme', city: 'Tyler' });
    expect(withPhone['contact'].meta_description).toContain('(430) 367-5601');
    expect(without['contact'].meta_description).not.toMatch(/call/i);
  });

  it('uses the tenant tagline verbatim, and does not produce a double period', () => {
    const seo = buildSeoSettings({ vertical: 'pest', businessName: 'Acme', city: 'Tyler', state: 'TX', tagline: 'Care you can count on.' });
    expect(seo.meta_description).toBe('Acme — Care you can count on. Serving Tyler, TX.');
    expect(seo.meta_description).not.toContain('..');
  });
});

// ── Validation: a bad vertical fails loudly, it is not dropped ───────────────
describe('validateVertical rejects rather than silently dropping', () => {
  it('accepts the two literals the CHECK constraint permits', () => {
    expect(validateVertical('pest')).toEqual({ vertical: 'pest', error: null });
    expect(validateVertical('irrigation')).toEqual({ vertical: 'irrigation', error: null });
  });

  it('treats absent / null / empty as "not recorded", which is legal', () => {
    for (const raw of [undefined, null, '', '   ']) {
      const r = validateVertical(raw);
      expect(r.vertical, `for ${JSON.stringify(raw)}`).toBeNull();
      expect(r.error, `for ${JSON.stringify(raw)}`).toBeNull();
    }
  });

  // The near-misses matter more than the obvious junk: these are what a caller
  // types by hand, and the constraint takes the literals ONLY.
  it('rejects the near-misses the CHECK constraint would 23514 on', () => {
    for (const raw of ['Pest', 'PEST', 'pest-control', 'pest_control', 'Irrigation', 'hvac', 'plumbing']) {
      const r = validateVertical(raw);
      expect(r.vertical, `should not accept ${raw}`).toBeNull();
      expect(r.error, `should report an error for ${raw}`).toBeTruthy();
      expect(r.error).toContain(raw);
    }
  });

  it('rejects non-strings with a typed message rather than coercing', () => {
    for (const raw of [1, true, {}, []]) {
      const r = validateVertical(raw);
      expect(r.vertical).toBeNull();
      expect(r.error).toBeTruthy();
    }
  });

  it('trims, because a wizard select can hand back padded values', () => {
    expect(validateVertical('  pest  ')).toEqual({ vertical: 'pest', error: null });
  });

  it('isSeedVertical agrees with the constraint, and is not merely truthy', () => {
    expect(isSeedVertical('pest')).toBe(true);
    expect(isSeedVertical('irrigation')).toBe(true);
    expect(isSeedVertical('Pest')).toBe(false);
    expect(isSeedVertical(null)).toBe(false);
    expect(isSeedVertical('')).toBe(false);
  });
});

describe('trade helpers name nothing for an unrecorded vertical', () => {
  it('tradeTitleFor / tradeNounFor return empty, not a neutral trade word', () => {
    expect(tradeTitleFor(null)).toBe('');
    expect(tradeNounFor(null)).toBe('');
    expect(tradeNounFor('hvac')).toBe('');
    expect(tradeTitleFor('pest')).toBe('Pest Control');
    expect(tradeNounFor('pest')).toBe('pest control');
    expect(tradeNounFor('irrigation')).toBe('irrigation');
  });

  it('servicePagesFor returns an empty list, never a pest list', () => {
    expect(servicePagesFor(null)).toEqual([]);
    expect(servicePagesFor('hvac')).toEqual([]);
    expect(servicePagesFor('pest').length).toBe(12);
    expect(servicePagesFor('irrigation').length).toBe(5);
  });
});

// ── The selector a human actually uses ──────────────────────────────────────
describe('the wizard selector offers exactly what provisioning can seed', () => {
  it('every non-empty option is a vertical the seed module knows', () => {
    const offered = VERTICAL_OPTIONS.map((o) => o.value).filter((v) => v !== '');
    expect(offered.slice().sort()).toEqual(SEED_VERTICALS.slice().sort());
  });

  it('every offered option passes the same validation provisioning runs', () => {
    for (const opt of VERTICAL_OPTIONS) {
      const r = validateVertical(opt.value);
      expect(r.error, `option "${opt.label}" would be rejected: ${r.error}`).toBeNull();
    }
  });

  // The empty option is load-bearing. Without it the operator has to pick a
  // trade for a tenant whose trade is not listed, and picking the nearest one
  // is exactly how a wellness clinic ends up with pest pages.
  it('offers a real "not listed" option that validates to NULL', () => {
    const none = VERTICAL_OPTIONS.filter((o) => o.value === '');
    expect(none.length).toBe(1);
    expect(validateVertical(none[0].value)).toEqual({ vertical: null, error: null });
  });
});

// ── The defect that started this: a pest default nobody chose ───────────────
describe('no wizard defaults a tenant into a trade', () => {
  it('the operator wizard starts with no vertical selected', () => {
    expect(CLIENT_SETUP_FORM.vertical).toBe('');
  });

  it('the client wizard starts with no vertical selected', () => {
    expect(ONBOARDING_FORM.vertical).toBe('');
  });

  // industry used to default to the literal 'Pest Control' in BOTH wizards and
  // again inside provision-tenant. That default is what put pest content on
  // every site regardless of trade.
  it('neither wizard pre-fills industry with a trade', () => {
    expect(CLIENT_SETUP_FORM).not.toHaveProperty('industry');
    expect(ONBOARDING_FORM.industry).toBe('');
  });

  it('a default of pest would be caught (the guard is not vacuous)', () => {
    expect(validateVertical('pest').vertical).toBe('pest');
    expect(ONBOARDING_FORM.industry).not.toBe('Pest Control');
  });
});
