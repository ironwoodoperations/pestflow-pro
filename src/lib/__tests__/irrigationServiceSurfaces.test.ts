import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { ADMIN_PRESETS } from '../adminVerticalPreset.ts';
import { IRRIGATION_CONTENT_MAP } from '../../shells/_shared/irrigationContent.ts';
import { VERTICAL_SEED } from '../../../supabase/functions/_shared/provisioningSeed.ts';

// S300 — the guard that would have caught this whole class.
//
// The irrigation service list is duplicated across five surfaces that nothing
// forced to agree: the admin preset, the provisioning seed, the backfill
// script, the home-page tile config, and the content map that the ROUTER's slug
// set is derived from. A slug changed in four of them and missed in the fifth
// produces a home-page tile pointing at a 404, or a tile pointing at an image
// file that is not there — which is exactly what a discontinued service does.
//
// Asserted against the FILESYSTEM and the real exported data, not against a
// second copy of the list written here: a fixture list would just become a
// sixth surface to forget.

const ROOT = new URL('../../../', import.meta.url);
const readRepo = (rel: string) => readFileSync(new URL(rel, ROOT), 'utf8');

/**
 * The home-page tile config, parsed out of the route file. It cannot be
 * imported — page.tsx pulls in the whole Next server graph — so it is read as
 * text, the way the prompt-module guards read theirs.
 */
function plsTiles(): { slug: string; image: string }[] {
  const src = readRepo('app/tenant/[slug]/page.tsx');
  // \b on BOTH sides of the anchor. Without the trailing boundary this matched
  // MODERN_PRO_TENANT_RENAMED too, so renaming the config away left the parse
  // quietly working against a stale block — the anchor matched a longer
  // identifier. That over-match is the defect this whole file exists to catch,
  // and the first draft of it shipped here.
  const block = src.match(/\bMODERN_PRO_TENANT\b[\s\S]*?pls:\s*\{\s*tiles:\s*\[([\s\S]*?)\]/);
  if (!block) throw new Error('pls tile block not found in app/tenant/[slug]/page.tsx');
  return [...block[1].matchAll(/\{\s*slug:\s*'([^']+)',\s*image:\s*'([^']+)'\s*\}/g)]
    .map((m) => ({ slug: m[1], image: m[2] }));
}

/** The backfill script's IRRIGATION array — a script, so read, not imported. */
function backfillIrrigationSlugs(): string[] {
  const src = readRepo('scripts/generate-authority-backfill.ts');
  const m = src.match(/const IRRIGATION = \[([^\]]*)\]/);
  if (!m) throw new Error('IRRIGATION array not found in scripts/generate-authority-backfill.ts');
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

/** Comments out. A comment EXPLAINING the removal is not a surviving reference. */
function stripComments(body: string): string {
  return body
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^[ \t]*(\/\/|\*)/.test(line))
    .join('\n');
}

const PRESET_SLUGS = ADMIN_PRESETS.irrigation.servicePageSlugs;
const SEED_SLUGS = VERTICAL_SEED.irrigation.servicePages.map((p: { slug: string }) => p.slug);

describe('the corpus is real (this guard cannot pass vacuously)', () => {
  it('every surface parsed to a NON-EMPTY list of the expected size', () => {
    // Without these, a regex that silently stops matching turns every
    // assertion below into a loop over nothing, and the file passes green.
    expect(plsTiles(), 'tile block parsed empty').toHaveLength(5);
    expect(PRESET_SLUGS, 'admin preset').toHaveLength(5);
    expect(SEED_SLUGS, 'provisioning seed').toHaveLength(5);
    expect(backfillIrrigationSlugs(), 'backfill script').toHaveLength(5);
    expect(Object.keys(IRRIGATION_CONTENT_MAP).length).toBeGreaterThanOrEqual(4);
  });

  it('the image-existence check can actually fail', () => {
    // The mutation this guard exists for, run inline: a tile pointing at a file
    // that is not on disk. If this passes, the real assertion below proves
    // nothing about the real tiles.
    expect(existsSync(new URL('public/images/pls/artificial-turf.jpg', ROOT))).toBe(true);
    expect(existsSync(new URL('public/images/pls/no-such-file.jpg', ROOT))).toBe(false);
  });
});

describe('every home tile resolves to a real image file', () => {
  for (const tile of plsTiles()) {
    it(`${tile.slug}: ${tile.image} is on disk`, () => {
      expect(tile.image.startsWith('/images/pls/'), `${tile.slug} points outside public/images/pls`).toBe(true);
      const onDisk = new URL(`public${tile.image}`, ROOT);
      expect(existsSync(onDisk), `MISSING FILE: public${tile.image}`).toBe(true);
    });

    it(`${tile.slug}: the image basename matches the slug`, () => {
      // A slug swapped without its image (or the reverse) is the exact defect
      // S300 fixes — the tile kept the old photo path after the service changed.
      expect(tile.image).toBe(`/images/pls/${tile.slug}.jpg`);
    });
  }
});

