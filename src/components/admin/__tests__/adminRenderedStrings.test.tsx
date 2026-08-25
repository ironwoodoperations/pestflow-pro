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

// S297 — the SECOND module-boundary mock, added for the same reason as the first
// and under the same restraint: it stubs a CONTEXT, never a component.
//
// useTenant() throws outside TenantBootProvider, and ContentPageForm mounts
// HeroImageUpload/PageImageUpload for the 'home' slug — which is the only slug
// that renders the Hero Headline field, i.e. the exact surface S297 defect #4
// lives on. Without this the guard would have to render a slug that hides the
// field and then claim to have covered it. The tenant returned here carries no
// vertical: useAdminPreset resolves that in an effect, and renderToStaticMarkup
// runs no effects, which is why every guarded component takes its vertical as a
// PROP rather than reading the hook.
vi.mock('../../../context/TenantBootProvider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useTenant: () => ({ id: 'test-tenant', slug: 'test', name: 'Test', theme: 'modern-pro',
    primary_color: '#000', accent_color: '#000', logo_url: '', cta_text: '' }),
}));

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import FaqItemForm from '../FaqItemForm';
import { ADMIN_PRESETS, NEUTRAL_ADMIN_PRESET } from '../../../lib/adminVerticalPreset';
import PageHelpBanner from '../PageHelpBanner';
import DemoBanner from '../DemoBanner';
import RemiAddonStrip from '../RemiAddonStrip';
import ComposerTemplates from '../social/ComposerTemplates';
import { resolveTemplateKey, INDUSTRY_TEMPLATES } from '../social/composerTemplateSets';

// pls's REAL stored settings.business_info.industry — free text, 154 chars.
const PLS_REAL_INDUSTRY = 'irrigation and sprinkler system installation and repair, yard drainage and french drains, lake and pond pump systems, sod and grading — East Texas';
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
    categories: ADMIN_PRESETS.pest.faqCategories,
    onSave: noop, onCancel: noop, saving: false, label: 'Save',
  }));

// S285 — THE REGRESSION CASE. An irrigation tenant editing an irrigation FAQ.
// Against main this render contained no 'Sprinkler Systems' option at all and no
// `selected` attribute anywhere: the control painted blank and saving rewrote
// the category to whichever pest species sorted first.
const faqPlsEdit = render('FaqItemForm.edit-irrigation-category',
  createElement(FaqItemForm, {
    initial: { question: 'How often should I run my system?', answer: 'A', category: 'Sprinkler Systems', sort_order: '0' },
    categories: ADMIN_PRESETS.irrigation.faqCategories,
    onSave: noop, onCancel: noop, saving: false, label: 'Save',
  }));

