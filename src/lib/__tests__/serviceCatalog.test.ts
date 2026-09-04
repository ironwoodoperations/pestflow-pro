import { describe, it, expect } from 'vitest';
import {
  SERVICE_CATALOG, CATALOG_SLUGS, CATALOG_VERTICALS,
  catalogFor, catalogSlugsFor, isCatalogVertical,
} from '../../../shared/lib/serviceCatalog';
import { ADMIN_PRESETS } from '../adminVerticalPreset';
import {
  SERVICE_DATA, SERVICE_SLUGS, IRRIGATION_SERVICE_SLUGS, LAWN_SERVICE_SLUGS,
  serviceSlugsFor,
} from '../../../app/tenant/[slug]/_lib/serviceData';
import { publiclyListedServices } from '../../../app/tenant/[slug]/_lib/publiclyListedServices';
import { IRRIGATION_CONTENT_MAP } from '../../shells/_shared/irrigationContent';
import { LAWN_CONTENT_MAP } from '../../shells/_shared/lawnContent';
import { PEST_CONTENT_MAP } from '../../shells/_shared/pestContent';

// S335 — the extraction's proof obligation.
//
// The catalog moved to shared/lib and three consumers now import it instead of
// restating it. The claim being defended is that NOTHING a tenant renders moved
// — so the assertions below are (a) byte-identity of the public listing for
// every live tenant, against slug lists read from production, and (b) guards
// that fail if any consumer goes back to holding its own copy.

// ── LIVE FIXTURES, read from the production database on 2026-09-04. ──────────
// Not invented: `select page_slug from page_content` per tenant.
const PROD: Record<string, string[]> = {
  // pls — a PAYING client on its own custom domain with an indexed sitemap.
  // If this list moves, its sitemap moves.
  pls: ['about', 'artificial-turf', 'drainage', 'faq', 'home', 'pump-systems',
    'sod-dirt-work', 'sprinkler-systems'],
  // apex-protect — representative pest tenant. coastal-pest, heartland-pest,
  // metro-pest-concierge, pestflow-pro and urban-strike carry byte-identical lists.
  'apex-protect': ['about', 'accessibility', 'ant-control', 'bed-bug-control', 'faq',
    'flea-tick-control', 'home', 'mosquito-control', 'pest-control', 'privacy',
    'roach-control', 'rodent-control', 'scorpion-control', 'sms-terms', 'spider-control',
    'termite-control', 'termite-inspections', 'terms', 'wasp-hornet-control'],
  // dang — READ-ONLY evidence. Separate repo, mid-migration, not rendered by this
  // app. Its stray `wasp-control` row is the anti-vacuity case: it is the ONE row
  // where the predicate differs from "rows minus exclusions".
  dang: ['about', 'accessibility', 'ant-control', 'bed-bug-control', 'contact', 'faq',
    'flea-tick-control', 'home', 'mosquito-control', 'pest-control', 'privacy', 'quote',
    'roach-control', 'rodent-control', 'scorpion-control', 'sms-terms', 'spider-control',
    'termite-control', 'termite-inspections', 'terms', 'wasp-control', 'wasp-hornet-control'],
  // vita-glow — branding.theme is 'vita-glow' and business_info.vertical is NULL.
  'vita-glow': ['about', 'contact', 'home', 'injectables', 'iv-infusions', 'weight-wellness'],
};

const TENANTS = {
  pls: { template: 'modern-pro', vertical: 'irrigation', industry: 'irrigation and sprinklers' },
  'apex-protect': { template: 'modern-pro', vertical: 'pest', industry: 'Pest Control' },
  dang: { template: 'modern-pro', vertical: 'pest', industry: 'Pest Control' },
  'vita-glow': { template: 'vita-glow', vertical: null, industry: 'Medical Aesthetics' },
} as const;

const rows = (t: string) => PROD[t].map((page_slug) => ({ page_slug }));
const listed = (t: keyof typeof TENANTS) =>
  publiclyListedServices(TENANTS[t], rows(t)).map((r) => r.page_slug);

// The result BEFORE the extraction, captured by running these same four cases
// against the pre-extraction tree. Hard-coded on purpose: a snapshot recomputed
// from today's code would move with any regression instead of catching it.
const BEFORE: Record<keyof typeof TENANTS, string[]> = {
  pls: ['artificial-turf', 'drainage', 'pump-systems', 'sod-dirt-work', 'sprinkler-systems'],
  'apex-protect': ['ant-control', 'bed-bug-control', 'flea-tick-control', 'mosquito-control',
    'pest-control', 'roach-control', 'rodent-control', 'scorpion-control', 'spider-control',
    'termite-control', 'termite-inspections', 'wasp-hornet-control'],
  dang: ['ant-control', 'bed-bug-control', 'flea-tick-control', 'mosquito-control',
    'pest-control', 'roach-control', 'rodent-control', 'scorpion-control', 'spider-control',
    'termite-control', 'termite-inspections', 'wasp-hornet-control'],
  'vita-glow': ['injectables', 'iv-infusions', 'weight-wellness'],
};

