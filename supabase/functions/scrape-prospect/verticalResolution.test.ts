// S347 — index.ts imports esm.sh so vitest cannot load it. These are source
// scans over the one thing that matters: the vertical the scrape acts on is
// resolved from the PROSPECT ROW, not taken on trust from the request body.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = readFileSync(join(__dirname, 'index.ts'), 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('the vertical is resolved server-side', () => {
  it('reads business_info from the prospects row', () => {
    expect(CODE).toMatch(/from\('prospects'\)/);
    expect(CODE).toMatch(/select\('business_info'\)/);
  });

  it('the stored value WINS over the request body', () => {
    const at = CODE.indexOf("select('business_info')");
    const after = CODE.slice(at, at + 600);
    expect(after).toMatch(/resolvedVertical\s*=\s*stored/);
  });

  it('every downstream consumer uses the RESOLVED value, never the raw body', () => {
    for (const call of [
      /candidatePathsFor\(resolvedVertical\)/,
      /pathToSlug\(s\.path,\s*resolvedVertical\)/,
      /extractionPromptFor\(resolvedVertical\)/,
      /analyzeSite\([^)]*resolvedVertical\)/,
    ]) expect(CODE).toMatch(call);
    // the raw body value must not still be driving anything
    expect(CODE).not.toMatch(/candidatePathsFor\(vertical\)/);
    expect(CODE).not.toMatch(/pathToSlug\(s\.path,\s*vertical\)/);
  });

  it('a prospect lookup failure does not silently become a different trade', () => {
    expect(CODE).toMatch(/prospectErr/);
  });
});

describe('the response reports what survived', () => {
  it('carries the counts and the resolved vertical', () => {
    for (const key of ['paths_tried', 'pages_kept', 'discarded', 'vertical_source']) {
      expect(CODE, key).toMatch(new RegExp(key));
    }
  });
  // THIS ASSERTION WAS VACUOUS ON ITS FIRST WRITING and a mutation caught it:
  // `partitionScrapedPages` also appears in the IMPORT line, so "the filter
  // appears before the write" stayed true after the CALL was deleted and the
  // raw fetch results were written straight through. Scope-too-wide, the S319
  // shape, in the assertion guarding the exact defect this session exists to
  // fix. It now pins the CALL and the value that flows out of it.
  it('the filter RESULT — not the raw fetch list — is what gets mapped', () => {
    const body = CODE.slice(CODE.indexOf('Deno.serve'));
    expect(body).toMatch(/const\s*\{[^}]*\bkept\s*:\s*successful\b[^}]*\}\s*=\s*partitionScrapedPages\(/);
    // the raw list must not be aliased back over the filtered one
    expect(body).not.toMatch(/const\s+successful\s*=\s*fetched/);
    // and the mapping loop must iterate the filtered value
    expect(body).toMatch(/for\s*\(const\s+s\s+of\s+successful\)/);
  });

  it('nothing is written before the filter runs', () => {
    const body = CODE.slice(CODE.indexOf('Deno.serve'));
    const callAt = body.search(/=\s*partitionScrapedPages\(/);
    const writeAt = body.indexOf('scraped_content: scrapedContent');
    expect(callAt).toBeGreaterThan(-1);
    expect(writeAt).toBeGreaterThan(callAt);
  });
});

describe('verify_jwt is pinned for this function', () => {
  const toml = readFileSync(join(__dirname, '..', '..', 'config.toml'), 'utf8');
  it('config.toml carries the pin — a flagless deploy flipped it at v54', () => {
    const at = toml.indexOf('[functions.scrape-prospect]');
    expect(at).toBeGreaterThan(-1);
    expect(toml.slice(at, at + 120)).toMatch(/verify_jwt\s*=\s*false/);
  });
});
