// S346 Part B — candidate paths, slug mapping and prompts, per vertical.
//
// NOT named index.test.ts on purpose: vitest.config.ts excludes
// `supabase/functions/*/index.test.ts`, so that name would be silently skipped.

import { describe, it, expect } from 'vitest';
import { candidatePathsFor, pathToSlug, PLATFORM_PATHS } from './mapContent';
import { extractionPromptFor, siteAnalysisPromptFor, tradeNounForPrompt } from './prompts';
import { CATALOG_SLUGS } from '../../../shared/lib/serviceCatalog';

const LAWN_SELECTED_BY_THE_PICKER = [
  'lawn-fertilization', 'weed-control', 'lawn-aeration',
  'mowing-maintenance', 'seasonal-cleanup', 'landscape-design', 'hardscape-stonework',
];

describe('candidate paths come from the vertical catalog', () => {
  it('LAWN — covers every catalog slug, selected or not', () => {
    const paths = candidatePathsFor('lawn');
    for (const slug of CATALOG_SLUGS.lawn) expect(paths).toContain('/' + slug);
    expect(CATALOG_SLUGS.lawn).toHaveLength(17);
  });

  it('LAWN — the seven the picker selected AND the ten it did not', () => {
    const paths = candidatePathsFor('lawn');
    for (const slug of LAWN_SELECTED_BY_THE_PICKER) expect(paths).toContain('/' + slug);
    const notSelected = CATALOG_SLUGS.lawn.filter(s => !LAWN_SELECTED_BY_THE_PICKER.includes(s));
    expect(notSelected).toHaveLength(10);
    // we scrape what EXISTS; the picker decides what is PROVISIONED. Not the same question.
    for (const slug of notSelected) expect(paths).toContain('/' + slug);
  });

  it('LAWN — still fetches the platform pages', () => {
    const paths = candidatePathsFor('lawn');
    for (const p of PLATFORM_PATHS) expect(paths).toContain(p);
  });

  it('PEST DOES NOT REGRESS — same path SET as the pre-S346 hardcoded list', () => {
    const legacy = [
      '/', '/about', '/about-us', '/services', '/pest-control',
      '/termite-control', '/termite-inspections', '/roach-control',
      '/ant-control', '/mosquito-control', '/bed-bug-control',
      '/flea-tick-control', '/rodent-control', '/scorpion-control',
      '/spider-control', '/wasp-hornet-control', '/contact', '/faq',
    ];
    // order differs (paths are fetched in parallel); membership must not
    expect([...candidatePathsFor('pest')].sort()).toEqual([...legacy].sort());
    for (const slug of CATALOG_SLUGS.pest) expect(candidatePathsFor('pest')).toContain('/' + slug);
  });

  it('IRRIGATION — all five, and no pest paths bleed in', () => {
    const paths = candidatePathsFor('irrigation');
    for (const slug of CATALOG_SLUGS.irrigation) expect(paths).toContain('/' + slug);
    expect(paths).not.toContain('/termite-control');
  });

  it('UNKNOWN or absent falls back to the historical list — never to nothing', () => {
    for (const v of [null, undefined, '', 'medical-aesthetics']) {
      const paths = candidatePathsFor(v as string | null | undefined);
      expect(paths.length).toBeGreaterThan(0);
      expect(paths).toContain('/');
      expect(paths).toContain('/termite-control');
    }
  });

  it('no duplicate paths when a catalog slug collides with a platform page', () => {
    for (const v of ['pest', 'lawn', 'irrigation']) {
      const paths = candidatePathsFor(v);
      expect(new Set(paths).size).toBe(paths.length);
    }
  });
});

