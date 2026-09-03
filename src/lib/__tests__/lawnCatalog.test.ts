import { describe, it, expect } from 'vitest';
import { ADMIN_PRESETS, ADMIN_VERTICAL_LABELS, VERTICAL_OPTIONS, isAdminVertical, isServicePageSlug } from '../adminVerticalPreset.ts';
import { LAWN_CONTENT_MAP } from '../../shells/_shared/lawnContent.ts';
import { IRRIGATION_CONTENT_MAP } from '../../shells/_shared/irrigationContent.ts';
import { PEST_CONTENT_MAP } from '../../shells/_shared/pestContent.ts';
import { getServiceEntry } from '../../shells/_shared/serviceEntry.ts';
import { getVerticalCopy } from '../../shells/_shared/verticalCopy.ts';
import { getSchemaVocabulary } from '../../../shared/lib/seoSchema.ts';
import { VERTICALS } from '../../../shared/lib/verticals.ts';
import { serviceSlugsFor } from '../../../app/tenant/[slug]/_lib/serviceData.ts';
import { SEED_VERTICALS } from '../../../supabase/functions/_shared/provisioningSeed.ts';

// S323 PR A — THE LAWN CATALOG, and the guard that keeps its surfaces in step.
//
// WHAT THIS FILE DEFENDS. The lawn vertical is a FULL CATALOG plus per-tenant
// selection, which is a different shape from pest and irrigation (one tenant's
// list, duplicated across five surfaces). Two things follow:
//
//   1. The catalog is stated in TWO places — LAWN_CONTENT_MAP (what a slug
//      RENDERS) and ADMIN_PRESETS.lawn.servicePageSlugs (what the admin surfaces
//      call a service page). A slug in the second and not the first is the live
//      404 defect: a page_content row puts a tile and a nav link in front of a
//      customer pointing at a route that serves nothing. That fired on
//      2026-08-26 with a stray artificial-turf row. Asserted in BOTH directions.
//
//   2. Three lawn slugs are SHARED with another vertical's catalog, deliberately
//      and with approval. Sharing is safe; sharing by ACCIDENT is not, so the
//      overlap set is pinned exactly rather than merely permitted.
//
// It also holds the line the whole vertical arc exists for: a preset carries
// only what is true of the TRADE. The claims sweep at the foot runs against the
// DATA (JSON.stringify of the real exports), never the file text — this file's
// own header names 'free 2-year warranty', 'Licensed since 2017' and 'BBB A+'
// as the mistakes it is written against, and a text scan would flag its own
// explanation. Tripping on your own comment has happened in this repo before.

const LAWN_SLUGS = Object.keys(LAWN_CONTENT_MAP);
const PRESET_SLUGS = ADMIN_PRESETS.lawn.servicePageSlugs;

describe('the corpus is real — this guard cannot pass vacuously', () => {
  it('both surfaces parsed to a NON-EMPTY list of the expected size', () => {
    // The S320 count=0 lesson: every assertion below loops over these, so an
    // empty list would make the whole file pass while checking nothing.
    expect(LAWN_SLUGS, 'content map').toHaveLength(17);
    expect(PRESET_SLUGS, 'admin preset').toHaveLength(17);
  });

  it('names the services from each group, so a truncated catalog fails', () => {
    for (const slug of ['lawn-fertilization', 'weed-control', 'mowing-maintenance', 'landscape-design', 'hardscape-stonework']) {
      expect(LAWN_SLUGS, `catalog lost ${slug}`).toContain(slug);
    }
  });
});

