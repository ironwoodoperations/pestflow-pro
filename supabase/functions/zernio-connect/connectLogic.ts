// S329 — the decidable parts of zernio-connect, as pure functions.
//
// WHY A SEPARATE MODULE. index.ts imports from `https://esm.sh/...`, which Node's ESM
// loader rejects, so nothing in it can execute under vitest — that is why
// vitest.config.ts excludes `supabase/functions/*/index.test.ts`. This file has no
// https import, so `connectLogic.test.ts` beside it is a REAL behavioural test that
// actually runs in CI. Same arrangement as generate-monthly-report/narrationPrompt.ts
// and _shared/originHost.ts, and for the same reason.
//
// It is NOT under _shared/ deliberately. Editing supabase/functions/_shared/** fires
// .github/workflows/redeploy-edge-on-shared-change.yml, which republishes the 16
// functions in .github/edge-shared-consumers.txt. Nothing here is needed by another
// function, so paying that cost would buy nothing.

import { resolveSiteUrl } from '../../../shared/lib/resolveSiteUrl.ts';

/**
 * The placeholder written into demo tenants' `integrations.zernio_profile_id`.
 *
 * Named once, because it is tested in two places and a literal in both is how the two
 * drift apart. Live values today: DEMO_FAKE_001 … DEMO_FAKE_005, on the five tenants
 * whose `demo_mode.active` is true.
 */
export const DEMO_PROFILE_ID_PREFIX = 'DEMO_FAKE_';

/**
 * True when the stored id is a demo placeholder rather than a real profile.
 *
 * THIS IS THE CASE A FALSY CHECK MISSES. `DEMO_FAKE_003` is TRUTHY, so the original
 * `if (!profileId)` treats it as a real profile, sends it to the vendor, and the tenant
 * gets a REMOTE error about an id that never existed — instead of a local, accurate one.
 */
export function isPlaceholderProfileId(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(DEMO_PROFILE_ID_PREFIX);
}

/**
 * True when the stored id can actually be used against the vendor API.
 *
 * The falsy half is deliberately `!value`, NOT `=== undefined`. Both shapes exist in the
 * live table right now: `pls` has no key at all (undefined) and `vita-glow` holds the
 * empty string. `=== undefined` would send `''` to the vendor.
 */
export function isUsableProfileId(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (!value) return false;
  return !isPlaceholderProfileId(value);
}

/**
 * True only when the tenant is explicitly flagged as a demo.
 *
 * `=== true`, NEVER `!== false` (S325). A tenant can have NO demo_mode row at all —
 * `vita-glow` is exactly that today — and `!== false` would classify it as a demo and
 * refuse a real client their connection.
 */
export function isDemoTenant(demoMode: unknown): boolean {
  if (!demoMode || typeof demoMode !== 'object') return false;
  return (demoMode as { active?: unknown }).active === true;
}

/**
 * Pull the profile id out of a vendor create-profile response.
 *
 * THE SAME EXPRESSION provision-tenant:710 already uses, deliberately not a second
 * parser — the vendor has been observed to return the id at more than one depth. That
 * code path has never executed (it postdates every tenant), so this is copied as
 * UNPROVEN rather than proven; the point is that if it is wrong it is wrong in one
 * place and gets fixed in one place.
 */
export function parseProfileId(data: unknown): string | undefined {
  const d = data as {
    profile?: { _id?: unknown; id?: unknown };
    id?: unknown;
    _id?: unknown;
  } | null | undefined;
  const candidate = d?.profile?._id ?? d?.profile?.id ?? d?.id ?? d?._id;
  return typeof candidate === 'string' && candidate ? candidate : undefined;
}

/** The columns buildAdminReturnUrl needs. Mirrors resolveSiteUrl's own parameter. */
export interface ReturnUrlTenant {
  slug: string;
  subdomain?: string | null;
  custom_domain?: string | null;
}

/**
 * Where the vendor sends the admin back after they finish authorizing.
 *
 * BUILT SERVER-SIDE FROM TENANT DATA, NEVER FROM REQUEST INPUT. That is the whole
 * open-redirect argument: the only inputs are columns on the tenant row the caller has
 * already been proven an admin of, so there is no attacker-controlled path into this
 * string. Do not add a parameter that lets a caller supply any part of it.
 *
 * This is NOT an OAuth `redirect_uri`. We are not the OAuth client — the vendor is, and
 * the callback registered with Facebook/Google/LinkedIn is theirs. This value is only
 * the return-to-app URL afterwards, which is why a per-tenant host is fine here and no
 * provider allowlist is involved.
 *
 * Host resolution is resolveSiteUrl's, unchanged and unduplicated: the CUSTOM_DOMAINS
 * map first, then tenants.custom_domain, then <subdomain|slug>.pestflowpro.ai. That
 * last step is also what corrects the retired .com this replaced — there is deliberately
 * no separate .com→.ai swap anywhere.
 */
export function buildAdminReturnUrl(tenant: ReturnUrlTenant): string {
  return `${resolveSiteUrl(tenant)}/admin?tab=social&connected=true`;
}

// ── S329 ITEM 4 — THE CLIENT-FACING COPY, DEFINED HERE SO IT CAN BE SCANNED. ──────────
//
// These live in this module rather than index.ts for one reason: index.ts imports from
// `https://esm.sh/...` and therefore cannot be imported by vitest, so a guard could only
// ever grep its TEXT. Exported from here, the guard imports the actual VALUES — it scans
// data, and a comment discussing the vendor cannot trip it.
//
// The rule: name the ACTION, never the vendor. The client has no account with our
// social-publishing provider, no bill from them, and no reason to learn the word. It is
// also careful not to assert a cause it cannot know — "aren't set up yet" is true whether
// the profile is missing, the create failed, or the vendor is down.
export const ERR_NOT_SET_UP  = 'Social connections aren’t set up yet. Try again in a moment, or contact your account manager if it keeps happening.';
export const ERR_DEMO_TENANT = 'Social connections aren’t available on a demo site.';
export const ERR_UNAVAILABLE = 'Social posting isn’t available right now. Contact your account manager.';

/** Every client-facing string this function can return. The guard iterates exactly this. */
export const CLIENT_FACING_MESSAGES = [ERR_NOT_SET_UP, ERR_DEMO_TENANT, ERR_UNAVAILABLE] as const;
