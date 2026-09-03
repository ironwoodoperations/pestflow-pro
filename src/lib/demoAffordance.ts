// S325 — THE DEMO-AFFORDANCE PREDICATE, defined once.
//
// THE DEFECT THIS REPLACES. Two components carried a byte-identical copy of:
//
//   const parts = window.location.hostname.split('.')
//   const slug = parts.length >= 3 && hostname.endsWith('.pestflowpro.ai') ? parts[0] : ''
//   return slug === 'pestflow-pro' || slug === ''   // "also show on localhost/dev"
//
// On a CUSTOM DOMAIN the hostname is two parts and does not end in
// .pestflowpro.ai, so `slug` falls through to '' — and '' was the localhost
// escape hatch. So the hatch matched every custom domain. It went live the
// moment precisionlawnsystems.com resolved, putting an internal demo control on
// a paying client's dashboard.
//
// It was wrong in BOTH directions. apex-protect.pestflowpro.ai resolves slug
// 'apex-protect', so the five DEMO TENANTS — the one place these affordances
// belong — never got them.
//
// WHY A HOSTNAME COULD NEVER ANSWER THIS. "Is this a demo tenant?" is a fact
// about the TENANT, and it is already recorded per tenant in
// settings.demo_mode.active. A hostname is a fact about the request. The two
// stopped agreeing the first time a tenant brought its own domain, and would
// have stopped again on the next one.
//
// `=== true`, NEVER `!== false`. A tenant can have NO demo_mode row at all —
// vita-glow has none today (6 settings rows, that key absent), and pls's row is
// `{"active": false}` with no seeded_at. `!== false` would resolve `undefined`
// to true and put the control back on a real client. Same NULL trap as
// `vertical` in S290 and `demo_mode` in S289. Locked by a test.
//
// THE DEV AFFORDANCE IS NOT A HOSTNAME. That is the whole defect. `import.meta.env.DEV`
// is statically replaced by Vite at build time, so in a production bundle this
// reads `demoActive === true || false` — the branch is a constant and no
// request, header or domain can reach it. It is injected as a parameter rather
// than read inline so a test can pin BOTH values: under vitest DEV is true, so a
// test that let it default would assert nothing about production behaviour.

/**
 * Should this tenant see demo-only affordances — the tier switcher, and the
 * self-serve upgrade nudges on the Social tab?
 *
 * @param demoActive  settings.demo_mode.active for the CURRENT tenant. Read once
 *                    in Dashboard and passed down; `undefined` means the tenant
 *                    has no demo_mode row, which is a real and current state.
 * @param isDevBuild  defaults to Vite's build-time DEV constant. Pass explicitly
 *                    in tests — never at a call site.
 */
export function showDemoAffordances(
  demoActive: boolean | null | undefined,
  isDevBuild: boolean = import.meta.env.DEV === true,
): boolean {
  return demoActive === true || isDevBuild === true;
}