describe('BYTE-IDENTICAL public listing for every live tenant', () => {
  for (const t of Object.keys(TENANTS) as (keyof typeof TENANTS)[]) {
    it(`${t} — unchanged by the extraction`, () => {
      expect(listed(t)).toStrictEqual(BEFORE[t]);
    });
  }

  it('anti-vacuity: dang differs from the pest tenants by EXACTLY wasp-control', () => {
    // If the predicate were "rows minus exclusions", dang would list wasp-control.
    // This is the one row proving the catalog intersection is actually applied,
    // so the four equalities above are not passing trivially.
    expect(PROD.dang).toContain('wasp-control');
    expect(listed('dang')).not.toContain('wasp-control');
    expect(listed('dang')).toStrictEqual(listed('apex-protect'));
  });

  it('anti-vacuity: the fixtures are distinct, non-empty listings', () => {
    expect(listed('pls')).toHaveLength(5);
    expect(listed('apex-protect')).toHaveLength(12);
    expect(listed('vita-glow')).toHaveLength(3);
    expect(listed('pls')).not.toStrictEqual(listed('apex-protect'));
  });
});

describe('every consumer resolves to THE catalog — a re-copy must fail', () => {
  // Reference identity, not value equality. A pasted-back literal is a different
  // array object and fails here no matter how correctly it was typed.
  it('ADMIN_PRESETS slugs ARE the catalog arrays', () => {
    expect(ADMIN_PRESETS.pest.servicePageSlugs).toBe(CATALOG_SLUGS.pest);
    expect(ADMIN_PRESETS.irrigation.servicePageSlugs).toBe(CATALOG_SLUGS.irrigation);
    expect(ADMIN_PRESETS.lawn.servicePageSlugs).toBe(CATALOG_SLUGS.lawn);
  });

  // The router sets are Sets, so identity cannot be asserted. ORDER is the lever
  // instead: the catalog order deliberately DIFFERS from the content maps' key
  // order for pest and irrigation, so reverting to `Object.keys(SOME_MAP)`
  // produces the same MEMBERS in a different sequence and fails this.
  it('router sets are built from the catalog, in catalog order', () => {
    expect([...SERVICE_SLUGS]).toStrictEqual([...CATALOG_SLUGS.pest]);
    expect([...IRRIGATION_SERVICE_SLUGS]).toStrictEqual([...CATALOG_SLUGS.irrigation]);
    expect([...LAWN_SERVICE_SLUGS]).toStrictEqual([...CATALOG_SLUGS.lawn]);
  });

  it('anti-vacuity: that order check genuinely discriminates', () => {
    // Same members, different sequence — so the assertion above would FAIL on a
    // revert. If these ever coincided, the guard above would be decorative and
    // this test says so out loud.
    const pestKeys = Object.keys(SERVICE_DATA);
    expect([...pestKeys].sort()).toStrictEqual([...CATALOG_SLUGS.pest].sort());
    expect(pestKeys).not.toStrictEqual([...CATALOG_SLUGS.pest]);

    const irrKeys = Object.keys(IRRIGATION_CONTENT_MAP);
    expect([...irrKeys].sort()).toStrictEqual([...CATALOG_SLUGS.irrigation].sort());
    expect(irrKeys).not.toStrictEqual([...CATALOG_SLUGS.irrigation]);

    // Lawn is the honest exception: its content-map order and catalog order
    // COINCIDE, so order cannot catch a revert there. The identity assertion on
    // ADMIN_PRESETS.lawn above is what covers lawn.
    expect(Object.keys(LAWN_CONTENT_MAP)).toStrictEqual([...CATALOG_SLUGS.lawn]);
  });
});

