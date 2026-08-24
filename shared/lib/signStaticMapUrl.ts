// S293 PR C — Google Static Maps URL signing (HMAC-SHA1 over path+query).
//
// This runs SERVER-SIDE ONLY: in the image generator, never in a page, never in
// the browser. The signing secret is the reason the whole delivery design is
// what it is — the image is generated and stored server-side and served from
// our own URL, so no key and no signature ever reaches a visitor.
//
// Why not an HTTP-referrer-restricted browser key instead: tenants live on
// wildcard *.pestflowpro.ai AND on arbitrary custom domains. A referrer
// allowlist cannot enumerate a domain that does not exist yet, so every new
// custom domain would 403 its own map until someone edited the Cloud Console.
//
// WebCrypto, not node:crypto, so the same file runs under Next's server runtime
// and under Deno in a Supabase edge function.

/** URL-safe base64 → bytes. Google issues the secret in this alphabet. */
export function decodeUrlSafeBase64(secret: string): Uint8Array {
  const padded = secret.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * bytes → URL-safe base64, which is the alphabet Google expects back.
 *
 * Exported ONLY so the alphabet can be asserted on a vector chosen to contain
 * '+' and '/' under standard base64. Asserting it via a signature instead is
 * luck: whether a given digest happens to hit those two characters is an
 * accident of the input.
 */
export function encodeUrlSafeBase64(bytes: ArrayBuffer): string {
  let binary = '';
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i++) binary += String.fromCharCode(view[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_');
}

export const STATIC_MAPS_HOST = 'https://maps.googleapis.com';

/**
 * Append `key` then sign, returning the absolute URL to fetch.
 *
 * Order matters and is not stylistic: Google signs the path AND query
 * INCLUDING the key, so the key must already be present when the digest is
 * taken. Signing first and appending the key second yields a URL that fails
 * with a 403 that says nothing useful.
 *
 * @param path  from buildStaticMapPath — "/maps/api/staticmap?size=…"
 */
export async function signStaticMapUrl(path: string, apiKey: string, signingSecret: string): Promise<string> {
  if (!path.startsWith('/maps/')) throw new Error('signStaticMapUrl: expected a /maps/... path');
  if (!apiKey) throw new Error('signStaticMapUrl: missing API key');
  if (!signingSecret) throw new Error('signStaticMapUrl: missing signing secret');

  const withKey = `${path}&key=${encodeURIComponent(apiKey)}`;
  const key = await crypto.subtle.importKey(
    'raw',
    decodeUrlSafeBase64(signingSecret) as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(withKey) as unknown as BufferSource);
  return `${STATIC_MAPS_HOST}${withKey}&signature=${encodeUrlSafeBase64(digest)}`;
}
