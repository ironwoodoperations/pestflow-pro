import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}
import { getAllLocations, getPageContent } from '../_lib/queries';
import { ServiceAreaPage } from '../_components/ServiceAreaPage';

type Params = { params: { slug: string } };

export default async function ServiceAreaRoute({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const [rawLocs, content] = await Promise.all([
    getAllLocations(tenant.id),
    getPageContent(tenant.id, 'service-area'),
  ]);

  const c = content as { title?: string; subtitle?: string } | null;
  const heroTitle = c?.title    || 'Our Service Area';
  const heroSub   = c?.subtitle || 'Professional pest control in your community and surrounding areas.';

  type LocItem = { slug: string; city: string; state?: string | null };
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
    />
  );
}