describe('the catalog is stated once — the two surfaces agree exactly', () => {
  it('content map keys === admin preset servicePageSlugs, in the same order', () => {
    // ORDER, not just membership: the preset list is the admin sidebar's order,
    // and it is grouped (turf treatment, maintenance, landscape, boundary). A
    // reordering is not a defect, but an unnoticed one means the two lists were
    // edited independently, which is how the gap opens.
    expect(PRESET_SLUGS).toEqual(LAWN_SLUGS);
  });

  it('neither list may grow alone — asserted in both directions', () => {
    for (const slug of PRESET_SLUGS) {
      expect(LAWN_CONTENT_MAP[slug], `preset names ${slug}, content map does not serve it`).toBeDefined();
    }
    for (const slug of LAWN_SLUGS) {
      expect(PRESET_SLUGS, `content map serves ${slug}, admin preset does not list it`).toContain(slug);
    }
  });

  it('VERIFICATION 4 — every catalog slug resolves to a real entry, so no catalog slug can 404', () => {
    // The defect in one line: a page_content row for a slug the content map does
    // not serve renders a tile and a nav link pointing at nothing. With the full
    // catalog in the map, adding a service later is just a row.
    for (const slug of PRESET_SLUGS) {
      const entry = getServiceEntry('lawn', slug);
      expect(entry, `no entry for ${slug}`).toBeDefined();
      expect(entry).toBe(LAWN_CONTENT_MAP[slug]);
      expect(isServicePageSlug('lawn', slug), `${slug} is not treated as a service page`).toBe(true);
    }
  });
});

describe('every entry satisfies the PestEntry contract', () => {
  for (const [slug, entry] of Object.entries(LAWN_CONTENT_MAP)) {
    it(`${slug}`, () => {
      expect(entry.slug, 'key and slug field disagree').toBe(slug);
      for (const field of ['displayName', 'pluralNoun', 'blurb', 'treatment', 'cta', 'metaTitle', 'metaDescription'] as const) {
        expect(entry[field].trim().length, `${slug}.${field} is empty`).toBeGreaterThan(0);
      }
      expect(entry.signs.length, `${slug}.signs is empty`).toBeGreaterThan(0);
      for (const s of entry.signs) expect(s.trim().length).toBeGreaterThan(0);
    });
  }
});

describe('slug reuse across verticals is EXACT, not merely permitted', () => {
  // Boundary services appear in more than one catalog on purpose — selection at
  // provisioning is what prevents collision. Pinning the set means a FOURTH
  // shared slug arriving by accident fails here, which is the case the approval
  // does not cover.
  const shared = (a: Record<string, unknown>) => LAWN_SLUGS.filter((s) => s in a).sort();

  it('shares exactly one slug with the pest catalog', () => {
    expect(shared(PEST_CONTENT_MAP)).toEqual(['mosquito-control']);
  });

  it('shares exactly two slugs with the irrigation catalog', () => {
    // 'sprinkler-systems' is REUSED rather than forked into 'irrigation-repair'.
    // Two slugs for one service means two URLs and a 404 the moment a tenant's
    // vertical changes. The scope difference — a lawn crew repairs, it does not
    // design and install — is carried by the COPY, asserted below.
    expect(shared(IRRIGATION_CONTENT_MAP)).toEqual(['artificial-turf', 'sprinkler-systems']);
  });

  it('a shared slug carries its OWN vertical\'s copy, not the other vertical\'s object', () => {
    for (const slug of ['artificial-turf', 'sprinkler-systems']) {
      expect(getServiceEntry('lawn', slug)).toBe(LAWN_CONTENT_MAP[slug]);
      expect(getServiceEntry('irrigation', slug)).toBe(IRRIGATION_CONTENT_MAP[slug]);
      expect(getServiceEntry('lawn', slug)).not.toBe(getServiceEntry('irrigation', slug));
    }
    expect(getServiceEntry('lawn', 'mosquito-control')).not.toBe(getServiceEntry('pest', 'mosquito-control'));
  });

  it('the reused sprinkler slug is repair-scoped on the lawn side and claims no installation', () => {
    // This is what makes the reuse honest. If the lawn entry ever grows an
    // installation claim, the two verticals have collapsed into one and the
    // reuse needs revisiting rather than quietly widening.
    const lawn = LAWN_CONTENT_MAP['sprinkler-systems'];
    expect(lawn.displayName).toBe('Irrigation Repair');
    expect(`${lawn.blurb} ${lawn.treatment} ${lawn.metaDescription}`).not.toMatch(/\binstall(ation|s|ed|ing)?\b|\bnew system\b|\bzone layout\b|\bdesign\b/i);
    // …and the irrigation side still does install, unchanged.
    expect(IRRIGATION_CONTENT_MAP['sprinkler-systems'].displayName).toMatch(/installation/i);
  });
});

