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

  // Apex (prod) → Vite SPA handles marketing + /ironwood
  if (!slug) {
    return NextResponse.rewrite(new URL('/_admin/index.html', req.url));
  }

  // Client admin on any subdomain → Vite SPA
  if (pathname.startsWith('/admin')) {
    return NextResponse.rewrite(new URL('/_admin/index.html', req.url));
  }

  // Dang is NOT migrated — stays on Vite
  if (slug === 'dang') {
    return NextResponse.rewrite(new URL('/_admin/index.html', req.url));
  }

  // Subdomain public shell → Next.js App Router
  const url = req.nextUrl.clone();
  const suffix = pathname === '/' ? '' : pathname;
  url.pathname = `/tenant/${slug}${suffix}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next|_admin|tenant|favicon.ico|api).*)'],
};
