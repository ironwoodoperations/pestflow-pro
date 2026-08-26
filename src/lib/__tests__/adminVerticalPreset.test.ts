import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ADMIN_PRESETS, NEUTRAL_ADMIN_PRESET, PLATFORM_PAGE_SLUGS,
  getAdminPreset, isAdminVertical, standardPageSlugs, isServicePageSlug, partitionPageSlugs,
} from '../adminVerticalPreset';

// S285 — the admin label preset. Pure data plus four pure functions, so this is
// a direct test. The RENDERED consequences are asserted separately, in
// src/components/admin/__tests__/adminRenderedStrings.test.tsx.

const PEST_WORDS = /\b(pest|termite|spider|roach|mosquito|scorpion|bed ?bug|flea|rodent|wasp|hornet|ants?)\b/i;

describe('resolution', () => {
  it('knows exactly the two verticals the CHECK constraint permits', () => {
    expect(Object.keys(ADMIN_PRESETS).sort()).toEqual(['irrigation', 'pest']);
  });

  it('resolves the two known verticals to their own presets', () => {
    expect(getAdminPreset('pest')).toBe(ADMIN_PRESETS.pest);
    expect(getAdminPreset('irrigation')).toBe(ADMIN_PRESETS.irrigation);
    expect(isAdminVertical('pest')).toBe(true);
    expect(isAdminVertical('irrigation')).toBe(true);
  });

  // Rule (b). Every one of these must land on NEUTRAL, never on pest.
  const UNKNOWN = [
    null, undefined, '', '   ', 'Pest', 'PEST', 'Irrigation', 'pest-control',
    'pest_control', 'hvac', 'medical_aesthetics', 'Medical Aesthetics',
    // pls's real stored `industry` string — proof that keying on industry
    // rather than vertical could never have matched a lookup key.
    'irrigation and sprinkler system installation and repair, yard drainage and french drains, lake and pond pump systems, sod and grading — East Texas',
  ];

  for (const v of UNKNOWN) {
    it(`resolves ${JSON.stringify(v)} to NEUTRAL, not pest`, () => {
      expect(getAdminPreset(v)).toBe(NEUTRAL_ADMIN_PRESET);
      expect(isAdminVertical(v)).toBe(false);
      expect(getAdminPreset(v)).not.toBe(ADMIN_PRESETS.pest);
    });
  }

  it('does not mistake an Object.prototype key for a preset', () => {
    for (const v of ['constructor', 'toString', 'hasOwnProperty', '__proto__']) {
      expect(isAdminVertical(v)).toBe(false);
      expect(getAdminPreset(v)).toBe(NEUTRAL_ADMIN_PRESET);
    }
  });
});

describe('NEUTRAL is usable but names no trade', () => {
  it('has a working FAQ category list', () => {
    expect(NEUTRAL_ADMIN_PRESET.faqCategories.length).toBeGreaterThan(0);
    expect(NEUTRAL_ADMIN_PRESET.faqCategories).toContain('General');
  });

  it('names NO service pages — inventing them would mean inventing a trade', () => {
    expect(NEUTRAL_ADMIN_PRESET.servicePageSlugs).toEqual([]);
  });

  it('still gets the full platform page set', () => {
    expect(standardPageSlugs(null)).toEqual(PLATFORM_PAGE_SLUGS);
  });

  it('contains no pest vocabulary anywhere', () => {
    expect(JSON.stringify(NEUTRAL_ADMIN_PRESET)).not.toMatch(PEST_WORDS);
  });

  it("claims nothing on the tenant's behalf in its FAQ buckets", () => {
    expect(JSON.stringify(NEUTRAL_ADMIN_PRESET.faqCategories)).not.toMatch(/warrant|guarantee|free|discount/i);
  });
});

