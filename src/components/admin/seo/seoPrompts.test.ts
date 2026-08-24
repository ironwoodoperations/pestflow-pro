import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  buildSeoMetadataPrompt, buildKeywordsPrompt, buildAioFallbackDescription,
} from './seoPrompts.ts';
import { buildBlogDraftSystemPrompt } from '../../../lib/ai/blogDraftPrompt.ts';

// S293 PR B — ASSEMBLED STRINGS, not helpers.
//
// A helper-only assertion passes while the string reaching the model still says
// "pest control company in East Texas". Settled practice since S283.

/** pls's REAL stored industry — 154 characters of free text. */
const PLS_INDUSTRY =
  'irrigation and sprinkler system installation and repair, yard drainage and french drains, '
  + 'lake and pond pump systems, sod and grading — East Texas';

/**
 * Page facts carry no trade of their own, so what a corpus says about a trade
 * came from the VERTICAL and nowhere else. The tenant's real page facts DO
 * carry trade words, and are asserted to pass through verbatim further down —
 * mixing the two into one fixture is what made the first draft of this file
 * assert that a tenant's own page title was a leak.
 */
const NEUTRAL_KEYWORDS = ['seasonal maintenance'];

const NEUTRAL_PAGE = {
  slug: 'home',
  pageTitle: 'Home',
  pageIntro: 'We look after homeowners in the area.',
  services: [] as string[],
};

/** Every assembled string a vertical produces, for one set of tenant facts. */
function allPrompts(vertical: string | null, city: string, businessName: string): string[] {
  const meta = buildSeoMetadataPrompt({ vertical, businessName, city, ...NEUTRAL_PAGE });
  return [
    meta.system,
    meta.user,
    buildKeywordsPrompt({ vertical, page: 'home', topic: 'watering', businessName, city }),
    buildAioFallbackDescription({ vertical, keywords: NEUTRAL_KEYWORDS, businessName, city }),
    buildBlogDraftSystemPrompt({ vertical, tone: 'informative', city }),
  ];
}

// Word boundaries throughout. /pest/ matches "PestFlow Pro" and /free/ matches
// "freeze" — both have already produced a false positive in this codebase.
const PEST_VOCAB = /\b(pest|termite|mosquito|rodent|bed ?bug|roach|spider|exterminator|ant control)\b/i;
const IRRIGATION_VOCAB = /\b(irrigation|sprinkler|drainage|french drain|sod|grading)\b/i;
const HARDCODED_REGION = /\bEast Texas\b|\bTyler\b|\bLongview\b|\bJacksonville\b/i;

describe('the corpus is real (the guards cannot pass vacuously)', () => {
  it('every builder returns a non-trivial string for every vertical', () => {
    for (const v of ['pest', 'irrigation', null]) {
      const corpus = allPrompts(v, 'Hawkins', 'Precision Lawn Systems LLC');
      expect(corpus.length).toBe(5);
      for (const s of corpus) {
        expect(typeof s, `${v}: not a string`).toBe('string');
      }
      // Floors per string, not an average: the system prompts and the keyword
      // prompt are substantial, the user block is a short fact list, and the
      // AIO description is one sentence. One floor for all three would be
      // satisfied by any of them alone.
      const [metaSystem, metaUser, keywords, aio, blog] = corpus;
      expect(metaSystem.length, `${v}: metadata system`).toBeGreaterThan(400);
      expect(metaUser.length, `${v}: metadata user`).toBeGreaterThan(40);
      expect(keywords.length, `${v}: keywords`).toBeGreaterThan(400);
      expect(blog.length, `${v}: blog system`).toBeGreaterThan(400);
      expect(aio.length, `${v}: aio description`).toBeGreaterThan(10);
    }
  });

  it('the matchers fire on the strings they exist to catch — EVERY alternative, not just one', () => {
    // One probe string satisfies an alternation through a single branch, so a
    // dead branch hides. Each term gets its own probe.
    const PROBES: Array<[string, RegExp, string[]]> = [
      ['pest', PEST_VOCAB, ['pest control', 'termite letter', 'mosquito misting', 'rodent exclusion',
        'bed bug heat', 'bedbug heat', 'roach gel', 'spider control', 'exterminator visit', 'ant control']],
      ['irrigation', IRRIGATION_VOCAB, ['irrigation audit', 'sprinkler repair', 'yard drainage',
        'french drain install', 'sod delivery', 'grading work']],
      ['region', HARDCODED_REGION, ['East Texas', 'Tyler TX', 'Longview', 'Jacksonville']],
    ];
    for (const [label, re, probes] of PROBES) {
      for (const probe of probes) {
        expect(re.test(probe), `${label} matcher is dead for "${probe}"`).toBe(true);
      }
    }
    // …and do NOT fire on the product name or on "freeze"
    expect(PEST_VOCAB.test('PestFlow Pro')).toBe(false);
    expect(/\bfree\b/i.test('cold weather can freeze pipes')).toBe(false);
  });

  it('the neutral page fixture is genuinely trade-free, so a hit means the vertical put it there', () => {
    const fixture = [NEUTRAL_PAGE.slug, NEUTRAL_PAGE.pageTitle, NEUTRAL_PAGE.pageIntro,
      ...NEUTRAL_PAGE.services, ...NEUTRAL_KEYWORDS].join(' ');
    expect(fixture).not.toMatch(PEST_VOCAB);
    expect(fixture).not.toMatch(IRRIGATION_VOCAB);
    expect(fixture).not.toMatch(HARDCODED_REGION);
  });
});

