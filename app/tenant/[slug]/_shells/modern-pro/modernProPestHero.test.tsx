import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { ModernProPestPage } from './ModernProPestPage';

// S295 — the modern-pro service hero. Before this change the route handed
// heroMedia to DefaultPestPage alone, so no themed tenant resolved a hero at
// all; this component's inline <section> rendered its gradient whatever the
// database held.

const TENANT = {
  id: 't', slug: 'pls', name: 'PLS', phone: '9035550100',
  business_name: 'Precision Lawn Systems LLC', vertical: 'irrigation',
} as never;

const HERO = 'https://biezzykcgzkrwdgqpsar.supabase.co/storage/v1/object/public/tenant-assets/x.jpg';

const render = (heroImageUrl: string | null) => renderToStaticMarkup(
  createElement(ModernProPestPage, {
    tenant: TENANT, pestSlug: 'drainage', content: { title: 'Drainage' }, heroImageUrl,
  } as never),
);

/** The hero is the first <section>; everything below it is untouched by S295. */
const heroSection = (html: string) => html.slice(html.indexOf('<section'), html.indexOf('</section>') + 10);

describe('the null path is BYTE-IDENTICAL to the pre-S295 render', () => {
  // This exact string was captured from the component as it stood on main,
  // before the change — rendered, not hand-written. A tenant with no hero image
  // of any kind must see precisely what it saw yesterday.
  const OPENING_TAG_ON_MAIN =
    '<section style="padding:5rem 1rem 3rem;border-bottom:1px solid rgba(63,184,175,0.2);background:linear-gradient(135deg,#1B2A4E,#0B1220)"><div class="max-w-5xl mx-auto" style="text-align:center">';

  it('the recorded baseline is a real string — an empty one makes startsWith vacuous', () => {
    // Found by mutation: blanking OPENING_TAG_ON_MAIN left the assertion below
    // passing, because every string starts with ''.
    expect(OPENING_TAG_ON_MAIN.length).toBeGreaterThan(150);
    expect(OPENING_TAG_ON_MAIN).toContain('linear-gradient(135deg,#1B2A4E,#0B1220)');
    expect(OPENING_TAG_ON_MAIN).toContain('text-align:center"');
    expect(OPENING_TAG_ON_MAIN).not.toContain('position');
  });

  it('emits the original section and content-div markup exactly', () => {
    expect(render(null).startsWith(
      '<div style="background-color:#0B1220;color:#E5E7EB;font-family:Inter, sans-serif">' + OPENING_TAG_ON_MAIN,
    )).toBe(true);
  });

  it('adds NO scrim, NO position and NO z-index when there is no image', () => {
    const hero = heroSection(render(null));
    expect(hero).not.toContain('rgba(0,0,0,0.55)');
    expect(hero).not.toContain('position:relative');
    expect(hero).not.toContain('position:absolute');
    expect(hero).not.toContain('z-index');
    expect(hero).not.toContain('background-image');
  });

  it('the null render is substantial — this is not asserting against an empty string', () => {
    const html = render(null);
    expect(html.length).toBeGreaterThan(4000);
    expect(html).toContain('Request a Quote');
  });
});

describe('the image path renders the hero the tenant actually stored', () => {
  const hero = heroSection(render(HERO));

  it('uses the image as a cover background', () => {
    expect(hero).toContain(`background-image:url(${HERO})`);
    expect(hero).toContain('background-size:cover');
    expect(hero).toContain('background-position:center');
  });

  it('drops the gradient — an image and a gradient would fight', () => {
    expect(hero).not.toContain('linear-gradient(135deg,#1B2A4E,#0B1220)');
  });

  it('lays a 55% scrim UNDER the text, matching DefaultPestPage', () => {
    // Without the scrim, white headings sit on an arbitrary photograph.
    expect(hero).toContain('background:rgba(0,0,0,0.55)');
    expect(hero).toContain('position:absolute');
    expect(hero).toContain('pointer-events:none');
    // The SECTION specifically must be positioned, or the absolute scrim
    // escapes it and covers the page. Found by mutation: asserting
    // `hero).toContain('position:relative')` passed via the CONTENT div's own
    // position, so it never checked the section at all.
    const sectionTag = hero.slice(0, hero.indexOf('>') + 1);
    expect(sectionTag).toContain('<section');
    expect(sectionTag, 'the section is not positioned').toContain('position:relative');
    // …and the content must sit above the scrim, not under it.
    expect(hero).toMatch(/class="max-w-5xl mx-auto" style="text-align:center;position:relative;z-index:1"/);
  });

  it('the scrim precedes the content in document order', () => {
    expect(hero.indexOf('rgba(0,0,0,0.55)')).toBeLessThan(hero.indexOf('max-w-5xl'));
  });

  it('keeps the padding and border the hero has always had', () => {
    expect(hero).toContain('padding:5rem 1rem 3rem');
    expect(hero).toContain('border-bottom:1px solid rgba(63,184,175,0.2)');
  });

  it('everything BELOW the hero is unchanged by the image', () => {
    // The prop must not leak into the rest of the page.
    const below = (h: string) => h.slice(h.indexOf('</section>') + 10);
    expect(below(render(HERO))).toBe(below(render(null)));
  });
});

