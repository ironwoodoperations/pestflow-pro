import { NextRequest, NextResponse } from 'next/server';
import redirectsMapJson from './redirects-map.json';
import { canonicalizePath } from './redirects-normalize.mjs';

// S253 / D1 — per-tenant redirect projection. Source of truth is
// public.tenant_redirects; this JSON is a build-time derived artifact emitted by
// scripts/generate-redirects-map.mjs (prebuild). Middleware does a synchronous
// in-memory lookup — NO DB round-trip on the Edge path. Bundle hygiene (Task 2):
// the only redirect imports here are this JSON and the tiny zero-dep normalizer.
type RedirectEntry = { to: string; status: number };
const redirectsMap = redirectsMapJson as Record<string, Record<string, RedirectEntry>>;

const APEX_HOSTS = new Set([
  'pestflowpro.com',
  'www.pestflowpro.com',
  'pestflowpro.ai',
  'www.pestflowpro.ai',
]);

const PFP_SUFFIXES = ['.pestflowpro.com', '.pestflowpro.ai'] as const;

// Standalone-repo tenants: public site lives in a SEPARATE Vercel project
// (e.g. Dang -> dangpestcontrol.com). On <slug>.pestflowpro.ai these tenants are
// admin-only; every non-admin path 404s to prevent a duplicate public render from
// this app's /tenant/<slug> shell. Source of truth = tenants.render_model column;
// this env var is the edge-read projection (set in Vercel dashboard, production scope).
// Validator-mandated defensive parse: undefined/empty -> empty Set (never matches "").
const STANDALONE_SLUGS = new Set(
  (process.env.STANDALONE_TENANT_SLUGS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

// Cold-start observability: surface the missing-env failure mode (DB says standalone
// but env var never got set -> would silently fall through to a duplicate render).
if (process.env.STANDALONE_TENANT_SLUGS === undefined) {
  console.warn(
    '[middleware] STANDALONE_TENANT_SLUGS is undefined — standalone routing disabled',
  );
}

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

  // S253 / D1 — per-tenant 301/308 redirects (build-time bundled map; no DB on
  // the Edge path). PURELY ADDITIVE: only a positive match early-returns; every
  // miss falls through to the existing routing below unchanged. Slug is non-null
  // here (apex returned above). Default status is 308 (preserves HTTP method;
  // Google treats it as 301 for link equity) but each row carries its own status.
  const slugRedirects = redirectsMap[slug];
  if (slugRedirects) {
    const match = slugRedirects[canonicalizePath(pathname)];
    if (match) {
      const target = new URL(match.to, req.url);
      // Re-append the original query string so UTM/tracking params survive.
      target.search = req.nextUrl.search;
      return NextResponse.redirect(target, { status: match.status });
    }
  }

  // Client admin on any subdomain → Vite SPA
  if (pathname.startsWith('/admin')) {
    return NextResponse.rewrite(new URL('/_admin/index.html', req.url));
  }

  // S273 PR #2c — set-password (invite + recovery) renders from THIS Next.js app on the tenant
  // subdomain the invite/reset link targets (https://<slug>.pestflowpro.ai/set-password). Placed
  // BEFORE the STANDALONE_SLUGS 404 so standalone tenants (e.g. Dang) resolve it too; converges on
  // the same public-shell rewrite as normal tenants. Exact-match (not startsWith) — the token rides
  // in the query string (?token_hash=…&type=…), which nextUrl.clone() preserves. Security headers:
  // Referrer-Policy guards the token-in-query before the page's replaceState runs; anti-framing
  // since the page sits on a public subdomain.
  if (pathname === '/set-password') {
    const spUrl = req.nextUrl.clone();
    spUrl.pathname = `/tenant/${slug}/set-password`;
    const res = NextResponse.rewrite(spUrl);
    res.headers.set('Referrer-Policy', 'no-referrer');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('Content-Security-Policy', "frame-ancestors 'none'");
    return res;
  }

  // Standalone-repo tenants (data-driven via render_model column -> STANDALONE_SLUGS
  // env projection). Public site is a separate Vercel project; here only /admin works
  // (handled above), everything else 404s to prevent a duplicate public render.
  // x-pfp-routing-decision header: filter Vercel logs to confirm this branch fires as
  // designed vs. catching unintended traffic.
  if (STANDALONE_SLUGS.has(slug)) {
    return new NextResponse(null, {
      status: 404,
      headers: { 'x-pfp-routing-decision': 'standalone-admin-only-404' },
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