describe('the router set and the content map are the SAME table', () => {
  // The two live in different files by necessity — the router set is in the
  // Next tree, the content maps under src/shells — and they MUST agree key for
  // key. [service]/page.tsx decides service-page vs location-page from the SET,
  // then renders from getServiceEntry: a vertical in one and not the other
  // renders a service page with no entry. Asserted for EVERY registered
  // vertical, not just lawn, because that is where the two could drift.
  for (const vertical of VERTICALS) {
    it(`${vertical}: the slug set is exactly the slugs that resolve to an entry`, () => {
      const set = [...serviceSlugsFor(vertical)].sort();
      for (const slug of set) {
        expect(getServiceEntry(vertical, slug), `${vertical}/${slug} is routed but serves nothing`).toBeDefined();
      }
      // …and nothing resolves that the router will not route there.
      const resolvable = [...new Set([
        ...Object.keys(PEST_CONTENT_MAP), ...Object.keys(IRRIGATION_CONTENT_MAP), ...LAWN_SLUGS,
      ])].filter((slug) => getServiceEntry(vertical, slug) !== undefined).sort();
      expect(resolvable).toEqual(set);
    });
  }

  it('a vertical with no catalog serves NOTHING — never another trade\'s pages', () => {
    // The defect this replaced: `vertical === 'irrigation' ? IRRIGATION : PEST`
    // handed the PEST set to every other vertical, so registering 'lawn' would
    // have routed a lawn tenant's /ant-control.
    for (const vertical of ['pool', 'hvac', 'roof', 'trailer'] as const) {
      expect(serviceSlugsFor(vertical).size, `${vertical} routes service pages`).toBe(0);
      expect(getServiceEntry(vertical, 'ant-control'), `${vertical} resolves pest content`).toBeUndefined();
    }
  });

  it('and the three registered verticals are non-empty, so the check above is not vacuous', () => {
    expect(serviceSlugsFor('pest').size).toBe(12);
    expect(serviceSlugsFor('irrigation').size).toBe(5);
    expect(serviceSlugsFor('lawn').size).toBe(17);
  });
});

describe('VERIFICATION 1 — pest and irrigation are untouched', () => {
  it('getServiceEntry still returns the SAME object reference for every pest slug', () => {
    for (const slug of Object.keys(PEST_CONTENT_MAP)) {
      expect(getServiceEntry('pest', slug)).toBe(PEST_CONTENT_MAP[slug]);
    }
  });

  it('…and for every irrigation slug', () => {
    for (const slug of Object.keys(IRRIGATION_CONTENT_MAP)) {
      expect(getServiceEntry('irrigation', slug)).toBe(IRRIGATION_CONTENT_MAP[slug]);
    }
  });

  it('no lawn-only slug leaks into the pest or irrigation catalogs', () => {
    const lawnOnly = LAWN_SLUGS.filter((s) => !(s in PEST_CONTENT_MAP) && !(s in IRRIGATION_CONTENT_MAP));
    expect(lawnOnly, 'the whole catalog turned out to be shared — that is not the design').toHaveLength(14);
    for (const slug of lawnOnly) {
      expect(getServiceEntry('pest', slug), `${slug} resolves on pest`).toBeUndefined();
      expect(getServiceEntry('irrigation', slug), `${slug} resolves on irrigation`).toBeUndefined();
    }
  });

  it('the irrigation preset still holds pls\'s five services, unwidened', () => {
    expect(ADMIN_PRESETS.irrigation.servicePageSlugs).toHaveLength(5);
    expect(ADMIN_PRESETS.pest.servicePageSlugs).toHaveLength(12);
  });
});

