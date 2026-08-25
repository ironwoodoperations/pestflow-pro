// S294 — the platform's name, defined once.
//
// THE DECISION, recorded here so it is not re-litigated:
//
//   PestFlow Pro is a VERTICAL brand — the pest front door, alongside PoolFlow,
//   LawnFlow, HVACFlow, RoofFlow and TrailerFlow. HomeFlow Pro is the PLATFORM.
//
// The admin had been showing every tenant the pest vertical's name whatever
// their trade: an irrigation client logged into "PestFlow Pro" daily, and his
// monthly report told him seven times to make changes inside a pest-control
// product.
//
// A PER-VERTICAL BRAND MAP WAS CONSIDERED AND REJECTED:
//   - every string that varies is a string that can be wrong, and this one
//     reaches a prompt block asserted byte-identical as an anti-hallucination
//     guard;
//   - if one client sees LawnFlow and another sees PestFlow they share no name
//     to refer anyone to, and the leverage is that ONE platform serves every
//     trade;
//   - only 'pest' and 'irrigation' exist in the vertical CHECK constraint
//     today, so a map would resolve to its default for most tenants anyway.
//
// Vertical names belong on the MARKETING sites a prospect lands on, not on the
// dashboard a customer uses every day.
//
// SCOPE. This constant is USER-VISIBLE COPY ONLY. It is deliberately not used
// for — and must not be used to rename — the pestflowpro.ai domain, tenant
// subdomains, the repo, the Supabase project, env vars, email sending domains,
// or anything else a customer does not read.
//
// It is NOT a tenant's business name. A surface that needs the tenant's own
// name reads it from settings.business_info and renders NOTHING when absent;
// substituting the platform's name there is the same category error this
// constant exists to fix.
export const PLATFORM_NAME = 'HomeFlow Pro';

/**
 * The name this platform used to carry on client-facing surfaces.
 *
 * Exported so the regression guards can name it without hardcoding a second
 * copy, and so that deleting the guards' subject is a visible edit here rather
 * than a silent one in a test file.
 */
export const RETIRED_PLATFORM_NAME = 'PestFlow Pro';