describe('slug mapping is catalog-driven', () => {
  it('LAWN — maps its own services', () => {
    expect(pathToSlug('/hardscape-stonework', 'lawn')).toBe('hardscape-stonework');
    expect(pathToSlug('/mowing-maintenance', 'lawn')).toBe('mowing-maintenance');
  });

  it('LAWN — a pest page on a lawn site maps to NOTHING, not to a pest slug', () => {
    expect(pathToSlug('/termite-control', 'lawn')).toBeNull();
    expect(pathToSlug('/roach-control', 'lawn')).toBeNull();
  });

  it('LAWN — /services maps to nothing rather than to pest-control', () => {
    // the pest catalog has a general 'pest-control' page; lawn has no equivalent,
    // and filing their services index under a pest slug would be a fabrication
    expect(pathToSlug('/services', 'lawn')).toBeNull();
  });

  it('LAWN — platform pages still map', () => {
    expect(pathToSlug('/', 'lawn')).toBe('home');
    expect(pathToSlug('/about-us', 'lawn')).toBe('about');
    expect(pathToSlug('/contact', 'lawn')).toBe('contact');
    expect(pathToSlug('/faq', 'lawn')).toBe('faq');
  });

  it('PEST DOES NOT REGRESS — every pre-S346 mapping still holds', () => {
    const cases: Array<[string, string]> = [
      ['/', 'home'], ['/home', 'home'],
      ['/termite-inspections', 'termite-inspections'], ['/termite-control', 'termite-control'],
      ['/roach-control', 'roach-control'], ['/ant-control', 'ant-control'],
      ['/mosquito-control', 'mosquito-control'], ['/bed-bug-control', 'bed-bug-control'],
      ['/flea-tick-control', 'flea-tick-control'], ['/rodent-control', 'rodent-control'],
      ['/scorpion-control', 'scorpion-control'], ['/spider-control', 'spider-control'],
      ['/wasp-hornet-control', 'wasp-hornet-control'], ['/services', 'pest-control'],
      ['/pest-control', 'pest-control'], ['/about', 'about'],
      ['/contact', 'contact'], ['/faq', 'faq'],
    ];
    for (const [path, slug] of cases) {
      expect(pathToSlug(path, 'pest'), path).toBe(slug);
      expect(pathToSlug(path), path + ' (no vertical)').toBe(slug); // legacy call site
    }
  });

  it('every pest catalog slug is reachable from its own path', () => {
    for (const slug of CATALOG_SLUGS.pest) expect(pathToSlug('/' + slug, 'pest')).toBe(slug);
  });

  it('an unmapped path is null, never a guess', () => {
    expect(pathToSlug('/careers', 'lawn')).toBeNull();
    expect(pathToSlug('/blog/2024/spring', 'pest')).toBeNull();
  });
});

describe('the prompts name the right trade', () => {
  it('trade nouns are READ from VERTICAL_COPY, not invented', () => {
    expect(tradeNounForPrompt('pest')).toBe('pest control');
    expect(tradeNounForPrompt('irrigation')).toBe('irrigation');
    expect(tradeNounForPrompt('lawn')).toBe('lawn care');
  });

  it('unknown names NO trade rather than the wrong one', () => {
    expect(tradeNounForPrompt(null)).toBe('home services');
    expect(tradeNounForPrompt('medical-aesthetics')).toBe('home services');
  });

  it('LAWN — neither prompt says pest control', () => {
    const forbidden = ['pest', 'control'].join(' ');
    expect(extractionPromptFor('lawn')).not.toContain(forbidden);
    expect(siteAnalysisPromptFor('lawn')).not.toContain(forbidden);
    expect(extractionPromptFor('lawn')).toContain('lawn care');
    expect(siteAnalysisPromptFor('lawn')).toContain('lawn care');
  });

  it('PEST — the wording it always had', () => {
    expect(extractionPromptFor('pest')).toContain('this pest control website content');
    expect(siteAnalysisPromptFor('pest')).toContain('a pest control SaaS platform');
  });

  it('the analysis prompt kept its substance, not just its first line', () => {
    const p = siteAnalysisPromptFor('lawn');
    for (const shell of ['modern-pro', 'clean-friendly', 'bold-local', 'rustic-rugged']) {
      expect(p).toContain(shell);
    }
    expect(p).toContain('#1e3a5f');   // the documented colour fallbacks
    expect(p).toContain('#f59e0b');
    expect(p).toContain('Shell selection rules');
  });

  it('THE ANTI-FABRICATION RULE survives generalisation', () => {
    // this prompt writes to page_content on a public site; a generalised prompt
    // is exactly where invented service copy would come back
    for (const v of ['pest', 'lawn', 'irrigation', null]) {
      const p = extractionPromptFor(v);
      expect(p).toContain('Use null for any field not found');
      expect(p).toMatch(/Do not infer, guess or generalise/);
    }
  });
});