describe('the irrigation preset carries no pest vocabulary', () => {
  it('is pest-free end to end', () => {
    expect(JSON.stringify(ADMIN_PRESETS.irrigation)).not.toMatch(PEST_WORDS);
  });

  it('matches the five live pls service pages', () => {
    expect(ADMIN_PRESETS.irrigation.servicePageSlugs).toEqual([
      'sprinkler-systems', 'drainage', 'pump-systems', 'sod-dirt-work', 'artificial-turf',
    ]);
  });

  it('matches the four live pls FAQ categories, plus General', () => {
    expect(ADMIN_PRESETS.irrigation.faqCategories).toEqual([
      'General', 'Sprinkler Systems', 'Drainage', 'Pump Systems', 'Sod & Dirt Work',
    ]);
  });

  // The brief's explicit warning. pls has FIVE service pages and FOUR
  // categories — artificial-turf has none. A test asserting these lists were
  // derivable from one another would force a wrong fix later.
  it('faqCategories and servicePageSlugs are NOT derivable from one another', () => {
    expect(ADMIN_PRESETS.irrigation.servicePageSlugs).toHaveLength(5);
    expect(ADMIN_PRESETS.irrigation.faqCategories.filter((c) => c !== 'General')).toHaveLength(4);
  });
});

describe('the pest preset preserves the live values', () => {
  it('keeps all twelve service slugs, matching the array it replaces', () => {
    expect(ADMIN_PRESETS.pest.servicePageSlugs).toHaveLength(12);
    for (const slug of [
      'pest-control', 'termite-control', 'termite-inspections', 'spider-control',
      'roach-control', 'ant-control', 'mosquito-control', 'scorpion-control',
      'bed-bug-control', 'flea-tick-control', 'rodent-control', 'wasp-hornet-control',
    ]) expect(ADMIN_PRESETS.pest.servicePageSlugs).toContain(slug);
  });

  // Renaming any of these would orphan live FAQ rows into FaqTab's otherCats.
  it('keeps the ten FAQ categories live rows are stored against', () => {
    expect(ADMIN_PRESETS.pest.faqCategories).toEqual([
      'General', 'Ants', 'Spiders', 'Wasps & Yellow Jackets',
      'Scorpions', 'Rodents', 'Mosquitoes', 'Fleas & Ticks', 'Roaches', 'Bed Bugs',
    ]);
  });
});

describe('platform pages are shared, not per-vertical', () => {
  it('corrects the old STANDARD_SLUGS in both directions', () => {
    // Omitted on main but live for real tenants — they fell into "Custom Pages".
    for (const slug of ['accessibility', 'privacy', 'terms', 'sms-terms', 'quote']) {
      expect(PLATFORM_PAGE_SLUGS).toContain(slug);
    }
    // `contact` stays: only Dang has a row, but it is a platform page, not a
    // trade page, and dropping it would hide Dang's.
    expect(PLATFORM_PAGE_SLUGS).toContain('contact');
  });

  it('carries no service page and no city page', () => {
    expect(PLATFORM_PAGE_SLUGS.join(' ')).not.toMatch(PEST_WORDS);
    // Location pages are TENANT facts from service_areas, in seo_meta, not here.
    expect(PLATFORM_PAGE_SLUGS.join(' ')).not.toMatch(/tyler|longview|lindale|bullard|jacksonville|nacogdoches|hawkins|holly-lake/i);
  });

  it('brackets the vertical service pages: platform, services, platform', () => {
    const pest = standardPageSlugs('pest');
    expect(pest.slice(0, 2)).toEqual(['home', 'about']);
    expect(pest.slice(2, 14)).toEqual(ADMIN_PRESETS.pest.servicePageSlugs);
    expect(pest).toHaveLength(PLATFORM_PAGE_SLUGS.length + 12);
  });

  it('no city page leaks into any slug list', () => {
    for (const v of ['pest', 'irrigation', null]) {
      expect(standardPageSlugs(v).join(' ')).not.toMatch(/-tx\b/);
    }
  });
});