describe('an UNRECORDED vertical names no trade and no region', () => {
  const corpus = allPrompts(null, '', 'Vita Glow Wellness');

  it('names NO trade — not pest, not irrigation', () => {
    for (const s of corpus) {
      expect(s, `pest vocabulary leaked: ${s.slice(0, 120)}`).not.toMatch(PEST_VOCAB);
      expect(s, `irrigation vocabulary leaked: ${s.slice(0, 120)}`).not.toMatch(IRRIGATION_VOCAB);
    }
  });

  it('names NO generic trade stand-in either — PR A\'s rule', () => {
    for (const s of corpus) {
      expect(s).not.toMatch(/home services|general services|service industry/i);
    }
  });

  it('names NO region the tenant did not supply', () => {
    for (const s of corpus) {
      expect(s, `region leaked: ${s.slice(0, 120)}`).not.toMatch(HARDCODED_REGION);
    }
  });

  it('the blog prompt explicitly forbids naming a city when none is known', () => {
    expect(buildBlogDraftSystemPrompt({ vertical: null, tone: 'informative', city: '' }))
      .toContain('Do not name any city, region or service area');
  });

  it('the keywords example carries no guessed city or trade', () => {
    const p = buildKeywordsPrompt({ vertical: null, page: 'home', topic: 't', businessName: '', city: '' });
    expect(p).toContain('<a keyword for this page>');
    expect(p).not.toMatch(/spider control tyler tx/i);
  });

  it('the AIO description falls back to the keywords ALONE, not a trade', () => {
    expect(buildAioFallbackDescription({ vertical: null, keywords: ['facials', 'injectables'], businessName: '', city: '' }))
      .toBe('facials, injectables.');
  });

  it('the metadata system prompt drops the city rule instead of demanding a city it has none of', () => {
    const { system, user } = buildSeoMetadataPrompt({ vertical: null, businessName: 'Vita Glow Wellness', city: '', ...NEUTRAL_PAGE });
    expect(system).toContain('includes the primary keyword');
    expect(system).not.toContain('includes the city');
    expect(user).not.toMatch(/City:/);
    expect(user).not.toMatch(/Unknown City/);
  });
});

describe('a recorded vertical names its OWN trade', () => {
  it('pest gets pest vocabulary and no irrigation', () => {
    const corpus = allPrompts('pest', 'Tyler', 'Ironclad Pest Solutions');
    expect(corpus.join(' | ')).toMatch(/\bpest control\b/i);
    for (const s of corpus) expect(s).not.toMatch(/\b(sprinkler|french drain|irrigation)\b/i);
  });

  it('irrigation gets irrigation vocabulary and NO pest', () => {
    const corpus = allPrompts('irrigation', 'Hawkins', 'Precision Lawn Systems LLC');
    expect(corpus.join(' | ')).toMatch(/\birrigation\b/i);
    for (const s of corpus) expect(s, 'pest leaked into irrigation').not.toMatch(PEST_VOCAB);
  });

  it('the tenant\'s own city is used, and no other', () => {
    const corpus = allPrompts('irrigation', 'Hawkins', 'PLS');
    expect(corpus.join(' | ')).toContain('Hawkins');
    for (const s of corpus) expect(s).not.toMatch(HARDCODED_REGION);
  });

  it('the AIO description names the trade only when it is recorded', () => {
    expect(buildAioFallbackDescription({ vertical: 'irrigation', keywords: ['sprinkler repair'], businessName: 'PLS', city: 'Hawkins' }))
      .toBe('sprinkler repair — Irrigation services from PLS in Hawkins.');
    expect(buildAioFallbackDescription({ vertical: null, keywords: ['sprinkler repair'], businessName: 'PLS', city: 'Hawkins' }))
      .toBe('sprinkler repair — from PLS in Hawkins.');
  });
});

