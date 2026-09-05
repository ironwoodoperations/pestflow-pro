// S348 Part A — Discard must clear the SAVED row, not just React state.
//
// index.ts imports esm.sh so vitest cannot load the edge function; ScrapePanel
// is a component whose handlers are not reachable without a full render harness
// this repo does not have for it. So these are source scans — but scoped to the
// CALL, not to a symbol that an import line would satisfy (the S347 lesson),
// and with comments stripped (the S343/S346C lesson).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PANEL_SRC = readFileSync(join(__dirname, '..', 'ScrapePanel.tsx'), 'utf8');
const EDGE_SRC = readFileSync(
  join(__dirname, '..', '..', '..', '..', 'supabase', 'functions', 'scrape-prospect', 'index.ts'), 'utf8');

const codeOnly = (s: string) =>
  s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const PANEL = codeOnly(PANEL_SRC);
const EDGE = codeOnly(EDGE_SRC);

/** The body of a named arrow-function handler, brace-matched. */
function handlerBody(src: string, name: string): string {
  const at = src.indexOf(`const ${name} =`);
  expect(at, `${name} not found`).toBeGreaterThan(-1);
  const open = src.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(open, i + 1); }
  }
  throw new Error(`unterminated ${name}`);
}

describe('Discard clears the stored overlay', () => {
  const body = handlerBody(PANEL, 'handleDiscard');

  it('it writes to the prospect row — not only setState', () => {
    expect(body).toMatch(/from\('prospects'\)/);
    expect(body).toMatch(/\.update\(/);
    expect(body).toMatch(/scraped_content:\s*null/);
  });

  it('it clears source_url too, so nothing from that run is left behind', () => {
    expect(body).toMatch(/source_url:\s*null/);
  });

  it('a failed clear is SURFACED, not swallowed', () => {
    expect(body).toMatch(/if\s*\(error\)/);
    expect(body).toMatch(/setState/);
    expect(body).toMatch(/return/);
  });

  it('MUTATION: reverting to state-only is caught', () => {
    const stateOnly = `const handleDiscard = () => {
      setState(s => ({ ...s, result: null, pagesFound: 0 }))
    }`;
    const reverted = handlerBody(stateOnly, 'handleDiscard');
    expect(reverted).not.toMatch(/from\('prospects'\)/);
  });

  it('MUTATION: swallowing the error is caught', () => {
    const swallowed = body.replace(/if\s*\(error\)\s*\{[\s\S]*?\n\s*\}/, '');
    expect(swallowed).not.toMatch(/if\s*\(error\)/);
  });

  it('ANTI-VACUITY: the extracted body is the real handler', () => {
    expect(body.length).toBeGreaterThan(120);
    expect(body).toMatch(/setState/);
  });
});

describe('the write moved to the point of ACCEPTANCE', () => {
  it('the edge function no longer writes scraped_content', () => {
    expect(EDGE).not.toMatch(/scraped_content:\s*scrapedContent/);
    expect(EDGE).not.toMatch(/\.update\(\{\s*scraped_content/);
  });

  it('it still RETURNS the content, so the operator sees no change', () => {
    expect(EDGE).toMatch(/scrapedContent,/);
  });

  it('Apply persists it', () => {
    const body = handlerBody(PANEL, 'handleApply');
    expect(body).toMatch(/from\('prospects'\)/);
    expect(body).toMatch(/scraped_content:\s*state\.scrapedContent/);
  });

  it('and a failed save on Apply is surfaced rather than marked applied', () => {
    const body = handlerBody(PANEL, 'handleApply');
    const errAt = body.search(/if\s*\(error\)/);
    const appliedAt = body.indexOf('applied: true');
    expect(errAt).toBeGreaterThan(-1);
    expect(appliedAt).toBeGreaterThan(errAt);   // the guard precedes the success flag
    expect(body.slice(errAt, appliedAt)).toMatch(/return/);
  });

  it('MUTATION: the edge function writing again is caught', () => {
    const regressed = EDGE + "\nawait supabase.from('prospects').update({ scraped_content: scrapedContent })\n";
    expect(regressed).toMatch(/\.update\(\{\s*scraped_content/);
  });
});