describe('isServicePageSlug', () => {
  it("is true only for the vertical's own service pages", () => {
    expect(isServicePageSlug('pest', 'spider-control')).toBe(true);
    expect(isServicePageSlug('irrigation', 'sprinkler-systems')).toBe(true);
    // The defect this fixes: pls pages were tested against a pest list.
    expect(isServicePageSlug('pest', 'sprinkler-systems')).toBe(false);
    expect(isServicePageSlug('irrigation', 'spider-control')).toBe(false);
  });

  it('is false for platform pages and for NEUTRAL', () => {
    expect(isServicePageSlug('pest', 'home')).toBe(false);
    expect(isServicePageSlug(null, 'sprinkler-systems')).toBe(false);
    expect(isServicePageSlug(null, 'spider-control')).toBe(false);
  });

  it('is false for a legacy tenant-specific slug, which the custom-slug path handles', () => {
    // Dang carries `wasp-control` alongside `wasp-hornet-control`. A duplicate
    // belonging to one tenant is not a trade fact, so it is not a preset entry
    // and must still reach the sidebar as a custom page.
    expect(isServicePageSlug('pest', 'wasp-control')).toBe(false);
    expect(ADMIN_PRESETS.pest.servicePageSlugs).not.toContain('wasp-control');
  });
});

// ---------------------------------------------------------------------------
// ONE SOURCE. The point of the PR: no hardcoded pest slug array survives
// anywhere under src/ outside the preset file.
// ---------------------------------------------------------------------------

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const PRESET_REL = 'src/lib/adminVerticalPreset.ts';
const SKIP_DIRS = ['node_modules', '.next', 'dist', 'build', '__tests__'];

function walk(dir: string, out: string[]): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.indexOf(entry) !== -1) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry) && !/\.test\./.test(entry)) out.push(full);
  }
  return out;
}

// Three or more pest service slugs on ONE line is a hardcoded list. Two could be
// an incidental pair; one could be a route string.
//
// The optional leading slash matters: without it this misses a ROUTE array
// (`'/spider-control', '/ant-control', …`), which is the same list wearing a
// different hat. That form exists today in Ironwood's redirect map and in the
// public Navbar — outside this guard's roots, but it would be a silent blind
// spot the moment such an array appeared in the admin.
const PEST_SLUG = /'\/?(?:spider|roach|ant|mosquito|scorpion|bed-bug|flea-tick|rodent|wasp-hornet|termite|pest)-(?:control|inspections)'/g;

// SCOPED TO THE ADMIN, deliberately and narrowly. Pest slug lists also live in
// src/components/public, src/shells, src/data and src/components/ironwood —
// public-site and Ironwood surfaces with a different reader, covered by
// shared/lib/noUnverifiedClaims.test.ts and by S279's own phases. Scanning all
// of src/ would make this guard fail on work that is not in this PR's scope;
// claiming repo-wide coverage it does not have would be worse than either.
const SCAN_ROOTS = [join('src', 'components', 'admin'), join('src', 'hooks'), join('src', 'lib')];

describe('one source of truth for service slugs (admin surfaces)', () => {
  const FILES = SCAN_ROOTS.reduce<string[]>((acc, r) => walk(join(REPO_ROOT, r), acc), []);

  it('scans a plausible number of admin files', () => {
    expect(FILES.length).toBeGreaterThan(60);
  });

  it('no file outside the preset hardcodes a pest slug list', () => {
    const offenders: string[] = [];
    for (const file of FILES) {
      const rel = relative(REPO_ROOT, file).split(sep).join('/');
      if (rel === PRESET_REL) continue;
      const lines = readFileSync(file, 'utf8').split('\n');
      for (let n = 0; n < lines.length; n += 1) {
        const hits = lines[n].match(PEST_SLUG);
        if (hits && hits.length >= 3) offenders.push(`${rel}:${n + 1}  ${hits.length} slugs`);
      }
    }
    expect(offenders, `\n${offenders.join('\n')}\n`).toEqual([]);
  });

  it('the preset file itself still contains the pest list, so the guard is not vacuous', () => {
    const body = readFileSync(join(REPO_ROOT, PRESET_REL), 'utf8');
    const total = body.split('\n').reduce((n, l) => n + (l.match(PEST_SLUG) || []).length, 0);
    expect(total).toBeGreaterThanOrEqual(10);
  });
});