// A category stored on a row but outside its vertical's preset — the parity case
// for FaqTab's otherCats fallback. It must still be selectable, or opening the
// edit form silently changes it.
const faqOffPreset = render('FaqItemForm.edit-off-preset-category',
  createElement(FaqItemForm, {
    initial: { question: 'Q', answer: 'A', category: 'Retaining Walls', sort_order: '0' },
    categories: ADMIN_PRESETS.irrigation.faqCategories,
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

// S285 — the vertical-keyed renders. ComposerTemplates paints COLLAPSED, so the
// template names are not in the markup; these assert the RESOLVED SET instead,
// via the exported lookup, and the renders prove the component still mounts with
// the new prop.
render('ComposerTemplates.vertical-irrigation',
  createElement(ComposerTemplates, {
    industry: PLS_REAL_INDUSTRY, vertical: 'irrigation',
    businessName: 'Precision Lawn Systems', onSelectTopic: noop,
  }));
render('ComposerTemplates.vertical-pest',
  createElement(ComposerTemplates, {
    industry: 'Pest Control', vertical: 'pest', businessName: 'Ironclad', onSelectTopic: noop,
  }));

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

describe('S285 — FaqItemForm renders the tenant\'s OWN categories', () => {
  const optionsOf = (html: string) =>
    [...html.matchAll(/<option[^>]*value="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));

  it('with no categories prop it falls back to NEUTRAL — never to pest', () => {
    const options = optionsOf(faqDefault);
    expect(options).toEqual(NEUTRAL_ADMIN_PRESET.faqCategories);
    // The defect this replaces: main rendered ten options, nine of them pest species.
    expect(options.join(' ')).not.toMatch(/ant|spider|wasp|scorpion|rodent|mosquito|flea|tick|roach|bed.?bug/i);
  });

  it('a pest tenant still gets exactly the ten categories its live rows are stored against', () => {
    expect(optionsOf(faqPestEdit)).toEqual(ADMIN_PRESETS.pest.faqCategories);
    expect(ADMIN_PRESETS.pest.faqCategories).toHaveLength(10);
  });

  it('a pest category renders as the selected option', () => {
    expect(faqPestEdit).toMatch(/<option[^>]*selected[^>]*value="Rodents"|value="Rodents"[^>]*selected/);
  });

  // THE REGRESSION TEST the brief asked for. Fails against main.
  it('an irrigation category renders as a SELECTED option, not a blank control', () => {
    expect(faqPlsEdit).toContain('Sprinkler Systems');
    expect(faqPlsEdit).toMatch(/<option[^>]*selected[^>]*value="Sprinkler Systems"|value="Sprinkler Systems"[^>]*selected/);
  });

  it('an irrigation tenant is offered irrigation categories and no pest species', () => {
    const options = optionsOf(faqPlsEdit);
    expect(options).toEqual(ADMIN_PRESETS.irrigation.faqCategories);
    expect(options.join(' ')).not.toMatch(/ant|spider|wasp|scorpion|rodent|mosquito|flea|tick|roach|bed.?bug/i);
  });

  it('a category outside the preset is appended and stays selected, so editing cannot silently change it', () => {
    expect(optionsOf(faqOffPreset)).toEqual([...ADMIN_PRESETS.irrigation.faqCategories, 'Retaining Walls']);
    expect(faqOffPreset).toMatch(/<option[^>]*selected[^>]*value="Retaining Walls"|value="Retaining Walls"[^>]*selected/);
  });

  it('the question placeholder follows the trade rather than naming pest treatments', () => {
    expect(faqDefault).toContain(NEUTRAL_ADMIN_PRESET.placeholders.faqQuestion.replace(/'/g, '&#x27;'));
    expect(faqDefault).not.toContain('treatments safe for pets');
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

  // S285 — this assertion USED to read `toContain('FaqItemForm.default')`, and
  // it passed, because the default render emitted nine pest species to every
  // tenant. It is inverted rather than deleted: the discovery artefact is more
  // useful as a standing guard that the default never regresses to pest than as
  // a record of the state it was in.
  it('the FAQ form no longer emits pest species by default', () => {
    expect(emitting.map((r) => r.name)).not.toContain('FaqItemForm.default');
  });

  it('the FAQ form still emits pest species when the tenant IS a pest tenant', () => {
    expect(emitting.map((r) => r.name)).toContain('FaqItemForm.edit-pest-category');
  });

  it('the irrigation FAQ render emits no pest vocabulary at all', () => {
    expect(emitting.map((r) => r.name)).not.toContain('FaqItemForm.edit-irrigation-category');
  });

  // S297 — INVERTED, not deleted, exactly as the FaqItemForm.default assertion
  // above was in S285. Both recorded a leak that has now been fixed, and both are
  // more useful standing guard against its return than as a record of it.
  // CS_INITIAL_FORM/OB_INITIAL_FORM carry vertical: '' — an operator who has not
  // yet picked a trade — so these are the "unrecorded" case.
  it('the client-setup business step no longer emits a pest example business name', () => {
    expect(visibleText(cs1) + cs1).not.toMatch(/Acme Pest Solutions|ironclad-pest/);
  });

  it('the onboarding business step no longer emits pest example copy', () => {
    expect(obBiz).not.toMatch(/Apex Pest Solutions|Your local pest experts|TPCL/);
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
  // S297 — inverted. This one named BOTH a trade and a region in a single string.
  // The region hardcoding below it is untouched and still recorded as a finding:
  // an address example is a different class from a trade claim, and S297 is
  // vocabulary only.
  it('the client-setup tagline placeholder no longer names East Texas or a trade', () => {
    // React escapes the apostrophe in an attribute value.
    expect(cs1).not.toContain('East Texas&#x27;s Most Trusted Pest Control');
    expect(cs1).not.toContain('Most Trusted');
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


// ---------------------------------------------------------------------------
// S285 — ComposerTemplates now keys on `vertical`, with `industry` kept as a
// fallback so 'hvac', 'plumbing' and 'roofing' (which have no vertical literal)
// keep their template sets.
// ---------------------------------------------------------------------------

describe('ComposerTemplates lookup', () => {
  it('prefers vertical over industry', () => {
    expect(resolveTemplateKey('irrigation', PLS_REAL_INDUSTRY)).toBe('irrigation');
    expect(resolveTemplateKey('pest', 'anything at all')).toBe('pest control');
  });

  it("falls through to 'generic' for pls's real industry string when vertical is absent — the state on main", () => {
    expect(resolveTemplateKey(null, PLS_REAL_INDUSTRY)).toBe('generic');
    expect(resolveTemplateKey(null, 'Medical Aesthetics')).toBe('generic');
  });

  it('keeps the industry path working for the three sets with no vertical literal', () => {
    expect(resolveTemplateKey(null, 'HVAC')).toBe('hvac');
    expect(resolveTemplateKey(null, 'Plumbing')).toBe('plumbing');
    expect(resolveTemplateKey(undefined, 'Roofing')).toBe('roofing');
  });

  it('an unknown vertical does not resolve to pest', () => {
    for (const v of [null, undefined, '', 'hvac', 'Pest', 'medical_aesthetics']) {
      expect(resolveTemplateKey(v, '')).not.toBe('pest control');
    }
  });

  it('the irrigation set exists and carries no pest vocabulary', () => {
    const set = INDUSTRY_TEMPLATES['irrigation'];
    expect(set).toBeDefined();
    expect(JSON.stringify(set)).not.toMatch(/\b(pest|termite|spider|roach|mosquito|scorpion|bed ?bug|flea|rodent|wasp|hornet)\b/i);
  });
});


// ===========================================================================
// S297 — THE GUARD.
//
// Everything above this line is S282/S285 DISCOVERY: it records what the admin
// renders. This block is the first part of the file that ASSERTS what it must
// never render — no admin string may name a trade for a tenant whose vertical is
// irrigation or unrecorded.
//
// WHY THE COMPONENTS BELOW TAKE THE VERTICAL AS A PROP.
// renderToStaticMarkup does not run effects, and `useAdminPreset` resolves the
// vertical in one. A component that reads the hook internally therefore renders
// as NEUTRAL here no matter what the tenant is, so an irrigation case run
// through it would pass vacuously. S297 moved the vertical dependency of every
// component it touched out to the prop boundary, which is exactly where this
// guard binds. The consequence is a REAL LIMIT, stated rather than papered over:
//
//   - BusinessInfoSection and LocationsTab load their data in an effect and
//     paint a "Loading..." stub until it resolves. renderToStaticMarkup runs no
//     effects, and this project has neither jsdom nor @testing-library/react to
//     mount them with, so rendering them here would assert the loading state and
//     nothing else. BusinessInfoSection's two defects are asserted as VALUES
//     (INITIAL_BUSINESS_INFO_FORM / industryFromStored) — real assertions on the
//     objects the component uses, not a grep. LocationsTab's three placeholders
//     are covered only by the preset-derivation assertion at the end of this
//     block; mounting it needs a DOM and is the follow-up S297 leaves open.
//   - useComposer is a hook, so its default is asserted the same way.
// ===========================================================================

import SeoInlineEditor from '../seo/SeoInlineEditor';
import ContentPageForm from '../ContentPageForm';
import { getAdminPreset, ADMIN_VERTICAL_LABELS, isAdminVertical } from '../../../lib/adminVerticalPreset';
import { INITIAL_BUSINESS_INFO_FORM, industryFromStored } from '../settings/businessInfoDefaults';
import { INITIAL_COMPOSER_INDUSTRY } from '../social/useComposer';
import { TAB_SUBTITLES } from '../../../pages/admin/dashboardTabCopy';
import type { SeoPageRow, EditorForm } from '../seo/seoTypes';
import type { SeoFixChain } from '../seo/useSeoFixChain';

// Word boundaries throughout, matching the precedent set in seo/seoPrompts.test.ts:
// a bare /pest/ matches "PestFlow Pro" and has already produced a false positive
// in this codebase. TPCL is here deliberately — it is "Texas Pest Control
// Licence", pest vocabulary wearing an acronym, and it was a live placeholder in
// two admin forms before S297.
const PEST_VOCAB_STRICT =
  /\b(pest|pests|termite|termites|spider|spiders|roach|roaches|mosquito|mosquitoes|scorpion|scorpions|bed ?bugs?|flea|fleas|tick|ticks|rodent|rodents|wasp|wasps|hornet|hornets|exterminator|TPCL)\b/i;

/**
 * Remove PLATFORM IDENTITY before matching. The product is named HomeFlow Pro
 * since S294, but its DOMAIN is still pestflowpro.ai and the admin renders it —
 * Step 1 of the client-setup wizard shows "<slug>.pestflowpro.ai" live. That is a
 * URL, not a claim about the tenant's trade, and a guard that flagged it would be
 * turned off within a week.
 *
 * This is the repair to the two `.replace(/PestFlow Pro/gi, '')` strips at :266-267,
 * which went partly inert after S294 in TWO ways that were never the same bug:
 *   1. the domain `pestflowpro.ai` was never covered by them at all, and
 *   2. `visibleText()` strips TAGS, so the marketing shells'
 *      `Pest<span>Flow</span> Pro` reaches the matcher as "Pest Flow Pro" — which
 *      /PestFlow Pro/ does not match either.
 * Both forms are handled here. Those two call sites are left as they are: they
 * feed the S282 discovery artefact, and rewriting them would restate that
 * artefact rather than guard anything.
 */
export function stripPlatformIdentity(s: string): string {
  return s
    .replace(/pestflowpro\.(ai|com)/gi, ' ')
    .replace(/support@pestflow\.ai/gi, ' ')
    .replace(/pestflow-pro/gi, ' ')
    .replace(/pest\s*flow\s*pro/gi, ' ');
}

/**
 * Remove the TRADE SELECTOR'S OWN OPTIONS before matching.
 *
 * Both provisioning wizards render VERTICAL_OPTIONS — the menu the operator picks
 * the trade FROM. "Pest Control" appearing there is not a claim about this
 * tenant; it is the option that makes pest selectable at all, and a guard that
 * flagged it could only be satisfied by deleting pest as a choosable vertical.
 *
 * Keyed on the option's VALUE, which is the CHECK-constrained vertical literal,
 * so exactly two elements in the admin match. Deliberately NOT a text-level strip
 * of the string "Pest Control": that would also blank a leaking placeholder like
 * "Acme Pest Control" and quietly gut the guard. Proven narrow below.
 */
export function stripVerticalSelector(html: string): string {
  return html.replace(/<option[^>]*value="(?:pest|irrigation)"[^>]*>[\s\S]*?<\/option>/gi, ' ');
}

const scrub = (html: string) => {
  const stripped = stripVerticalSelector(html);
  return stripPlatformIdentity(visibleText(stripped) + ' ' + stripped);
};

// ── Fixtures. Deliberately trade-free, so a hit means the COMPONENT put it there.
const SEO_PAGE: SeoPageRow = {
  slug: 'home', label: 'Home', url: '/', type: 'static', isLive: true, hasMeta: true,
  metaTitle: '', metaDescription: '', focusKeyword: '', ogTitle: '', ogDescription: '',
  userEdited: false,
};
const SEO_FORM: EditorForm = {
  meta_title: '', meta_description: '', focus_keyword: '', og_title: '', og_description: '',
} as EditorForm;
const FIX_CHAIN = {
  generating: null, applying: null, generated: {},
  onGenerate: noop, onApply: noop, onDismiss: noop,
} as unknown as SeoFixChain;
const CONTENT_FORM = {
  title: '', subtitle: '', intro: '', video_url: '', image_url: '',
  pageHeroImageUrl: '', image1Url: '', image2Url: '', image3Url: '',
};

/** The hero-headline example exactly as ContentTab builds it. */
function heroPlaceholderFor(vertical: string | null): string {
  return isAdminVertical(vertical)
    ? `e.g. Professional ${getAdminPreset(vertical).entityLabels.service} you can trust`
    : '';
}

/**
 * Every guarded render, for BOTH non-pest tenants: 'irrigation' (recorded, has a
 * preset) and null (unrecorded — the live tenant that is deliberately NULL).
 *
 * ContentPageForm renders the 'home' slug specifically: it is the only slug that
 * renders the Hero Headline field, which is where defect #4 lives. That needs the
 * TenantBootProvider mock at the top of this file — see the note there.
 */
const NON_PEST_VERTICALS: Array<'irrigation' | null> = ['irrigation', null];

const GUARDED: Array<{ name: string; el: React.ReactElement }> = NON_PEST_VERTICALS.flatMap((v) => {
  const tag = v ?? 'unrecorded';
  const preset = getAdminPreset(v);
  const tradeForm = { ...CS_INITIAL_FORM, vertical: v === 'irrigation' ? 'irrigation' : '' };
  const obTradeForm = { ...OB_INITIAL_FORM, vertical: v === 'irrigation' ? 'irrigation' : '' };
  return [
    { name: `SeoInlineEditor.${tag}`, el: createElement(SeoInlineEditor, {
        page: SEO_PAGE, form: SEO_FORM, saving: false, aiGenerating: false, aiGenerated: false,
        fixChain: FIX_CHAIN, keywordExample: preset.placeholders.seoKeyword,
        onChange: noop, onSave: noop, onCancel: noop, onAiGenerate: noop,
      }) },
    { name: `ContentPageForm.${tag}`, el: createElement(ContentPageForm, {
        selectedSlug: 'home', form: CONTENT_FORM, loading: false, saving: false,
        aiLoading: false, reverting: false, isServicePage: false,
        serviceLabel: preset.entityLabels.service,
        heroHeadlinePlaceholder: heroPlaceholderFor(v),
        updateField: noop, onSave: noop, onGenerateAI: noop, onRevert: noop,
      } as never) },
    { name: `client-setup.Step1BusinessInfo.${tag}`, el:
        createElement(Step1BusinessInfo, { form: tradeForm, setForm: noop } as never) },
    { name: `client-setup.Step3Domain.${tag}`, el:
        createElement(Step3Domain, { form: tradeForm, setForm: noop } as never) },
    { name: `onboarding.StepBusinessInfo.${tag}`, el:
        createElement(StepBusinessInfo, { form: obTradeForm, updateField: noop, onNext: noop, onBack: noop } as never) },
    { name: `FaqItemForm.${tag}`, el: createElement(FaqItemForm, {
        categories: preset.faqCategories, onSave: noop, onCancel: noop, saving: false, label: 'Add FAQ',
      }) },
  ];
});

const GUARDED_RENDERS = GUARDED.map(({ name, el }) => ({ name, html: renderToStaticMarkup(el) }));

describe('S297 — the guard cannot pass vacuously', () => {
  // MUTATION 2 of the brief: emptying the component list must go red. It does,
  // here, explicitly — not as a side effect of a for-loop over nothing.
  it('the guarded set is non-empty and covers both non-pest verticals', () => {
    expect(GUARDED_RENDERS.length).toBe(12);
    expect(GUARDED_RENDERS.length).toBeGreaterThanOrEqual(12);
    for (const tag of ['irrigation', 'unrecorded']) {
      expect(GUARDED_RENDERS.filter((r) => r.name.endsWith(`.${tag}`))).toHaveLength(6);
    }
  });

  it('every guarded component produced real markup', () => {
    for (const { name, html } of GUARDED_RENDERS) {
      expect(html.length, `${name} produced no markup`).toBeGreaterThan(80);
    }
  });

  // MUTATION 1 of the brief: a sixth leaking placeholder must go red. Rather than
  // describing that, the leak is BUILT and run through the identical pipeline, so
  // the proof stays in the suite instead of in a commit message.
  it('the matcher catches a leaking placeholder pushed through the same pipeline', () => {
    const leaks = [
      createElement('input', { placeholder: 'e.g. pest control Tyler TX' }),
      createElement('input', { placeholder: 'Acme Pest Solutions' }),
      createElement('input', { placeholder: 'TPCL-12345' }),
      createElement('p', {}, 'Overview of your pest control business'),
      createElement('input', { placeholder: 'e.g. Spring Termite Season' }),
      createElement('input', { placeholder: 'Your local pest experts' }),
    ];
    for (const el of leaks) {
      expect(PEST_VOCAB_STRICT.test(scrub(renderToStaticMarkup(el)))).toBe(true);
    }
  });

  it('every alternative in the matcher is live — one probe per branch', () => {
    const probes = ['pest control', 'termite letter', 'spider control', 'roach gel',
      'mosquito misting', 'scorpion sting', 'bed bug heat', 'bedbug heat', 'flea dip',
      'tick season', 'rodent exclusion', 'wasp nest', 'hornet nest', 'exterminator visit',
      'TPCL-12345', 'Pests everywhere'];
    for (const p of probes) {
      expect(PEST_VOCAB_STRICT.test(p), `matcher is dead for "${p}"`).toBe(true);
    }
  });

  it('the trade-selector strip removes ONLY the option elements, not the words in them', () => {
    const sel = '<select><option value="">Not listed</option>'
      + '<option value="pest">Pest Control</option>'
      + '<option value="irrigation">Irrigation &amp; Sprinklers</option></select>';
    expect(PEST_VOCAB_STRICT.test(scrub(sel))).toBe(false);
    // The same words ANYWHERE else still trip the guard — including in a
    // placeholder on the very same select, and in a third option.
    expect(PEST_VOCAB_STRICT.test(scrub(sel + '<input placeholder="Acme Pest Control" />'))).toBe(true);
    expect(PEST_VOCAB_STRICT.test(scrub(sel.replace('</select>', '<option value="x">Pest Control</option></select>')))).toBe(true);
    expect(PEST_VOCAB_STRICT.test(scrub('<p>Overview of your pest control business</p>'))).toBe(true);
  });

  it('the platform strip covers the domain and the tag-split brand, and strips nothing else', () => {
    // The forms the pre-S297 `.replace(/PestFlow Pro/gi, '')` strips missed.
    expect(PEST_VOCAB_STRICT.test(stripPlatformIdentity('acme.pestflowpro.ai'))).toBe(false);
    expect(PEST_VOCAB_STRICT.test(stripPlatformIdentity('Pest Flow Pro'))).toBe(false);
    expect(PEST_VOCAB_STRICT.test(stripPlatformIdentity('support@pestflow.ai'))).toBe(false);
    expect(PEST_VOCAB_STRICT.test(stripPlatformIdentity('slug === pestflow-pro'))).toBe(false);
    // …and it is not a blanket /pest/ delete: real vocabulary still gets through.
    expect(PEST_VOCAB_STRICT.test(stripPlatformIdentity('pest control in Tyler'))).toBe(true);
    expect(PEST_VOCAB_STRICT.test(stripPlatformIdentity('Acme Pest Solutions'))).toBe(true);
  });
});

describe('S297 — no admin string names a trade for an irrigation or unrecorded tenant', () => {
  it.each(GUARDED_RENDERS.map((r) => [r.name, r.html] as const))(
    '%s emits no pest vocabulary',
    (name, html) => {
      const text = scrub(html);
      const hit = text.match(PEST_VOCAB_STRICT);
      expect(hit === null, `${name} leaked "${hit?.[0]}" — in: …${
        hit ? text.slice(Math.max(0, (hit.index ?? 0) - 60), (hit.index ?? 0) + 60) : ''
      }…`).toBe(true);
    },
  );

  // The pest tenant is the control: the same components, keyed to pest, SHOULD
  // still say pest. A guard that passed by deleting every example everywhere
  // would be indistinguishable from one that resolves the trade correctly.
  it('a PEST tenant still gets its trade back — the guard is not a blanket delete', () => {
    const pest = getAdminPreset('pest');
    const seo = renderToStaticMarkup(createElement(SeoInlineEditor, {
      page: SEO_PAGE, form: SEO_FORM, saving: false, aiGenerating: false, aiGenerated: false,
      fixChain: FIX_CHAIN, keywordExample: pest.placeholders.seoKeyword,
      onChange: noop, onSave: noop, onCancel: noop, onAiGenerate: noop,
    }));
    expect(PEST_VOCAB_STRICT.test(scrub(seo))).toBe(true);

    const step1 = renderToStaticMarkup(createElement(Step1BusinessInfo, {
      form: { ...CS_INITIAL_FORM, vertical: 'pest' }, setForm: noop,
    } as never));
    expect(step1).toContain('Acme Pest Control');
  });
});

describe('S297 — the five defects, at the boundary each one lives on', () => {
  it('1. the Focus Keyword help AND placeholder both follow the preset', () => {
    for (const v of NON_PEST_VERTICALS) {
      const html = renderToStaticMarkup(createElement(SeoInlineEditor, {
        page: SEO_PAGE, form: SEO_FORM, saving: false, aiGenerating: false, aiGenerated: false,
        fixChain: FIX_CHAIN, keywordExample: getAdminPreset(v).placeholders.seoKeyword,
        onChange: noop, onSave: noop, onCancel: noop, onAiGenerate: noop,
      }));
      // Two strings, one field — the brief's framing. Neither may survive.
      expect(html).not.toContain('pest control Tyler TX');
      expect(html).toContain(getAdminPreset(v).placeholders.seoKeyword);
    }
  });

  it('2. the industry default is empty in BOTH places, and empty stored stays empty', () => {
    expect(INITIAL_BUSINESS_INFO_FORM.industry).toBe('');
    // The worse of the two: a stored row with no industry must not acquire one.
    expect(industryFromStored({ name: 'Precision Lawn Systems' })).toBe('');
    expect(industryFromStored({ industry: '' })).toBe('');
    expect(industryFromStored(null)).toBe('');
    // …while a real stored value is still returned untouched.
    expect(industryFromStored({ industry: PLS_REAL_INDUSTRY })).toBe(PLS_REAL_INDUSTRY);
    expect(PEST_VOCAB_STRICT.test(INITIAL_BUSINESS_INFO_FORM.industry)).toBe(false);
  });

  it('3. the composer industry default names no trade', () => {
    expect(INITIAL_COMPOSER_INDUSTRY).toBe('');
    expect(PEST_VOCAB_STRICT.test(INITIAL_COMPOSER_INDUSTRY)).toBe(false);
  });

  it('4. the Hero Headline example follows the vertical, and is EMPTY when unrecorded', () => {
    expect(heroPlaceholderFor(null)).toBe('');
    expect(heroPlaceholderFor('medical_aesthetics')).toBe('');
    expect(heroPlaceholderFor('irrigation')).toBe('e.g. Professional irrigation service you can trust');
    expect(PEST_VOCAB_STRICT.test(heroPlaceholderFor('irrigation'))).toBe(false);
    // Recorded pest still gets a pest example — see the control test above.
    expect(PEST_VOCAB_STRICT.test(heroPlaceholderFor('pest'))).toBe(true);
  });

  it('5. the client-setup tagline names neither a trade nor a region', () => {
    const html = renderToStaticMarkup(
      createElement(Step1BusinessInfo, { form: CS_INITIAL_FORM, setForm: noop } as never));
    expect(html).not.toContain('East Texas&#x27;s Most Trusted Pest Control');
    expect(html).not.toContain('Most Trusted');
  });
});

describe('S297 — the admin dashboard tab subtitles', () => {
  // The one addition Scott called before merge, and the correction that came with
  // it: I had filed this report-only on the grounds that it is COPY rather than a
  // placeholder. The taxonomy was right and the call was wrong — `dashboard` is
  // the DEFAULT tab, so this string is the first line every tenant reads on every
  // login, and the other thirteen subtitles were already trade-neutral. The
  // outlier was the leak, not the design.
  //
  // Asserted over the WHOLE MAP rather than the one entry, so a pest subtitle
  // added to any future tab goes red too. Dashboard.tsx itself is not rendered
  // here: it pulls a lazy-loaded tab graph and the router, which is why the map
  // moved to its own module.

  it('the map is real and covers every tab — it cannot pass by being empty', () => {
    expect(Object.keys(TAB_SUBTITLES)).toHaveLength(14);
    expect(TAB_SUBTITLES.dashboard).toBe('Overview of your business');
    for (const [tab, text] of Object.entries(TAB_SUBTITLES)) {
      expect(text.length, `${tab} has no subtitle`).toBeGreaterThan(10);
    }
  });

  it('no tab subtitle names a trade', () => {
    for (const [tab, text] of Object.entries(TAB_SUBTITLES)) {
      const hit = stripPlatformIdentity(text).match(PEST_VOCAB_STRICT);
      expect(hit === null, `TAB_SUBTITLES.${tab} leaked "${hit?.[0]}" — "${text}"`).toBe(true);
    }
  });

  it('the subtitle is trade-neutral by construction, not by lookup', () => {
    // It takes no vertical, so it cannot go blank while useAdminPreset's effect
    // is in flight — the failure mode an empty-when-unrecorded placeholder
    // accepts, and which a page header should not.
    expect(TAB_SUBTITLES.dashboard).not.toBe('');
    expect(PEST_VOCAB_STRICT.test(TAB_SUBTITLES.dashboard)).toBe(false);
  });
});

describe('S297 — LocationsTab, whose placeholders are BUILT at render time', () => {
  // LocationsTab calls useTenant() and cannot be mounted without a DOM, so this
  // asserts the derivation it now performs rather than its markup. Stated as a
  // partial check, not as coverage of the component.
  const tradeLabelFor = (v: string | null) => (isAdminVertical(v) ? ADMIN_VERTICAL_LABELS[v] : '');

  it('an unrecorded vertical yields no trade label, so all three placeholders are empty', () => {
    for (const v of [null, '', 'medical_aesthetics', 'Pest']) {
      expect(tradeLabelFor(v)).toBe('');
    }
  });

  it('irrigation yields an irrigation label and no pest vocabulary', () => {
    const label = tradeLabelFor('irrigation');
    expect(label).toBe('Irrigation & Sprinklers');
    for (const built of [`Tyler ${label}`, `${label} in Tyler | Your Business`, `${label.toLowerCase()} tyler`]) {
      expect(PEST_VOCAB_STRICT.test(built)).toBe(false);
    }
  });
});
