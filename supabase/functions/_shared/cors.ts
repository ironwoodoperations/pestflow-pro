// Dynamic CORS for multi-tenant wildcard subdomains.
// APP_BASE_DOMAIN env var defines the base; all https://*.${BASE} origins are allowed.
// localhost dev origins also allowed.
//
// NOTE: other edge functions still use a static `corsHeaders` object. This helper
// is intentionally scoped to pagespeed-proxy for S224. Rolling it out across all
// edge functions is a tracked backlog follow-up.
export function getCorsHeaders(req: Request): HeadersInit {
  const baseDomain = Deno.env.get('APP_BASE_DOMAIN') || 'pestflowpro.ai'
  const escapedBase = baseDomain.replace(/\./g, '\\.')
  const originRegex = new RegExp(`^https://([a-z0-9-]+\\.)?${escapedBase}$`)
  const requestOrigin = req.headers.get('Origin')
  let allowedOrigin = `https://${baseDomain}` // fallback for missing Origin
  if (requestOrigin) {
    if (originRegex.test(requestOrigin) || requestOrigin.startsWith('http://localhost:')) {
      allowedOrigin = requestOrigin
    }
  }
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}