describe('the five surfaces name the SAME five services', () => {
  it('preset, seed, backfill and tiles agree exactly', () => {
    const sorted = (a: string[]) => [...a].sort();
    expect(sorted(SEED_SLUGS), 'provisioning seed disagrees with the admin preset').toEqual(sorted(PRESET_SLUGS));
    expect(sorted(backfillIrrigationSlugs()), 'backfill script disagrees').toEqual(sorted(PRESET_SLUGS));
    expect(sorted(plsTiles().map((t) => t.slug)), 'home tiles disagree').toEqual(sorted(PRESET_SLUGS));
  });

  it('names artificial-turf, and no surface still names retaining-walls', () => {
    for (const [label, slugs] of [
      ['admin preset', PRESET_SLUGS], ['provisioning seed', SEED_SLUGS],
      ['backfill script', backfillIrrigationSlugs()], ['home tiles', plsTiles().map((t) => t.slug)],
    ] as Array<[string, string[]]>) {
      expect(slugs, `${label} lost artificial-turf`).toContain('artificial-turf');
      expect(slugs, `${label} still names the discontinued service`).not.toContain('retaining-walls');
    }
  });

  it('no CODE literal in the swapped surfaces still says retaining-walls', () => {
    // Comments stripped: this file's own explanation of the removal, and the
    // historical note in ContentPageForm describing the S285 bug as it was, are
    // records — not surviving references. A guard tripping on its own comment
    // has happened here before.
    const FILES = [
      'src/lib/adminVerticalPreset.ts',
      'supabase/functions/_shared/provisioningSeed.ts',
      'scripts/generate-authority-backfill.ts',
      'app/tenant/[slug]/page.tsx',
    ];
    for (const f of FILES) {
      const code = stripComments(readRepo(f));
      expect(code, `${f} still carries a retaining-walls literal`).not.toMatch(/retaining[- ]walls?/i);
      // …and the file really was read (not an empty string passing trivially).
      expect(code.length, `${f} read empty`).toBeGreaterThan(200);
    }
  });
});

// ── The one KNOWN, DELIBERATE gap — STATE 2 of 3 ────────────────────────────
//
// Named in code rather than left to be rediscovered, and written so it RETIRES
// ITSELF: each state's assertions fail the moment the next one is reached.
//
//   state 1 (S300)  map has retaining-walls, no artificial-turf   ← retired
//   state 2 (S302)  map has NEITHER — the old page is gone, the   ← HERE
//                   replacement copy is still pending owner facts
//   state 3         map has artificial-turf → both assertions
//                   below fail and this whole block gets deleted
describe('KNOWN OPEN ITEM — the turf content entry is still blocked on owner facts', () => {
  it('the map has retired retaining-walls and does not yet have artificial-turf', () => {
    expect(
      Object.keys(IRRIGATION_CONTENT_MAP),
      'retaining-walls is back in the map — S302 removed it; the service is discontinued',
    ).not.toContain('retaining-walls');
    expect(
      Object.keys(IRRIGATION_CONTENT_MAP),
      'artificial-turf entry now EXISTS — delete this whole describe block and the '
      + 'PENDING_ROUTE exception below; the swap is complete',
    ).not.toContain('artificial-turf');
  });

  it('artificial-turf is the ONLY tile whose route does not resolve yet', () => {
    // The router's active slug set is derived from the content map
    // (app/tenant/[slug]/_lib/serviceData.ts: IRRIGATION_SERVICE_SLUGS =
    // new Set(Object.keys(IRRIGATION_CONTENT_MAP))), so a tile slug with no map
    // entry 404s. The tile itself is filtered against page_content, so it does
    // not render until the DB row exists — which is why the DB row must land
    // AFTER the content entry, never before.
    const PENDING_ROUTE = ['artificial-turf'];
    expect(PENDING_ROUTE).toHaveLength(1);
    const unresolved = plsTiles()
      .map((t) => t.slug)
      .filter((s) => !Object.prototype.hasOwnProperty.call(IRRIGATION_CONTENT_MAP, s));
    expect(unresolved, 'a tile other than the known-pending one has no content entry').toEqual(PENDING_ROUTE);
  });

  it('the four services that DO resolve are the ones with copy', () => {
    // A floor, so removing an entry cannot quietly shrink the routable set to
    // nothing while the assertions above still pass.
    expect(Object.keys(IRRIGATION_CONTENT_MAP).sort()).toEqual(
      ['drainage', 'pump-systems', 'sod-dirt-work', 'sprinkler-systems'],
    );
  });
});
