import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { showDemoAffordances } from '../../../lib/demoAffordance';

// S325 — THE DEMO TIER SWITCHER RENDERED ON EVERY CUSTOM DOMAIN.
//
// THE DEFECT. TierToggle and SocialTab each carried:
//
//   const slug = parts.length >= 3 && hostname.endsWith('.pestflowpro.ai') ? parts[0] : ''
//   return slug === 'pestflow-pro' || slug === ''
//
// On precisionlawnsystems.com the hostname is two parts and is not
// .pestflowpro.ai, so slug fell through to '' — the localhost escape hatch —
// and the function returned TRUE. The hatch matched every custom domain, and it
// went live the moment a paying client got their own domain.
//
// Wrong in both directions: apex-protect.pestflowpro.ai resolved slug
// 'apex-protect' and returned FALSE, so the five demo tenants — the one place
// these affordances belong — never saw them.
//
// NOT a privilege escalation, and this file does not pretend otherwise:
// PlanContext.setTier writes local React state only, and every gated action
// re-checks server-side via check_tenant_access. What it was is an internal
// demo control, and a self-serve upgrade pitch, on a concierge client's
// dashboard.
//
// THREE LAYERS BELOW, because a predicate test alone would pass while the
// components still read the hostname:
//   1. the predicate itself, against the REAL live demo_mode values
//   2. a source scan proving neither component can consult a hostname again
//   3. a render, proving the prop actually gates the markup

// ── 1. The predicate, against live data ─────────────────────────────────────
//
// Values read from the live settings table during S324. `isDevBuild` is passed
// EXPLICITLY as false throughout: under vitest `import.meta.env.DEV` is true, so
// a test that let it default would assert nothing whatsoever about what a
// production bundle does. That is the trap this parameter exists to avoid.
describe('showDemoAffordances — the five demo tenants, and nobody else', () => {
  const DEMO_TENANTS = ['apex-protect', 'coastal-pest', 'heartland-pest', 'metro-pest-concierge', 'urban-strike'];

  for (const slug of DEMO_TENANTS) {
    it(`${slug}: demo_mode {active:true} → shows`, () => {
      expect(showDemoAffordances(true, false)).toBe(true);
    });
  }

  it('pls: demo_mode {"active": false} (no seeded_at) → hidden', () => {
    expect(showDemoAffordances(false, false)).toBe(false);
  });

  it('dang and the operator tenant: {active:false, seeded_at:""} → hidden', () => {
    expect(showDemoAffordances(false, false)).toBe(false);
  });

  // THE NULL TRAP, and the reason the brief said `=== true` and never `!== false`.
  // vita-glow has NO demo_mode row at all — 6 settings rows, that key absent —
  // so the value reaching this predicate is undefined. `!== false` resolves that
  // to TRUE and puts the control straight back onto a real client.
  it('vita-glow: NO demo_mode row → hidden', () => {
    expect(showDemoAffordances(undefined, false)).toBe(false);
  });

  it('a null value is hidden too — JSON null is not the same absence, and both must fail closed', () => {
    expect(showDemoAffordances(null, false)).toBe(false);
  });

  it('MUTATION: `!== false` would break vita-glow — asserted, not assumed', () => {
    // The exact wrong implementation, run inline. If someone "simplifies"
    // showDemoAffordances to this, the two cases above start failing — this
    // proves they would, rather than trusting that they would.
    const wrong = (d: boolean | null | undefined) => d !== false;
    expect(wrong(undefined)).toBe(true);   // vita-glow: control returns
    expect(wrong(null)).toBe(true);        // and a null row too
    expect(showDemoAffordances(undefined, false)).toBe(false);
    expect(showDemoAffordances(null, false)).toBe(false);
  });

  it('no truthy non-boolean sneaks through — only the literal true', () => {
    for (const junk of ['true', 1, {}, []] as unknown[]) {
      expect(showDemoAffordances(junk as boolean, false), `for ${JSON.stringify(junk)}`).toBe(false);
    }
  });
});

describe('showDemoAffordances — the dev affordance is a build flag, not a hostname', () => {
  it('shows in a dev build regardless of the tenant', () => {
    expect(showDemoAffordances(false, true)).toBe(true);
    expect(showDemoAffordances(undefined, true)).toBe(true);
  });

  it('and contributes nothing in a production build', () => {
    expect(showDemoAffordances(false, false)).toBe(false);
  });

  it('takes NO argument that a request could influence', () => {
    // The signature is the guarantee. Two parameters, both supplied by the app:
    // a value read from the tenant's own settings row, and a constant Vite
    // replaces at build time. Neither can carry a Host header.
    expect(showDemoAffordances).toHaveLength(1); // one required, isDevBuild defaulted
  });
});

// ── 2. The source scan ──────────────────────────────────────────────────────
const SRC = join(__dirname, '..');
/** Comments stripped: both files EXPLAIN the pattern they no longer use. */
const codeOf = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '')
    .replace(/([^:])\/\/.*$/gm, '$1');