describe('catalog integrity', () => {
  it('counts are 12 / 5 / 17', () => {
    expect(SERVICE_CATALOG.pest).toHaveLength(12);
    expect(SERVICE_CATALOG.irrigation).toHaveLength(5);
    expect(SERVICE_CATALOG.lawn).toHaveLength(17);
  });

  it('no duplicate slug within a vertical, and every title is non-empty', () => {
    for (const v of CATALOG_VERTICALS) {
      const slugs = SERVICE_CATALOG[v].map((s) => s.slug);
      expect(new Set(slugs).size, `duplicate slug in ${v}`).toBe(slugs.length);
      for (const s of SERVICE_CATALOG[v]) {
        expect(s.title.trim(), `empty title: ${v}/${s.slug}`).not.toBe('');
      }
    }
  });

  it('every slug satisfies the tenant_services CHECK regex', () => {
    // public.tenant_services_slug_shape, read from pg_constraint on 2026-09-04:
    //   CHECK (service_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
    // A catalog slug that this rejects could never be stored as a selection.
    const shape = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const v of CATALOG_VERTICALS) {
      for (const s of SERVICE_CATALOG[v]) {
        expect(shape.test(s.slug), `bad slug shape: ${s.slug}`).toBe(true);
      }
    }
  });

  it('CATALOG_SLUGS is the slug projection of SERVICE_CATALOG', () => {
    for (const v of CATALOG_VERTICALS) {
      expect([...CATALOG_SLUGS[v]]).toStrictEqual(SERVICE_CATALOG[v].map((s) => s.slug));
    }
  });

  it('an unregistered vertical gets NOTHING, never pest', () => {
    // The same rule serviceSlugsFor follows: an unknown trade must serve no
    // pages rather than another trade's.
    expect(catalogFor('pool')).toStrictEqual([]);
    expect(catalogSlugsFor(null)).toStrictEqual([]);
    expect(catalogSlugsFor(undefined)).toStrictEqual([]);
    expect(catalogSlugsFor('hvac')).toStrictEqual([]);
    expect(isCatalogVertical('pest')).toBe(true);
    expect(isCatalogVertical('pool')).toBe(false);
  });

  it('the catalog is frozen — no consumer can mutate the shared reference', () => {
    expect(Object.isFrozen(SERVICE_CATALOG)).toBe(true);
    expect(Object.isFrozen(SERVICE_CATALOG.pest)).toBe(true);
    expect(Object.isFrozen(CATALOG_SLUGS.pest)).toBe(true);
  });
});

describe('routing cannot outrun content', () => {
  // Every slug the router will serve must have a content entry, or the page
  // renders empty. These are the pairings [service]/page.tsx actually uses.
  it('each vertical catalog is exactly its content map’s key set', () => {
    expect([...CATALOG_SLUGS.pest].sort()).toStrictEqual(Object.keys(SERVICE_DATA).sort());
    expect([...CATALOG_SLUGS.pest].sort()).toStrictEqual(Object.keys(PEST_CONTENT_MAP).sort());
    expect([...CATALOG_SLUGS.irrigation].sort())
      .toStrictEqual(Object.keys(IRRIGATION_CONTENT_MAP).sort());
    expect([...CATALOG_SLUGS.lawn].sort()).toStrictEqual(Object.keys(LAWN_CONTENT_MAP).sort());
  });

  it('serviceSlugsFor still answers from the catalog', () => {
    expect([...serviceSlugsFor('pest')].sort()).toStrictEqual([...CATALOG_SLUGS.pest].sort());
    expect([...serviceSlugsFor('irrigation')].sort())
      .toStrictEqual([...CATALOG_SLUGS.irrigation].sort());
    expect(serviceSlugsFor('pool' as never).size).toBe(0);
  });
});

describe('lawn titles are borrowed, not invented', () => {
  // Lawn has never had seed titles — it is not a SeedVertical. Rather than write
  // new strings, each lawn title is LAWN_CONTENT_MAP's own displayName. This
  // pins that, so the two cannot drift while nothing consumes them.
  it('every lawn title equals LAWN_CONTENT_MAP displayName for that slug', () => {
    for (const s of SERVICE_CATALOG.lawn) {
      const entry = (LAWN_CONTENT_MAP as Record<string, { displayName: string }>)[s.slug];
      expect(entry, `no content entry for ${s.slug}`).toBeTruthy();
      expect(s.title, `lawn title drifted for ${s.slug}`).toBe(entry.displayName);
    }
  });

  it('a page title and a display name are NOT the same field — irrigation proves it', () => {
    // Recorded so a future session widening SEED_VERTICALS reviews lawn's titles
    // rather than inheriting them as page titles by accident.
    const sprinkler = SERVICE_CATALOG.irrigation.find((s) => s.slug === 'sprinkler-systems');
    expect(sprinkler?.title).toBe('Sprinkler Systems');
    expect(IRRIGATION_CONTENT_MAP['sprinkler-systems'].displayName)
      .toBe('Sprinkler System Installation & Repair');
  });
});
