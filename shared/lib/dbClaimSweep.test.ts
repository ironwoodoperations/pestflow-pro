import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// S286 — this guards THE GUARD.
//
// The repo's claim guard (noUnverifiedClaims.test.ts) walks the filesystem. It
// structurally cannot see a database row, and bolting a Supabase client into a
// unit test is the wrong fix: CI has no production data (the auth-isolation job
// spins a LOCAL, empty stack), it would need service-role credentials in CI, and
// it would make the suite network-dependent and flaky. Worse, a test that can
// reach the DB invites a test that WRITES to it, and rule (a) says the database
// is exactly where tenant facts are supposed to live.
//
// So the DB check is a separate, runnable, READ-ONLY SQL script. What CI can
// usefully verify is that the script has not rotted: that it is still read-only,
// that it still says what it covers, and — the part that actually matters — that
// what it SAYS it covers is what it ACTUALLY queries.
//
// That last check exists because the failure this whole arc keeps repeating is
// not "the guard was missing", it is "the guard's scope quietly stopped matching
// its claim". S281's sweep reported "0 remaining" and was right about the three
// tables it scanned, while four rows sat in two tables it never looked at.

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SWEEP_PATH = join(REPO_ROOT, 'supabase', 'tests', 'claims_content_sweep.sql');
const SQL = readFileSync(SWEEP_PATH, 'utf8');

const commentLines = SQL.split('\n').filter((l) => /^\s*--/.test(l)).join('\n');
const codeLines = SQL.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');

describe('the content-table sweep is read-only', () => {
  for (const verb of ['update', 'delete', 'insert', 'drop', 'alter', 'truncate', 'create']) {
    it(`contains no ${verb.toUpperCase()} statement`, () => {
      expect(codeLines).not.toMatch(new RegExp(`\\b${verb}\\b`, 'i'));
    });
  }

  it('is a SELECT', () => {
    expect(codeLines).toMatch(/\bselect\b/i);
  });

  // Rule (a): the DB is where tenant facts belong. A sweep that deletes would
  // remove the tenant's own claims about their own business — S281 nearly did
  // exactly that, and only `user_edited` separated seed from truth. Neither of
  // these two tables has such a column, so this one must never classify.
  it('says out loud that it only reports, and why', () => {
    expect(commentLines).toMatch(/READ-ONLY/);
    expect(commentLines).toMatch(/classifies nothing|hands a human/i);
  });
});

describe('the sweep declares its scope, and the declaration matches the query', () => {
  const DECLARED = ['blog_posts.title', 'blog_posts.content', 'blog_posts.excerpt', 'social_posts.caption'];

  it('names every column it covers, in a COVERS block', () => {
    expect(commentLines).toMatch(/COVERS/);
    for (const col of DECLARED) expect(commentLines).toContain(col);
  });

  it('names what it does NOT cover, so a clean result is not read as more than it is', () => {
    expect(commentLines).toMatch(/DOES NOT COVER/);
    // The tables nothing sweeps yet — the honest part, and the next place to look.
    for (const t of ['page_content', 'faqs', 'seo_meta']) expect(commentLines).toContain(t);
  });

  // ANTI-DRIFT. Every declared table must actually be queried, and every queried
  // table must actually be declared. Adding a table to the query without saying
  // so, or promising one the query never touches, both fail here.
  it('the tables it queries are exactly the tables it declares', () => {
    // No Set-spread and no matchAll: the ROOT tsconfig, which is the one CI's
    // bare `tsc --noEmit` uses, sets no `target` and so compiles shared/** as
    // ES5. (src/** is excluded from it, which is why the same idioms are fine in
    // the composer test next door.)
    const uniqSorted = (xs: string[]) => xs.filter((x, i) => xs.indexOf(x) === i).sort();
    const declaredTables = uniqSorted(DECLARED.map((c) => c.split('.')[0]));

    const found: string[] = [];
    const re = /\bfrom\s+([a-z_]+)\b/gi;
    let hit: RegExpExecArray | null = re.exec(codeLines);
    while (hit !== null) {
      found.push(hit[1].toLowerCase());
      hit = re.exec(codeLines);
    }
    // 'pat' is the pattern CTE, not a table.
    const queriedTables = uniqSorted(found.filter((t) => t !== 'pat'));

    expect(queriedTables).toEqual(declaredTables);
  });

  it('every declared column appears in the query body', () => {
    for (const col of DECLARED) {
      const [, column] = col.split('.');
      expect(codeLines, `${col} is declared but never read`).toMatch(new RegExp(`\\b${column}\\b`));
    }
  });
});

describe('the sweep and the code guard agree on what a capacity claim is', () => {
  // If these two drift, one of them starts calling a claim clean. Asserted by
  // reading the code guard as TEXT rather than importing it — importing a test
  // file would register its whole suite inside this one.
  const GUARD = readFileSync(join(REPO_ROOT, 'shared', 'lib', 'noUnverifiedClaims.test.ts'), 'utf8');

  it('uses the same capacity/terms alternation as CAPACITY_OR_TERMS', () => {
    // (?:[^/\\]|\\.)+ rather than [^/]+ : the literal contains an ESCAPED slash
    // (24\/7), and a naive class stops dead on it — which is how this test first
    // reported the guard as "changed shape" when nothing had changed at all.
    const m = GUARD.match(/const CAPACITY_OR_TERMS = \/((?:[^/\\]|\\.)+)\/i;/);
    expect(m, 'CAPACITY_OR_TERMS not found — the code guard changed shape').toBeTruthy();
    const alternation = m![1].replace(/\\\//g, '/');   // 24\/7 -> 24/7, as SQL writes it
    expect(alternation).toBe('same-day|next-day|24/7|no contracts');
    expect(codeLines).toContain(alternation);
  });

  it('targets the reserved fictional 555-01xx range, not one hardcoded literal', () => {
    expect(codeLines).toMatch(/555/);
    expect(codeLines).toMatch(/01\[0-9\]\{2\}/);
    // A pattern matching only '(903) 555-0142' would miss the next seeded number.
    expect(codeLines).not.toMatch(/555-0142/);
  });
});
