import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';

export async function generateStaticParams() {
  return [];
}
import { getIntegrations } from '../_lib/queries';
import { QuoteForm } from '../_components/forms/QuoteForm';

type Params = { params: { slug: string } };

export default async function QuotePage({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const integrations = await getIntegrations(tenant.id);

  return (
    <div className="min-h-screen py-12" style={{ backgroundColor: 'var(--color-bg-section)' }}>
      <QuoteForm
        tenantId={tenant.id}
        businessName={tenant.business_name ?? tenant.name}
        businessPhone={tenant.phone ?? ''}
        ownerSmsNumber={integrations.owner_sms_number ?? ''}
      />
    </div>
  );
}
