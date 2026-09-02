// S321 PR A — origin parsing for the public lead endpoint.
//
// WHY THIS FILE IS SEPARATE FROM api-quote/index.ts, and why that is load-bearing:
// index.ts imports from `https://esm.sh/...`, which Node's ESM loader rejects, so nothing
// in it can be executed under vitest — that is exactly why vitest.config.ts excludes
// `supabase/functions/*/index.test.ts`, and why S313 fell back to a source scan. This
// module has NO https imports, so `originHost.test.ts` beside it is a REAL behavioural
// test that actually runs. The security-critical parsing lives here for that reason.
//
// THE ATTACK THIS EXISTS TO STOP. The previous gate regex-matched the RAW header:
//     /^https?:\/\/([a-z0-9-]+\.)?pestflowpro\.com(\/|$)/i
// A raw prefix match cannot see userinfo. `https://pestflowpro.com@evil.example/` matches
// that pattern and is a request FROM evil.example — the browser sends it, the regex says
// yes. URL parsing resolves .hostname to `evil.example` and it is refused. Never regex a
// raw Origin header.

/**
 * Normalize an **Origin header** to a bare lowercase host, or null if it is not a value we
 * will accept. An Origin is `scheme://host[:port]` — it carries no path, so anything with
 * one is malformed and refused rather than coerced.
 */
export function normalizeOriginHost(raw: string): string | null {
  let url: URL;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  if (url.pathname !== '/' || url.search || url.hash) return null;
  if (url.port) return null;
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || host.includes('%')) return null;
  return host;
}

/**
 * Normalize a **Referer header** to a bare lowercase host, or null.
 *
 * A Referer is a full URL and legitimately carries a path, query and fragment — so the
 * pathname check above would reject every real one. Every other safety check is identical;
 * only the path constraint is relaxed, and only here. This is why the two headers are
 * parsed by two functions rather than one: they are different grammars, and treating a
 * Referer as an Origin is the semantic error the gate used to make with `origin ?? referer`.
 */
export function normalizeRefererHost(raw: string): string | null {
  let url: URL;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  if (url.port) return null;
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || host.includes('%')) return null;
  return host;
}

/**
 * The platform's own hosts. Matching is on the PARSED host, never on the raw header.
 *
 * ⚠️ `.ai` IS LOAD-BEARING. Deployed api-quote v36 allowed `pestflowpro\.(com|ai)`; the repo
 * file allowed `.com` only, because the 2026-08-23 bulk import wrote a pre-S213a.1 copy over
 * it. Deploying the repo file as it stood would have 403'd EVERY .ai tenant and stopped lead
 * capture platform-wide, silently, with the function still reading ACTIVE. Do not drop `.ai`.
 *
 * `.com` is retained: the wildcard 308 from *.pestflowpro.com to *.pestflowpro.ai means a
 * .com Origin can still legitimately arrive.
 */
export const PLATFORM_HOSTS = [
  'pestflowpro.com',
  'pestflowpro.ai',
  'homeflowpro.ai',
  'dangpestcontrol.com',
] as const;

/**
 * True when `host` is a platform host or a single-label subdomain of one.
 *
 * ONE label, deliberately — it reproduces the old regex's `([a-z0-9-]+\.)?` exactly. A bare
 * `endsWith('.' + base)` would also admit `a.b.pestflowpro.ai`, which the previous gate
 * refused; widening the allowlist while fixing it is not this change's business.
 */
export function isPlatformHost(host: string): boolean {
  return PLATFORM_HOSTS.some((base) => {
    if (host === base) return true;
    if (!host.endsWith('.' + base)) return false;
    const label = host.slice(0, host.length - base.length - 1);
    return label.length > 0 && !label.includes('.');
  });
}
