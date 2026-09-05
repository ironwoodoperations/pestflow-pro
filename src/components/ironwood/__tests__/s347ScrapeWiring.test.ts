// S347 — the WIRING, not the contract.
//
// s346ScrapeCaller.test.ts pins that ScrapePanel sends `vertical` when it has
// one. That test passed while the live feature produced ten pest pages for a
// lawn prospect, because it renders the component itself and never asks whether
// the REAL PARENT supplies what the component needs. That is the S342 defect
// twice over. These assertions read the parent, and the prop's optionality.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(__dirname, '..');
const PARENT = readFileSync(join(dir, 'ProspectDetail.Sections.tsx'), 'utf8');
const PANEL = readFileSync(join(dir, 'ScrapePanel.tsx'), 'utf8');

const codeOnly = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** The <ScrapePanel .../> element as written in the parent, comments stripped. */
function scrapePanelElement(src: string): string {
  const code = codeOnly(src);
  const at = code.indexOf('<ScrapePanel');
  expect(at, 'the parent no longer renders <ScrapePanel>').toBeGreaterThan(-1);
  const end = code.indexOf('/>', at);
  expect(end, 'unterminated <ScrapePanel> element').toBeGreaterThan(at);
  return code.slice(at, end + 2);
}

describe('the real parent supplies what ScrapePanel needs', () => {
  it('passes form — without it the vertical is null and the scrape goes pest', () => {
    expect(scrapePanelElement(PARENT)).toMatch(/\bform=\{/);
  });

  it('passes prospectId — the edge function resolves the vertical from that row', () => {
    expect(scrapePanelElement(PARENT)).toMatch(/\bprospectId=\{/);
  });

  it('MUTATION: dropping form={form} from the parent is caught', () => {
    const broken = PARENT.replace(/\bform=\{form\}/, '');
    expect(() => {
      expect(scrapePanelElement(broken)).toMatch(/\bform=\{/);
    }).toThrow();
  });

  it('ANTI-VACUITY: the element slice really is the ScrapePanel call site', () => {
    const el = scrapePanelElement(PARENT);
    expect(el.startsWith('<ScrapePanel')).toBe(true);
    expect(el).toMatch(/sourceUrl=\{/);
    expect(el.length).toBeGreaterThan(80);
  });
});

describe('form is REQUIRED, so a missing wiring is a compile error', () => {
  it('the prop is not optional', () => {
    const code = codeOnly(PANEL);
    expect(code).toMatch(/\bform:\s+Partial<Prospect>/);
    expect(code).not.toMatch(/\bform\?:/);
  });

  it('and it is read without optional chaining, which would hide an absent form', () => {
    const code = codeOnly(PANEL);
    expect(code).toMatch(/readVerticalChoice\(\s*\(form\.business_info/);
  });
});

describe('the operator sees what SURVIVED, not what was fetched', () => {
  const code = codeOnly(PANEL);
  it('the summary reports real pages and paths tried', () => {
    expect(code).toMatch(/paths_tried/);
    expect(code).toMatch(/discarded_count/);
  });
  it('it no longer claims every fetched path was a page of content', () => {
    expect(code).not.toMatch(/pages? of content found and saved/);
  });
});
