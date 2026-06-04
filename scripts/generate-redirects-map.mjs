// S253 / D1 — Build-time projection of public.tenant_redirects -> redirects-map.json
//
// WHY build-time and not Vercel Edge Config / per-request DB:
//   Middleware resolves the tenant slug by pure hostname parsing and touches NO
//   database — the Edge path is deliberately data-free for latency. Redirect rows
//   are authored once at cutover (a deploy-gated event), so a static projection
//   bundled into the deploy is the right shape: Postgres stays the single source
//   of truth, this JSON is a derived artifact, and middleware does a synchronous
//   in-memory lookup. Redirects go live on the NEXT deploy.
//
// Runs from `prebuild` (npm lifecycle) before `next build`. Uses the SERVICE ROLE
// key (server-only, never VITE_/NEXT_PUBLIC_) which bypasses RLS — correct here
// because the map must contain every tenant's redirects.
//
// Resilience: missing creds, an empty table, or a query error all emit `{}` and
// exit 0 — a deploy must never fail because there are no redirects to project.
// Customer #2 is the first real consumer; most builds have an empty/near-empty map.

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalizePath } from '../redirects-normalize.mjs';

const OUT_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'redirects-map.json');

/** Decode once; fall back to the raw value on malformed percent-encoding. */
function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function writeMap(map) {
  // Trailing newline + 2-space indent to match the repo's JSON style and keep diffs clean.
  writeFileSync(OUT_PATH, JSON.stringify(map, null, 2) + '\n');
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn(
      '[generate-redirects-map] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — ' +
        'emitting empty redirects-map.json ({}). This is expected for local/dev builds; ' +
        'on a production cutover deploy these must be present or redirects will be empty.',
    );
    writeMap({});
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // JOIN tenant_redirects -> tenants(slug) via the tenant_id FK. Service role
  // bypasses RLS so this reads all tenants' rows.
  const { data, error } = await supabase
    .from('tenant_redirects')
    .select('from_path, to_path, status_code, tenants(slug)');

  if (error) {
    console.warn(
      `[generate-redirects-map] query failed (${error.message}) — emitting empty map ({}). ` +
        'Build continues; investigate before relying on redirects in this deploy.',
    );
    writeMap({});
    return;
  }

  const rows = data ?? [];

  // Shape: { [slug]: { [normalizedFromPath]: { to, status } } }
  const map = {};
  let projected = 0;
  for (const row of rows) {
    const slug = row.tenants?.slug;
    if (!slug || !row.from_path || !row.to_path) continue;

    // Decode ONCE here (DB value may be percent-encoded; nextUrl.pathname is
    // already-decoded at runtime), then canonicalize identically to middleware.
    const fromKey = canonicalizePath(safeDecode(row.from_path));
    // Destination is decoded-but-otherwise-as-authored — it becomes a URL and
    // must NOT be normalized (case/trailing slash are meaningful for the target).
    const to = safeDecode(row.to_path);

    (map[slug] ??= {})[fromKey] = { to, status: row.status_code };
    projected += 1;
  }

  // Deterministic key order keeps the committed artifact's diffs readable.
  const sorted = {};
  for (const slug of Object.keys(map).sort()) {
    sorted[slug] = {};
    for (const path of Object.keys(map[slug]).sort()) {
      sorted[slug][path] = map[slug][path];
    }
  }

  writeMap(sorted);
  console.log(
    `[generate-redirects-map] wrote ${OUT_PATH} — ${projected} redirect(s) across ` +
      `${Object.keys(sorted).length} tenant(s).`,
  );
}

main().catch((err) => {
  // Last-resort guard: never fail the build on a projection error.
  console.warn(
    `[generate-redirects-map] unexpected error (${err?.message ?? err}) — emitting empty map ({}).`,
  );
  writeMap({});
});