describe('tenant facts pass through verbatim — they are not the thing being suppressed', () => {
  // The rule bans INVENTION, not the tenant's own words. An irrigation tenant's
  // page about sprinklers must still say "sprinkler", whatever their vertical.
  it('the page the operator is on reaches the prompt as written', () => {
    const { user } = buildSeoMetadataPrompt({
      vertical: null, businessName: 'Precision Lawn Systems LLC', city: 'Hawkins',
      slug: 'sprinkler-systems', pageTitle: 'Sprinkler Systems',
      pageIntro: 'We install and repair sprinkler systems.',
      services: ['sprinkler-systems', 'drainage'],
    });
    expect(user).toContain('Page: sprinkler-systems');
    expect(user).toContain('Page title: Sprinkler Systems');
    expect(user).toContain('Services offered: sprinkler-systems, drainage');
    expect(user).toContain('City: Hawkins');
  });

  it('a tenant with no service pages gets no "Services offered" line at all — not a guessed one', () => {
    const { user } = buildSeoMetadataPrompt({
      vertical: 'pest', businessName: 'Ironclad Pest Solutions', city: 'Tyler',
      slug: 'home', pageTitle: 'Home', pageIntro: '', services: [],
    });
    expect(user).not.toMatch(/Services offered/);
  });
});

describe('pls\'s free-text industry never reaches the model', () => {
  // The 154-char service description in settings.business_info.industry is what
  // makes `industry` unusable as a key. No builder takes it, and no builder's
  // output may contain it.
  it('no builder accepts or emits the industry string', () => {
    for (const v of ['pest', 'irrigation', null]) {
      for (const s of allPrompts(v, 'Hawkins', 'Precision Lawn Systems LLC')) {
        expect(s, 'the free-text industry reached the prompt').not.toContain(PLS_INDUSTRY);
        expect(s).not.toContain('lake and pond pump systems');
      }
    }
  });

  it('the industry string itself is the 154-char one, so this test is about the real value', () => {
    expect(PLS_INDUSTRY.length).toBeGreaterThan(140);
    expect(PLS_INDUSTRY).toContain('East Texas');
  });
});

