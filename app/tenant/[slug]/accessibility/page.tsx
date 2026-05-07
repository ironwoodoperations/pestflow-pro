import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';
import { tenantSeoMetadata } from '../../../../shared/lib/tenantSeoMetadata';
import { getPageContent } from '../_lib/queries';
import LegalPageLayout from '../_components/LegalPageLayout';

export const revalidate = 300;
export async function generateStaticParams() { return []; }

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const tenant = await resolveTenantBySlug(params.slug);
  const name = tenant?.business_name || tenant?.name || '';
  const title = `Accessibility Statement | ${name}`;
  const description = `Accessibility Statement for ${name}.`;
  return {
    title,
    description,
    ...(tenant ? tenantSeoMetadata(tenant, { title, description, pathname: '/accessibility' }) : {}),
  };
}

export default async function AccessibilityPage({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const updated = new Date().toISOString().split('T')[0];

  // Prefer DB-stored content; provision-tenant Step 9g seeds these from
  // master template. On miss, render a minimal "coming soon" placeholder so
  // the page never blank-pages.
  const pageContent = await getPageContent(tenant.id, 'accessibility') as
    | { title?: string; intro?: string } | null;
  if (pageContent?.intro) {
    return (
      <LegalPageLayout title={pageContent.title || 'Accessibility Statement'} lastUpdated={updated}>
        <div className="whitespace-pre-wrap">{pageContent.intro}</div>
      </LegalPageLayout>
    );
  }

  return (
    <LegalPageLayout title="Accessibility Statement" lastUpdated={updated}>
      <p className="mb-4">Our accessibility statement is being prepared. For accessibility assistance or to report a barrier, please contact us.</p>
    </LegalPageLayout>
  );
}
