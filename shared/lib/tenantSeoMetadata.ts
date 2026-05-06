import type { Metadata } from 'next';
import type { Tenant } from './tenant/types';

type Opts = {
  title: string;
  description: string;
  pathname?: string;
};

export function tenantSeoMetadata(
  tenant: Tenant,
  opts: Opts,
): Pick<Metadata, 'alternates' | 'openGraph' | 'twitter'> {
  const siteUrl = `https://${tenant.subdomain ?? tenant.slug}.pestflowpro.com`;
  const url = opts.pathname ? `${siteUrl}${opts.pathname}` : siteUrl;
  const businessName = tenant.business_name ?? tenant.name ?? 'PestFlow Pro';
  const ogImage = tenant.logo_url ?? `${siteUrl}/og-default.png`;

  return {
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: businessName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: businessName }],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
      images: [ogImage],
    },
  };
}
