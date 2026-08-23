import { describe, it, expect, vi } from 'vitest';

// Module-boundary mock, and the ONLY one in this file. src/lib/supabase builds a
// real client at import time from Vite env vars that do not exist under vitest,
// so any component whose tree transitively imports it fails to load. Stubbing
// the CLIENT keeps every admin component under test real — nothing about their
// markup is faked. Deliberately not mocking any component: a stub aggressive
// enough to make the render succeed trivially would make this whole layer
// vacuous, which is the failure mode S281 shipped.
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      insert: async () => ({ data: null, error: null }),
      upsert: async () => ({ data: null, error: null }),
    }),
    auth: { getSession: async () => ({ data: { session: null } }) },
    storage: { from: () => ({ upload: async () => ({ data: null, error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
  },
}));

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import FaqItemForm, { FAQ_CATEGORIES } from '../FaqItemForm';
import PageHelpBanner from '../PageHelpBanner';
import DemoBanner from '../DemoBanner';
import RemiAddonStrip from '../RemiAddonStrip';
import ComposerTemplates from '../social/ComposerTemplates';
import ComposerPlatformSelector from '../social/ComposerPlatformSelector';
import LeadFunnel from '../reports/LeadFunnel';
import ShellSelector from '../client-setup/components/ShellSelector';
import Step1BusinessInfo from '../client-setup/steps/Step1BusinessInfo';
import Step3Domain from '../client-setup/steps/Step3Domain';
import ClientSetupWizard from '../client-setup/ClientSetupWizard';
import { INITIAL_FORM as CS_INITIAL_FORM } from '../client-setup/types';
import StepBusinessInfo from '../onboarding/StepBusinessInfo';
import StepBranding from '../onboarding/StepBranding';
import { INITIAL_FORM as OB_INITIAL_FORM } from '../onboarding/types';

// S282 LAYER 2 — rendered-output dump for the admin SPA.
//
// Patterned on the public-shell tests (retiredClaims.test.tsx,
// aboutStatsShells.test.tsx): render with renderToStaticMarkup, assert against
// the OUTPUT rather than the source, and write each component's markup to disk
// so the audit has something to diff against later.
//
// Why this layer exists at all: a literal grep over source cannot see a string
// assembled at render time. The `generic` fallback in ComposerTemplates is the
// clearest case — no source line says an irrigation tenant gets pest-free
// template names, but the render proves it.
//
// DISCOVERY ONLY. Nothing here asserts that a string SHOULD change; these
// assertions record what the admin renders today so Phase 3 has a baseline.

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'docs', 'audits', 's282-rendered');
mkdirSync(OUT_DIR, { recursive: true });

const noop = () => {};

function dump(name: string, html: string) {
  writeFileSync(join(OUT_DIR, `${name}.html`), html, 'utf8');
  return html;
}

/** Visible text only — tags and attributes stripped. */
export function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const RENDERED: Array<{ name: string; html: string }> = [];
function render(name: string, el: React.ReactElement) {
  const html = dump(name, renderToStaticMarkup(el));
  RENDERED.push({ name, html });
  return html;
}

// ---------------------------------------------------------------------------
// The components that render with no session, router or network.
// ---------------------------------------------------------------------------

const faqDefault = render('FaqItemForm.default',
  createElement(FaqItemForm, { onSave: noop, onCancel: noop, saving: false, label: 'Add FAQ' }));

const faqPestEdit = render('FaqItemForm.edit-pest-category',
  createElement(FaqItemForm, {
    initial: { question: 'Q', answer: 'A', category: 'Rodents', sort_order: '0' },
    onSave: noop, onCancel: noop, saving: false, label: 'Save',
  }));

// The pls case: a category that exists in the DB but not in FAQ_CATEGORIES.
const faqPlsEdit = render('FaqItemForm.edit-irrigation-category',
  createElement(FaqItemForm, {
    initial: { question: 'How often should I run my system?', answer: 'A', category: 'Sprinkler Systems', sort_order: '0' },
    onSave: noop, onCancel: noop, saving: false, label: 'Save',
  }));

const help = render('PageHelpBanner',
  createElement(PageHelpBanner, { title: 'FAQ Manager', body: 'Add, edit, or delete FAQ questions by category.' } as never));

