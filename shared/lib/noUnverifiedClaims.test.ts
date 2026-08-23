import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// PR E — a REPO-WIDE guard, replacing the two narrow ones.
//
// PRs B, C and D each found this same class of literal in a place the previous
// guard could not see, because the guards were shaped wrong: they scanned the
// preset registry and one component family, while the literals are scattered
// across ordinary components. This one walks every .ts/.tsx under app/ and src/.
//
// Two classes, both failures of rule (b) — never fabricate:
//
//   CAPACITY / TERMS — a promise about how fast a business responds or on what
//   contractual terms. Not a trade fact, and no tenant has verified it.
//
//   FABRICATED STATISTIC — a claim about a customer base that does not exist
//   ("most customers…", "thousands of properties…", "within 24 hours").
//
// A claim about a specific BUSINESS does not move to the DB and does not get a
// vertical-neutral rewrite: there is no tenant fact behind it. It is deleted.
//
// SCOPE: app/tenant/** and src/shells/** — the tenant public render path, and
// nothing else. Structural, not an allowlist: there are no named exceptions to
// argue about, and nothing to quietly grow. Admin and Ironwood copy is a
// different vocabulary written for a different reader (Scott, or a client
// looking at their own dashboard) and is NOT covered here — that is Phase 2
// scope per S279, with its own preset file and its own guard.
//
// Deliberately NOT a pattern: /within \d+ hours/. It cannot tell treatment
// efficacy ("effective within 24 hours" — a trade fact) from business turnaround
// ("report delivered within 24 hours" — a tenant fact), and a guard that cries
// wolf is a guard that gets allowlisted into uselessness.

const CAPACITY_OR_TERMS = /same-day|next-day|24\/7|no contracts/i;
const FABRICATED_STAT = /most customers|thousands of (properties|customers|homes)|\d{1,3},\d{3}\+? (properties|customers)/i;

// PR F closes the gap that hid four live tiles from PR E's scan. FABRICATED_STAT
// needs the number and its noun ADJACENT ("4,200+ properties"), but a stat tile
// splits them across two object fields on one line:
//
//   { num: '4,200+', label: 'Customers' }
//   { num: '15+',    label: 'Years on the job' }
//
// so nothing matched, and BoldLocalAboutPage kept rendering invented customer
// and treatment counts through the whole sweep. This pattern matches the SHAPE
// instead: a quoted count-like literal in one field, any label in the next.
//
// The number must LOOK like a statistic: a thousands separator (4,200+), a
// trailing plus (15+, 500+), or a percentage (98%). A bare small integer is
// excluded on purpose — `{ num: '01', label: 'Step one' }` is an ordinal, not a
// claim, and a pattern that flags it is the kind that gets suppressed the first
// time it cries wolf. Every literal PR F removes carries one of the three
// markers, so nothing real is lost by requiring them.
//
// It does NOT judge the label: a label is just a word, and judging it is what
// would make this unreliable. A genuine tenant figure lives in settings.about
// and never appears as a source literal, so a literal of this shape inside a
// component is hardcoded by definition.
const HARDCODED_STAT_PAIR = /['"`]\s*(?:\d{1,3}(?:,\d{3})+\+?|\d+\s*[+%])\s*['"`]\s*,\s*label\s*:/i;

const CLASSES = [
  { name: 'capacity / terms promise', pattern: CAPACITY_OR_TERMS },
  { name: 'fabricated statistic', pattern: FABRICATED_STAT },
  { name: 'hardcoded stat tile (number/label field pair)', pattern: HARDCODED_STAT_PAIR },
] as const;

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCAN_ROOTS = [join('app', 'tenant'), join('src', 'shells')];
const SKIP_DIRS = ['node_modules', '.next', 'dist', 'build', 'public', '.git'];

function walk(dir: string, out: string[]): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.indexOf(entry) !== -1) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (/\.tsx?$/.test(entry) && !/\.test\./.test(entry) && !/\.d\.ts$/.test(entry)) {
      // *.test.* files are excluded wholesale: several of them assert these
      // strings' ABSENCE and must quote them to do it.
      out.push(full);
    }
  }
  return out;
}

// String-aware comment stripper. A naive line-comment strip would also eat
// everything after the "//" in a URL literal, hiding any claim later on that
// line — the exact kind of blind spot this PR exists to close. Tracks quote
// state so only real comments are removed.
export function stripComments(src: string): string {
  let out = '';
  let i = 0;
  let quote: string | null = null;

  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];

    if (quote) {
      if (ch === '\\') { out += ch + (next || ''); i += 2; continue; }
      if (ch === quote) quote = null;
      out += ch;
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; out += ch; i += 1; continue; }

    if (ch === '/' && next === '/') {
      while (i < src.length && src[i] !== '\n') i += 1;
      continue;
    }

    if (ch === '/' && next === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }

    out += ch;
    i += 1;
  }

  return out;
}

const FILES: string[] = SCAN_ROOTS.reduce<string[]>(
  (acc, root) => walk(join(REPO_ROOT, root), acc),
  [],
);

