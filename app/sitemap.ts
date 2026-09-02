import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import domainMapJson from '../domain-map.json';
import { resolveTenantBySlug } from '../shared/lib/tenant/resolve';
import { resolveSiteUrl } from '../shared/lib/resolveSiteUrl';
import { getAllServicePages, getAllBlogPosts } from './tenant/[slug]/_lib/queries';

// S321 B5 — the per-tenant sitemap.
//
// WHY THIS LIVES AT THE APP ROOT AND NOT UNDER app/tenant/[slug]/.
// middleware.ts's matcher is `/((?!_next|_admin|_tenant|api|.*\..*).*)` — it EXCLUDES any
// path containing a dot. `/sitemap.xml` therefore never reaches the middleware and is never
// rewritten to `/tenant/<slug>/sitemap.xml`. A sitemap under the tenant segment would be
// unreachable at the URL crawlers actually request. This route resolves the tenant itself.
//
// THE HOST IS A SELECTOR, NEVER AN OUTPUT. This is the host-header-injection finding from
// the gate: a `Host:` header is attacker-controlled, so building sitemap URLs from it lets
// anyone publish a sitemap full of poisoned <loc> values. The header is used only to LOOK UP
// a slug in the build-time domain map — an unknown host matches nothing and yields an empty
// sitemap — and every emitted URL is then built from resolveSiteUrl(tenant), which reads the
// database and the static map. Untrusted input selects; trusted config renders.
//
// A NOINDEXED TENANT PUBLISHES NOTHING. Returning [] rather than a list is deliberate: a
// sitemap is a positive invitation to crawl, and handing one to a tenant whose pages carry
// noindex is a contradiction a crawler resolves in the wrong direction.

// B6 — robots.txt IS DELIBERATELY UNCHANGED, and that is a decision, not an omission.
//
//   * NO `Disallow` is added for a noindexed tenant. Both validators were explicit:
//     blocking crawl prevents the crawler from ever seeing the page-level noindex meta tag,
//     and can strand URLs that are already indexed. Page-level noindex stays the mechanism.
//   * NO `Sitemap:` directive is added. `public/robots.txt` is a SINGLE STATIC FILE served
//     identically for every tenant and every host, so it cannot name a per-tenant sitemap
//     without advertising one tenant's to all of them. Omitting the directive is acceptable:
//     crawlers fetch /sitemap.xml by convention, and Search Console takes a direct submission.
//   * An `app/robots.ts` was considered and NOT added: a static file in public/ takes
//     precedence over an App Router metadata route, so it would be dead code that looks live.
//     Making robots host-aware means removing the static file, which is its own change.
const domainMap = domainMapJson as Record<string, string>;

/** Slug for a request host, or null. Custom domains come from the build-time projection;
 *  platform subdomains are parsed, mirroring middleware's extractSubdomain. */
export function slugForHost(rawHost: string): string | null {
  const host = rawHost.split(':')[0].toLowerCase().replace(/\.$/, '');
  if (!host) return null;

  const mapped = domainMap[host] ?? domainMap[host.replace(/^www\./, '')];
  if (mapped) return mapped;

  for (const suffix of ['.pestflowpro.ai', '.pestflowpro.com']) {
    if (host.endsWith(suffix)) {
      const label = host.slice(0, -suffix.length);
      // One label only, and never the apex or a reserved host.
      if (label && !label.includes('.') && label !== 'www') return label;
    }
  }
  return null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get('host') ?? '';
  const slug = slugForHost(host);
  if (!slug) return [];

  const tenant = await resolveTenantBySlug(slug);
  if (!tenant) return [];

  // B-h. The gate was explicit that robots.txt must NOT gain a Disallow for a noindexed
  // tenant — blocking crawl stops the crawler ever seeing the noindex meta tag and can
  // strand already-indexed URLs. Page-level noindex stays the mechanism. What a noindexed
  // tenant must not get is an ADVERTISED LIST OF PAGES, which is this.
  if (tenant.noindex) return [];

  // Every URL is built from the resolved canonical origin, so the sitemap and the
  // rel=canonical on each page always agree. A sitemap on one host with canonicals on
  // another is worse than no sitemap: it tells a crawler the two disagree.
  const siteUrl = resolveSiteUrl(tenant);
  const now = new Date();

  // S322 — this MUST reproduce buildPageMetadata's rule exactly:
  //     pathname && pathname !== '/' ? `${siteUrl}${pathname}` : siteUrl
  // The naive `${siteUrl}${path}` emitted `https://host/` for the homepage while the page's
  // own rel=canonical is `https://host` — a one-byte disagreement between the sitemap and
  // the page it points at, which is worse than omitting the entry. Caught by comparing the
  // two against the real helper rather than by eye.
  const url = (path: string) => (path && path !== '/' ? `${siteUrl}${path}` : siteUrl);

  const entries: MetadataRoute.Sitemap = [
    { url: url('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: url('/about'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: url('/contact'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: url('/quote'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: url('/service-area'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: url('/reviews'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: url('/faq'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: url('/blog'), lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
  ];

  // Service and blog pages come from the SAME queries the routes themselves use, so a page
  // that renders is a page that is listed and vice versa. Deriving a second list would let
  // the two drift.
  const [services, posts] = await Promise.all([
    getAllServicePages(tenant.id),
    getAllBlogPosts(tenant.id),
  ]);

  for (const s of services) {
    if (s?.page_slug) {
      entries.push({ url: url(`/${s.page_slug}`), lastModified: now, changeFrequency: 'monthly', priority: 0.9 });
    }
  }

  for (const p of posts as Array<{ slug?: string | null; published_at?: string | null }>) {
    if (p?.slug) {
      entries.push({
        url: url(`/blog/${p.slug}`),
        lastModified: p.published_at ? new Date(p.published_at) : now,
        changeFrequency: 'yearly',
        priority: 0.4,
      });
    }
  }

  return entries;
}