// ── The branch guard ───────────────────────────────────────────────────────
//
// SCOPE, STATED IN THE GUARD: every branch of [service]/page.tsx that renders a
// component named *PestPage must receive a hero — either `heroMedia` (which the
// component then resolves, as DefaultPestPage does) or an already-resolved
// `heroImageUrl`.
//
// VitaGlowServicesPage is deliberately NOT in scope: it returns at the top of
// the route, BEFORE heroMedia is fetched at all, and is not a *PestPage.
describe('every *PestPage branch of the service route receives a hero', () => {
  const route = readFileSync(new URL('../../[service]/page.tsx', import.meta.url), 'utf8');

  /** Every `<XPestPage ... />` element in the route, as written. */
  function pestPageElements(src: string): Array<{ name: string; tag: string }> {
    const out: Array<{ name: string; tag: string }> = [];
    const re = /<([A-Za-z]+PestPage)\b([^>]*)\/>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) out.push({ name: m[1], tag: m[0] });
    return out;
  }

  it('the route file is the one this guard thinks it is', () => {
    expect(route).toContain('export default async function ServicePage');
    expect(route.length).toBeGreaterThan(4000);
  });

  it('finds a NON-EMPTY set of branches — an empty list would pass every assertion below', () => {
    // This repo has hit the empty-list vacuity twice (S294, twice in one
    // sitting). A `for` loop over [] generates no tests and reports success.
    const found = pestPageElements(route);
    expect(found.length).toBe(7);
    expect(found.map((f) => f.name).sort()).toEqual([
      'BoldLocalPestPage', 'CleanFriendlyPestPage', 'DangComicPestPage',
      'DefaultPestPage', 'MetroProPestPage', 'ModernProPestPage',
      'RusticRuggedPestPage',
    ]);
    // Both the count AND the names: a matcher that silently stopped finding one
    // branch would keep the other assertions in this file green.
  });

  /** A branch has a hero if it is handed heroMedia OR an already-resolved URL. */
  const hasHero = (tag: string) => /heroMedia=|heroImageUrl=/.test(tag);

  // The five branches S295 deliberately did NOT fix. Listed here rather than
  // described in a PR body, so the filed defect is visible in code and fixing
  // one of them FORCES an edit to this list. If this ever reads [] the defect
  // is closed; if it grows, a regression shipped.
  const KNOWN_WITHOUT_HERO = [
    'BoldLocalPestPage', 'CleanFriendlyPestPage', 'DangComicPestPage',
    'MetroProPestPage', 'RusticRuggedPestPage',
  ];

  it('exactly the five filed branches still lack a hero — no more, no fewer', () => {
    const missing = pestPageElements(route).filter((f) => !hasHero(f.tag)).map((f) => f.name).sort();
    expect(missing).toEqual(KNOWN_WITHOUT_HERO);
  });

  it('a NEW *PestPage branch without a hero is caught', () => {
    // Adding a branch that forgets the hero is exactly how the five above came
    // to be broken. It must be a deliberate decision, recorded in the list
    // above, not a silent omission.
    const withNewBranch = route + '\n  if (x) return <EighthPestPage tenant={tenant} content={content} />;\n';
    const missing = pestPageElements(withNewBranch).filter((f) => !hasHero(f.tag)).map((f) => f.name).sort();
    expect(missing).toEqual([...KNOWN_WITHOUT_HERO, 'EighthPestPage'].sort());
    expect(missing).not.toEqual(KNOWN_WITHOUT_HERO);
  });

  it('the matcher is live — it finds a planted branch and reads its props', () => {
    const planted = pestPageElements('<FakePestPage tenant={t} content={c} heroImageUrl={h} />');
    expect(planted).toHaveLength(1);
    expect(planted[0].name).toBe('FakePestPage');
    expect(planted[0].tag).toContain('heroImageUrl');
  });

  it('MODERN-PRO receives a resolved heroImageUrl', () => {
    const modernPro = pestPageElements(route).find((f) => f.name === 'ModernProPestPage');
    expect(modernPro, 'the modern-pro branch is gone').toBeDefined();
    expect(modernPro!.tag).toContain('heroImageUrl={heroImageUrl}');
  });

  it('the DEFAULT branch still receives heroMedia', () => {
    const fallback = pestPageElements(route).find((f) => f.name === 'DefaultPestPage');
    expect(fallback!.tag).toContain('heroMedia={heroMedia}');
  });

  it('the route resolves the hero itself, as every other tenant route does', () => {
    expect(route).toContain("import { resolveHeroImage } from '../_lib/heroImage'");
    expect(route).toContain('resolveHeroImage(content, heroMedia)');
  });
});
