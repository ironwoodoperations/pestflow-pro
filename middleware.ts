import { NextRequest, NextResponse } from 'next/server';

const APEX_HOSTS = new Set([
  'pestflowpro.com',
  'www.pestflowpro.com',
  'pestflowpro.ai',
  'www.pestflowpro.ai',
]);

const PFP_SUFFIXES = ['.pestflowpro.com', '.pestflowpro.ai'] as const;

function extractSubdomain(host: string): string | null {
  const hostname = host.split(':')[0].toLowerCase();

  if (APEX_HOSTS.has(hostname)) return null;

  for (const suffix of PFP_SUFFIXES) {
    if (hostname.endsWith(suffix)) {
      const sub = hostname.slice(0, -suffix.length);
      if (!sub || sub === 'www') return null;
      return sub;
    }
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
    //
    // History:
    //   PR #40 (S193) — original apex lockdown to /, /admin/*, /ironwood/*
    //   PR #44 (S194) — KEPT IntakePage, IntakeSuccess, PaymentSuccess as
    //                   apex utility routes for future paying-client flows
    //   PR #X  (S195) — this whitelist expansion to honor the KEPT decision
    //                   (Stripe success_url + intake link distribution are
    //                   both apex-bound — see create-checkout-session/index.ts
    //                   and ProspectDetail.IntakeLink.tsx).
    const isMarketingApex = pathname === '/';
    const isAdminApex = pathname === '/admin' || pathname.startsWith('/admin/');
    const isIronwoodApex = pathname === '/ironwood' || pathname.startsWith('/ironwood/');
    const isPaymentSuccess = pathname === '/payment-success';
    const isIntake = pathname.startsWith('/intake/');
    const isIntakeSuccess = pathname === '/intake-success';
    // S208 — apex demo galleries (sales surface). /demos and /demos/admin
    // are React Router routes inside the Vite SPA; everything under /demos
    // is allowlisted for forward-compat.
    const isDemos = pathname === '/demos' || pathname.startsWith('/demos/');
    // S209 — apex platform legal pages (TOS + Privacy). Linked from
    // StepReview.tsx onboarding agreement and from MarketingFooter.
    const isLegal = pathname === '/terms' || pathname === '/privacy';

    if (
      isMarketingApex ||
      isAdminApex ||
      isIronwoodApex ||
      isPaymentSuccess ||
      isIntake ||
      isIntakeSuccess ||
      isDemos ||
      isLegal
    ) {
      return NextResponse.rewrite(new URL('/_admin/index.html', req.url));
    }

    return new NextResponse(null, { status: 404 });
  }

  // Client admin on any subdomain → Vite SPA
  if (pathname.startsWith('/admin')) {
    return NextResponse.rewrite(new URL('/_admin/index.html', req.url));
  }

  // Dang is the only customer on the standalone-repo model — public lives at
  // dangpestcontrol.com (separate Vercel project). dang.pestflowpro.com is
  // admin-only: the /admin check above still fires for Kirk's admin URL,
  // every other path returns 404 to prevent the duplicate public render.
  if (slug === 'dang') {
    // x-pfp-routing-decision header: filter Vercel logs to confirm this
    // branch is firing as designed vs. catching unintended traffic. Per
    // Perplexity + Gemini validator concurrence on observability for the
    // new 404 branch.
    return new NextResponse(null, {
      status: 404,
      headers: { 'x-pfp-routing-decision': 'dang-admin-only-404' },
    });
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
