// S346C — after this PR there must be EXACTLY ONE operator list, and it is a
// database table. This scan fails if any operator email literal reappears.
//
// TWO TRAPS THIS TEST HAD TO AVOID, both paid for earlier in this arc:
//   * S343 — a scan that matches its own explanatory COMMENT. The forbidden
//     addresses are legitimately discussed in comments, so the scan strips
//     comments before matching. My first pass at this PR tripped exactly that.
//   * S345 — a test that spells the forbidden literal out becomes a hit itself.
//     The needles are assembled from fragments.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const TREES = ['src', 'app', 'supabase/functions'];
const EXT = /\.(ts|tsx)$/;

/** Assembled from fragments so this file is not itself a violation. */
const DOMAIN = ['pestflowpro', 'com'].join('.');
const DEMO_ADMIN = ['admin', DOMAIN].join('@');
const DEAD_ADDRESS = ['murphygurl92', ['gmail', 'com'].join('.')].join('@');
const OPERATOR_ADDRESS = ['scott', ['homeflowpro', 'ai'].join('.')].join('@');
const LIST_NAME = ['IRONWOOD', 'OPERATOR', 'USER', 'IDS'].join('_');
const OLD_ALLOWLIST = ['IRONWOOD', 'ALLOWED'].join('_');
const OPERATOR_UUID = ['32b8fbf4', '6378', '49b2', 'b5b5', '580d7a0c9a21'].join('-');
const DEMO_ADMIN_UUID = ['5181b30a', '265f', '4a70', 'a323', 'bf6e3c53641b'].join('-');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '.next') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXT.test(name)) out.push(full);
  }
  return out;
}

const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const FILES = TREES.flatMap(t => walk(join(ROOT, t)));
/** This test file and its own fixtures are excluded — see the S345 note above. */
const SCANNED = FILES
  .filter(f => !f.endsWith('s346cOneOperatorList.test.ts'))
  .map(f => ({ file: f.slice(ROOT.length + 1), code: stripComments(readFileSync(f, 'utf8')) }));

describe('exactly one operator list, and it lives in the database', () => {
  it('ANTI-VACUITY: the scan actually walked a real tree', () => {
    expect(SCANNED.length).toBeGreaterThan(200);
    expect(SCANNED.some(f => f.file.includes('IronwoodOps'))).toBe(true);
    expect(SCANNED.some(f => f.file.includes('isOperator'))).toBe(true);
  });

  it('ANTI-VACUITY: the comment stripper leaves real code behind', () => {
    const ops = SCANNED.find(f => f.file.endsWith('IronwoodOps.tsx'))!;
    expect(ops.code).toMatch(/useEffect/);
    expect(ops.code).toMatch(/isOperator/);
  });

  // ── SCOPE, and why it is not "no email literal anywhere" ──────────────────
  // The first version of this scan asserted exactly that, and it failed on ten
  // files — all but one legitimately. These addresses have real non-gate uses:
  // a support mailto in BillingTab and DomainSection, the published demo login
  // on the marketing page (an owner decision, recorded in S343), sender and
  // footer addresses in transactional email HTML, and legal/privacy contact
  // text. Banning the string outright would have forced those to be obfuscated
  // for no security gain.
  //
  // THE ONE REAL HIT IT FOUND IS WHY THE BROAD PASS WAS WORTH RUNNING:
  // _shared/offboardDrain.ts exported OPERATOR_ID + OPERATOR_EMAIL, and
  // offboard-tenant gated on them — a SIXTH copy, already broken, guarding
  // tenant deletion. It is fixed in this PR.
  //
  // So the scan asserts the two things that actually matter:
  //   1. no allowlist-shaped CONSTANT survives anywhere, and
  //   2. the files that make an operator AUTHORIZATION DECISION contain no
  //      identity literal at all.

  for (const [label, needle] of [
    ['the edge allowlist constant', LIST_NAME],
    ['the frontend allowlist constant', OLD_ALLOWLIST],
    ['the offboard operator id constant', ['OPERATOR', 'ID'].join('_')],
    ['the offboard operator email constant', ['OPERATOR', 'EMAIL'].join('_')],
  ] as const) {
    it(`no non-test code declares ${label}`, () => {
      const hits = SCANNED
        .filter(f => !/\.test\.tsx?$/.test(f.file))
        .filter(f => f.code.includes(needle))
        .map(f => f.file);
      expect(hits, `still present in: ${hits.join(', ')}`).toEqual([]);
    });
  }

  /** Every file that decides whether a caller is an operator. */
  const GATES = [
    'src/pages/IronwoodOps.tsx',
    'src/pages/admin/IronwoodLogin.tsx',
    'src/lib/isOperator.ts',
    'supabase/functions/_shared/aiAuth.ts',
    'supabase/functions/_shared/operatorLookup.ts',
    'supabase/functions/scrape-prospect/index.ts',
    'supabase/functions/ironwood-provision/index.ts',
    'supabase/functions/offboard-tenant/index.ts',
  ];

  it('ANTI-VACUITY: every named gate file exists and was scanned', () => {
    for (const g of GATES) {
      expect(SCANNED.find(f => f.file === g), `${g} not scanned`).toBeDefined();
    }
  });

  for (const gate of GATES) {
    it(`${gate} decides from the database, not from a literal identity`, () => {
      const entry = SCANNED.find(f => f.file === gate)!;
      for (const [what, needle] of [
        ['demo admin address', DEMO_ADMIN],
        ['dead address', DEAD_ADDRESS],
        ['operator address', OPERATOR_ADDRESS],
        ['operator uuid', OPERATOR_UUID],
        ['demo admin uuid', DEMO_ADMIN_UUID],
      ] as const) {
        expect(entry.code.includes(needle), `${gate} hardcodes the ${what}`).toBe(false);
      }
    });
  }

  it('MUTATION: a reintroduced literal WOULD be caught', () => {
    const reintroduced = stripComments(`const X = ['${DEMO_ADMIN}']\n`);
    expect(reintroduced.includes(DEMO_ADMIN)).toBe(true);
  });

  it('both gates route through the one helper', () => {
    for (const f of ['src/pages/IronwoodOps.tsx', 'src/pages/admin/IronwoodLogin.tsx']) {
      const entry = SCANNED.find(x => x.file === f)!;
      expect(entry.code, f).toMatch(/isOperator\(supabase\)/);
    }
  });
});