render('DemoBanner', createElement(DemoBanner, { onGoLive: noop }));
render('RemiAddonStrip', createElement(RemiAddonStrip, {} as never));

const tplPest = render('ComposerTemplates.pest-control',
  createElement(ComposerTemplates, { industry: 'Pest Control', businessName: 'Acme', onSelectTopic: noop }));
const tplHvac = render('ComposerTemplates.hvac',
  createElement(ComposerTemplates, { industry: 'HVAC', businessName: 'Acme', onSelectTopic: noop }));
const tplIrrigation = render('ComposerTemplates.irrigation-unmapped',
  createElement(ComposerTemplates, { industry: 'Irrigation', businessName: 'Precision Lawn Systems', onSelectTopic: noop }));

render('ComposerPlatformSelector',
  createElement(ComposerPlatformSelector, { platform: 'facebook', connectedKeys: ['facebook'], industry: 'Irrigation', onSelect: noop }));

const funnel = render('LeadFunnel',
  createElement(LeadFunnel, { leads: [{ status: 'new' }, { status: 'won' }, { status: 'lost' }] }));

render('ShellSelector',
  createElement(ShellSelector, { value: 'bold-local', onChange: noop, tier: 4 } as never));

const cs1 = render('client-setup.Step1BusinessInfo',
  createElement(Step1BusinessInfo, { form: CS_INITIAL_FORM, setForm: noop } as never));
const cs3 = render('client-setup.Step3Domain',
  createElement(Step3Domain, { form: CS_INITIAL_FORM, setForm: noop } as never));
render('client-setup.ClientSetupWizard', createElement(ClientSetupWizard, {} as never));

const obBiz = render('onboarding.StepBusinessInfo',
  createElement(StepBusinessInfo, { form: OB_INITIAL_FORM, updateField: noop, onNext: noop, onBack: noop } as never));
const obBrand = render('onboarding.StepBranding',
  createElement(StepBranding, { form: OB_INITIAL_FORM, updateField: noop, onNext: noop, onBack: noop } as never));

// ---------------------------------------------------------------------------
// FAQ_CATEGORIES — the finding the brief asked to be verified, not assumed.
// ---------------------------------------------------------------------------

describe('FaqItemForm: the category select is a closed pest list', () => {
  it('renders exactly the ten hardcoded options and no others', () => {
    const options = [...faqDefault.matchAll(/<option[^>]*value="([^"]*)"/g)]
      .map((m) => m[1].replace(/&amp;/g, '&'));   // React escapes '&' in attributes
    expect(options).toEqual(FAQ_CATEGORIES);
    expect(options).toHaveLength(10);
  });

  it('nine of the ten options are pest species or pest-generic', () => {
    expect(FAQ_CATEGORIES).toContain('Ants');
    expect(FAQ_CATEGORIES).toContain('Wasps & Yellow Jackets');
    expect(FAQ_CATEGORIES).toContain('Bed Bugs');
    // 'General' is the only trade-neutral entry.
    const neutral = FAQ_CATEGORIES.filter((c) => !/ant|spider|wasp|scorpion|rodent|mosquito|flea|tick|roach|bed.?bug/i.test(c));
    expect(neutral).toEqual(['General']);
  });

  it('a pest category that IS in the list renders as the selected option', () => {
    expect(faqPestEdit).toMatch(/<option[^>]*selected[^>]*value="Rodents"|value="Rodents"[^>]*selected/);
  });

  // The pls case. React sets select.value to a value with no matching <option>,
  // so the browser reports selectedIndex -1 and the control paints EMPTY. The
  // category is NOT in the option list and NOT marked selected anywhere.
  it('an irrigation category present in the DB renders NO selected option — the control is blank', () => {
    expect(faqPlsEdit).not.toContain('Sprinkler Systems');
    expect(faqPlsEdit).not.toMatch(/selected/);
  });

  it('the rest of the irrigation row still renders, so only the category is lost visually', () => {
    expect(visibleText(faqPlsEdit)).toContain('Category');
    expect(faqPlsEdit).toContain('How often should I run my system?');
  });
});

// ---------------------------------------------------------------------------
// ComposerTemplates — an industry registry that already exists in the admin.
// ---------------------------------------------------------------------------

