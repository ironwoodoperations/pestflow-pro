// S289 — AI Authority prompt generation.
//
// ai_authority_prompts had rows for exactly ONE tenant: dang's ten, inserted by
// hand. Nothing in the codebase ever created them — ai-authority-worker only
// READS the table — so every other tenant's AI Authority ran, found no prompts,
// and produced nothing. A missing feature, not a defect.
//
// WHAT THESE ARE. Search queries the platform issues ON BEHALF OF the tenant
// against AI engines — "best pest control in Tyler TX" — to find out whether
// those engines mention the business. They are QUESTIONS, not claims: nothing
// here asserts anything about the tenant, which is why the rule (b) machinery
// that governs marketing copy does not apply. What DOES apply: never put an
// offer, a capacity promise, or a superlative about the tenant into one. "best
// pest control in Tyler TX" asks which provider is best; "best pest control
// company — Dang Pest Control" would assert it.
//
// EVERY INPUT IS A TENANT FACT. Business name and city from settings.business_info,
// cities from service_areas, service slugs from the tenant's own page_content /
// vertical preset. Nothing is inferred:
//   - no city  ->  fewer prompts
//   - no service areas  ->  fewer prompts
//   - no services (unrecorded vertical)  ->  NO service prompts at all
// A tenant we know nothing about yields an empty list, and an empty list is the
// correct output. Inventing a trade to fill it would be the S283 defect again.
//
// WHERE THIS LIVES. supabase/functions/_shared/ so ONE implementation serves both
// runtimes. provision-tenant (Deno) cannot import from shared/ or src/ — the
// Supabase CLI only bundles supabase/functions/**, so a cross-tree import would
// deploy broken. The admin UI imports it in the other direction, which Vite
// resolves. The alternative was two copies of the generator, and this codebase
// has spent an entire arc paying for duplicated constants.
//
// Pure: zero imports, no I/O, ES5-safe (the root tsconfig sets no target).

export interface AuthorityLocation {
  city: string;
  /** Two-letter state. NULL in service_areas for many live rows — see below. */
  state?: string | null;
}

export interface AuthorityPromptInputs {
  /** settings.business_info.name */
  businessName: string;
  /** Parsed from settings.business_info.address. '' when unknown. */
  city: string;
  /** Parsed from the same address. '' when unknown. */
  state: string;
  /** service_areas rows for this tenant. */
  serviceAreas: AuthorityLocation[];
  /**
   * The tenant's own service page slugs ('termite-control', 'sprinkler-systems').
   * EMPTY for an unrecorded vertical, which is what makes an unknown trade yield
   * no trade queries rather than pest ones.
   */
  serviceSlugs: string[];
  /** Dang's hand-written set is ten. That is the reference, not a limit found by trial. */
  max?: number;
}

export const DEFAULT_MAX_PROMPTS = 10;

/** 'termite-control' -> 'termite control'. The slug is already the trade phrase. */
function humanise(slug: string): string {
  return slug.replace(/[-_]+/g, ' ').trim();
}

/**
 * "Tyler TX", or "Athens" when no state is recorded.
 *
 * Half of dang's eighteen service_areas rows have a NULL state. The tempting fix
 * is to borrow the state from the business address — dang is in TX, so Athens
 * must be Athens TX. That is an inference, not a fact: there is an Athens in
 * Georgia, Ohio, Alabama and Tennessee. A city-only query is still a valid
 * query, so the state is used only where it is actually recorded.
 */
function formatLocation(loc: AuthorityLocation): string {
  const city = (loc.city || '').trim();
  if (!city) return '';
  const state = (loc.state || '').trim();
  return state ? city + ' ' + state : city;
}

// The six shapes, read off dang's ten live rows rather than invented:
//   best pest control in Tyler TX          -> best {service} in {loc}
//   termite treatment Tyler TX             -> {service} {loc}
//   best pest control company Whitehouse TX-> best {service} company {loc}
//   pest control services Jacksonville TX  -> {service} services {loc}
//   exterminator near me Longview TX       -> {service} near me {loc}
//   exterminator Athens TX reviews         -> {service} {loc} reviews
//
// dang's rows use pest-specific agent nouns ("exterminator") and morphologies
// ("treatment", "inspection") that have no irrigation equivalent. Deriving the
// phrase from the tenant's OWN service slugs instead keeps every query grounded
// and drops the need to invent a trade-agent noun per vertical.
const TEMPLATES: Array<(service: string, loc: string) => string> = [
  (s, l) => 'best ' + s + ' in ' + l,
  (s, l) => s + ' ' + l,
  (s, l) => 'best ' + s + ' company ' + l,
  (s, l) => s + ' services ' + l,
  (s, l) => s + ' near me ' + l,
  (s, l) => s + ' ' + l + ' reviews',
];

/**
 * Deterministic: the same inputs always produce the same list, in the same
 * order. Tests depend on it, and so does not re-seeding a tenant with a
 * different set every time provisioning runs.
 */
