import type { Metadata } from 'next';
import type { Tenant } from './tenant/types';
import { resolveSiteUrl } from './resolveSiteUrl';

/**
 * The shape returned by the `getSeoMeta` loader
 * (`app/tenant/[slug]/_lib/queries.ts`). Kept structural (not an import) so
 * this shared helper has no dependency on the app route tree.
 */
export type SeoMetaRow = {
  page_slug: string;
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
};

type BuildPageMetadataOpts = {
  /** Canonical/OG pathname for this route, e.g. '/', '/about', '/blog/foo'. */
  pathname: string;
  /** The seo_meta row for this page, or null when none exists. */
  seoMeta?: SeoMetaRow | null;
  /** Generic fallback used only when neither seo_meta nor tenant settings.seo supply a value. */
  fallback: { title: string; description: string };
};

/**
 * Build a Next.js `Metadata` object for a tenant page.
 *
 * Precedence (per field): per-page `seo_meta` row → tenant `settings.seo`
 * (carried on the resolved Tenant as `meta_title`/`meta_description`) →
 * generic `fallback`. Empty strings are treated as absent (the dashboard
 * write path leaves unset og_* as `''`, not null).
 *
 * Output shape mirrors `tenantSeoMetadata` (alternates / openGraph / twitter)
 * plus top-level title/description and `metadataBase`. When no `seo_meta` row
 * exists, the resolved title/description are byte-identical to the prior
 * tenant-level metadata (the regression floor).
 */
export function buildPageMetadata(
  tenant: Tenant,
  opts: BuildPageMetadataOpts,
): Metadata {
  const { pathname, seoMeta, fallback } = opts;

  // first non-empty wins ('' from the dashboard write path counts as absent)
  const pick = (...vals: Array<string | null | undefined>) =>
    vals.find((v) => typeof v === 'string' && v.trim().length > 0) ?? '';

  const title = pick(seoMeta?.meta_title, tenant.meta_title, fallback.title);
  const description = pick(
    seoMeta?.meta_description,
    tenant.meta_description,
    fallback.description,
  );

  // OG → meta fallback: og_* is only ~39% populated platform-wide, so an
  // absent og_title/og_description resolves to the chosen meta title/description.
  const ogTitle = pick(seoMeta?.og_title, title);
  const ogDescription = pick(seoMeta?.og_description, description);

  const siteUrl = resolveSiteUrl(tenant);
  const url = pathname && pathname !== '/' ? `${siteUrl}${pathname}` : siteUrl;
  const businessName = tenant.business_name ?? tenant.name ?? 'PestFlow Pro';
  const ogImage = tenant.logo_url ?? `${siteUrl}/og-default.png`;

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical: url },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url,
      siteName: businessName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: businessName }],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
  };
}