describe('ComposerTemplates: the industry registry is NOT reachable by static render', () => {
  // Premise correction. The source has INDUSTRY_TEMPLATES keyed by
  // 'pest control' | 'hvac' | 'plumbing' | 'roofing' | 'generic', and I expected
  // the render to prove which set an unmapped industry gets. It cannot: the
  // component renders COLLAPSED behind useState, so static output is the trigger
  // button and nothing else. Recorded here rather than quietly dropped, and the
  // expanded panel is listed for screenshot capture in the layer-1 doc.

  it('every industry renders the same collapsed trigger — no template names in output', () => {
    for (const html of [tplPest, tplHvac, tplIrrigation]) {
      expect(visibleText(html)).toBe('📋 Use a Template ▼');
    }
  });

  it('pest, hvac and unmapped are byte-identical when collapsed', () => {
    expect(tplPest).toEqual(tplHvac);
    expect(tplPest).toEqual(tplIrrigation);
  });

  it('so no template name — pest or otherwise — reaches static output', () => {
    expect(tplPest).not.toContain('Pest Fact');
    expect(tplHvac).not.toContain('Filter Reminder');
  });
});

// ---------------------------------------------------------------------------
// Pest vocabulary that survives into rendered output.
// ---------------------------------------------------------------------------

const PEST_IN_OUTPUT = /\b(pest|termite|spider|roach|mosquito|scorpion|bed ?bug|flea|rodent|wasp|hornet)\w*/i;

describe('which admin components emit pest vocabulary in their OUTPUT', () => {
  // Recorded, not asserted-against: this is the discovery artefact. The two
  // lists below are what the render actually produced.
  const emitting = RENDERED.filter((r) => PEST_IN_OUTPUT.test(visibleText(r.html).replace(/PestFlow Pro/gi, '')));
  const clean = RENDERED.filter((r) => !PEST_IN_OUTPUT.test(visibleText(r.html).replace(/PestFlow Pro/gi, '')));

  it('at least one component emits pest vocabulary (the audit would be vacuous otherwise)', () => {
    expect(emitting.length).toBeGreaterThan(0);
  });

  it('the FAQ form emits pest species names', () => {
    expect(emitting.map((r) => r.name)).toContain('FaqItemForm.default');
  });

  it('the client-setup business step emits a pest example business name', () => {
    expect(visibleText(cs1) + cs1).toMatch(/Acme Pest Solutions|ironclad-pest/);
  });

  it('the onboarding business step emits pest example copy', () => {
    expect(obBiz).toMatch(/Apex Pest Solutions|Your local pest experts/);
  });

  it('records the clean set too, so the split is visible', () => {
    expect(clean.length).toBeGreaterThan(0);
    expect(clean.map((r) => r.name)).toContain('LeadFunnel');
  });
});

// ---------------------------------------------------------------------------
// Region hardcoded into admin chrome — a TENANT fact, not a trade fact.
// ---------------------------------------------------------------------------

describe('hardcoded region reaches rendered output', () => {
  it('the client-setup tagline placeholder names East Texas', () => {
    // React escapes the apostrophe in an attribute value.
    expect(cs1).toContain('East Texas&#x27;s Most Trusted Pest Control');
  });

  it('address placeholders hardcode Tyler, TX', () => {
    expect(obBiz).toContain('123 Main St, Tyler, TX 75701');
  });
});

// ---------------------------------------------------------------------------
// Everything rendered gets written to docs/audits/s282-rendered/.
// ---------------------------------------------------------------------------

describe('the dump itself', () => {
  it('rendered every component in the set and produced real markup for each', () => {
    expect(RENDERED.length).toBeGreaterThanOrEqual(16);
    for (const { name, html } of RENDERED) {
      expect(html.length, `${name} produced no markup`).toBeGreaterThan(80);
    }
  });

  it('components that should differ by input actually differ', () => {
    // Guards against a stub so aggressive that every render returns the same thing.
    // NOT tplPest vs tplHvac — those are legitimately identical when collapsed,
    // which is the finding above, not a stubbing failure.
    expect(faqDefault).not.toEqual(faqPlsEdit);
    expect(cs1).not.toEqual(cs3);
    expect(obBiz).not.toEqual(obBrand);
  });

  it('unrelated components render unrelated markup', () => {
    expect(visibleText(funnel)).not.toEqual(visibleText(help));
  });
});
