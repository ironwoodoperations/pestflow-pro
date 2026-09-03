import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  isUsableProfileId,
  isPlaceholderProfileId,
  isDemoTenant,
  parseProfileId,
  buildAdminReturnUrl,
  DEMO_PROFILE_ID_PREFIX,
  CLIENT_FACING_MESSAGES,
  ERR_NOT_SET_UP,
  ERR_DEMO_TENANT,
  ERR_UNAVAILABLE,
} from './connectLogic.ts';

// NOT named index.test.ts, deliberately: vitest.config.ts excludes
// `supabase/functions/*/index.test.ts` (those are Deno tests importing https:// URLs) and
// a vitest file with that name would be SILENTLY SKIPPED. Its own config says so.

const INDEX = readFileSync(join(__dirname, 'index.ts'), 'utf8');

/** Comments out, code in. A comment naming the vendor is not a client-facing string. */
function codeOnly(body: string): string {
  return body
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^[ \t]*(\/\/|\*)/.test(line))
    .join('\n');
}

/** Every single/double/back-quoted literal in a body, as data rather than as text. */
function stringLiterals(body: string): string[] {
  return (body.match(/'[^'\n]*'|"[^"\n]*"|`[^`]*`/g) ?? []).map((s) => s.slice(1, -1));
}

/**
 * Remove whole `console.*(...)` calls, arguments and all.
 *
 * LOG LINES ARE SERVER-SIDE AND KEEP THE VENDOR'S NAME — they are ours to read and
 * renaming them costs clarity for no gain. So the client-facing scan has to exclude them
 * STRUCTURALLY rather than by pattern-matching their prefix: a prefix rule would also
 * exempt any client string that happened to start the same way. Paren-balanced, so a
 * literal containing a bracket does not truncate the removal.
 */
function withoutLogCalls(body: string): string {
  let out = '';
  let i = 0;
  while (i < body.length) {
    const at = body.indexOf('console.', i);
    if (at === -1) { out += body.slice(i); break; }
    out += body.slice(i, at);
    let j = body.indexOf('(', at);
    if (j === -1) { out += body.slice(at); break; }
    let depth = 0;
    for (; j < body.length; j++) {
      if (body[j] === '(') depth++;
      else if (body[j] === ')') { depth--; if (depth === 0) { j++; break; } }
    }
    i = j;
  }
  return out;
}

describe('isUsableProfileId — the predicate the old `if (!profileId)` got half right', () => {
  it('accepts a real vendor id', () => {
    expect(isUsableProfileId('69dd26eaa42cd3ddf3fa8802')).toBe(true);
  });

  // Both of these shapes exist in the live settings table right now. `=== undefined`
  // would send the empty string to the vendor; the brief is explicit that the original
  // falsy test was CORRECT on this point and must not be "improved".
  it('treats NULL and the empty string alike as absent', () => {
    expect(isUsableProfileId(undefined)).toBe(false);   // pls: no key at all
    expect(isUsableProfileId(null)).toBe(false);
    expect(isUsableProfileId('')).toBe(false);          // vita-glow: genuinely ''
  });

  it('treats the demo placeholder as absent even though it is TRUTHY', () => {
    // The whole point: a falsy check passes DEMO_FAKE_003 straight to the vendor, and the
    // client gets a remote error about an id that never existed instead of a local one.
    expect(Boolean('DEMO_FAKE_003')).toBe(true);
    expect(isUsableProfileId('DEMO_FAKE_003')).toBe(false);
    for (const n of ['001', '002', '003', '004', '005']) {
      expect(isUsableProfileId(`${DEMO_PROFILE_ID_PREFIX}${n}`)).toBe(false);
    }
  });

  it('rejects non-strings rather than coercing them', () => {
    expect(isUsableProfileId(123)).toBe(false);
    expect(isUsableProfileId({})).toBe(false);
  });
});

describe('isPlaceholderProfileId', () => {
  it('is true only for the sentinel prefix', () => {
    expect(isPlaceholderProfileId('DEMO_FAKE_001')).toBe(true);
    expect(isPlaceholderProfileId('69dd26eaa42cd3ddf3fa8802')).toBe(false);
    expect(isPlaceholderProfileId('')).toBe(false);
    expect(isPlaceholderProfileId(null)).toBe(false);
  });

  it('does not match the sentinel appearing mid-string', () => {
    expect(isPlaceholderProfileId('real_DEMO_FAKE_001')).toBe(false);
  });
});

describe('isDemoTenant — === true, never !== false (S325)', () => {
  it('is true only when the row explicitly says so', () => {
    expect(isDemoTenant({ active: true })).toBe(true);
  });

  // vita-glow has NO demo_mode row at all today. `!== false` would classify it as a demo
  // and refuse a real client their social connection — the exact S289/S325 failure.
  it('is false when there is no demo_mode row, and when the flag is absent or false', () => {
    expect(isDemoTenant(null)).toBe(false);
    expect(isDemoTenant(undefined)).toBe(false);
    expect(isDemoTenant({})).toBe(false);
    expect(isDemoTenant({ active: false })).toBe(false);
  });

  it('does not accept a truthy non-true value', () => {
    // 'true' the STRING is what a careless JSONB read hands back.
    expect(isDemoTenant({ active: 'true' })).toBe(false);
    expect(isDemoTenant({ active: 1 })).toBe(false);
  });
});

describe('parseProfileId — one parser, four observed shapes', () => {
  it('reads the id at every depth the vendor has been seen to use', () => {
    expect(parseProfileId({ profile: { _id: 'a' } })).toBe('a');
    expect(parseProfileId({ profile: { id: 'b' } })).toBe('b');
    expect(parseProfileId({ id: 'c' })).toBe('c');
    expect(parseProfileId({ _id: 'd' })).toBe('d');
  });

  it('prefers profile._id when more than one is present', () => {
    expect(parseProfileId({ profile: { _id: 'a', id: 'b' }, id: 'c' })).toBe('a');
  });

  it('returns undefined rather than a falsy id that would then be persisted', () => {
    expect(parseProfileId(null)).toBeUndefined();
    expect(parseProfileId({})).toBeUndefined();
    expect(parseProfileId({ profile: {} })).toBeUndefined();
    expect(parseProfileId({ id: '' })).toBeUndefined();
    expect(parseProfileId({ id: 12345 })).toBeUndefined();
  });
});

describe('buildAdminReturnUrl — resolveSiteUrl precedence, unchanged', () => {
  it('sends a custom-domain tenant to its OWN host', () => {
    expect(buildAdminReturnUrl({ slug: 'pls', subdomain: 'pls', custom_domain: 'precisionlawnsystems.com' }))
      .toBe('https://precisionlawnsystems.com/admin?tab=social&connected=true');
  });

  it('sends a platform-subdomain tenant to .ai — the retired .com is gone', () => {
    const url = buildAdminReturnUrl({ slug: 'urban-strike', subdomain: 'urban-strike', custom_domain: null });
    expect(url).toBe('https://urban-strike.pestflowpro.ai/admin?tab=social&connected=true');
    expect(url).not.toContain('pestflowpro.com');
  });

  it('falls back to the slug when there is no subdomain', () => {
    expect(buildAdminReturnUrl({ slug: 'coastal-pest' }))
      .toBe('https://coastal-pest.pestflowpro.ai/admin?tab=social&connected=true');
  });

  // DANG IS OUT OF SCOPE AND MUST NOT MOVE. Its tenants.custom_domain holds an ADMIN host
  // that does not resolve in DNS, so the CUSTOM_DOMAINS map taking precedence is what
  // keeps it pointing anywhere real. Deep equality, per the brief.
  it('resolves dang exactly as the map says, ignoring its admin-host column', () => {
    expect(buildAdminReturnUrl({ slug: 'dang', subdomain: null, custom_domain: 'admin.dangpestcontrol.com' }))
      .toStrictEqual('https://dangpestcontrol.com/admin?tab=social&connected=true');
    expect(buildAdminReturnUrl({ slug: 'dang-pfp', subdomain: null, custom_domain: 'admin.dangpestcontrol.com' }))
      .toStrictEqual('https://dangpestcontrol.com/admin?tab=social&connected=true');
  });

  it('degrades a junk custom_domain to the platform host instead of emitting junk', () => {
    expect(buildAdminReturnUrl({ slug: 'x', subdomain: 'x', custom_domain: 'not a host' }))
      .toBe('https://x.pestflowpro.ai/admin?tab=social&connected=true');
  });
});

describe('S329 ITEM 1 — the auth gate runs BEFORE anything touches tenant data', () => {
  // requireTenantAdmin's own cross-tenant behaviour (anonymous → 401, non-member → 403,
  // tenant A asking for tenant B → 403) is proven by the Deno isolation suite that CI
  // runs against a live local Supabase stack: `deno test supabase/functions/_shared/auth/`.
  // This function inherits all of it by calling that helper. What is NOT inherited, and
  // what these assertions exist for, is POSITION — a gate placed after the settings read
  // has already leaked the data it was meant to protect.
  const code = codeOnly(INDEX);
  const gateAt = code.indexOf('requireTenantAdmin(req, tenantId)');
  // The FIRST database read of any kind, not just settings — `.from('tenants')` is
  // tenant data too, and a gate that only beat the settings read would still have leaked
  // it. Generic on purpose so a table added later is covered without editing this.
  const settingsAt = code.search(/\.from\('/);
  const vendorAt = code.indexOf('https://zernio.com');

  it('calls requireTenantAdmin at all', () => {
    expect(gateAt).toBeGreaterThan(-1);
    expect(code).toContain("from '../_shared/auth/requireTenantUser.ts'");
  });

  it('anti-vacuity: the things it must precede are actually present', () => {
    expect(settingsAt).toBeGreaterThan(-1);
    expect(vendorAt).toBeGreaterThan(-1);
    // and there really is more than one table read, so "first" is meaningful
    expect((code.match(/\.from\('/g) ?? []).length).toBeGreaterThan(1);
  });

  it('the gate precedes the first database read', () => {
    expect(gateAt).toBeLessThan(settingsAt);
  });

  it('the gate precedes every vendor call', () => {
    expect(gateAt).toBeLessThan(vendorAt);
  });

  it('an AuthError is returned to the caller, not swallowed', () => {
    expect(code).toContain('if (e instanceof AuthError) return e.toResponse()');
  });
});

describe('S329 ITEM 2 — the persisted write merges rather than replaces', () => {
  const code = codeOnly(INDEX);

  it('every settings write spreads the existing blob through stripVaultSecrets', () => {
    // dang holds 23 keys here, including OAuth tokens. A whole-blob write destroys them.
    const writes = code.match(/\.update\(\{ value: \{[^}]*/g) ?? [];
    expect(writes.length).toBeGreaterThanOrEqual(3);
    for (const w of writes) expect(w).toContain('...stripVaultSecrets(');
  });

  it('re-reads integrations immediately before creating, to narrow the double-create race', () => {
    const createAt = code.indexOf("fetch('https://zernio.com/api/v1/profiles'");
    const rereadAt = code.lastIndexOf('.maybeSingle()', createAt);
    expect(createAt).toBeGreaterThan(-1);
    expect(rereadAt).toBeGreaterThan(-1);
    expect(rereadAt).toBeLessThan(createAt);
  });
});

describe('S329 ITEM 4 — no client-facing string names the vendor', () => {
  // The vendor's own name. Word-boundary matched: substring over-match has produced five
  // false positives in this repo already.
  const VENDOR = /\bzernio\b/i;

  it('anti-vacuity: the matcher fires on what it exists to catch', () => {
    expect(VENDOR.test('No Zernio profile found. Contact support.')).toBe(true);
    expect(VENDOR.test('Zernio error: 500')).toBe(true);
    expect(VENDOR.test('Social connections aren’t set up yet.')).toBe(false);
  });

  // DATA, not file text — these are the actual exported values the function returns.
  it('every exported client-facing message is vendor-free', () => {
    expect(CLIENT_FACING_MESSAGES.length).toBe(3);
    for (const msg of CLIENT_FACING_MESSAGES) {
      expect(msg, `client-facing message names the vendor: ${msg}`).not.toMatch(VENDOR);
      expect(msg.length).toBeGreaterThan(10);   // anti-vacuity: not an empty string
    }
  });

  it('the messages say what is true without inventing a cause', () => {
    expect(ERR_NOT_SET_UP).toContain('aren’t set up yet');
    expect(ERR_DEMO_TENANT).toContain('demo');
    expect(ERR_UNAVAILABLE).toContain('isn’t available');
  });

  // Second layer: no string LITERAL anywhere in the handler names the vendor, apart from
  // the vendor's own API host, which is a URL the function must call and not copy shown
  // to anyone. Comments are stripped first, so the reasoning above cannot trip this.
  it('no string literal in index.ts names the vendor except its API host', () => {
    const offenders = stringLiterals(withoutLogCalls(codeOnly(INDEX)))
      .filter((s) => VENDOR.test(s))
      .filter((s) => !s.startsWith('https://zernio.com'));
    expect(offenders).toStrictEqual([]);
  });

  it('anti-vacuity: the scan sees real literals, and the log stripper really strips', () => {
    const scanned = stringLiterals(withoutLogCalls(codeOnly(INDEX)));
    expect(scanned.length).toBeGreaterThan(10);
    // The vendor host survives: it is a URL the function calls, not copy anyone reads.
    expect(scanned.some((s) => s.startsWith('https://zernio.com'))).toBe(true);
    // ...and the log lines are genuinely gone, so the exemption is doing work rather
    // than the regex simply never having matched them.
    const unstripped = stringLiterals(codeOnly(INDEX));
    expect(unstripped.some((s) => s.startsWith('[zernio-connect]'))).toBe(true);
    expect(scanned.some((s) => s.startsWith('[zernio-connect]'))).toBe(false);
  });
});