describe('PR A is INERT — nothing can provision a lawn tenant yet', () => {
  // The A → B → C ordering is load-bearing: getVerticalCopy and
  // getSchemaVocabulary throw from layout.tsx, so a CHECK widened ahead of the
  // presets lets a JSONB edit 500 an entire site. These assertions are the
  // ordering, stated. PR B deletes the first two; PR C widens the constraint.
  it('the wizard does not offer lawn', () => {
    expect(VERTICAL_OPTIONS.map((o) => o.value)).not.toContain('lawn');
  });

  it('provisioning cannot seed lawn', () => {
    expect(SEED_VERTICALS as string[]).not.toContain('lawn');
  });

  it('but the preset IS reachable, so PR B has something to select from', () => {
    expect(isAdminVertical('lawn')).toBe(true);
    expect(ADMIN_VERTICAL_LABELS.lawn).toBe('Lawn Care & Landscape');
  });

  it('VERIFICATION 3 — a lawn tenant with NOTHING selected does not 500', () => {
    // This is the whole reason presets ship BEFORE the CHECK widens.
    // layout.tsx calls getVerticalCopy(resolveVertical(tenant)) and
    // getSchemaVocabulary(...) on every request, and both THROW for a vertical
    // with no preset — so a tenant set to a copyless vertical takes its ENTIRE
    // site down, triggerable by a JSONB edit with no deploy. With the presets in
    // place neither throws, whatever the tenant has or has not selected: the
    // selection lives in page_content rows, which these two never read.
    expect(() => getVerticalCopy('lawn')).not.toThrow();
    expect(() => getSchemaVocabulary('lawn')).not.toThrow();
    // …and this assertion is not vacuous — a vertical without presets still does.
    expect(() => getVerticalCopy('pool')).toThrow(/pool/);
    expect(() => getSchemaVocabulary('pool')).toThrow(/pool/);
  });
});

// ── The claims sweep ────────────────────────────────────────────────────────
//
// Run against the DATA, never the file text: this file and lawnContent.ts both
// quote the literals they forbid, and a text scan would flag the explanation.
//
// The patterns are deliberately restricted to phrases that are business claims
// in every context. The repo's own rule applies — a guard that cries wolf gets
// allowlisted into uselessness — so bare speed adjectives (`fast`, `quick`) are
// NOT here: "fast-draining base" is a trade fact and "fast response" is a
// tenant claim, and one pattern cannot tell them apart.
const CLAIM_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: 'guarantee / warranty', re: /\bguarantee(d|s)?\b|\bwarrant(y|ies|ied)\b/i },
  { name: 'offer', re: /\bfree\b|\bno[- ]obligation\b|\bdiscount\b/i },
  { name: 'licence / insurance / certification', re: /\blicen[sc]ed?\b|\binsured\b|\bbonded\b|\bcertified\b|\bBBB\b/i },
  { name: 'tenure / ownership', re: /\bsince \d{4}\b|\byears of experience\b|\bfamily[- ]owned\b|\blocally[- ]owned\b/i },
  { name: 'capacity / terms', re: /same-day|next-day|24\/7|no contracts|\bwithin \d+ (hours|days)\b/i },
  { name: 'superiority', re: /\bbest\b|\b#1\b|\btop[- ]rated\b|\baward[- ]winning\b|\bexpert(s)?\b|\btrusted\b/i },
  { name: 'fabricated statistic', re: /\bmost customers\b|\bthousands of\b|\d{1,3},\d{3}\+?/i },
  { name: 'a specific tenant\'s region', re: /East Texas|Longview|Lindale|Bullard|Nacogdoches|Hawkins/i },
];

/** The four lawn surfaces, as the data a reader would actually receive. */
const LAWN_SURFACES: Array<[string, string]> = [
  ['content map', JSON.stringify(LAWN_CONTENT_MAP)],
  ['copy preset', JSON.stringify(getVerticalCopy('lawn'))],
  ['admin preset', JSON.stringify(ADMIN_PRESETS.lawn)],
  ['schema vocabulary', JSON.stringify(getSchemaVocabulary('lawn'))],
];

