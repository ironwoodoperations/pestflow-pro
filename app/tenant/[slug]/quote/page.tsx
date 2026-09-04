import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildPageMetadata } from '../../../../shared/lib/buildPageMetadata';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';

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
  const seoMeta = await getSeoMeta(tenant.id, 'quote');
  return buildPageMetadata(tenant, {
    pathname: '/quote',
    seoMeta,
    fallback: {
      title: `Request a Quote | ${businessName}`,
      description: `Request a quote from ${businessName}.`,
    },
  });
}


export async function generateStaticParams() {
  return [];
}
import { getIntegrations, getAllServicePages, getSeoMeta } from '../_lib/queries';
import { publiclyListedServices } from '../_lib/publiclyListedServices';
import { resolveVertical } from '../../../../src/shells/_shared/serviceEntry';
import { getVerticalCopy } from '../../../../src/shells/_shared/verticalCopy';
import { QuoteForm } from '../_components/forms/QuoteForm';

type Params = { params: { slug: string } };

export default async function QuotePage({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const [integrations, servicePages] = await Promise.all([
    getIntegrations(tenant.id),
    getAllServicePages(tenant.id),
  ]);

  // Service options come from the tenant's OWN service page_content rows — the
  // same signal the homepage tiles and the navbar use. slice() first: the query
  // is React-cached, so the array must not be sorted in place.
  // S331 — canonical list. publiclyListedServices returns a NEW array, so the sort below
  // no longer needs its own slice() to avoid mutating the React-cached query result.
  const serviceOptions = publiclyListedServices(tenant, servicePages as { page_slug: string; title: string | null }[])
    .sort((a, b) => a.page_slug.localeCompare(b.page_slug))
    .map(p => p.title)
    .filter((t): t is string => !!t);

  return (
    <div className="min-h-screen py-12" style={{ backgroundColor: 'var(--color-bg-section)' }}>
      <QuoteForm
        tenantId={tenant.id}
        businessName={tenant.business_name ?? tenant.name}
        businessPhone={tenant.phone ?? ''}
        ownerSmsNumber={integrations.owner_sms_number ?? ''}
        shellTemplate={tenant.template ?? undefined}
        serviceOptions={serviceOptions}
        heroTitle={getVerticalCopy(resolveVertical(tenant)).quoteHeroTitle}
      />
    </div>
  );
}
