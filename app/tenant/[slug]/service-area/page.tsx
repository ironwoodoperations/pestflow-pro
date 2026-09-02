import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildPageMetadata } from '../../../../shared/lib/buildPageMetadata';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';
import { resolveVertical } from '../../../../src/shells/_shared/serviceEntry';
import { getVerticalCopy } from '../../../../src/shells/_shared/verticalCopy';

export const revalidate = 300;

// S322 — canonical self-reference. This route had NO generateMetadata, so in the App Router
// it inherited the tenant LAYOUT's metadata, whose canonical is the bare site URL because it
// describes the SITE rather than a page. Every such page told Google it was a duplicate of
// the homepage and would not be indexed separately.
//
// buildPageMetadata was already correct — `pathname && pathname !== '/' ? siteUrl+pathname :
// siteUrl` — it was simply never called here. S276 wired only four route groups ([service],
// blog, blog/[post], home) and the rest were missed.
//
// The pathname is a LITERAL matching this route's own directory, never derived from a request
// header. Host is an untrusted selector, not a URL source (established in S321 PR B).
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) return {};
  const businessName = tenant.business_name || tenant.name;
  // A seo_meta row supplies the TITLE when one exists; the ROUTE supplies the path. A correct
  // canonical needs no row — that is why this is a code fix and not a per-tenant data fix.
  const seoMeta = await getSeoMeta(tenant.id, 'service-area');
  return buildPageMetadata(tenant, {
    pathname: '/service-area',
    seoMeta,
    fallback: {
      title: `Service Area | ${businessName}`,
      description: `Areas served by ${businessName}.`,
    },
  });
}


export async function generateStaticParams() {
  return [];
}
import { getAllLocations, getPageContent, getServiceAreaMap, getSeoMeta } from '../_lib/queries';
import { ServiceAreaPage } from '../_components/ServiceAreaPage';

type Params = { params: { slug: string } };

export default async function ServiceAreaRoute({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const [rawLocs, content, storedMap] = await Promise.all([
    getAllLocations(tenant.id),
    getPageContent(tenant.id, 'service-area'),
    // Parallel with the other two, so the map costs no extra round trip and
    // `revalidate = 300` below is unaffected.
    getServiceAreaMap(tenant.id),
  ]);

  const c = content as { title?: string; subtitle?: string } | null;
  const heroTitle = c?.title    || 'Our Service Area';
  // DB subtitle still wins; the preset only supplies the fallback.
  const heroSub   = c?.subtitle || getVerticalCopy(resolveVertical(tenant)).serviceAreaStrapline;

  type LocItem = { slug: string; city: string; state?: string | null; is_live?: boolean | null; latitude?: number | string | null; longitude?: number | string | null };
  const locations: LocItem[] = (rawLocs as LocItem[]) ?? [];
  const phone = tenant.phone ?? '';
  const businessName = tenant.business_name || tenant.name;

  return (
    <ServiceAreaPage
      heroTitle={heroTitle}
      heroSub={heroSub}
      locations={locations}
      phone={phone}
      businessName={businessName}
      storedMap={storedMap}
    />
  );
}