describe('VERIFICATION 6 — no claim strings in any lawn surface', () => {
  for (const [surface, text] of LAWN_SURFACES) {
    for (const { name, re } of CLAIM_PATTERNS) {
      it(`${surface}: no ${name}`, () => {
        expect(text.match(re)?.[0] ?? null, `${surface} carries a ${name} claim`).toBeNull();
      });
    }
  }

  it('VERIFICATION 7 — the sweep is not vacuous: each pattern catches a real literal', () => {
    // MUTATION TEST, run inline. A guard that cannot fail is the S319 failure
    // mode and this repo has been bitten by it three times. Every string below
    // is a real claim from a live preset or from the researched competitor
    // sites the brief named — the things this sweep exists to keep out.
    const MUST_CATCH: Array<[string, string]> = [
      ['guarantee / warranty', 'Every system we install carries a free 2-year warranty.'],
      ['offer', 'Free estimates across East Texas.'],
      ['licence / insurance / certification', 'Licensed and insured, BBB A+.'],
      ['tenure / ownership', 'Serving East Texas since 2017.'],
      ['capacity / terms', 'Same-day appointments available. No contracts required.'],
      ['superiority', 'The most trusted lawn care experts in the area.'],
      ['fabricated statistic', 'Trusted by 4,200+ properties.'],
      ['a specific tenant\'s region', 'Sod installation and dirt work for East Texas properties.'],
    ];
    for (const [name, literal] of MUST_CATCH) {
      const pattern = CLAIM_PATTERNS.find((p) => p.name === name);
      expect(pattern, `no pattern named ${name}`).toBeDefined();
      expect(pattern!.re.test(literal), `pattern "${name}" does not catch: ${literal}`).toBe(true);
    }
  });

  it('…and the sweep really is reading the lawn data, not an empty string', () => {
    for (const [surface, text] of LAWN_SURFACES) {
      // 100, not a round-looking 200: the schema vocabulary is the smallest of
      // the four and serializes to under 200 characters. A threshold set by
      // guessing rather than by measuring is a guard that fails on correct data
      // — which is exactly what the first version of this line did.
      expect(text.length, `${surface} serialized empty`).toBeGreaterThan(100);
      expect(text.toLowerCase(), `${surface} does not look like lawn content`).toMatch(/lawn|turf/);
    }
  });
});

describe('pest vocabulary in the lawn catalog is confined to the boundary services', () => {
  // A blanket "no pest words" rule would be wrong here: perimeter pest control
  // and mosquito & tick control are real lawn services and MUST name what they
  // treat. So the assertion is placement, not absence — pest vocabulary outside
  // those two entries means pest copy has bled into the turf catalog.
  // `pests?` and `roaches?`, with the plural. The first version of this pattern
  // required the singular, so "keep common pests outside" — the literal in the
  // perimeter entry — did not match it. The mutation assertion below is what
  // caught that, which is the whole reason it is here.
  const PEST_WORDS = /\b(pests?|termites?|roach(es)?|rodents?|bed ?bugs?|scorpions?|exterminat\w*)\b/i;
  const BOUNDARY = ['perimeter-pest-control', 'mosquito-control'];

  for (const [slug, entry] of Object.entries(LAWN_CONTENT_MAP)) {
    if (BOUNDARY.indexOf(slug) !== -1) continue;
    it(`${slug} names no pest work`, () => {
      expect(JSON.stringify(entry)).not.toMatch(PEST_WORDS);
    });
  }

  it('and the two boundary entries DO — otherwise this guard is checking nothing', () => {
    expect(JSON.stringify(LAWN_CONTENT_MAP['perimeter-pest-control'])).toMatch(PEST_WORDS);
    expect(PEST_WORDS.test('Exterior treatment around the structure to keep common pests outside.')).toBe(true);
  });

  it('the schema vocabulary claims none of it, because it is emitted for EVERY lawn tenant', () => {
    expect(getSchemaVocabulary('lawn').knowsAbout.join(' | ')).not.toMatch(PEST_WORDS);
  });
});