// ---------------------------------------------------------------------------
// S285 follow-up — the ContentTab sidebar race.
//
// page_content and the vertical lookup are two independent queries with no
// ordering between them. ContentTab's slug effect has deps [tenantId], so it
// runs ONCE; if it computed the standard/custom split at that moment and the
// vertical had not landed yet, the split was made against NEUTRAL — whose
// servicePageSlugs is [] — and never recomputed. Every service page ended up in
// BOTH groups once the vertical arrived, rendering twice in the sidebar.
//
// The fix is to derive, so these assert the invariant across the whole
// resolution sequence rather than at one instant.
// ---------------------------------------------------------------------------

describe('sidebar partition survives the vertical resolving late', () => {
  // pls's real page_content rows: five service pages plus the platform pages
  // it actually has.
  const PLS_ROWS = [
    'home', 'about', 'faq', 'quote', 'privacy', 'terms', 'accessibility', 'sms-terms',
    'sprinkler-systems', 'drainage', 'pump-systems', 'sod-dirt-work', 'artificial-turf',
  ];

  // Every state ContentTab passes through: NEUTRAL while unresolved, then the
  // real vertical.
  const SEQUENCE: Array<string | null> = [null, 'irrigation'];

  it('never puts a slug in both groups, at any point in the sequence', () => {
    for (const vertical of SEQUENCE) {
      const { standard, custom } = partitionPageSlugs(vertical, PLS_ROWS);
      const both = standard.filter((s) => custom.indexOf(s) !== -1);
      expect(both, `vertical=${String(vertical)} — rendered twice: ${both.join(', ')}`).toEqual([]);
    }
  });

  it('renders every stored slug exactly once, in every state', () => {
    for (const vertical of SEQUENCE) {
      const { standard, custom } = partitionPageSlugs(vertical, PLS_ROWS);
      for (const slug of PLS_ROWS) {
        const n = standard.filter((s) => s === slug).length + custom.filter((s) => s === slug).length;
        expect(n, `${slug} rendered ${n}x at vertical=${String(vertical)}`).toBe(1);
      }
    }
  });

  it('moves the service pages from custom to standard as the vertical lands', () => {
    const before = partitionPageSlugs(null, PLS_ROWS);
    const after = partitionPageSlugs('irrigation', PLS_ROWS);
    // Unresolved: no vertical, so the service pages are custom — correct, and
    // the reason a snapshot taken here is poison.
    expect(before.custom).toEqual(ADMIN_PRESETS.irrigation.servicePageSlugs);
    // Resolved: they are standard, and nothing is custom.
    expect(after.custom).toEqual([]);
    for (const slug of ADMIN_PRESETS.irrigation.servicePageSlugs) {
      expect(after.standard).toContain(slug);
    }
  });

  it('a legacy tenant-specific slug stays custom in both states', () => {
    const rows = [...PLS_ROWS, 'wasp-control'];
    for (const vertical of ['pest', 'irrigation', null]) {
      expect(partitionPageSlugs(vertical, rows).custom).toContain('wasp-control');
    }
  });

  // NOT VACUOUS. This models the shape main shipped — split once, at fetch time,
  // against the still-unresolved preset — and shows it produces exactly the
  // duplicates the assertions above forbid. Without this, those assertions
  // would pass against a derivation that could never fail and prove nothing.
  it('the OLD shape — snapshot the split while unresolved — does render duplicates', () => {
    const snapshotCustom = partitionPageSlugs(null, PLS_ROWS).custom;   // taken early, then frozen
    const laterStandard = partitionPageSlugs('irrigation', PLS_ROWS).standard;
    const both = laterStandard.filter((s) => snapshotCustom.indexOf(s) !== -1);
    expect(both).toEqual(ADMIN_PRESETS.irrigation.servicePageSlugs);
    expect(both).toHaveLength(5);
  });
});