describe('repo-wide guard: no unverified claims in source', () => {
  it('finds a plausible number of files to scan', () => {
    expect(FILES.length).toBeGreaterThan(100);
  });

  for (const { name, pattern } of CLASSES) {
    it(`no file contains a ${name}`, () => {
      const offenders: string[] = [];

      for (const file of FILES) {
        const body = stripComments(readFileSync(file, 'utf8'));
        const lines = body.split('\n');
        for (let n = 0; n < lines.length; n += 1) {
          if (pattern.test(lines[n])) {
            offenders.push(`${relative(REPO_ROOT, file).split(sep).join('/')}:${n + 1}  ${lines[n].trim().slice(0, 160)}`);
          }
        }
      }

      expect(offenders, `\n${offenders.join('\n')}\n`).toEqual([]);
    });
  }
});

describe('the guard is not vacuous', () => {
  const CAUGHT = [
    'Same-day and next-day appointments available. No contracts required.',
    'Same-day appointments available.',
    'We offer same-day and next-day appointments for Austin residents.',
    'Call us today for same-day scheduling.',
    '24/7 emergency response',
    'Most customers get an appointment within 24 hours of calling — often the same day.',
    'We have treated thousands of properties across the region.',
    'We have treated thousands of homes just like yours.',
    'No contracts. You hire us because we earn it.',
    'Over 4,200+ properties protected since 2010.',
  ];

  for (const literal of CAUGHT) {
    it(`catches: ${literal.slice(0, 48)}…`, () => {
      expect(CAPACITY_OR_TERMS.test(literal) || FABRICATED_STAT.test(literal)).toBe(true);
    });
  }

  const ALLOWED = [
    'Every visit starts with an inspection.',
    'Every job starts with a site walk.',
    'We give you a firm appointment window, keep you posted if anything changes, and show up when we say we will.',
    'Call us to check current availability for Austin and we will schedule an inspection.',
  ];

  for (const literal of ALLOWED) {
    it(`does not fire on: ${literal.slice(0, 48)}…`, () => {
      expect(CAPACITY_OR_TERMS.test(literal)).toBe(false);
      expect(FABRICATED_STAT.test(literal)).toBe(false);
    });
  }

  // PR F — the field-pair class, proven against the exact literals this PR
  // removed. Without these the new pattern could silently rot into a no-op.
  const STAT_PAIRS_REMOVED = [
    "{ num: '4,200+', label: 'Customers' },",
    "{ num: '12,000+', label: 'Treatments' },",
    "{ num: '15+', label: 'Years' },",
    "{ num: '15+',      label: 'Years Experience',       Icon: Star  },",
    "{ num: '4,200+',   label: 'Homes Protected',        Icon: Home  },",
    "{ num: '98%',      label: 'Customer Satisfaction',  Icon: Heart },",
    "{ num: '100%', label: 'Guarantee' },",
    "{ num: '15+', label: 'Years on the job' },",
  ];

  for (const literal of STAT_PAIRS_REMOVED) {
    it(`catches the removed stat tile: ${literal.slice(0, 40)}…`, () => {
      expect(HARDCODED_STAT_PAIR.test(literal)).toBe(true);
    });
  }

  const STAT_PAIRS_ALLOWED = [
    // The replacements this PR ships — all DB-driven, none a literal.
    '{ num: s.value, label: s.label }',
    '{ value: s.value, label: entry.label }',
    "{ num: licenseNumber, label: 'License #' }",
    // Ordinals are not statistics.
    "{ num: '01', label: 'Step one' },",
    "{ num: '02', label: 'Inspect' },",
    "{ num: '4', label: 'Steps' },",
  ];

  for (const literal of STAT_PAIRS_ALLOWED) {
    it(`does not fire on: ${literal.slice(0, 40)}…`, () => {
      expect(HARDCODED_STAT_PAIR.test(literal)).toBe(false);
    });
  }

  // The dropped class, asserted so the decision is visible rather than implied
  // by an absence. Treatment efficacy is a TRADE fact and stays; a business
  // turnaround promise is a TENANT fact and was deleted by hand in this PR —
  // the guard is deliberately not the thing that distinguishes them.
  it('does NOT attempt to police "within N hours" — efficacy reads the same as turnaround', () => {
    const efficacy = 'Safe for pets, effective within 24 hours.';
    const turnaround = 'You receive a written WDI report within 48 hours.';
    for (const literal of [efficacy, turnaround]) {
      expect(CAPACITY_OR_TERMS.test(literal)).toBe(false);
      expect(FABRICATED_STAT.test(literal)).toBe(false);
    }
  });
});

describe('the comment stripper is string-aware', () => {
  it('strips a line comment', () => {
    expect(stripComments('const a = 1; // same-day')).not.toMatch(/same-day/);
  });

  it('strips a block comment, including a multi-line one', () => {
    expect(stripComments('/* same-day\n   next-day */ const a = 1;')).not.toMatch(/same-day|next-day/);
  });

  it('does NOT treat the // in a URL as a comment, so a claim after it still counts', () => {
    const src = `const u = 'https://x.test'; const claim = 'Same-day service';`;
    expect(stripComments(src)).toMatch(/Same-day service/);
  });

  it('keeps a claim that lives inside a string containing an apostrophe escape', () => {
    const src = `const s = 'it\\'s same-day';`;
    expect(stripComments(src)).toMatch(/same-day/);
  });
});
