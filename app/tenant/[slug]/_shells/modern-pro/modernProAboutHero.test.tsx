import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { readFileSync, readdirSync } from 'node:fs';
import { ModernProAboutPage } from './ModernProAboutPage';

// S301 — the modern-pro platform-page hero scrim.
//
// The About hero composited TWO stops of rgba(11,18,32,0.85) over the photo, so
// an uploaded image rendered at ~15% and a correct upload looked exactly like
// the plain gradient. Every OTHER hero surface in the app was already at 0.55.

const HERO = 'https://x.supabase.co/storage/v1/object/public/tenant-assets/turf.jpg';

const render = (heroImageUrl: string | null) => renderToStaticMarkup(
  createElement(ModernProAboutPage, {
    heroTitle: 'About Us', heroSub: 'Sub', heroImageUrl, aboutImage: null,
    team: [], businessName: 'PLS', introParagraphs: [], phone: '', stats: [],
  } as never),
);

const heroSection = (html: string) => html.slice(html.indexOf('<section'), html.indexOf('</section>') + 10);

describe('the null path is BYTE-IDENTICAL to the pre-S301 render', () => {
  // Captured by RENDERING the component as it stood on main before the change,
  // not hand-written. A tenant with no hero image sees precisely what it saw
  // yesterday: same gradient, same #3FB8AF eyebrow, same #94A3B8 subtitle.
  const NULL_HERO_ON_MAIN = "<section style=\"padding:5rem 1rem 3rem;border-bottom:1px solid rgba(63, 184, 175, 0.2);background-image:linear-gradient(135deg,#1B2A4E,#0B1220);background-size:cover;background-position:center\"><div class=\"max-w-5xl mx-auto\" style=\"text-align:center\"><p style=\"font-size:12px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#3FB8AF;margin-bottom:0.75rem\">Our Mission</p><h1 style=\"font-size:clamp(36px,5vw,56px);font-weight:700;color:#fff;margin-bottom:1rem;line-height:1.15\">About Us</h1><p style=\"font-size:18px;color:#94A3B8;line-height:1.6;max-width:60ch;margin:0 auto\">Sub</p></div></section>";

  it('the recorded baseline is a real string — an empty one makes the compare vacuous', () => {
    expect(NULL_HERO_ON_MAIN.length).toBeGreaterThan(500);
    expect(NULL_HERO_ON_MAIN).toContain('linear-gradient(135deg,#1B2A4E,#0B1220)');
    expect(NULL_HERO_ON_MAIN).toContain('color:#3FB8AF');
    expect(NULL_HERO_ON_MAIN).toContain('color:#94A3B8');
    expect(NULL_HERO_ON_MAIN).not.toContain('rgba(0,0,0');
  });

  it('emits the original hero markup exactly, character for character', () => {
    expect(heroSection(render(null))).toBe(NULL_HERO_ON_MAIN);
  });

  it('carries NO scrim and NO lifted colours when there is no image', () => {
    const hero = heroSection(render(null));
    expect(hero).not.toContain('rgba(0,0,0,0.6)');
    expect(hero).not.toContain('#A5F3EE');
    expect(hero).not.toContain('#E2E8F0');
  });
});

describe('the image path shows the photo and keeps the text legible', () => {
  const hero = heroSection(render(HERO));

  it('renders the photo behind a 0.6 scrim, not a 0.85 one', () => {
    expect(hero).toContain('url(' + HERO + ')');
    expect(hero).toContain('linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.6))');
    expect(hero, 'the heavy scrim survived').not.toContain('0.85');
  });

  it('lifts the two muted colours that the heavy scrim was carrying', () => {
    // At 0.6 over a blown highlight: #A5F3EE 4.55:1 and #E2E8F0 4.66:1, both
    // clearing AA. The originals measure 2.38:1 and 2.24:1 there — which is why
    // dropping the scrim without touching them would have traded one defect for
    // another, less visible one.
    expect(hero).toContain('color:#A5F3EE');
    expect(hero).toContain('color:#E2E8F0');
    expect(hero).not.toContain('color:#94A3B8');
  });

  it('the h1 stays pure white — it never needed lifting', () => {
    expect(hero).toContain('color:#fff');
  });

  it('the image render is substantial — not asserting against an empty string', () => {
    expect(hero.length).toBeGreaterThan(500);
    expect(hero).toContain('About Us');
  });
});

// ── The ceiling, across every modern-pro surface ────────────────────────────
describe('no modern-pro hero scrim exceeds 0.6 alpha', () => {
  const DIR = new URL('.', import.meta.url);
  const files = readdirSync(DIR).filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'));

  it('the shell directory really was read', () => {
    // A directory read that silently returns [] would make the scan below
    // iterate nothing and pass green.
    expect(files.length).toBeGreaterThanOrEqual(10);
    expect(files).toContain('ModernProAboutPage.tsx');
    expect(files).toContain('ModernProHero.tsx');
  });

  /**
   * Comments out first. ModernProAboutPage's own comment records the value it
   * replaced — rgba(11,18,32,0.85) — and the first run of this guard failed on
   * that line, not on any rendered style. A guard that trips on its own
   * explanation of the fix is the recurring defect in this codebase, and it
   * showed up again here.
   */
  function stripComments(body: string): string {
    return body
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((line) => !/^[ \t]*(\/\/|\*)/.test(line))
      .join('\n');
  }

  /** Alphas from rgba(...) stops used as a SCRIM — a flat dark wash over a photo. */
  function scrimAlphas(raw: string): number[] {
    const src = stripComments(raw);
    // exec loop, not [...matchAll]: the root tsconfig's target rejects spreading
    // a RegExpStringIterator (TS2802), and this file is inside its scope.
    const re = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/g;
    const out: number[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      if (Number(m[1]) < 60 && Number(m[2]) < 60 && Number(m[3]) < 60) out.push(Number(m[4]));
    }
    return out;
  }

  it('comment stripping removes prose and keeps code — it does not gut the file', () => {
    const body = readFileSync(new URL('ModernProAboutPage.tsx', DIR), 'utf8');
    const stripped = stripComments(body);
    expect(body, 'the historical value is recorded in a comment').toContain('rgba(11,18,32,0.85)');
    expect(stripped, 'comment stripping missed it').not.toContain('rgba(11,18,32,0.85)');
    expect(stripped).toContain('const HERO_SCRIM');
    expect(stripped.length).toBeGreaterThan(body.length / 4);
  });

  it('the scan still sees a real offender placed in CODE, outside a comment', () => {
    // The stripper must not be so wide that a live style slips past it.
    const planted = "const x = { background: 'rgba(11,18,32,0.85)' };";
    expect(scrimAlphas(planted).filter((a) => a > 0.6)).toEqual([0.85]);
  });

  it('the alpha extractor finds scrims and ignores the teal borders', () => {
    expect(scrimAlphas("background: 'rgba(0,0,0,0.55)'")).toEqual([0.55]);
    expect(scrimAlphas('rgba(11,18,32,0.85)')).toEqual([0.85]);
    // #3FB8AF-derived borders and white overlays are not scrims.
    expect(scrimAlphas('rgba(63,184,175,0.2)')).toEqual([]);
    expect(scrimAlphas('rgba(255,255,255,0.4)')).toEqual([]);
  });

  for (const f of files) {
    it(f + ': every dark wash is at or below 0.6', () => {
      const src = readFileSync(new URL(f, DIR), 'utf8');
      const offenders = scrimAlphas(src).filter((a) => a > 0.6);
      expect(offenders, f + ' scrims a photo at ' + JSON.stringify(offenders) + ' — the photo will not read').toEqual([]);
    });
  }
});
