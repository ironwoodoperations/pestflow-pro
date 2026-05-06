import { NextRequest, NextResponse } from 'next/server';

const APEX_HOSTS = new Set([
  'pestflowpro.com',
  'www.pestflowpro.com',
]);

function extractSubdomain(host: string): string | null {
  const hostname = host.split(':')[0].toLowerCase();

  if (APEX_HOSTS.has(hostname)) return null;

  if (hostname.endsWith('.pestflowpro.com')) {
    const sub = hostname.slice(0, -'.pestflowpro.com'.length);
    if (!sub || sub === 'www') return null;
    return sub;
  }

  // Local dev: e.g. pestflow-pro.localhost:3000
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.slice(0, -'.localhost'.length);
    return sub || null;
  }

  return null;
}

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const hostname = host.split(':')[0].toLowerCase();
  const { pathname } = req.nextUrl;

  // Local dev pure localhost: pass through so /_tenant/* direct URLs work
  if (process.env.NODE_ENV !== 'production' && hostname === 'localhost') {
    return NextResponse.next();
  }

  const slug = extractSubdomain(host);

  // Apex (prod) — only marketing landing, /admin, and /ironwood stay on Vite.
  // Everything else on apex returns 404 (master tenant content lives on demo.*).
  if (!slug) {
    // Static assets bypass apex gating regardless of path shape.
    // Defense-in-depth even if config.matcher excludes these — protects
    // Vite SPA hashed assets (/assets/*), framework paths (/_next/*),
    // and any dotted public file (favicon.ico, robots.txt, etc.) from
    // being 404'd by the catch-all below.
    const isStaticAsset =
      pathname.startsWith('/_next') ||
      pathname.startsWith('/assets/') ||
      pathname.includes('.');

    if (isStaticAsset) {
      return NextResponse.rewrite(new URL('/_admin/index.html', req.url));
    }

    // Apex whitelist: exact-match OR slash-prefix to prevent overmatch
    // (pathname.startsWith('/admin') would incorrectly match /administration,
    // /admin-panel, /administrator).
    const isMarketingApex = pathname === '/';
    const isAdminApex = pathname === '/admin' || pathname.startsWith('/admin/');
    const isIronwoodApex = pathname === '/ironwood' || pathname.startsWith('/ironwood/');

    if (isMarketingApex || isAdminApex || isIronwoodApex) {
      return NextResponse.rewrite(new URL('/_admin/index.html', req.url));
    }

    return new NextResponse(null, { status: 404 });
  }

  // Client admin on any subdomain → Vite SPA
  if (pathname.startsWith('/admin')) {
    return NextResponse.rewrite(new URL('/_admin/index.html', req.url));
  }

  // Subdomain public shell → Next.js App Router
  const url = req.nextUrl.clone();
  const suffix = pathname === '/' ? '' : pathname;
  url.pathname = `/tenant/${slug}${suffix}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next (Next.js internals)
     * - _admin (Vite SPA assets)
     * - _tenant (internal rewrite target)
     * - api (API routes)
     * - Paths with a file extension (images, fonts, manifest.json, etc.)
     */
    '/((?!_next|_admin|_tenant|api|.*\\..*).*)',
  ],
};
