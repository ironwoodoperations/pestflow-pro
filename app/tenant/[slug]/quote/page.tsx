import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}
import { getIntegrations, getAllServicePages } from '../_lib/queries';
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
  const serviceOptions = (servicePages as { page_slug: string; title: string | null }[])
    .slice()
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