// ── Whole-file guards ───────────────────────────────────────────────────────
//
// Scoped to the FILES, not to one builder's output, so a NEW prompt added
// beside these cannot reintroduce what was just removed. The corpus assertions
// above cannot see a builder nobody calls.
describe('the prompt modules instruct no claim, anywhere in the file', () => {
  // Resolved from this file, not from process.cwd(): the guard must read the
  // same modules the tests above import, wherever the runner was started.
  const FILES = [
    new URL('./seoPrompts.ts', import.meta.url),
    new URL('../../../lib/ai/blogDraftPrompt.ts', import.meta.url),
  ];
  const label = (f: URL) => f.pathname.split('/').pop() as string;

  /**
   * A line that FORBIDS a guarantee is textually identical to one that promises
   * it, so the ban list is excised by explicit markers rather than sniffed for
   * with a "does it look like a negation" heuristic — a heuristic wide enough to
   * spare "- free offers, discounts, or prices" is wide enough to spare
   * "Mention our free inspection without delay". The ban list is then asserted
   * POSITIVELY, below.
   */
  function splitBanList(body: string): { bans: string; rest: string } {
    const parts = body.split(/^[ \t]*\/\/ BAN-LIST START.*$/m);
    if (parts.length !== 2) return { bans: '', rest: body };
    const after = parts[1].split(/^[ \t]*\/\/ BAN-LIST END[ \t]*$/m);
    if (after.length !== 2) return { bans: '', rest: body };
    return { bans: after[0], rest: parts[0] + after[1] };
  }

  /**
   * Comments out, code in. An apostrophe in prose — "the tenant's city" — is an
   * unpaired quote, and it shifts every literal boundary after it: the probe at
   * the bottom of this file came back clean against a planted offender until
   * this was added. Comments in these files sit on their own lines.
   */
  function stripComments(body: string): string {
    return body
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((line) => !/^[ \t]*(\/\/|\*)/.test(line))
      .join('\n');
  }

  /** Every quoted string literal in the CODE — what could reach a model. */
  function stringLiterals(source: string): string[] {
    const body = stripComments(source);
    const out: string[] = [];
    const re = /'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)"|`([^`\\]*(?:\\.[^`\\]*)*)`/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) out.push(m[1] ?? m[2] ?? m[3] ?? '');
    return out;
  }

  const CLAIM_PATTERNS: Array<{ name: string; re: RegExp }> = [
    { name: 'guarantee', re: /\bguarantee(d|s)?\b|\bwarrant(y|ies)\b/i },
    { name: 'free offer', re: /\bfree\b/i },
    { name: 'capacity promise', re: /\bfast\b|\bsame[- ]day\b|\b24\/7\b|\bimmediate(ly)?\b/i },
    { name: 'licence claim', re: /\blicen[sc]ed?\b|\binsured\b|\bEPA[- ]approved\b|\bcertified\b/i },
    { name: 'weather event', re: /\brecent storms?\b|\bafter the storm\b/i },
  ];

  it('reads the files it claims to scan — the RIGHT ones, byte-identified', () => {
    // Paths resolve; that is not the same as resolving to the module under
    // test. Each file is identified by an export only it has, so a guard
    // silently pointed at the wrong file fails instead of passing.
    const IDENTITY: Array<[URL, string]> = [
      [FILES[0], 'export function buildAioFallbackDescription'],
      [FILES[1], 'export function buildBlogDraftSystemPrompt'],
    ];
    for (const [f, marker] of IDENTITY) {
      const body = readFileSync(f, 'utf8');
      expect(body.length, `${label(f)} is empty`).toBeGreaterThan(500);
      expect(body, `${label(f)} is not the module this guard is for`).toContain(marker);
    }
    // …and they are two DIFFERENT files, not the same one read twice.
    expect(readFileSync(FILES[0], 'utf8')).not.toBe(readFileSync(FILES[1], 'utf8'));
  });

  it('each file has exactly one MARKED ban region, and excising it leaves the prompts behind', () => {
    for (const f of FILES) {
      const body = readFileSync(f, 'utf8');
      expect((body.match(/\/\/ BAN-LIST START/g) || []).length, `${label(f)}: not exactly one ban region`).toBe(1);
      const { bans, rest } = splitBanList(body);
      expect(bans, `${label(f)}: markers did not resolve`).not.toBe('');
      expect(bans).toMatch(/DO NOT INVENT ANYTHING/);
      // The excision is narrow: the prompt instructions still live in `rest`.
      expect(rest).toContain('export function');
      expect(rest.length).toBeGreaterThan(bans.length);
      expect(stringLiterals(rest).length, `${label(f)}: excision swallowed the file`).toBeGreaterThan(10);
    }
  });

  for (const f of FILES) {
    for (const p of CLAIM_PATTERNS) {
      it(`${label(f)}: no string OUTSIDE the ban list mentions a ${p.name}`, () => {
        const offenders = stringLiterals(splitBanList(readFileSync(f, 'utf8')).rest)
          .filter((s) => p.re.test(s));
        expect(offenders, `${p.name} instructed in: ${JSON.stringify(offenders)}`).toEqual([]);
      });
    }
  }

  it('the ban lines are actually present — the modules forbid, they do not merely omit', () => {
    for (const f of FILES) {
      const { bans } = splitBanList(readFileSync(f, 'utf8'));
      expect(bans, `${label(f)} has no ban list`).toMatch(/guarantees, warranties/i);
      expect(bans).toMatch(/free offers, discounts/i);
      expect(bans).toMatch(/certifications, licences/i);
      expect(bans).toMatch(/years in business/i);
    }
  });

  it('comment stripping removes prose and keeps code — it does not gut the file', () => {
    const body = readFileSync(FILES[0], 'utf8');
    const stripped = stripComments(body);
    // The prose apostrophe that broke the scanner is gone…
    expect(body).toMatch(/tenant's/);
    expect(stripped).not.toMatch(/tenant's/);
    // …and the prompt lines are not.
    expect(stripped).toContain('DO NOT INVENT ANYTHING');
    expect(stripped).toContain('export function buildSeoMetadataPrompt');
    expect(stripped.length).toBeGreaterThan(body.length / 3);
  });

  it('the string-literal scanner finds literals (it is not returning an empty list)', () => {
    const found = stringLiterals(readFileSync(FILES[0], 'utf8'));
    expect(found.length).toBeGreaterThan(20);
    expect(found.some((s) => s.includes('DO NOT INVENT ANYTHING'))).toBe(true);
  });

  it('the claim scan sees an offending line placed OUTSIDE the markers', () => {
    // The excision must not be so wide that a real instruction slips past it.
    const synthetic = readFileSync(FILES[0], 'utf8') + "\nconst leak = 'Offer a free inspection, licensed and insured, same-day.';\n";
    const rest = splitBanList(synthetic).rest;
    const hits = CLAIM_PATTERNS.filter((p) => stringLiterals(rest).some((s) => p.re.test(s))).map((p) => p.name);
    expect(hits).toEqual(['free offer', 'capacity promise', 'licence claim']);
  });
});