export function generateAuthorityPrompts(input: AuthorityPromptInputs): string[] {
  const max = input.max === undefined ? DEFAULT_MAX_PROMPTS : input.max;
  const out: string[] = [];
  const seen: Record<string, boolean> = {};

  const push = (value: string) => {
    const v = value.replace(/\s+/g, ' ').trim();
    const key = v.toLowerCase();
    if (!v || seen[key] || out.length >= max) return;
    seen[key] = true;
    out.push(v);
  };

  // The one branded query, and the only shape not present in dang's reference
  // set. It is the canonical AI-authority question — does the engine know this
  // business at all — and it is built entirely from the tenant's own name.
  const name = (input.businessName || '').trim();
  if (name) push(name + ' reviews');

  // Locations: the business's own city first, then its service areas. Deduped
  // case-insensitively so a service area that repeats the head office does not
  // consume two slots.
  const locations: string[] = [];
  const locSeen: Record<string, boolean> = {};
  const addLoc = (loc: AuthorityLocation) => {
    const formatted = formatLocation(loc);
    if (!formatted) return;
    const key = formatted.toLowerCase();
    if (locSeen[key]) return;
    locSeen[key] = true;
    locations.push(formatted);
  };
  if ((input.city || '').trim()) addLoc({ city: input.city, state: input.state });
  for (let i = 0; i < input.serviceAreas.length; i += 1) addLoc(input.serviceAreas[i]);

  const services: string[] = [];
  for (let i = 0; i < input.serviceSlugs.length; i += 1) {
    const s = humanise(input.serviceSlugs[i]);
    if (s) services.push(s);
  }

  // No trade or nowhere to ask about: no service queries. The branded query, if
  // any, still stands — it needs neither.
  if (services.length === 0 || locations.length === 0) return out;

  // Every (service, location) pair, visited once, with the template advancing
  // across them so the output varies in shape as well as content.
  //
  // LOCATIONS ARE THE INNER LOOP, SERVICES THE OUTER ONE. The cap almost
  // always bites — five services times five locations is twenty-five pairs for
  // ten slots — so whichever axis is walked innermost is the one that gets
  // covered before the budget runs out. Walking locations innermost spends the
  // budget breadth-first across the tenant's markets: every service area is
  // asked about once before any service is asked twice.
  //
  // The other way round silently drops markets. Precision Lawn Systems serves
  // Hawkins, Holly Lake Ranch, Lindale, Longview and Tyler; with locations in
  // the outer loop the ten slots were exhausted on the first two, and Tyler and
  // Longview — its largest markets — were never asked about at all. Nothing in
  // the output looked wrong: ten valid prompts for two real cities.
  //
  // ORDERING WITHIN EACH AXIS IS THE CALLER'S. service_areas has no priority
  // column and, for pls, every row carries an identical created_at, so there is
  // no recorded ranking to honour and inventing one (by population, say) would
  // be a fabricated tenant fact. The caller passes a deterministic order and
  // this walk covers all of it; it does not rank.
  //
  // Still a full nested walk, not three independent `i % n` cycles: those are
  // wrong for small inputs — with two services and two locations they produce
  // only (s0,l0) and (s1,l1), never the cross pairs.
  let step = 0;
  for (let si = 0; si < services.length && out.length < max; si += 1) {
    for (let li = 0; li < locations.length && out.length < max; li += 1) {
      const t = step % TEMPLATES.length;
      step += 1;
      push(TEMPLATES[t](services[si], locations[li]));
    }
  }

  return out;
}

/**
 * True only for a tenant explicitly flagged as a demo.
 *
 * `=== true`, never `!== false`. One live REAL tenant (vita-glow) has no
 * settings.demo_mode row at all, so the value reaches here as undefined; two
 * others carry `active: false`. A `!== false` test would classify the tenant
 * with no row as a demo and silently skip it — the same absent-vs-false trap
 * that made `vertical` a three-state field rather than a boolean.
 *
 * Demo tenants are invented businesses with no domain. Running AI Authority for
 * one pays live engines to search the web for a company that does not exist and
 * writes confirmed-zero snapshots that would skew any cross-tenant average.
 */
export function isDemoTenant(demoModeValue: unknown): boolean {
  if (!demoModeValue || typeof demoModeValue !== 'object') return false;
  return (demoModeValue as { active?: unknown }).active === true;
}

/**
 * True only when this tenant IS the platform's operator tenant.
 *
 * The operator tenant is the PestFlow Pro SaaS product itself, not a home
 * services business. Its page_content and service_areas are pest demo
 * scaffolding — the same scaffolding that carried the fabricated phone numbers
 * cleaned in S286 — so generating trade prompts from them would have the
 * platform asking search engines whether a software product is the best pest
 * control company in Tyler, and scoring itself on the answer.
 *
 * `operatorTenantId` is not hardcoded here. It comes from public
 * .operator_tenant_id(), the SECURITY DEFINER resolver added in S273 and
 * already load-bearing for the provisioning_status RLS gate. That function is
 * the platform's single declared answer to "which tenant is the operator"; this
 * predicate defers to it rather than adding a second opinion that could drift.
 *
 * Both ids must be known. An unresolved operator id returns false — "not the
 * operator" — so callers that cannot resolve one MUST skip rather than seed:
 * the safe default when the operator is unknown is to write nothing.
 */
export function isOperatorTenant(
  tenantId: string | null | undefined,
  operatorTenantId: string | null | undefined,
): boolean {
  const a = (tenantId || '').trim().toLowerCase();
  const b = (operatorTenantId || '').trim().toLowerCase();
  if (!a || !b) return false;
  return a === b;
}
