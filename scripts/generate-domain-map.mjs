// S318 — Build-time projection of verified custom domains -> domain-map.json
//
// WHY build-time and not Vercel Edge Config / per-request DB:
//   Middleware resolves the tenant slug by pure hostname parsing and touches NO
//   database — the Edge path is deliberately data-free for latency (stated at
//   middleware.ts:6). A custom-domain lookup has to follow the same pattern, so
//   this is the exact shape scripts/generate-redirects-map.mjs already proves:
//   Postgres stays the single source of truth, this JSON is a derived artifact,
//   middleware does a synchronous in-memory lookup.
//
//   CONSEQUENCE, STATED PLAINLY: adding a client's domain requires a DEPLOY, not
//   just a settings save. A row written after the last build is invisible until
//   the next one.
//
// SOURCE OF TRUTH — public.tenant_domains, NOT tenants.custom_domain.
//   Two stores exist and they disagree. `tenants.custom_domain` is written by
//   the client-admin DomainSection.tsx and read by NOTHING at request time; its
//   only live value is dang's `admin.dangpestcontrol.com`, which is NXDOMAIN and
//   has never resolved from anywhere (verified 2026-09-02). `tenant_domains` is
//   written by Ironwood's CustomDomainSetup.tsx, carries a `verified` flag, and
//   is already what src/lib/subdomainRouter.ts trusts in the Vite SPA. Sourcing
//   from it means ONE row serves both the middleware and the SPA admin lookup.
//
// TWO INDEPENDENT GUARDS, either sufficient today:
//   1. verified = true       — an unverified row must never route live traffic.
//   2. render_model <> 'standalone' — a standalone tenant's public site lives in
//      a SEPARATE Vercel project. Mapping its domain here would resolve a slug
//      that middleware then 404s via STANDALONE_SLUGS. dang is the live case:
//      both its tenant_domains rows are currently verified=false, so guard 1
//      alone excludes it today — guard 2 is what keeps it excluded if anyone
//      ever flips that flag.
//
// Runs from `prebuild` after the redirects projector. Uses the SERVICE ROLE key
// (server-only, never VITE_/NEXT_PUBLIC_) which bypasses RLS — correct here
// because the map must contain every tenant's verified domains.
//
// Resilience: missing creds, an empty table, or a query error all emit `{}` and
// exit 0 — a deploy must never fail because there are no domains to project.
// The log line always states which path was taken, because an empty map is
// indistinguishable from a working one at runtime: it just never matches.
//
// REQUIRE_DOMAIN_MAP=1 inverts that for the cutover deploy: any path that would
// emit an empty map exits 1 and FAILS THE BUILD instead. Default OFF, so this is
// a no-op everywhere until someone sets it.
//
// It exists because the silent-empty failure is not hypothetical — it is the
// LIVE state of the sibling projector. Every production build to date logs
//   [generate-redirects-map] query failed (TypeError: fetch failed)
// (checked dpl_GmHPgde1Zrv… 2026-09-02 and dpl_GpnCWthQduP… 2026-09-01), so
// redirects-map.json ships as {} while the deploy goes green. Reading a build
// log is a check a person can forget; a non-zero exit is not.

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalizeHost } from '../domain-normalize.mjs';

const OUT_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'domain-map.json');

function writeMap(map) {
  // Trailing newline + 2-space indent to match the repo's JSON style.
  writeFileSync(OUT_PATH, JSON.stringify(map, null, 2) + '\n');
}

const STRICT = process.env.REQUIRE_DOMAIN_MAP === '1';

/** Emit an empty map, and fail the build instead if strict mode is armed. */
function bail(reason) {
  writeMap({});
  if (STRICT) {
    console.error(
      `[generate-domain-map] REQUIRE_DOMAIN_MAP=1 and the projection is empty: ${reason}. ` +
        'Failing the build rather than shipping a map that silently never matches.',
    );
    process.exit(1);
  }
}

/**
 * Pure projection, exported so the guards are asserted against the EMITTED
 * shape rather than against a description of it.
 *
 * @param {Array<{custom_domain: string|null, verified: boolean|null,
 *                tenants: {slug: string|null, render_model: string|null}|null}>} rows
 * @returns {Record<string, string>} hostname -> slug, keys sorted
 */
export function buildDomainMap(rows) {
  const map = {};
  for (const row of rows ?? []) {
    const slug = row?.tenants?.slug;
    const renderModel = row?.tenants?.render_model;
    if (!slug || !row?.custom_domain) continue;

    // Guard 1 — never route traffic on an unverified row.
    if (row.verified !== true) continue;
    // Guard 2 — a standalone tenant is served by a different Vercel project.
    if (renderModel === 'standalone') continue;

    const host = canonicalizeHost(row.custom_domain);
    if (!host) continue;

    // A host may map to exactly ONE slug. First write wins and the collision is
    // reported rather than silently overwritten — two tenants claiming the same
    // domain is a data fault someone must fix, not something to resolve here.
    if (map[host] && map[host] !== slug) {
      console.warn(
        `[generate-domain-map] COLLISION: ${host} claimed by both ` +
          `'${map[host]}' and '${slug}' — keeping '${map[host]}'. Fix tenant_domains.`,
      );
      continue;
    }
    map[host] = slug;

    // Apex and www are DISTINCT keys and both are projected. Vercel's apex/www
    // redirect is dashboard state, invisible from this repo, so resolution must
    // not depend on it. If Vercel does redirect first, the extra key is inert.
    const bare = host.startsWith('www.') ? host.slice(4) : host;
    const www = `www.${bare}`;
    for (const alias of [bare, www]) {
      if (alias === host) continue;
      if (map[alias] && map[alias] !== slug) {
        console.warn(
          `[generate-domain-map] COLLISION on alias ${alias} — keeping '${map[alias]}'.`,
        );
        continue;
      }
      map[alias] = slug;
    }
  }

  // Deterministic key order keeps the committed artifact's diffs readable.
  const sorted = {};
  for (const host of Object.keys(map).sort()) sorted[host] = map[host];
  return sorted;
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn(
      '[generate-domain-map] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — ' +
        'emitting empty domain-map.json ({}). This is expected for local/dev builds; ' +
        'on a production cutover deploy these must be present or NO custom domain resolves.',
    );
    bail('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from('tenant_domains')
    .select('custom_domain, verified, tenants(slug, render_model)');

  if (error) {
    console.warn(
      `[generate-domain-map] query failed (${error.message}) — emitting empty map ({}). ` +
        'Build continues; investigate before cutting DNS onto a custom domain.',
    );
    bail(`query failed (${error.message})`);
    return;
  }

  const rows = data ?? [];
  const map = buildDomainMap(rows);
  writeMap(map);
  if (Object.keys(map).length === 0) {
    // An empty map from a SUCCESSFUL query is legitimate today — no tenant has a
    // verified row yet. Strict mode still refuses it, because the only time you
    // arm strict mode is a cutover, and a cutover with no domains is a mistake.
    bail(`query succeeded but projected 0 hostnames from ${rows.length} row(s)`);
  }
  console.log(
    `[generate-domain-map] wrote ${OUT_PATH} — ${Object.keys(map).length} hostname(s) ` +
      `from ${rows.length} tenant_domains row(s).`,
  );
}

// Only run when executed directly, so the test can import buildDomainMap without
// the script reaching for credentials or writing a file.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    // Last-resort guard: never fail the build on a projection error.
    console.warn(
      `[generate-domain-map] unexpected error (${err?.message ?? err}) — emitting empty map ({}).`,
    );
    writeMap({});
  });
}
