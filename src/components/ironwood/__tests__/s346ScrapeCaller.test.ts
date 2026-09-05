// S346 — the caller must actually SEND the vertical.
//
// S342's lesson, paid for once: deleting the field from the component left a
// contract-level suite fully green, because it pinned the builder and not the
// call site. This scans the real component source, with comments stripped —
// the S343 lesson, where a scan matched the assertion's own explanatory comment.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = readFileSync(join(__dirname, '..', 'ScrapePanel.tsx'), 'utf8');

/** Strip // line and block comments so a scan cannot match prose about the code. */
function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}
const CODE = codeOnly(SRC);

describe('ScrapePanel sends the vertical to scrape-prospect', () => {
  it('the fetch body carries a vertical field', () => {
    const body = CODE.match(/body:\s*JSON\.stringify\(\{[^}]*\}\)/);
    expect(body, 'no JSON.stringify body found in the component').not.toBeNull();
    expect(body![0]).toMatch(/vertical/);
  });

  it('the vertical is READ FROM THE FORM, not hardcoded', () => {
    expect(CODE).toMatch(/readVerticalChoice\(/);
    // a literal trade in the request body would be the bug this session fixed
    expect(CODE).not.toMatch(/vertical:\s*['"]pest['"]/);
    expect(CODE).not.toMatch(/vertical:\s*['"]lawn['"]/);
  });

  it('THE COMMENT STRIPPER STILL SEES REAL CODE (anti-vacuity)', () => {
    // if the stripper ever ate the whole file, every assertion above passes
    // trivially. Prove it still contains the call site it is asserting about.
    expect(CODE).toMatch(/functions\/v1\/scrape-prospect/);
    expect(CODE.length).toBeGreaterThan(SRC.length / 2);
  });

  it('a reintroduced hardcoded trade WOULD be caught by the stripper', () => {
    const withBug = codeOnly(SRC.replace(/vertical: scrapeVertical/, "vertical: 'pest'"));
    expect(withBug).toMatch(/vertical:\s*['"]pest['"]/);
  });
});