describe('neither component can consult a hostname again', () => {
  for (const file of ['TierToggle.tsx', 'SocialTab.tsx']) {
    const code = codeOf(file);

    it(`${file} reads no hostname`, () => {
      // THE MUTATION THE BRIEF ASKED FOR. Restoring the '' fallback means
      // restoring `window.location.hostname` — this fails the moment it returns.
      expect(code, `${file} is back to deciding from the request host`).not.toMatch(/window\.location|location\.hostname|\.hostname\b/);
    });

    it(`${file} names no platform domain`, () => {
      expect(code).not.toMatch(/pestflowpro\.(ai|com)/);
    });

    it(`${file} defines no local demo predicate — it uses the shared one`, () => {
      expect(code).not.toMatch(/function\s+useIsDemoTenant/);
      expect(code).toContain('showDemoAffordances');
    });

    it(`${file} was actually read, not an empty string passing trivially`, () => {
      expect(code.length).toBeGreaterThan(400);
    });
  }

  // WITHOUT THIS, the prop could simply stop being passed. Both components
  // would then fail closed — safe for pls, but the five demo tenants lose the
  // control permanently, which is the OTHER half of the defect this fixes.
  it('Dashboard passes demoActive to both consumers', () => {
    const dash = readFileSync(join(SRC, '..', '..', 'pages', 'admin', 'Dashboard.tsx'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^[ \t]*\/\/.*$/gm, '');
    expect(dash, 'Dashboard no longer reads demo_mode').toMatch(/setDemoActive\(\s*demoRes\.data\?\.value\?\.active === true\s*\)/);
    // `[\s\S]{0,200}?`, NOT `[^>]*`: SocialTab's other prop is
    // `onNavigate={(t) => …}` and the arrow contains a `>`, so a
    // negated-`>` class stops dead inside the attribute list and the assertion
    // fails on correct code. It did, on the first run of this test.
    expect(dash, 'TierToggle lost its demoActive prop').toMatch(/<TierToggle[\s\S]{0,200}?demoActive=\{demoActive\}/);
    expect(dash, 'SocialTab lost its demoActive prop').toMatch(/<SocialTab[\s\S]{0,200}?demoActive=\{demoActive\}/);
  });

  // The SECOND render site, which the first pass of this fix missed:
  // IronwoodSocial reuses SocialTab for the operator's own accounts. Under the
  // old predicate /ironwood (pestflowpro.ai — two labels) resolved '' and got
  // the demo affordances; the brief says the operator tenant must not.
  it('IronwoodSocial pins demoActive explicitly rather than relying on the default', () => {
    const iw = readFileSync(join(SRC, '..', 'ironwood', 'IronwoodSocial.tsx'), 'utf8')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    expect(iw, 'IronwoodSocial renders SocialTab without saying what it intends')
      .toMatch(/<SocialTab\s+demoActive=\{false\}\s*\/>/);
  });

  it('the scan is not vacuous — it catches the exact code that was removed', () => {
    const REMOVED = `
      const parts = window.location.hostname.split('.')
      const slug = parts.length >= 3 && window.location.hostname.endsWith('.pestflowpro.ai') ? parts[0] : ''
      return slug === 'pestflow-pro' || slug === ''
    `;
    expect(/window\.location|location\.hostname|\.hostname\b/.test(REMOVED)).toBe(true);
    expect(/pestflowpro\.(ai|com)/.test(REMOVED)).toBe(true);
  });
});

// ── 3. The render ───────────────────────────────────────────────────────────
//
// A predicate test and a source scan together still would not prove the prop is
// WIRED — TierToggle could import showDemoAffordances and ignore it. This
// renders the real component.
//
// usePlan is mocked at the module boundary because PlanProvider calls useTenant,
// which throws outside TenantBootProvider. Nothing about TierToggle's own markup
// is faked.
vi.mock('../../../hooks/usePlan', () => ({
  usePlan: () => ({ tier: 2, loading: false, canAccess: () => true, setTier: () => {}, refreshPlan: () => {} }),
}));

describe('TierToggle renders only for a demo tenant', () => {
  // Under vitest import.meta.env.DEV is TRUE, which would show the control for
  // every case below and make this whole block vacuous. Stubbed to false so
  // these assert PRODUCTION behaviour — the thing that was broken.
  afterEach(() => { vi.unstubAllEnvs(); });

  const render = async (demoActive: boolean | null | undefined) => {
    vi.stubEnv('DEV', false);
    const { default: TierToggle } = await import('../TierToggle');
    return renderToStaticMarkup(createElement(TierToggle, { demoActive }));
  };

  it('renders the switcher for a demo tenant', async () => {
    const html = await render(true);
    expect(html).toContain('Demo Tier');
    expect(html).toContain('Starter');
  });

  it('renders NOTHING for pls — demo_mode.active false', async () => {
    expect(await render(false)).toBe('');
  });

  it('renders NOTHING for vita-glow — no demo_mode row at all', async () => {
    expect(await render(undefined)).toBe('');
  });

  it('renders NOTHING for a null row', async () => {
    expect(await render(null)).toBe('');
  });

  it('the empty results are real — the same component DOES render markup when it should', async () => {
    // Anti-vacuity: without this, a component that always returned null would
    // pass all three assertions above.
    expect((await render(true)).length).toBeGreaterThan(200);
  });
});
